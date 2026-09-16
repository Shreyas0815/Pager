import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';

export default function Profile() {
  const { user, updateUser, logout } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    department: user?.department || '',
    phone: user?.phone || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'edit' | 'security'

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        department: user.department || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg({ type: '', text: '' });

    try {
      const updated = await api.updateProfile({
        name: formData.name,
        department: formData.department,
        phone: formData.phone,
      });
      updateUser(updated);
      setProfileMsg({ type: 'success', text: '✅ Profile details updated successfully!' });
      setTimeout(() => setProfileMsg({ type: '', text: '' }), 4000);
    } catch (err) {
      setProfileMsg({ type: 'error', text: `❌ ${err.message || 'Failed to update profile'}` });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMsg({ type: 'error', text: '❌ New passwords do not match' });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: '❌ New password must be at least 6 characters' });
      return;
    }

    setSavingPassword(true);
    setPasswordMsg({ type: '', text: '' });

    try {
      await api.updateProfile({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordMsg({ type: 'success', text: '✅ Password changed successfully!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordMsg({ type: '', text: '' }), 4000);
    } catch (err) {
      setPasswordMsg({ type: 'error', text: `❌ ${err.message || 'Failed to update password'}` });
    } finally {
      setSavingPassword(false);
    }
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'AD';

  const roleColor =
    user?.role === 'ADMIN' ? 'var(--accent-primary)' :
    user?.role === 'DOCTOR' ? '#059669' : '#d97706';

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">User Profile & Account</h1>
          <p className="page-description">Manage staff credentials, duty status, and security settings</p>
        </div>
      </div>

      {/* Profile Banner Card */}
      <div className="profile-banner-card">
        <div className="profile-banner-avatar">{initials}</div>
        <div className="profile-banner-details">
          <div className="profile-banner-name-row">
            <h2 className="profile-banner-name">{user?.name || 'Administrator'}</h2>
            <span className="profile-role-badge" style={{ backgroundColor: roleColor }}>
              {user?.role || 'ADMIN'}
            </span>
            <span className="profile-status-pill">
              <span className="profile-status-dot"></span> On Duty • Active
            </span>
          </div>
          <div className="profile-banner-meta">
            <span>📧 {user?.email || 'admin@hospital.com'}</span>
            <span>🏥 {user?.department || 'Cardiology & ICU'}</span>
            {user?.phone && <span>📞 {user?.phone}</span>}
            <span>🆔 Staff ID: HPMS-{user?.id ? user.id.slice(0, 8) : '001'}</span>
          </div>
        </div>
        <div className="profile-banner-actions">
          <button className="btn btn-outline" onClick={logout} id="profile-logout-btn">
            🚪 Log Out
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="profile-tabs">
        <button
          className={`profile-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          👤 Account Overview
        </button>
        <button
          className={`profile-tab-btn ${activeTab === 'edit' ? 'active' : ''}`}
          onClick={() => setActiveTab('edit')}
        >
          ✏️ Edit Details
        </button>
        <button
          className={`profile-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          🔒 Security & Password
        </button>
      </div>

      {/* Tab 1: Account Overview */}
      {activeTab === 'overview' && (
        <div className="grid-2" style={{ gap: '20px' }}>
          {/* Card: Duty & Assignments */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">🩺 Clinical Duty & Staff Credentials</div>
            </div>
            <div className="profile-info-grid">
              <div className="profile-info-item">
                <span className="profile-info-label">Full Legal Name</span>
                <span className="profile-info-value">{user?.name || 'Admin'}</span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">Hospital Email</span>
                <span className="profile-info-value">{user?.email || 'admin@hospital.com'}</span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">Clinical Role</span>
                <span className="profile-info-value" style={{ fontWeight: 700, color: roleColor }}>
                  {user?.role || 'ADMIN'}
                </span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">Assigned Department</span>
                <span className="profile-info-value">{user?.department || 'ICU / Telemetry'}</span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">Contact Extension / Phone</span>
                <span className="profile-info-value">{user?.phone || '+1 (555) 234-5678'}</span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">Shift Coverage</span>
                <span className="profile-info-value">07:00 – 19:00 (Day Telemetry)</span>
              </div>
            </div>
          </div>

          {/* Card: Permissions & Privileges */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">🛡️ System Permissions & Access Rights</div>
            </div>
            <div className="permissions-list">
              <div className="permission-item">
                <span className="permission-icon">✅</span>
                <div>
                  <div className="permission-name">Real-Time Vital Signs Streaming</div>
                  <div className="permission-desc">Full access to 40 medical device streaming telemetry</div>
                </div>
              </div>
              <div className="permission-item">
                <span className="permission-icon">✅</span>
                <div>
                  <div className="permission-name">Critical Alert Acknowledgment</div>
                  <div className="permission-desc">Permission to silence and acknowledge medical alarm notifications</div>
                </div>
              </div>
              <div className="permission-item">
                <span className="permission-icon">✅</span>
                <div>
                  <div className="permission-name">Comprehensive Clinical Reports</div>
                  <div className="permission-desc">Generate, copy, and export 24-hour patient physiological summaries</div>
                </div>
              </div>
              <div className="permission-item">
                <span className="permission-icon">✅</span>
                <div>
                  <div className="permission-name">Equipment & Diagnostics Management</div>
                  <div className="permission-desc">Monitor equipment online status, battery levels, and telemetry lag</div>
                </div>
              </div>
              {user?.role === 'ADMIN' && (
                <div className="permission-item">
                  <span className="permission-icon">👑</span>
                  <div>
                    <div className="permission-name">Administrative Oversight</div>
                    <div className="permission-desc">Staff user management, security logs, and system configuration</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* System & Session Card */}
          <div className="card" style={{ gridColumn: 'span 2' }}>
            <div className="card-header">
              <div className="card-title">📡 Active Session & Telemetry Connection</div>
            </div>
            <div className="session-grid">
              <div className="session-stat-box">
                <span className="session-stat-label">Authentication Token</span>
                <span className="session-stat-val">Active (JWT 24h)</span>
              </div>
              <div className="session-stat-box">
                <span className="session-stat-label">WebSocket Connection</span>
                <span className="session-stat-val" style={{ color: 'var(--status-stable)' }}>Connected (3001/ws)</span>
              </div>
              <div className="session-stat-box">
                <span className="session-stat-label">Device Client</span>
                <span className="session-stat-val">HPMS Web Admin v1.0.0</span>
              </div>
              <div className="session-stat-box">
                <span className="session-stat-label">Last Synchronized</span>
                <span className="session-stat-val">Just now (Live)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Edit Profile */}
      {activeTab === 'edit' && (
        <div className="card" style={{ maxWidth: '680px', margin: '0 auto' }}>
          <div className="card-header">
            <div className="card-title">✏️ Update Profile Information</div>
          </div>

          {profileMsg.text && (
            <div className={`alert-banner ${profileMsg.type === 'success' ? 'banner-success' : 'banner-error'}`}>
              {profileMsg.text}
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="profile-form">
            <div className="form-group">
              <label className="form-label" htmlFor="profile-name">Full Name</label>
              <input
                id="profile-name"
                className="form-input"
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g. Dr. Sarah Smith"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="profile-email">Email Address (Read-only)</label>
              <input
                id="profile-email"
                className="form-input"
                type="email"
                value={formData.email}
                disabled
                style={{ opacity: 0.7, cursor: 'not-allowed' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Official email address is managed by hospital IT administration.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="profile-dept">Department / Specialization</label>
              <input
                id="profile-dept"
                className="form-input"
                type="text"
                value={formData.department}
                onChange={e => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g. Cardiology, Intensive Care Unit, Emergency"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="profile-phone">Contact Phone / Beeper Extension</label>
              <input
                id="profile-phone"
                className="form-input"
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. +1 (555) 234-5678"
              />
            </div>

            <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={savingProfile}
                id="save-profile-btn"
              >
                {savingProfile ? '⏳ Saving Changes...' : '💾 Save Profile'}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setActiveTab('overview')}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Security & Password */}
      {activeTab === 'security' && (
        <div className="card" style={{ maxWidth: '680px', margin: '0 auto' }}>
          <div className="card-header">
            <div className="card-title">🔒 Change Account Password</div>
          </div>

          {passwordMsg.text && (
            <div className={`alert-banner ${passwordMsg.type === 'success' ? 'banner-success' : 'banner-error'}`}>
              {passwordMsg.text}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="profile-form">
            <div className="form-group">
              <label className="form-label" htmlFor="current-pass">Current Password</label>
              <input
                id="current-pass"
                className="form-input"
                type="password"
                value={passwordData.currentPassword}
                onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                required
                placeholder="Enter your current password"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="new-pass">New Password</label>
              <input
                id="new-pass"
                className="form-input"
                type="password"
                value={passwordData.newPassword}
                onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                required
                minLength={6}
                placeholder="At least 6 characters"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirm-pass">Confirm New Password</label>
              <input
                id="confirm-pass"
                className="form-input"
                type="password"
                value={passwordData.confirmPassword}
                onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                required
                minLength={6}
                placeholder="Re-enter your new password"
              />
            </div>

            <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={savingPassword}
                id="save-password-btn"
              >
                {savingPassword ? '⏳ Updating Password...' : '🔑 Update Password'}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setActiveTab('overview');
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
