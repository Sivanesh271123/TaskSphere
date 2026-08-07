import db from '../config/db.js';

const NotificationModel = {
  async getAllByUser(userId, limit = 50, offset = 0) {
    const [rows] = await db.execute(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [userId, parseInt(limit), parseInt(offset)]
    );
    return rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      taskId: row.task_id,
      title: row.title,
      message: row.message,
      type: row.type,
      isRead: Boolean(row.is_read),
      createdAt: row.created_at
    }));
  },

  async getUnreadCount(userId) {
    const [rows] = await db.execute(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );
    return { count: parseInt(rows[0].count, 10) || 0 };
  },

  async create(userId, data) {
    const { message, type, taskId, title } = data;

    // Duplicate Prevention Logic
    if (taskId) {
      const [existing] = await db.execute(
        'SELECT id FROM notifications WHERE user_id = ? AND task_id = ? AND type = ? LIMIT 1',
        [userId, taskId, type || 'info']
      );
      if (existing.length > 0) {
        // Notification already exists for this task and type (e.g. 30min reminder)
        // We will just return the existing one.
        const [rows] = await db.execute('SELECT * FROM notifications WHERE id = ?', [existing[0].id]);
        const row = rows[0];
        return {
          id: row.id,
          userId: row.user_id,
          taskId: row.task_id,
          title: row.title,
          message: row.message,
          type: row.type,
          isRead: Boolean(row.is_read),
          createdAt: row.created_at
        };
      }
    }

    const [result] = await db.execute(
      'INSERT INTO notifications (user_id, task_id, title, message, type) VALUES (?, ?, ?, ?, ?)',
      [userId, taskId || null, title || null, message, type || 'info']
    );

    const [rows] = await db.execute('SELECT * FROM notifications WHERE id = ?', [result.insertId]);
    const row = rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      taskId: row.task_id,
      title: row.title,
      message: row.message,
      type: row.type,
      isRead: Boolean(row.is_read),
      createdAt: row.created_at
    };
  },

  async markAsRead(id, userId) {
    await db.execute(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return { success: true };
  },

  async markAllAsRead(userId) {
    await db.execute(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );
    return { success: true };
  },

  async delete(id, userId) {
    await db.execute(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return { success: true };
  }
};

export default NotificationModel;
