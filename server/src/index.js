require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

// Import modules
const WebSocketHandler = require('./websocket/handler');
const StreamProcessor = require('./services/streamProcessor');
const AlertingEngine = require('./services/alertingEngine');
const NotificationGateway = require('./services/notificationGateway');
const ReportingEngine = require('./services/reportingEngine');
const EquipmentSimulator = require('./services/equipmentSimulator');

// Import routes
const createAuthRouter = require('./routes/auth');
const createPatientsRouter = require('./routes/patients');
const createAlertsRouter = require('./routes/alerts');
const createEquipmentRouter = require('./routes/equipment');
const createReportsRouter = require('./routes/reports');
const createStaffRouter = require('./routes/staff');

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Initialize WebSocket
const wsHandler = new WebSocketHandler(server);

// Initialize services
const notificationGateway = new NotificationGateway(prisma, wsHandler);
const alertingEngine = new AlertingEngine(prisma, wsHandler, notificationGateway);
const streamProcessor = new StreamProcessor(prisma, wsHandler, alertingEngine);
const reportingEngine = new ReportingEngine(prisma);
const equipmentSimulator = new EquipmentSimulator(prisma, wsHandler, streamProcessor);

// Mount routes
app.use('/api/auth', createAuthRouter(prisma));
app.use('/api/patients', createPatientsRouter(prisma));
app.use('/api/alerts', createAlertsRouter(prisma, wsHandler));
app.use('/api/equipment', createEquipmentRouter(prisma));
app.use('/api/reports', createReportsRouter(prisma, reportingEngine));
app.use('/api/staff', createStaffRouter(prisma));

// System health endpoint
app.get('/api/system/health', (req, res) => {
  const uptime = process.uptime();
  res.json({
    status: 'HEALTHY',
    uptime: Math.floor(uptime),
    uptimeFormatted: formatUptime(uptime),
    servers: {
      primary: {
        status: 'ACTIVE',
        uptime: Math.floor(uptime),
        cpu: (Math.random() * 30 + 15).toFixed(1) + '%',
        memory: (Math.random() * 20 + 40).toFixed(1) + '%',
      },
      backup: {
        status: 'STANDBY',
        uptime: Math.floor(uptime),
        cpu: (Math.random() * 5 + 2).toFixed(1) + '%',
        memory: (Math.random() * 10 + 20).toFixed(1) + '%',
      },
    },
    database: {
      primary: { status: 'ACTIVE', replicationLag: '0ms' },
      backup: { status: 'SYNCED', replicationLag: Math.floor(Math.random() * 5) + 'ms' },
    },
    services: {
      streamProcessor: streamProcessor.getStats(),
      alertingEngine: alertingEngine.getStats(),
      notificationGateway: notificationGateway.getStats(),
    },
    connectedClients: wsHandler.getConnectedClientsCount(),
    timestamp: new Date().toISOString(),
  });
});

// System clients endpoint
app.get('/api/system/clients', (req, res) => {
  res.json(wsHandler.getConnectedClients());
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Hospital Patient Monitoring System',
    version: '1.0.0',
    status: 'RUNNING',
    endpoints: {
      auth: '/api/auth',
      patients: '/api/patients',
      alerts: '/api/alerts',
      equipment: '/api/equipment',
      reports: '/api/reports',
      staff: '/api/staff',
      system: '/api/system/health',
      websocket: '/ws',
    },
  });
});

function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
}

// Broadcast system health periodically
setInterval(() => {
  const uptime = process.uptime();
  wsHandler.broadcast('system-health', {
    status: 'HEALTHY',
    uptime: Math.floor(uptime),
    connectedClients: wsHandler.getConnectedClientsCount(),
    services: {
      streamProcessor: streamProcessor.getStats(),
      alertingEngine: alertingEngine.getStats(),
      notificationGateway: notificationGateway.getStats(),
    },
  });
}, 5000);

// Broadcast equipment status periodically
setInterval(async () => {
  try {
    const equipment = await prisma.equipment.findMany({
      include: { patient: { select: { name: true, bedNumber: true } } },
    });
    wsHandler.broadcast('equipment-status', equipment);
  } catch (err) {
    // ignore
  }
}, 10000);

// Start server
const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0'; // Listen on all interfaces for mobile access
server.listen(PORT, HOST, async () => {
  // Get local IP addresses
  const os = require('os');
  const interfaces = os.networkInterfaces();
  const localIPs = [];
  for (const iface of Object.values(interfaces)) {
    for (const addr of iface) {
      if (addr.family === 'IPv4' && !addr.internal) {
        localIPs.push(addr.address);
      }
    }
  }

  console.log(`\n🏥 Hospital Patient Monitoring System`);
  console.log(`   Server running on http://localhost:${PORT}`);
  console.log(`   WebSocket on ws://localhost:${PORT}/ws`);
  if (localIPs.length > 0) {
    console.log(`   ──────────────────────────────────────`);
    console.log(`   📱 Mobile devices can connect via:`);
    localIPs.forEach(ip => {
      console.log(`      http://${ip}:${PORT}`);
    });
  }
  console.log(`   ──────────────────────────────────────`);

  // Start equipment simulator after a short delay
  setTimeout(() => {
    equipmentSimulator.start();
  }, 2000);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n[Server] Shutting down...');
  equipmentSimulator.stop();
  wsHandler.destroy();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  equipmentSimulator.stop();
  wsHandler.destroy();
  await prisma.$disconnect();
  process.exit(0);
});
