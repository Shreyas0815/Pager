import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import useWebSocket from './hooks/useWebSocket';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PatientMonitor from './pages/PatientMonitor';
import AlertsPanel from './pages/AlertsPanel';
import EquipmentStatus from './pages/EquipmentStatus';
import SystemHealth from './pages/SystemHealth';
import Profile from './pages/Profile';

const pageTitles = {
  '/': 'Dashboard',
  '/patients': 'Patient Monitor',
  '/alerts': 'Alert Management',
  '/equipment': 'Equipment Status',
  '/system': 'System Health',
  '/profile': 'User Profile & Account',
};

function AppContent() {
  const { isAuthenticated } = useAuth();
  const { isConnected, lastVitals, latestAlerts, systemHealth, equipmentStatus, notifications } = useWebSocket();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Login />;
  }

  const pageTitle = Object.entries(pageTitles).find(
    ([path]) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
  )?.[1] || 'Patient Monitor';

  const unacknowledgedAlerts = latestAlerts.filter(a => !a.acknowledged).length;

  return (
    <div className="app-layout">
      <Sidebar alertCount={unacknowledgedAlerts} />
      <div className="main-content">
        <Header wsConnected={isConnected} pageTitle={pageTitle} />
        <Routes>
          <Route path="/" element={
            <Dashboard lastVitals={lastVitals} latestAlerts={latestAlerts} />
          } />
          <Route path="/patients/:id" element={
            <PatientMonitor lastVitals={lastVitals} />
          } />
          <Route path="/patients" element={
            <Dashboard lastVitals={lastVitals} latestAlerts={latestAlerts} />
          } />
          <Route path="/alerts" element={
            <AlertsPanel latestAlerts={latestAlerts} />
          } />
          <Route path="/equipment" element={
            <EquipmentStatus equipmentStatus={equipmentStatus} />
          } />
          <Route path="/system" element={
            <SystemHealth systemHealth={systemHealth} />
          } />
          <Route path="/profile" element={
            <Profile />
          } />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
