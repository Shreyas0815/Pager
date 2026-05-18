# 🏥 Hospital Patient Monitoring System (HPMS)

A full-stack real-time hospital patient monitoring system featuring live vital signs streaming, critical alerting, admin monitoring, and mobile access for medical staff.

## 🌐 Live Demo

**Admin Dashboard:** [https://hpms-admin-dashboard.vercel.app](https://hpms-admin-dashboard.vercel.app)

## 📋 Architecture

```
┌─────────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│   Medical Equipment  │────▶│  Backend Server       │────▶│  Admin Dashboard    │
│   (Simulated)        │     │  (Node.js/Express)    │     │  (React + Vite)     │
│   ECG, HR, SpO2,    │     │  WebSocket + REST API │     │  Real-time Charts   │
│   BP, Temp           │     │  SQLite + Prisma      │     │  Dark Medical UI    │
└─────────────────────┘     └──────────┬───────────┘     └─────────────────────┘
                                       │
                            ┌──────────▼───────────┐
                            │  Mobile App           │
                            │  (React Native/Expo)  │
                            │  + Web Simulator      │
                            └──────────────────────┘
```

## 🚀 Features

### 1. Real-Time Vital Signs Streaming
- 40 simulated medical devices streaming patient vitals every 2 seconds
- ECG, Heart Rate, SpO2, Blood Pressure, Temperature monitoring
- WebSocket-based real-time data delivery

### 2. Admin Dashboard (Web)
- Dark medical-grade UI with glassmorphism design
- Live patient cards with color-coded status (CRITICAL/WARNING/STABLE)
- Real-time alert management with severity filters
- System health monitoring with server metrics
- Equipment status tracking

### 3. Intelligent Alerting Engine
- Patient-specific vital sign thresholds
- Alert debouncing to prevent false alarms
- Critical, Warning, and Info severity levels
- Push notification simulation via WebSocket

### 4. Mobile Application
- React Native (Expo) for iOS/Android
- Patient dashboard with live vitals
- Alert acknowledgment
- Report generation
- Web simulator for browser testing

### 5. Report Generation
- Comprehensive patient reports with vital statistics
- Trend analysis and alert history
- PDF-ready data formatting

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend Server | Node.js, Express, Prisma, SQLite |
| WebSocket | ws (Node.js WebSocket library) |
| Admin Dashboard | React 18, Vite, Chart.js |
| Mobile App | React Native, Expo |
| Authentication | JWT (JSON Web Tokens) |
| Database | SQLite with Prisma ORM |

## 📂 Project Structure

```
Pager/
├── server/                 # Backend API server
│   ├── prisma/             # Database schema
│   ├── src/
│   │   ├── middleware/     # Auth middleware
│   │   ├── routes/         # REST API routes
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Seed data
│   │   ├── websocket/      # WebSocket handler
│   │   └── index.js        # Entry point
│   └── package.json
├── admin-dashboard/        # React admin web app
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page components
│   │   └── utils/          # API client & config
│   ├── vercel.json         # Vercel SPA config
│   └── package.json
├── mobile-app/             # React Native mobile app
│   ├── src/
│   │   ├── navigation/     # App navigator
│   │   ├── screens/        # Screen components
│   │   ├── services/       # API & WebSocket
│   │   └── utils/          # Constants
│   └── package.json
└── mobile-simulator/       # Web-based mobile UI simulator
    └── index.html
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### 1. Backend Server
```bash
cd server
npm install
npx prisma db push
node src/utils/seedData.js   # Seed demo data
node src/index.js            # Start server on port 3001
```

### 2. Admin Dashboard
```bash
cd admin-dashboard
npm install
npm run dev                  # Start on port 5173
```

### 3. Mobile App (Expo)
```bash
cd mobile-app
npm install
npx expo start               # Start Expo dev server
```

### 4. Mobile Simulator (Web)
```bash
cd mobile-simulator
npx serve -l 8082 .          # Serve on port 8082
```

## 🔐 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hospital.com | password123 |
| Doctor | dr.smith@hospital.com | password123 |
| Nurse | nurse.johnson@hospital.com | password123 |

## 🌐 Deployment

The admin dashboard is deployed on **Vercel**. When accessed from a non-localhost environment, it will prompt for the backend server URL. You can expose your local backend using a tunnel service like `localtunnel` or `ngrok`:

```bash
# Expose backend
npx localtunnel --port 3001
# Then enter the tunnel URL in the dashboard config prompt
```

## 📄 License

MIT
