import { useState, useCallback } from 'react';
import { dbService } from '../db/todoDatabase';

export default function useTasks(user, addToast, addNotification, handleApiAuthError) {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTasksFromDB = async (currentUser = user) => {
    if (!currentUser) {
      setTasks([]);
      return;
    }
    try {
      setIsLoading(true);
      const data = await dbService.getAllTasks();
      setTasks(data);
    } catch (err) {
      if (handleApiAuthError && handleApiAuthError(err)) return;
      console.error('Failed to load DB records:', err);
      addToast('Failed to load database records. Please try again.', 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategoriesFromDB = async (currentUser = user) => {
    if (!currentUser) {
      setCategories([]);
      return;
    }
    try {
      const data = await dbService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const handleSaveTask = async (taskData, taskToEdit, setTaskToEdit) => {
    try {
      if (taskToEdit) {
        const updated = await dbService.updateTask(taskToEdit.id, taskData);
        setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
        addToast('Task Updated', `"${updated.title}" updated successfully.`, 'success');
        addNotification(`✏️ Task "${updated.title}" updated`);
      } else {
        const created = await dbService.createTask(taskData);
        setTasks(prev => [created, ...prev]);
        addToast('Task Created', `"${created.title}" has been added.`, 'success');
        addNotification(`✨ New task "${created.title}" created`);
      }
      if (setTaskToEdit) setTaskToEdit(null);
    } catch (err) {
      if (handleApiAuthError && handleApiAuthError(err)) return;
      addToast('Failed to Save Task', err.message || 'Please try again.', 'danger');
    }
  };

  const handleToggleComplete = async (id, notificationsEnabled, notifyTaskCompleted) => {
    try {
      const updated = await dbService.toggleTaskStatus(id);
      setTasks(prev => prev.map(t => t.id === id ? updated : t));

      if (updated.completed) {
        addToast('Task Completed', `"${updated.title}" marked as completed. +50 XP 🏆`, 'success');
        addNotification(`✅ Task "${updated.title}" completed! +50 XP 🏆`, 'completed', updated.id, updated.title);
        if (notifyTaskCompleted) notifyTaskCompleted(updated.title, notificationsEnabled);
      } else {
        addToast('Task Reopened', `"${updated.title}" marked as active.`, 'info');
        addNotification(`🔄 Task "${updated.title}" marked active`, 'info', updated.id, updated.title);
      }
    } catch (err) {
      if (handleApiAuthError && handleApiAuthError(err)) return;
      addToast('Update Failed', err.message || 'Failed to update task status.', 'danger');
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      const taskToDelete = tasks.find(t => t.id === id);
      await dbService.deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
      addToast('Task Deleted', `"${taskToDelete?.title || 'Task'}" has been removed.`, 'danger');
      addNotification(`🗑️ Task "${taskToDelete?.title || 'Unknown'}" deleted`);
    } catch (err) {
      if (handleApiAuthError && handleApiAuthError(err)) return;
      addToast('Delete Failed', err.message || 'Failed to delete task.', 'danger');
    }
  };

  const handleClearCompleted = async () => {
    try {
      const count = await dbService.purgeCompletedTasks();
      setTasks(prev => prev.filter(t => !t.completed));
      addToast('Tasks Cleared', `${count} completed tasks removed from workspace.`, 'info');
      addNotification(`🧹 Purged ${count} completed tasks from database`);
    } catch (err) {
      if (handleApiAuthError && handleApiAuthError(err)) return;
      addToast('Purge Failed', err.message || 'Failed to clear completed tasks.', 'danger');
    }
  };

  const handleCreateCategory = async (catName, catColor) => {
    try {
      const created = await dbService.createCategory({ name: catName, color: catColor });
      setCategories(prev => [...prev, created]);
      addToast(`Category "${created.name}" created successfully`, 'success');
      return created;
    } catch (err) {
      if (handleApiAuthError && handleApiAuthError(err)) return;
      addToast(err.message || 'Failed to create category.', 'danger');
      throw err;
    }
  };

  const handleSeedData = async () => {
    try {
      await dbService.seedSampleData();
      await fetchTasksFromDB();
      addToast('Sample demo tasks loaded into database', 'info');
      addNotification('📦 Sample demo tasks loaded into database');
    } catch (err) {
      if (handleApiAuthError && handleApiAuthError(err)) return;
      addToast(err.message || 'Failed to load sample data.', 'danger');
    }
  };

  const updateTaskStatusLocally = useCallback(async (taskId, newKanbanStatus) => {
    let originalTask = null;

    setTasks(prev => {
      const taskIndex = prev.findIndex(t => t.id === taskId);
      if (taskIndex === -1) return prev;
      originalTask = prev[taskIndex];

      let newCompleted = originalTask.completed;
      if (newKanbanStatus === 'Completed') {
        newCompleted = true;
      } else if (originalTask.kanbanStatus === 'Completed' && newKanbanStatus !== 'Completed') {
        newCompleted = false;
      }

      const updatedTask = { ...originalTask, kanbanStatus: newKanbanStatus, completed: newCompleted };
      const newTasks = [...prev];
      newTasks[taskIndex] = updatedTask;
      return newTasks;
    });

    if (!originalTask) return; // Not found in state

    try {
      let newCompleted = originalTask.completed;
      if (newKanbanStatus === 'Completed') {
        newCompleted = true;
      } else if (originalTask.kanbanStatus === 'Completed' && newKanbanStatus !== 'Completed') {
        newCompleted = false;
      }
      
      const updated = await dbService.updateTask(taskId, { kanbanStatus: newKanbanStatus, completed: newCompleted });
      // Optional: sync with exact db response
      setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
    } catch (err) {
      if (handleApiAuthError && handleApiAuthError(err)) return;
      // Revert
      setTasks(prev => prev.map(t => t.id === taskId ? originalTask : t));
      addToast(err.message || 'Failed to update task status.', 'danger');
    }
  }, [handleApiAuthError, addToast]);

  const handleResetDB = async (setIsDBModalOpen) => {
    if (!window.confirm('Are you sure you want to clear all tasks from the database?')) {
      return;
    }
    try {
      await dbService.resetDatabase();
      setTasks([]);
      if (setIsDBModalOpen) setIsDBModalOpen(false);
      addToast('Database wiped clean', 'danger');
      addNotification('💥 Database wiped — all tasks removed');
    } catch (err) {
      if (handleApiAuthError && handleApiAuthError(err)) return;
      addToast(err.message || 'Failed to reset the database.', 'danger');
    }
  };

  const clearTasksAndCategories = () => {
    setTasks([]);
    setCategories([]);
  };

  const handleRescheduleTask = async (task, newDueDate) => {
    if (!task || !newDueDate || task.dueDate === newDueDate) return;

    const previousTasks = [...tasks];

    // Optimistic Update
    const optimisticTask = { ...task, dueDate: newDueDate };
    setTasks(prev => prev.map(t => t.id === task.id ? optimisticTask : t));

    try {
      const updated = await dbService.updateTask(task.id, { ...task, dueDate: newDueDate });
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
      addToast(`Task rescheduled to ${newDueDate}`, 'success');
      addNotification(`📅 Task "${updated.title}" rescheduled to ${newDueDate}`);
    } catch (err) {
      // Rollback on API failure
      setTasks(previousTasks);
      if (handleApiAuthError && handleApiAuthError(err)) return;
      addToast(err.message || 'Failed to reschedule task. Changes rolled back.', 'danger');
    }
  };

  return {
    tasks,
    categories,
    isLoading,
    fetchTasksFromDB,
    fetchCategoriesFromDB,
    handleSaveTask,
    handleRescheduleTask,
    handleToggleComplete,
    handleDeleteTask,
    handleClearCompleted,
    handleCreateCategory,
    handleSeedData,
    handleResetDB,
    clearTasksAndCategories,
    updateTaskStatusLocally
  };
}
