const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

class WebSocketHandler {
  constructor(server) {
    this.wss = new WebSocket.Server({ server, path: '/ws' });
    this.clients = new Map(); // clientId -> { ws, user, subscriptions }
    this.channels = {
      vitals: new Set(),
      alerts: new Set(),
      'system-health': new Set(),
      'equipment-status': new Set(),
      notifications: new Set(),
    };

    this.wss.on('connection', (ws, req) => this.handleConnection(ws, req));

    // Heartbeat to detect dead connections
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          ws.terminate();
          return;
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);

    console.log('[WebSocket] Server initialized');
  }

  handleConnection(ws, req) {
    // Parse token from query
    const url = new URL(req.url, 'http://localhost');
    const token = url.searchParams.get('token');

    let user = null;
    if (token) {
      try {
        user = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        // Allow anonymous connections for admin dashboard in dev mode
        user = { id: 'anonymous', role: 'VIEWER', name: 'Anonymous' };
      }
    } else {
      user = { id: 'anonymous', role: 'VIEWER', name: 'Anonymous' };
    }

    const clientId = `${user.id}-${Date.now()}`;
    ws.isAlive = true;
    ws.clientId = clientId;

    this.clients.set(clientId, {
      ws,
      user,
      subscriptions: new Set(['vitals', 'alerts', 'system-health', 'equipment-status', 'notifications']),
    });

    // Auto-subscribe to all channels
    for (const channel of ['vitals', 'alerts', 'system-health', 'equipment-status', 'notifications']) {
      this.channels[channel].add(clientId);
    }

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        this.handleMessage(clientId, msg);
      } catch (err) {
        // ignore malformed messages
      }
    });

    ws.on('close', () => {
      // Remove from all channels
      for (const channel of Object.values(this.channels)) {
        channel.delete(clientId);
      }
      this.clients.delete(clientId);
    });

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      clientId,
      user: { id: user.id, name: user.name, role: user.role },
      timestamp: new Date().toISOString(),
    }));

    console.log(`[WebSocket] Client connected: ${clientId} (${user.name})`);
  }

  handleMessage(clientId, msg) {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (msg.type) {
      case 'subscribe':
        if (this.channels[msg.channel]) {
          client.subscriptions.add(msg.channel);
          this.channels[msg.channel].add(clientId);
        }
        break;
      case 'unsubscribe':
        if (this.channels[msg.channel]) {
          client.subscriptions.delete(msg.channel);
          this.channels[msg.channel].delete(clientId);
        }
        break;
      case 'ping':
        client.ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        break;
    }
  }

  broadcast(channel, data) {
    const subscribers = this.channels[channel];
    if (!subscribers) return;

    const message = JSON.stringify({
      type: channel,
      data,
      timestamp: new Date().toISOString(),
    });

    subscribers.forEach((clientId) => {
      const client = this.clients.get(clientId);
      if (client && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message);
      }
    });
  }

  broadcastToUser(userId, data) {
    this.clients.forEach((client) => {
      if (client.user.id === userId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(data));
      }
    });
  }

  getConnectedClientsCount() {
    return this.clients.size;
  }

  getConnectedClients() {
    const clients = [];
    this.clients.forEach((client, id) => {
      clients.push({
        id,
        user: { id: client.user.id, name: client.user.name, role: client.user.role },
        subscriptions: Array.from(client.subscriptions),
      });
    });
    return clients;
  }

  destroy() {
    clearInterval(this.heartbeatInterval);
    this.wss.close();
  }
}

module.exports = WebSocketHandler;
