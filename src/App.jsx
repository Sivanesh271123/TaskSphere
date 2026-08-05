import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import { dbService } from './db/todoDatabase';
import Navbar from './components/Navbar';
import CommandPalette from './components/CommandPalette';
import Toast from './components/Toast';
import TaskFormModal from './components/TaskFormModal';
import DatabaseModal from './components/DatabaseModal';
import FloatingActionButton from './components/FloatingActionButton';

// Page Imports
import HomePage from './pages/HomePage';
import TasksPage from './pages/TasksPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AuthPage from './pages/AuthPage';

// ─── Notification Helper ─────────────────────────────────────────────────────
let notificationIdCounter = 0;
function createNotification(text) {
  return {
    id: ++notificationIdCounter,
    text,
    time: 'Just now',
    timestamp: Date.now()
  };
}

function formatNotificationTime(timestamp) {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ─── Gamification Helpers ────────────────────────────────────────────────────
function computeGamification(tasks) {
  const completed = tasks.filter(t => t.completed).length;
  const xpPerTask = 50;
  const totalXP = completed * xpPerTask;

  // Level thresholds: Level 1 = 0 XP, Level 2 = 100 XP, Level 3 = 250 XP, Level 4 = 500 XP, Level 5 = 800 XP, etc.
  const levels = [
    { level: 1, title: 'Task Apprentice', xpNeeded: 0 },
    { level: 2, title: 'Focus Initiate', xpNeeded: 100 },
    { level: 3, title: 'Silver Strategist', xpNeeded: 250 },
    { level: 4, title: 'Gold Architect', xpNeeded: 500 },
    { level: 5, title: 'Diamond Executor', xpNeeded: 800 },
    { level: 6, title: 'Master Strategist', xpNeeded: 1200 },
    { level: 7, title: 'Legendary Achiever', xpNeeded: 2000 }
  ];

  let currentLevel = levels[0];
  let nextLevel = levels[1];
  for (let i = levels.length - 1; i >= 0; i--) {
    if (totalXP >= levels[i].xpNeeded) {
      currentLevel = levels[i];
      nextLevel = levels[i + 1] || null;
      break;
    }
  }

  const xpInCurrentLevel = totalXP - currentLevel.xpNeeded;
  const xpForNextLevel = nextLevel ? (nextLevel.xpNeeded - currentLevel.xpNeeded) : 1;
  const levelProgress = nextLevel ? Math.min((xpInCurrentLevel / xpForNextLevel) * 100, 100) : 100;

  // Streak: count consecutive days (from today backwards) that have at least 1 completed task
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  const completedDates = new Set();
  tasks.forEach(t => {
    if (t.completed && t.createdAt) {
      const d = new Date(t.createdAt);
      d.setHours(0, 0, 0, 0);
      completedDates.add(d.getTime());
    }
  });
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today.getTime() - i * 86400000);
    if (completedDates.has(checkDate.getTime())) {
      streak++;
    } else if (i > 0) {
      break; // only break after checking today
    }
  }

  // Weekly completion percentage
  const oneWeekAgo = new Date(today.getTime() - 7 * 86400000);
  const thisWeekTasks = tasks.filter(t => {
    const d = new Date(t.createdAt);
    return d >= oneWeekAgo;
  });
  const thisWeekCompleted = thisWeekTasks.filter(t => t.completed).length;
  const weeklyPct = thisWeekTasks.length > 0 ? Math.round((thisWeekCompleted / thisWeekTasks.length) * 100) : 0;

  return {
    totalXP,
    currentLevel,
    nextLevel,
    levelProgress,
    xpInCurrentLevel,
    xpForNextLevel: nextLevel ? (nextLevel.xpNeeded - currentLevel.xpNeeded) : 0,
    xpDisplay: nextLevel
      ? `${totalXP - currentLevel.xpNeeded} / ${nextLevel.xpNeeded - currentLevel.xpNeeded} XP`
      : `${totalXP} XP (MAX)`,
    streak,
    weeklyPct,
    tasksToNextLevel: nextLevel ? Math.ceil((nextLevel.xpNeeded - totalXP) / xpPerTask) : 0
  };
}

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState(null);

  // Theme with localStorage persistence
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('tasksphere-theme') || 'dark';
    } catch {
      return 'dark';
    }
  });

  const [activePage, setActivePage] = useState('home'); // home | tasks | analytics

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Modals & Popovers
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [isDBModalOpen, setIsDBModalOpen] = useState(false);
  const [isCmdPaletteOpen, setIsCmdPaletteOpen] = useState(false);

  // Toast Notifications Stack
  const [toasts, setToasts] = useState([]);

  // Real Notification System
  const [notifications, setNotifications] = useState([]);

  // Scroll Progress
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Apply theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  const addNotification = useCallback((text) => {
    setNotifications(prev => {
      const updated = [createNotification(text), ...prev].slice(0, 20);
      return updated;
    });
  }, []);

  // Update notification relative timestamps every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications(prev =>
        prev.map(n => ({ ...n, time: formatNotificationTime(n.timestamp) }))
      );
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleApiAuthError = (err) => {
    if (!err?.message) return false;
    const authError = err.status === 401 || /authenti|token|login|expired/i.test(err.message);
    if (authError) {
      setUser(null);
      setTasks([]);
      addToast('Session expired or unauthorized. Please sign in again.', 'danger');
    }
    return authError;
  };

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
      if (handleApiAuthError(err)) {
        return;
      }
      console.error('Failed to load DB records:', err);
      addToast('Failed to load database records. Please try again.', 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  const checkAuth = async () => {
    try {
      const response = await dbService.me();
      if (response.user) {
        setUser(response.user);
        await fetchTasksFromDB(response.user);
      } else {
        setUser(null);
        setTasks([]);
      }
    } catch (err) {
      handleApiAuthError(err);
      setUser(null);
      setTasks([]);
    } finally {
      setAuthReady(true);
    }
  };

  // Load session on startup
  useEffect(() => {
    checkAuth();
  }, []);

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
      setScrollProgress(progress);
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard shortcut Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCmdPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    try {
      localStorage.setItem('tasksphere-theme', nextTheme);
    } catch { /* localStorage unavailable */ }
    addToast(`Switched to ${nextTheme} theme`, 'info');
  };

  const handleAuthSubmit = async (mode, payload) => {
    try {
      const response = mode === 'signup'
        ? await dbService.register({ name: payload.fullName, email: payload.email, password: payload.password })
        : await dbService.login({ email: payload.email, password: payload.password, rememberMe: payload.rememberMe });

      setUser(response.user);
      setActivePage('home');
      setTasks([]);
      await fetchTasksFromDB(response.user);

      const msg = mode === 'signup' ? 'Account created successfully' : 'Welcome back!';
      addToast(msg, 'success');
      addNotification(mode === 'signup' ? `🎉 Welcome to TaskSphere, ${response.user.name}!` : `👋 Welcome back, ${response.user.name}!`);

      return response;
    } catch (err) {
      throw err;
    }
  };

  const handleLogout = async () => {
    try {
      await dbService.logout();
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setUser(null);
      setTasks([]);
      setNotifications([]);
      setActivePage('home');
      addToast('You have been logged out', 'info');
    }
  };

  // CRUD Handlers
  const handleSaveTask = async (taskData) => {
    try {
      if (taskToEdit) {
        const updated = await dbService.updateTask(taskToEdit.id, taskData);
        setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
        addToast('Task updated successfully', 'success');
        addNotification(`✏️ Task "${updated.title}" updated`);
      } else {
        const created = await dbService.createTask(taskData);
        setTasks(prev => [created, ...prev]);
        addToast('New task added to your workspace', 'success');
        addNotification(`✨ New task "${created.title}" created`);
      }
      setTaskToEdit(null);
    } catch (err) {
      if (handleApiAuthError(err)) return;
      addToast(err.message || 'Failed to save task. Please try again.', 'danger');
    }
  };

  const handleToggleComplete = async (id) => {
    try {
      const updated = await dbService.toggleTaskStatus(id);
      setTasks(prev => prev.map(t => t.id === id ? updated : t));

      if (updated.completed) {
        addToast('Task completed! +50 XP 🏆', 'success');
        addNotification(`✅ Task "${updated.title}" completed! +50 XP 🏆`);
      } else {
        addToast('Task marked active', 'success');
        addNotification(`🔄 Task "${updated.title}" marked active`);
      }
    } catch (err) {
      if (handleApiAuthError(err)) return;
      addToast(err.message || 'Failed to update task status.', 'danger');
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      const taskToDelete = tasks.find(t => t.id === id);
      await dbService.deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
      addToast('Task deleted from database', 'danger');
      addNotification(`🗑️ Task "${taskToDelete?.title || 'Unknown'}" deleted`);
    } catch (err) {
      if (handleApiAuthError(err)) return;
      addToast(err.message || 'Failed to delete task.', 'danger');
    }
  };

  const handleClearCompleted = async () => {
    try {
      const count = await dbService.purgeCompletedTasks();
      setTasks(prev => prev.filter(t => !t.completed));
      addToast(`Purged ${count} completed tasks`, 'info');
      addNotification(`🧹 Purged ${count} completed tasks from database`);
    } catch (err) {
      if (handleApiAuthError(err)) return;
      addToast(err.message || 'Failed to clear completed tasks.', 'danger');
    }
  };

  const handleSeedData = async () => {
    try {
      await dbService.seedSampleData();
      await fetchTasksFromDB();
      addToast('Sample demo tasks loaded into database', 'info');
      addNotification('📦 Sample demo tasks loaded into database');
    } catch (err) {
      if (handleApiAuthError(err)) return;
      addToast(err.message || 'Failed to load sample data.', 'danger');
    }
  };

  const handleResetDB = async () => {
    if (!window.confirm('Are you sure you want to clear all tasks from the database?')) {
      return;
    }

    try {
      await dbService.resetDatabase();
      setTasks([]);
      setIsDBModalOpen(false);
      addToast('Database wiped clean', 'danger');
      addNotification('💥 Database wiped — all tasks removed');
    } catch (err) {
      if (handleApiAuthError(err)) return;
      addToast(err.message || 'Failed to reset the database.', 'danger');
    }
  };

  // Filter Tasks
  const filteredTasks = useMemo(() => {
    return tasks
      .filter(t => {
        if (statusFilter === 'active' && t.completed) return false;
        if (statusFilter === 'completed' && !t.completed) return false;
        if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const titleMatch = t.title.toLowerCase().includes(q);
          const descMatch = t.description && t.description.toLowerCase().includes(q);
          const catMatch = t.category.toLowerCase().includes(q);
          return titleMatch || descMatch || catMatch;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
        if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
        if (sortBy === 'dueDate') return new Date(a.dueDate) - new Date(b.dueDate);
        if (sortBy === 'priority') {
          const pRank = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
          return pRank[b.priority] - pRank[a.priority];
        }
        return 0;
      });
  }, [tasks, searchQuery, statusFilter, categoryFilter, sortBy]);

  // Compute gamification from real data
  const gamification = useMemo(() => computeGamification(tasks), [tasks]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!authReady) {
    return (
      <div className="auth-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="auth-card" style={{ padding: '2rem', textAlign: 'center' }}>
          <div className="auth-spinner" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ margin: 0 }}>Preparing your workspace...</h2>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onAuthSuccess={handleAuthSubmit} />;
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      {/* Top Scroll Progress Bar */}
      <div className="scroll-progress-bar" style={{ width: `${scrollProgress}%` }} />

      {/* Aurora Gradient Background */}
      <div className="aurora-bg">
        <div className="aurora-orb aurora-orb-1" />
        <div className="aurora-orb aurora-orb-2" />
        <div className="aurora-orb aurora-orb-3" />
        <div className="noise-overlay" />
      </div>

      <div className="app-container">
        {/* Floating Navbar with Page Links */}
        <Navbar 
          activePage={activePage}
          onPageChange={setActivePage}
          onOpenCreateModal={() => { setTaskToEdit(null); setIsTaskModalOpen(true); }}
          onOpenCmdPalette={() => setIsCmdPaletteOpen(true)}
          onOpenDBModal={() => setIsDBModalOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
          user={user}
          onLogout={handleLogout}
          notifications={notifications}
        />

        {/* Dynamic Page Rendering */}
        <AnimatePresence mode="wait">
          {activePage === 'home' && (
            <HomePage 
              key="home"
              tasks={tasks}
              user={user}
              gamification={gamification}
              onNavigateToTasks={() => setActivePage('tasks')}
              onOpenCreateModal={() => { setTaskToEdit(null); setIsTaskModalOpen(true); }}
              onOpenDBModal={() => setIsDBModalOpen(true)}
              onToggleComplete={handleToggleComplete}
            />
          )}

          {activePage === 'tasks' && (
            <TasksPage 
              key="tasks"
              tasks={tasks}
              isLoading={isLoading}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              sortBy={sortBy}
              setSortBy={setSortBy}
              filteredTasks={filteredTasks}
              onToggleComplete={handleToggleComplete}
              onOpenEditModal={(t) => { setTaskToEdit(t); setIsTaskModalOpen(true); }}
              onDeleteTask={handleDeleteTask}
              onClearCompleted={handleClearCompleted}
              onOpenCreateModal={() => { setTaskToEdit(null); setIsTaskModalOpen(true); }}
            />
          )}

          {activePage === 'analytics' && (
            <AnalyticsPage 
              key="analytics"
              tasks={tasks}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton onClick={() => { setTaskToEdit(null); setIsTaskModalOpen(true); }} />

      {/* Back to Top */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            style={{
              position: 'fixed', bottom: '2.5rem', left: '2.5rem',
              width: 44, height: 44, borderRadius: '50%',
              background: 'var(--bg-modal)', border: '1px solid var(--border-glow)',
              color: 'var(--text-main)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', zIndex: 80,
              boxShadow: 'var(--shadow-lg)'
            }}
            title="Back to Top"
          >
            <ArrowUp size={18} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Command Palette (Ctrl + K) */}
      <CommandPalette 
        isOpen={isCmdPaletteOpen}
        onClose={() => setIsCmdPaletteOpen(false)}
        onOpenCreateModal={() => { setTaskToEdit(null); setIsTaskModalOpen(true); }}
        onViewChange={(page) => { setActivePage(page === 'kanban' || page === 'calendar' || page === 'list' ? 'tasks' : page); }}
        onToggleTheme={toggleTheme}
        onOpenDBModal={() => setIsDBModalOpen(true)}
      />

      {/* Task Form Modal */}
      <TaskFormModal 
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        taskToEdit={taskToEdit}
      />

      {/* Database Inspector Modal */}
      <DatabaseModal 
        isOpen={isDBModalOpen}
        onClose={() => setIsDBModalOpen(false)}
        tasks={tasks}
        onSeedData={handleSeedData}
        onResetDB={handleResetDB}
      />

      {/* Toast Notification Container */}
      <Toast toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
