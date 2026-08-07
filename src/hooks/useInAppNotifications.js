import { useState, useCallback } from 'react';
import { API_BASE } from '../db/todoDatabase';

export default function useInAppNotifications(user, handleApiAuthError) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 20;

  const fetchUnreadCount = useCallback(async () => {
    if (!user || !user.token) return;
    try {
      const res = await fetch(`${API_BASE}/notifications/unread-count`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count);
      } else if (res.status === 401 && handleApiAuthError) {
        handleApiAuthError({ status: 401 });
      }
    } catch (err) {
      if (handleApiAuthError && handleApiAuthError(err)) return;
    }
  }, [user, handleApiAuthError]);

  const fetchNotifications = useCallback(async (reset = false) => {
    if (!user || !user.token) return;
    try {
      const offset = reset ? 0 : page * limit;
      const res = await fetch(`${API_BASE}/notifications?limit=${limit}&offset=${offset}`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (!res.ok) {
        const errObj = { status: res.status, message: `Failed to fetch notifications (${res.status})` };
        throw errObj;
      }
      const data = await res.json();
      
      setNotifications(prev => reset ? data : [...prev, ...data]);
      setHasMore(data.length === limit);
      if (reset) {
        setPage(1);
      } else {
        setPage(prev => prev + 1);
      }
      fetchUnreadCount();
    } catch (err) {
      if (handleApiAuthError && handleApiAuthError(err)) return;
      console.error('[Notification Service] Fetch Error:', err.message || err);
    }
  }, [user, handleApiAuthError, page, limit, fetchUnreadCount]);

  const createNotification = useCallback(async (message, type = 'info', taskId = null, title = null) => {
    const localNotif = {
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      message,
      type,
      taskId,
      title: title || (type === 'completed' ? 'Task Completed' : 'Notification'),
      createdAt: new Date().toISOString(),
      isRead: false
    };

    setNotifications(prev => [localNotif, ...prev]);
    setUnreadCount(prev => prev + 1);

    if (!user || !user.token) return;
    try {
      const res = await fetch(`${API_BASE}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ message, type, taskId, title })
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(prev => prev.map(n => n.id === localNotif.id ? data : n));
      }
    } catch (err) {
      if (handleApiAuthError && handleApiAuthError(err)) return;
      console.error('[Notification Service] Create DB Sync Error:', err.message || err);
    }
  }, [user, handleApiAuthError]);

  const markAsRead = useCallback(async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));

    if (!user || !user.token) return;
    try {
      const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (!res.ok && handleApiAuthError) {
        handleApiAuthError({ status: res.status });
      }
    } catch (err) {
      if (handleApiAuthError && handleApiAuthError(err)) return;
      console.error('[Notification Service] MarkRead Error:', err.message || err);
    }
  }, [user, handleApiAuthError]);

  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);

    if (!user || !user.token) return;
    try {
      const res = await fetch(`${API_BASE}/notifications/read-all`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (!res.ok && handleApiAuthError) {
        handleApiAuthError({ status: res.status });
      }
    } catch (err) {
      if (handleApiAuthError && handleApiAuthError(err)) return;
      console.error('[Notification Service] MarkAllRead Error:', err.message || err);
    }
  }, [user, handleApiAuthError]);

  const deleteNotification = useCallback(async (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));

    if (!user || !user.token) return;
    try {
      const res = await fetch(`${API_BASE}/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (!res.ok && handleApiAuthError) {
        handleApiAuthError({ status: res.status });
      }
    } catch (err) {
      if (handleApiAuthError && handleApiAuthError(err)) return;
      console.error('[Notification Service] Delete Error:', err.message || err);
    }
  }, [user, handleApiAuthError]);

  return {
    notifications,
    unreadCount,
    hasMore,
    fetchNotifications,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };
}
