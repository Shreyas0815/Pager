import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Header({ wsConnected, pageTitle }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'AD';

  return (
    <header className="header" id="main-header">
      <div className="header-left">
        <h2>{pageTitle}</h2>
      </div>
      <div className="header-right">
        <div className={`ws-indicator ${wsConnected ? 'connected' : 'disconnected'}`}>
          <span className="ws-dot"></span>
          {wsConnected ? 'Live Connected' : 'Disconnected'}
        </div>
        <span className="header-time">
          {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
        <div
          className="header-user clickable"
          id="header-user-menu"
          onClick={() => navigate('/profile')}
          title="Click to view & edit Profile"
          role="button"
          tabIndex={0}
        >
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.name || 'Admin'}</div>
            <div className="user-role">{user?.role || 'ADMIN'}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
