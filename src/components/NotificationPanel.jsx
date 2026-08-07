import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, CheckCheck, Trash2, X, Clock, AlertTriangle, Calendar, Info, CheckCircle2 } from 'lucide-react';
import useFocusTrap from '../hooks/useFocusTrap.js';

export default function NotificationPanel({ isOpen, onClose, notifications, hasMore, onMarkAsRead, onMarkAllAsRead, onDelete, onLoadMore }) {
  const getIcon = (type) => {
    switch (type) {
      case '30min':
      case 'exact': return <Clock size={16} style={{ color: 'var(--accent-gold-main)' }} />;
      case 'overdue': return <AlertTriangle size={16} style={{ color: 'var(--danger-color)' }} />;
      case 'completed': return <CheckCircle2 size={16} style={{ color: 'var(--success-color)' }} />;
      case 'recurring': return <Calendar size={16} style={{ color: 'var(--accent-purple)' }} />;
      default: return <Info size={16} style={{ color: 'var(--text-gold)' }} />;
    }
  };
  const panelRef = useFocusTrap(isOpen, onClose);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="dropdown-overlay"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 90 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="region"
            aria-label="Notification Center"
            aria-live="polite"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="notification-panel"
            style={{
              position: 'absolute',
              top: 'calc(100% + 14px)',
              right: 0,
              width: '360px',
              maxHeight: '480px',
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--bg-surface)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              boxShadow: 'var(--shadow-premium)',
              zIndex: 1000,
              padding: '1.25rem',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }} id="notifications-title">
                <Bell size={18} aria-hidden="true" /> Notifications
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {notifications.some(n => !n.isRead) && (
                  <button 
                    className="action-icon-btn" 
                    onClick={onMarkAllAsRead} 
                    title="Mark all as read"
                    aria-label="Mark all notifications as read"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <CheckCheck size={18} aria-hidden="true" />
                  </button>
                )}
                <button className="action-icon-btn" onClick={onClose} aria-label="Close notifications">
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
            </div>

            {notifications.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '2rem 0' }}>
                No notifications yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {notifications.map(notif => (
                  <div 
                    key={notif.id} 
                    style={{
                      padding: '0.75rem',
                      background: notif.isRead ? 'transparent' : 'var(--surface-subtle)',
                      border: '1px solid',
                      borderColor: notif.isRead ? 'var(--border-color)' : 'var(--accent-gold-main)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <div style={{ marginTop: '0.1rem' }}>
                        {getIcon(notif.type)}
                      </div>
                      <div style={{ flex: 1 }}>
                        {notif.title && <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.2rem' }}>{notif.title}</div>}
                        <div style={{ fontSize: '0.8rem', color: notif.isRead ? 'var(--text-muted)' : 'var(--text-main)', lineHeight: 1.4 }}>
                          {notif.message}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {!notif.isRead && (
                          <button 
                            className="action-icon-btn" 
                            style={{ padding: '0.25rem', color: 'var(--success-color)' }}
                            onClick={() => onMarkAsRead(notif.id)}
                            title="Mark as read"
                            aria-label={`Mark notification ${notif.title || ''} as read`}
                          >
                            <Check size={14} aria-hidden="true" />
                          </button>
                        )}
                        <button 
                          className="action-icon-btn" 
                          style={{ padding: '0.25rem', color: 'var(--danger-color)' }}
                          onClick={() => onDelete(notif.id)}
                          title="Delete"
                          aria-label={`Delete notification ${notif.title || ''}`}
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {hasMore && (
                  <button 
                    onClick={onLoadMore}
                    style={{
                      background: 'transparent',
                      border: '1px dashed var(--border-color)',
                      color: 'var(--text-muted)',
                      padding: '0.5rem',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.color = 'var(--text-gold)'; e.currentTarget.style.borderColor = 'var(--text-gold)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                  >
                    Load More History
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
