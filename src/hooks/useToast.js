import { useState, useCallback } from 'react';

let toastIdCounter = 0;

export default function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((arg1, arg2 = 'info', arg3, arg4) => {
    let title = '';
    let description = '';
    let type = 'info';
    let duration = 3800;

    if (typeof arg1 === 'object' && arg1 !== null) {
      title = arg1.title || arg1.message || 'Notification';
      description = arg1.description || arg1.text || '';
      type = arg1.type || 'info';
      duration = arg1.duration || 3800;
    } else if (typeof arg1 === 'string') {
      if (typeof arg2 === 'string' && (arg2 === 'success' || arg2 === 'danger' || arg2 === 'warning' || arg2 === 'info' || arg2 === 'error')) {
        // Form: addToast(message, type)
        type = arg2 === 'danger' ? 'error' : arg2;
        title = formatSmartTitle(arg1, type);
        description = formatSmartDescription(arg1, type);
      } else {
        // Form: addToast(title, description, type, duration)
        title = arg1;
        description = typeof arg2 === 'string' ? arg2 : '';
        type = typeof arg3 === 'string' ? (arg3 === 'danger' ? 'error' : arg3) : 'info';
        duration = typeof arg4 === 'number' ? arg4 : 3800;
      }
    }

    const id = ++toastIdCounter;
    setToasts(prev => [...prev, { id, title, description, type, duration, createdAt: Date.now() }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

function formatSmartTitle(msg, type) {
  if (!msg) return type === 'success' ? 'Action Completed' : 'Notification';
  const lower = msg.toLowerCase();
  if (lower.includes('task created') || lower.includes('new task added') || lower.includes('added to your workspace')) return 'Task Created Successfully';
  if (lower.includes('task updated') || lower.includes('updated successfully')) return 'Task Updated';
  if (lower.includes('task deleted') || lower.includes('removed from workspace')) return 'Task Deleted';
  if (lower.includes('account created') || lower.includes('welcome to tasksphere')) return 'Account Created Successfully';
  if (lower.includes('welcome back') || lower.includes('login') || lower.includes('logged in')) return 'Welcome Back';
  if (lower.includes('logged out') || lower.includes('logout')) return 'Logged Out Successfully';
  if (lower.includes('password')) return 'Password Changed Successfully';
  if (lower.includes('setting')) return 'Settings Saved';
  if (lower.includes('export')) return 'Export Completed';
  if (lower.includes('import')) return 'Import Completed';
  if (lower.includes('email') || lower.includes('verification code')) return 'Verification Code Sent';
  if (lower.includes('failed') || lower.includes('error')) return 'Action Failed';
  if (type === 'success') return 'Changes Saved';
  if (type === 'error') return 'Failed to Complete Action';
  if (type === 'warning') return 'Warning';
  return 'Notification';
}

function formatSmartDescription(msg, type) {
  if (msg && msg.length > 5) return msg;
  if (type === 'success') return 'Your changes have been saved successfully to your workspace.';
  if (type === 'error') return 'Something went wrong. Please try again.';
  if (type === 'warning') return 'Please review your input before leaving.';
  return 'System notification.';
}
