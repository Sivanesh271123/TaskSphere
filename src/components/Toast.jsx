import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastItem = React.memo(function ToastItem({ toast, onDismiss }) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const duration = toast.duration || 3800;
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (elapsed >= duration) {
        clearInterval(interval);
        onDismiss(toast.id);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [toast, onDismiss]);

  const getAccentColor = (type) => {
    switch (type) {
      case 'success': return '#22C55E';
      case 'error':
      case 'danger': return '#EF4444';
      case 'warning': return '#F4C542';
      case 'info':
      default: return '#3B82F6';
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle2 size={22} style={{ color: '#22C55E', flexShrink: 0 }} />;
      case 'error':
      case 'danger': return <XCircle size={22} style={{ color: '#EF4444', flexShrink: 0 }} />;
      case 'warning': return <AlertTriangle size={22} style={{ color: '#F4C542', flexShrink: 0 }} />;
      case 'info':
      default: return <Info size={22} style={{ color: '#3B82F6', flexShrink: 0 }} />;
    }
  };

  const accentColor = getAccentColor(toast.type);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="toast-card-luxury"
      style={{
        position: 'relative',
        width: '360px',
        maxWidth: 'calc(100vw - 2rem)',
        background: 'rgba(20, 20, 24, 0.94)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid var(--border-color)',
        borderLeft: `4px solid ${accentColor}`,
        borderRadius: '16px',
        padding: '14px 16px',
        boxShadow: `0 16px 40px rgba(0, 0, 0, 0.65), 0 0 20px ${accentColor}1A`,
        overflow: 'hidden',
        pointerEvents: 'auto',
        userSelect: 'none'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ paddingTop: '2px' }}>
          {getIcon(toast.type)}
        </div>

        <div style={{ flex: 1, paddingRight: '6px' }}>
          <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.25 }}>
            {toast.title}
          </h4>
          {toast.description && (
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.4, fontWeight: 500 }}>
              {toast.description}
            </p>
          )}
        </div>

        <button
          onClick={() => onDismiss(toast.id)}
          aria-label="Close Toast Notification"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-dim)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.2s ease, background 0.2s ease',
            marginLeft: '4px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-primary)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-dim)';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Auto-Dismiss Sleek Progress Bar */}
      <div 
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: '2px',
          width: `${progress}%`,
          background: accentColor,
          boxShadow: `0 0 8px ${accentColor}`,
          transition: 'width 30ms linear'
        }}
      />
    </motion.div>
  );
});

const Toast = React.memo(function Toast({ toasts, onDismiss }) {
  return (
    <div
      className="toast-container-wrapper"
      style={{
        position: 'fixed',
        top: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        pointerEvents: 'none'
      }}
    >
      <AnimatePresence mode="sync">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
});

export default Toast;
