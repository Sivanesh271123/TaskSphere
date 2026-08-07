/**
 * Task Model — MySQL / PostgreSQL
 * Scoped by user_id for data isolation.
 * Dynamically expands recurring tasks within requested ranges.
 */

import db from '../config/db.js';
import { calculateTaskStatus } from '../utils/statusHelper.js';
import { generateOccurrences } from '../utils/recurrenceHelper.js';
import NotificationModel from './notificationModel.js';

function formatDate(dateVal) {
  if (!dateVal) return null;
  if (dateVal instanceof Date) {
    const year = dateVal.getFullYear();
    const month = String(dateVal.getMonth() + 1).padStart(2, '0');
    const day = String(dateVal.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  if (typeof dateVal === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) return dateVal;
    return new Date(dateVal).toISOString().split('T')[0];
  }
  return null;
}

function formatTask(row) {
  const task = {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    priority: row.priority,
    dueDate: formatDate(row.due_date),
    dueTime: row.due_time,
    repeatType: row.repeat_type || 'None',
    repeatInterval: row.repeat_interval || 1,
    startDate: formatDate(row.start_date),
    endDate: formatDate(row.end_date),
    completed: Boolean(row.completed),
    kanbanStatus: row.kanban_status || 'Todo',
    createdAt: row.created_at
  };
  task.status = calculateTaskStatus(task);
  return task;
}

const TaskModel = {
  async getAllByUser(userId, rangeStart, rangeEnd) {
    // 1. Determine range limits
    const today = new Date();
    const defaultStart = new Date(today.getTime() - 30 * 24 * 3600 * 1000).toISOString().split('T')[0];
    const defaultEnd = new Date(today.getTime() + 90 * 24 * 3600 * 1000).toISOString().split('T')[0];
    const start = rangeStart || defaultStart;
    const end = rangeEnd || defaultEnd;

    // 2. Fetch all raw task definitions
    const [rows] = await db.execute('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    const tasks = rows.map(formatTask);

    // 3. Fetch all completions for recurring tasks
    const [completions] = await db.execute(
      'SELECT task_id, completed_date FROM task_completions WHERE task_id IN (SELECT id FROM tasks WHERE user_id = ?)',
      [userId]
    );

    // Group completed dates by task_id
    const completionsMap = {};
    completions.forEach(c => {
      const tId = c.task_id;
      if (!completionsMap[tId]) completionsMap[tId] = new Set();
      completionsMap[tId].add(formatDate(c.completed_date));
    });

    // 4. Generate dynamic occurrences
    const expandedTasks = [];
    tasks.forEach(t => {
      if (t.repeatType && t.repeatType !== 'None') {
        const occurrences = generateOccurrences(t, start, end, completionsMap[t.id] || new Set());
        expandedTasks.push(...occurrences);
      } else {
        expandedTasks.push(t);
      }
    });

    return expandedTasks;
  },

  async findById(id, userId) {
    const parts = String(id).split('_');
    const rawId = parseInt(parts[0], 10);

    const [rows] = await db.execute('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [rawId, userId]);
    if (rows.length === 0) return null;

    const parent = formatTask(rows[0]);
    if (parts.length === 2) {
      const completedDate = parts[1];
      const [completions] = await db.execute(
        'SELECT * FROM task_completions WHERE task_id = ? AND completed_date = ?',
        [rawId, completedDate]
      );
      return {
        ...parent,
        id: id,
        dueDate: completedDate,
        completed: completions.length > 0,
        isOccurrence: true,
        parentTaskId: rawId
      };
    }

    return parent;
  },

  async create(userId, data) {
    const { 
      title, description, category, priority, dueDate, dueTime,
      repeatType, repeatInterval, startDate, endDate, kanbanStatus
    } = data;

    const [result] = await db.execute(
      'INSERT INTO tasks (user_id, title, description, category, priority, due_date, due_time, repeat_type, repeat_interval, start_date, end_date, kanban_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        userId, 
        title, 
        description || '', 
        category || 'Personal', 
        priority || 'Medium', 
        dueDate || null, 
        dueTime || null,
        repeatType || 'None',
        repeatInterval || 1,
        startDate || null,
        endDate || null,
        kanbanStatus || 'Todo'
      ]
    );

    const [rows] = await db.execute('SELECT * FROM tasks WHERE id = ?', [result.insertId]);
    return formatTask(rows[0]);
  },

  async update(id, userId, data) {
    const parts = String(id).split('_');
    const rawId = parseInt(parts[0], 10);

    const { 
      title, description, category, priority, dueDate, dueTime,
      repeatType, repeatInterval, startDate, endDate, kanbanStatus, completed
    } = data;

    const existing = await this.findById(rawId, userId);
    if (!existing) throw new Error('Task not found');

    let newKanbanStatus = kanbanStatus !== undefined ? kanbanStatus : existing.kanbanStatus;
    let newCompleted = completed !== undefined ? completed : existing.completed;

    if (kanbanStatus !== undefined && kanbanStatus !== existing.kanbanStatus) {
      if (kanbanStatus === 'Completed') {
        newCompleted = true;
      } else if (existing.kanbanStatus === 'Completed' && kanbanStatus !== 'Completed') {
        newCompleted = false;
      }
    }

    if (completed !== undefined && completed !== existing.completed) {
      if (completed === true) {
        newKanbanStatus = 'Completed';
      } else if (existing.completed === true && completed === false) {
        newKanbanStatus = 'Todo';
      }
    }

    await db.execute(
      'UPDATE tasks SET title = ?, description = ?, category = ?, priority = ?, due_date = ?, due_time = ?, repeat_type = ?, repeat_interval = ?, start_date = ?, end_date = ?, kanban_status = ?, completed = ? WHERE id = ? AND user_id = ?',
      [
        title ?? existing.title,
        description ?? existing.description,
        category ?? existing.category,
        priority ?? existing.priority,
        dueDate !== undefined ? dueDate : existing.dueDate,
        dueTime !== undefined ? dueTime : existing.dueTime,
        repeatType ?? existing.repeatType,
        repeatInterval ?? existing.repeatInterval,
        startDate !== undefined ? startDate : existing.startDate,
        endDate !== undefined ? endDate : existing.endDate,
        newKanbanStatus,
        newCompleted,
        rawId,
        userId
      ]
    );

    return this.findById(id, userId);
  },

  async toggleComplete(id, userId) {
    const parts = String(id).split('_');
    const rawId = parseInt(parts[0], 10);

    const parent = await this.findById(rawId, userId);
    if (!parent) throw new Error('Task not found');

    if (parts.length === 2) {
      // Toggle recurring task occurrence completion
      const completedDate = parts[1];
      const [completions] = await db.execute(
        'SELECT * FROM task_completions WHERE task_id = ? AND completed_date = ?',
        [rawId, completedDate]
      );

      if (completions.length > 0) {
        await db.execute(
          'DELETE FROM task_completions WHERE task_id = ? AND completed_date = ?',
          [rawId, completedDate]
        );
      } else {
        await db.execute(
          'INSERT INTO task_completions (task_id, completed_date) VALUES (?, ?)',
          [rawId, completedDate]
        );
        
        // Spawn a notification that a new occurrence is ready
        await NotificationModel.create(userId, {
          taskId: rawId,
          title: parent.title,
          message: `Cycle completed. A new occurrence of "${parent.title}" is now ready!`,
          type: 'recurring'
        });
      }

      return this.findById(id, userId);
    } else {
      // Toggle standard task completion
      const newCompleted = !parent.completed;
      const newKanbanStatus = newCompleted ? 'Completed' : 'Todo';
      await db.execute('UPDATE tasks SET completed = ?, kanban_status = ? WHERE id = ? AND user_id = ?', [newCompleted, newKanbanStatus, rawId, userId]);
      return this.findById(rawId, userId);
    }
  },

  async delete(id, userId) {
    const parts = String(id).split('_');
    const rawId = parseInt(parts[0], 10);

    const existing = await this.findById(rawId, userId);
    if (!existing) throw new Error('Task not found');

    await db.execute('DELETE FROM tasks WHERE id = ? AND user_id = ?', [rawId, userId]);
    return { success: true };
  },

  async purgeCompleted(userId) {
    // Delete all completed non-recurring tasks
    const [result] = await db.execute('DELETE FROM tasks WHERE user_id = ? AND completed = true AND (repeat_type IS NULL OR repeat_type = "None")', [userId]);
    // Delete task completions records
    await db.execute('DELETE FROM task_completions WHERE task_id IN (SELECT id FROM tasks WHERE user_id = ?)', [userId]);
    return result.affectedRows;
  },

  async exportFormatted(userId) {
    const tasks = await this.getAllByUser(userId);
    return tasks.map(t => ({
      ...t,
      completed: t.completed ? 'Yes' : 'No'
    }));
  },

  async purgeAll(userId) {
    await db.execute('DELETE FROM task_completions WHERE task_id IN (SELECT id FROM tasks WHERE user_id = ?)', [userId]);
    const [result] = await db.execute('DELETE FROM tasks WHERE user_id = ?', [userId]);
    return result.affectedRows;
  }
};

export default TaskModel;
