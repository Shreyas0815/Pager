import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const navItems = [
  { path: '/', icon: '📊', label: 'Dashboard' },
  { path: '/patients', icon: '🏥', label: 'Patient Monitor' },
  { path: '/alerts', icon: '🚨', label: 'Alerts' },
  { path: '/equipment', icon: '🔧', label: 'Equipment Status' },
  { path: '/system', icon: '⚙️', label: 'System Health' },
];

export default function Sidebar({ alertCount }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <aside className="sidebar" id="sidebar-nav">
      <div className="sidebar-logo">
        <h1>
          <span className="logo-icon">🏥</span>
          HPMS
        </h1>
        <div className="system-subtitle">Patient Monitoring System</div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Main Menu</div>
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            id={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <span className="link-icon">{item.icon}</span>
            {item.label}
            {item.path === '/alerts' && alertCount > 0 && (
              <span className="link-badge">{alertCount}</span>
            )}
          </NavLink>
        ))}

        <div className="sidebar-section-label" style={{ marginTop: '24px' }}>Account</div>
        <NavLink
          to="/profile"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          id="nav-profile"
        >
          <span className="link-icon">👤</span>
          My Profile
        </NavLink>
        <button className="sidebar-link" onClick={logout} id="nav-logout" style={{ width: '100%', textAlign: 'left' }}>
          <span className="link-icon">🚪</span>
          Logout
        </button>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-status">
          <span className="status-dot"></span>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
            Primary Server Active
          </span>
        </div>
      </div>
    </aside>
  );
}
