import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { isDemoMode } from '../utils/config.js';

export default function Login() {
  const [email, setEmail] = useState('admin@hospital.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed.');
    }
  };

  const demoMode = isDemoMode();

  return (
    <div className="login-page">
      <div className="login-container fade-in">
        <div className="login-card">
          <div className="login-logo">
            <div className="logo-symbol">🏥</div>
            <h2>HPMS Admin Dashboard</h2>
            <p>Hospital Patient Monitoring System</p>
          </div>

          {demoMode && (
            <div style={{
              background: 'rgba(30,64,175,0.06)', border: '1px solid rgba(30,64,175,0.2)',
              borderRadius: '10px', padding: '12px', marginBottom: '18px', textAlign: 'center'
            }}>
              <p style={{ fontSize: '0.78rem', color: '#1e40af', fontWeight: 600, marginBottom: '4px' }}>
                🔵 Live Demo Mode
              </p>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Running with simulated real-time data — no backend required
              </p>
            </div>
          )}

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
          </div>
        </div>
      </div>
    </div>
  );
}
