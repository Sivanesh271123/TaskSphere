import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, BellRing, Settings, AlertTriangle } from 'lucide-react';
import { requestNotificationPermission } from '../utils/notificationService';
import useFocusTrap from '../hooks/useFocusTrap.js';

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  notificationsEnabled, 
  onToggleNotifications 
}) {
  const modalRef = useFocusTrap(isOpen, onClose);
  const [permissionState, setPermissionState] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );

  useEffect(() => {
    if (isOpen) {
      setPermissionState(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggle = async () => {
    if (!notificationsEnabled) {
      if (typeof Notification !== 'undefined') {
        const result = await requestNotificationPermission();
        setPermissionState(result);
        if (result === 'granted') {
          new Notification('TaskSphere', {
            body: 'Notifications have been enabled successfully!',
            icon: '/favicon.ico'
          });
        }
      }
    }
    // This toggles state and saves to localStorage
    onToggleNotifications();
  };

  const handleTestNotification = () => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification('TaskSphere Test Notification', {
          body: '🎉 Notifications are successfully enabled and configured!',
          icon: '/favicon.ico'
        });
      } catch (err) {
        console.error('Failed to trigger test notification:', err);
      }
    } else {
      alert('Please enable notifications first and ensure permission is granted.');
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        className="modal-overlay" 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          ref={modalRef}
          className="modal-content" 
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{ maxWidth: '480px' }} 
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Settings className="brand-icon" style={{ width: 32, height: 32, color: 'var(--accent-gold-main)' }} size={18} />
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-gold)' }}>User Settings</h2>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Configure application options and browser alerts
                </p>
              </div>
            </div>
            <button className="action-icon-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <div style={{ margin: '1.5rem 0', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Notification Access Row */}
            <div style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
              background: 'var(--surface-subtle)', padding: '1rem', 
              borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {notificationsEnabled && permissionState === 'granted' ? (
                  <BellRing size={20} style={{ color: 'var(--accent-gold-main)' }} />
                ) : (
                  <Bell size={20} style={{ color: 'var(--text-muted)' }} />
                )}
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Browser Reminders
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {notificationsEnabled ? 'Active (Reminders enabled)' : 'Disabled'}
                  </div>
                </div>
              </div>

              <label className="toggle-switch" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <input 
                  type="checkbox" 
                  checked={notificationsEnabled}
                  onChange={handleToggle}
                  style={{ display: 'none' }}
                />
                <span className={`toggle-slider ${notificationsEnabled ? 'active' : ''}`} style={{
                  width: 44, height: 24, borderRadius: 12,
                  background: notificationsEnabled ? 'var(--accent-gold-main)' : 'var(--surface-subtle)',
                  display: 'inline-block', position: 'relative', transition: 'all 0.2s'
                }}>
                  <span style={{
                    width: 18, height: 18, borderRadius: '50%', background: 'var(--text-on-accent)',
                    position: 'absolute', top: 3, left: notificationsEnabled ? 23 : 3,
                    transition: 'all 0.2s'
                  }} />
                </span>
              </label>
            </div>

            {permissionState === 'denied' && (
              <div style={{ 
                display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
                padding: '0.75rem', background: 'var(--danger-bg)', 
                border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                color: 'var(--danger-color)', marginTop: '0.5rem'
              }}>
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  <strong>Blocked by browser.</strong> Please reset site permission settings in your address bar to re-enable alerts.
                </span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button className="btn btn-secondary" onClick={handleTestNotification} disabled={!notificationsEnabled || permissionState !== 'granted'}>
              Test Notification
            </button>
            <button className="btn btn-primary" onClick={onClose}>
              Done
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
