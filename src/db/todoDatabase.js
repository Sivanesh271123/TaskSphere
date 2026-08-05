/**
 * TaskSphere API Service
 * CRUD operations use the Express + MySQL backend.
 * API_BASE is configurable via VITE_API_BASE environment variable.
 */

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = { 'Content-Type': 'application/json' };
  const config = {
    headers,
    credentials: 'include',
    ...options
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  let res;
  try {
    res = await fetch(url, config);
  } catch (err) {
    throw new Error('Network error. Please check your connection.');
  }

  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json() : await res.text();

  if (!res.ok) {
    const message = typeof data === 'string' ? data : (data.error || `API Error ${res.status}`);
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }

  return data;
}

class TaskSphereAPI {
  async getAllTasks() {
    return apiFetch('/tasks');
  }

  async createTask(taskData) {
    return apiFetch('/tasks', {
      method: 'POST',
      body: taskData
    });
  }

  async updateTask(id, updateData) {
    return apiFetch(`/tasks/${id}`, {
      method: 'PUT',
      body: updateData
    });
  }

  async toggleTaskStatus(id) {
    return apiFetch(`/tasks/${id}/toggle`, {
      method: 'PATCH'
    });
  }

  async deleteTask(id) {
    return apiFetch(`/tasks/${id}`, {
      method: 'DELETE'
    });
  }

  async purgeCompletedTasks() {
    const result = await apiFetch('/tasks/completed/purge', {
      method: 'DELETE'
    });
    return result.deleted;
  }

  async exportFormattedDatabase() {
    return apiFetch('/tasks/export/formatted');
  }

  async seedSampleData() {
    const samples = [
      { title: 'Design Glassmorphic UI', description: 'Create premium black & gold SaaS theme.', category: 'Work', priority: 'High', dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0] },
      { title: 'Connect MySQL Database', description: 'Integrate Express REST API with MySQL CRUD operations.', category: 'Work', priority: 'Urgent', dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0] },
      { title: 'Review Analytics Dashboard', description: 'Prepare productivity charts and weekly velocity charts.', category: 'Personal', priority: 'Medium', dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0] }
    ];

    const created = [];
    for (const s of samples) {
      const task = await this.createTask(s);
      created.push(task);
    }
    return created;
  }

  async resetDatabase() {
    await apiFetch('/tasks/completed/purge', { method: 'DELETE' });
    const allTasks = await this.getAllTasks();
    for (const t of allTasks) {
      await this.deleteTask(t.id);
    }
    return true;
  }

  async register(payload) {
    return apiFetch('/auth/register', {
      method: 'POST',
      body: payload
    });
  }

  async login(payload) {
    return apiFetch('/auth/login', {
      method: 'POST',
      body: payload
    });
  }

  async me() {
    return apiFetch('/auth/me');
  }

  async logout() {
    return apiFetch('/auth/logout', {
      method: 'POST'
    });
  }
}

export const dbService = new TaskSphereAPI();
