import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { isConfigured, setApiBase, API_BASE } from '../utils/config.js';

export default function Login() {
  const [email, setEmail] = useState('admin@hospital.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [showConfig, setShowConfig] = useState(!isConfigured());
  const [backendUrl, setBackendUrl] = useState(API_BASE || '');
  const { login, loading } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed. Check backend connection.');
    }
  };

  const handleConfigSave = (e) => {
    e.preventDefault();
    if (!backendUrl.trim()) return;
    let url = backendUrl.trim();
    if (url.endsWith('/')) url = url.slice(0, -1);
    setApiBase(url); // saves and reloads page
  };

  return (
    <div className="login-page">
      <div className="login-container fade-in">
        <div className="login-card">
          <div className="login-logo">
            <div className="logo-symbol">🏥</div>
            <h2>HPMS Admin Dashboard</h2>
            <p>Hospital Patient Monitoring System</p>
          </div>

          {showConfig ? (
            <div>
              <div style={{
                background: 'rgba(255,176,32,0.08)', border: '1px solid rgba(255,176,32,0.25)',
                borderRadius: '10px', padding: '14px', marginBottom: '20px', textAlign: 'center'
              }}>
                <p style={{ fontSize: '0.85rem', color: '#ffb020', fontWeight: 600, marginBottom: '6px' }}>
                  ⚠️ Backend Not Connected
                </p>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Enter the URL of your running HPMS backend server to connect this dashboard.
                </p>
              </div>

              <form onSubmit={handleConfigSave}>
                <div className="input-group">
                  <label htmlFor="backend-url">Backend Server URL</label>
                  <input
                    id="backend-url"
                    type="url"
                    className="input-field"
                    placeholder="https://your-backend.loca.lt"
                    value={backendUrl}
                    onChange={(e) => setBackendUrl(e.target.value)}
                    required
                    style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                  />
                </div>

                <button type="submit" className="login-btn" style={{ marginTop: '12px' }}>
                  🔗 Connect to Backend
                </button>
              </form>

              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Start the backend with: <code style={{ color: 'var(--accent)', fontFamily: 'monospace', fontSize: '0.68rem' }}>
                  cd server && node src/index.js</code><br/>
                  Then expose it with: <code style={{ color: 'var(--accent)', fontFamily: 'monospace', fontSize: '0.68rem' }}>
                  npx localtunnel --port 3001</code>
                </p>
              </div>
            </div>
          ) : (
            <>
              {error && <div className="login-error">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="input-group">
                  <label htmlFor="login-email">Email Address</label>
                  <input
                    id="login-email"
                    type="email"
                    className="input-field"
                    placeholder="admin@hospital.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="login-password">Password</label>
                  <input
                    id="login-password"
                    type="password"
                    className="input-field"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <button
                  id="login-button"
                  type="submit"
                  className="login-btn"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign In to Dashboard'}
                </button>
              </form>

              <div style={{ marginTop: '24px', textAlign: 'center' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Demo Credentials
                </p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  admin@hospital.com / password123
                </p>
                <button
                  onClick={() => setShowConfig(true)}
                  style={{
                    marginTop: '12px', background: 'none', border: '1px solid var(--border)',
                    color: 'var(--text-muted)', padding: '6px 14px', borderRadius: '6px',
                    cursor: 'pointer', fontSize: '0.68rem'
                  }}
                >
                  ⚙️ Change Backend URL
                </button>
                {API_BASE && (
                  <p style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '8px', fontFamily: 'monospace' }}>
                    Connected to: {API_BASE}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
