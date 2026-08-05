/**
 * Task Model — MySQL via mysql2/promise
 * All queries scoped by user_id for data isolation.
 */

import db from '../config/db.js';

function formatTask(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    priority: row.priority,
    dueDate: row.due_date,
    completed: Boolean(row.completed),
    createdAt: row.created_at
  };
}

const TaskModel = {
  async getAllByUser(userId) {
    const [rows] = await db.execute('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    return rows.map(formatTask);
  },

  async findById(id, userId) {
    const [rows] = await db.execute('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [id, userId]);
    return rows[0] ? formatTask(rows[0]) : null;
  },

  async create(userId, data) {
    const { title, description, category, priority, dueDate } = data;
    const [result] = await db.execute(
      'INSERT INTO tasks (user_id, title, description, category, priority, due_date) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, title, description || '', category || 'Personal', priority || 'Medium', dueDate || null]
    );

    const [rows] = await db.execute('SELECT * FROM tasks WHERE id = ?', [result.insertId]);
    return formatTask(rows[0]);
  },

  async update(id, userId, data) {
    const { title, description, category, priority, dueDate } = data;

    const existing = await this.findById(id, userId);
    if (!existing) throw new Error('Task not found');

    await db.execute(
      'UPDATE tasks SET title = ?, description = ?, category = ?, priority = ?, due_date = ? WHERE id = ? AND user_id = ?',
      [
        title ?? existing.title,
        description ?? existing.description,
        category ?? existing.category,
        priority ?? existing.priority,
        dueDate ?? existing.dueDate,
        id,
        userId
      ]
    );

    return this.findById(id, userId);
  },

  async toggleComplete(id, userId) {
    const existing = await this.findById(id, userId);
    if (!existing) throw new Error('Task not found');

    await db.execute('UPDATE tasks SET completed = ? WHERE id = ? AND user_id = ?', [!existing.completed, id, userId]);

    return this.findById(id, userId);
  },

  async delete(id, userId) {
    const existing = await this.findById(id, userId);
    if (!existing) throw new Error('Task not found');

    await db.execute('DELETE FROM tasks WHERE id = ? AND user_id = ?', [id, userId]);
    return { success: true };
  },

  async purgeCompleted(userId) {
    const [result] = await db.execute('DELETE FROM tasks WHERE user_id = ? AND completed = true', [userId]);
    return result.affectedRows;
  },

  async exportFormatted(userId) {
    const [rows] = await db.execute('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    return rows.map(row => ({
      ...formatTask(row),
      completed: row.completed ? 'Yes' : 'No'
    }));
  }
};

export default TaskModel;
