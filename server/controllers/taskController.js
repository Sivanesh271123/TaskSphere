/**
 * Task Controller
 * All operations are scoped to the authenticated user via req.user.id.
 * Includes input validation and XSS sanitization.
 */

import TaskModel from '../models/taskModel.js';

// ─── Sanitization & Validation Helpers ───────────────────────────────────────
const MAX_TITLE_LENGTH = 255;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_CATEGORY_LENGTH = 50;
const VALID_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const VALID_CATEGORIES = ['Work', 'Personal', 'Urgent', 'Ideas'];
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Strips HTML tags and trims whitespace to prevent XSS via stored content.
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

function validateTaskInput(data, isCreate = false) {
  const errors = [];
  const { title, description, category, priority, dueDate } = data;

  if (isCreate) {
    if (!title || !title.trim()) {
      errors.push('Task title is required.');
    }
  }

  if (title !== undefined) {
    if (typeof title !== 'string') {
      errors.push('Title must be a string.');
    } else if (title.trim().length > MAX_TITLE_LENGTH) {
      errors.push(`Title must be at most ${MAX_TITLE_LENGTH} characters.`);
    }
  }

  if (description !== undefined && typeof description === 'string') {
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push(`Description must be at most ${MAX_DESCRIPTION_LENGTH} characters.`);
    }
  }

  if (category !== undefined && !VALID_CATEGORIES.includes(category)) {
    errors.push(`Category must be one of: ${VALID_CATEGORIES.join(', ')}.`);
  }

  if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
    errors.push(`Priority must be one of: ${VALID_PRIORITIES.join(', ')}.`);
  }

  if (dueDate !== undefined && dueDate !== null && dueDate !== '') {
    if (!DATE_REGEX.test(dueDate)) {
      errors.push('Due date must be in YYYY-MM-DD format.');
    }
  }

  return errors;
}

function sanitizeTaskData(data) {
  const sanitized = {};
  if (data.title !== undefined) sanitized.title = sanitizeString(data.title);
  if (data.description !== undefined) sanitized.description = sanitizeString(data.description);
  if (data.category !== undefined) sanitized.category = data.category;
  if (data.priority !== undefined) sanitized.priority = data.priority;
  if (data.dueDate !== undefined) sanitized.dueDate = data.dueDate;
  return sanitized;
}

// ─── Controllers ─────────────────────────────────────────────────────────────
export async function getAllTasks(req, res) {
  try {
    const tasks = await TaskModel.getAllByUser(req.user.id);
    res.json(tasks);
  } catch (err) {
    console.error('GetAllTasks error:', err);
    res.status(500).json({ error: 'Failed to load tasks.' });
  }
}

export async function createTask(req, res) {
  try {
    const errors = validateTaskInput(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ error: errors[0] });
    }

    const sanitized = sanitizeTaskData(req.body);
    const task = await TaskModel.create(req.user.id, sanitized);
    res.status(201).json(task);
  } catch (err) {
    console.error('CreateTask error:', err);
    res.status(500).json({ error: 'Failed to create task.' });
  }
}

export async function updateTask(req, res) {
  try {
    const errors = validateTaskInput(req.body, false);
    if (errors.length > 0) {
      return res.status(400).json({ error: errors[0] });
    }

    const sanitized = sanitizeTaskData(req.body);
    const task = await TaskModel.update(req.params.id, req.user.id, sanitized);
    res.json(task);
  } catch (err) {
    if (err.message === 'Task not found') {
      return res.status(404).json({ error: 'Task not found.' });
    }
    console.error('UpdateTask error:', err);
    res.status(500).json({ error: 'Failed to update task.' });
  }
}

export async function toggleTask(req, res) {
  try {
    const task = await TaskModel.toggleComplete(req.params.id, req.user.id);
    res.json(task);
  } catch (err) {
    if (err.message === 'Task not found') {
      return res.status(404).json({ error: 'Task not found.' });
    }
    console.error('ToggleTask error:', err);
    res.status(500).json({ error: 'Failed to toggle task.' });
  }
}

export async function deleteTask(req, res) {
  try {
    const result = await TaskModel.delete(req.params.id, req.user.id);
    res.json(result);
  } catch (err) {
    if (err.message === 'Task not found') {
      return res.status(404).json({ error: 'Task not found.' });
    }
    console.error('DeleteTask error:', err);
    res.status(500).json({ error: 'Failed to delete task.' });
  }
}

export async function purgeCompleted(req, res) {
  try {
    const deleted = await TaskModel.purgeCompleted(req.user.id);
    res.json({ deleted });
  } catch (err) {
    console.error('PurgeCompleted error:', err);
    res.status(500).json({ error: 'Failed to purge completed tasks.' });
  }
}

export async function exportFormatted(req, res) {
  try {
    const tasks = await TaskModel.exportFormatted(req.user.id);
    res.json(tasks);
  } catch (err) {
    console.error('ExportFormatted error:', err);
    res.status(500).json({ error: 'Failed to export tasks.' });
  }
}
