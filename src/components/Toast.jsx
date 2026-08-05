import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, Trash2, X } from 'lucide-react';

export default function Toast({ toasts, onDismiss }) {
  return (
    <div className="toast-container">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="toast-message"
          >
            {toast.type === 'success' && <CheckCircle2 size={18} style={{ color: 'var(--success-color)' }} />}
            {toast.type === 'danger' && <Trash2 size={18} style={{ color: 'var(--danger-color)' }} />}
            {toast.type === 'info' && <Info size={18} style={{ color: 'var(--accent-primary)' }} />}

            <span>{toast.message}</span>

            <button 
              onClick={() => onDismiss(toast.id)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginLeft: '0.5rem' }}
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
