import React, { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import Navbar from './components/Navbar';
import CommandPalette from './components/CommandPalette';
import Toast from './components/Toast';
import TaskFormModal from './components/TaskFormModal';
import DatabaseModal from './components/DatabaseModal';
import SettingsModal from './components/SettingsModal';
import FloatingActionButton from './components/FloatingActionButton';
import { calculateTaskStatus } from './utils/statusHelper.js';
import { notifyTaskCompleted } from './utils/notificationService.js';

// Page Imports with Code Splitting / Lazy Loading
import HomePage from './pages/HomePage';
const TasksPage = lazy(() => import('./pages/TasksPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));

// Custom Hooks
import useToast from './hooks/useToast';
import useAuth from './hooks/useAuth';
import useTasks from './hooks/useTasks';
import useFCM from './hooks/useFCM';
import useInAppNotifications from './hooks/useInAppNotifications';
// ─── Notification Helper ─────────────────────────────────────────────────────

export default function App() {
  // ─── Toast Hook ────────────────────────────────────────────────────────────
  const { toasts, addToast, removeToast } = useToast();

  // ─── Notification Cycle Breaker ────────────────────────────────────────────
  // We use a ref to hold createNotification so we can pass addNotification to useAuth 
  // before useInAppNotifications is initialized (preventing the TDZ for 'user').
  const createNotificationRef = useRef(null);

  const addNotification = useCallback((text, type = 'info', taskId = null, title = null) => {
    if (createNotificationRef.current) {
      createNotificationRef.current(text, type, taskId, title);
    }
  }, []);

  // ─── Firebase Cloud Messaging ───────────────────────────────────────────────
  useFCM(addToast, addNotification);

  // ─── Auth Hook ──────────────────────────────────────────────────────────────
  const { user, authReady, setUser, handleAuthSubmit, handleLogout } = useAuth(addToast, addNotification);

  // ─── API Auth Error Handler ────────────────────────────────────────────────
  const handleApiAuthError = useCallback((err) => {
    if (err.status === 401) {
      addToast('Session expired. Please log in again.', 'danger');
      setUser(null);
      return true;
    }
    return false;
  }, [addToast, setUser]);

  // ─── Real Notification System ──────────────────────────────────────────────
  const {
    notifications,
    unreadCount,
    hasMore,
    fetchNotifications,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useInAppNotifications(user, handleApiAuthError);

  // Update ref with actual createNotification
  createNotificationRef.current = createNotification;

  // ─── Tasks & Categories Hook ───────────────────────────────────────────────
  const {
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
  } = useTasks(user, addToast, addNotification, handleApiAuthError);

  // ─── Theme & UI States ─────────────────────────────────────────────────────
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('tasksphere-theme') || 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const [activePage, setActivePage] = useState('home');

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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    try {
      const stored = localStorage.getItem('notifications_enabled');
      return stored !== null ? JSON.parse(stored) : true;
    } catch {
      return true;
    }
  });

  // Scroll Progress
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const [notificationPermission, setNotificationPermission] = useState(() => {
    return typeof Notification !== 'undefined' ? Notification.permission : 'default';
  });

  useEffect(() => {
    const syncPermission = () => {
      if (typeof Notification !== 'undefined') {
        setNotificationPermission(Notification.permission);
      }
    };

    // Auto-prompt for permission if default
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
        .then((perm) => {
          setNotificationPermission(perm);
        })
        .catch((err) => console.error('Error requesting notification permission:', err));
    }

    window.addEventListener('focus', syncPermission);
    return () => window.removeEventListener('focus', syncPermission);
  }, []);

  // ─── Dynamic Task Reminders (Pure setTimeout Scheduler - No Polling) ───────
  const notifiedTasksRef = useRef(new Set());

  useEffect(() => {
    if (!notificationsEnabled) return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    // Prune obsolete Set keys for tasks that were completed, deleted, or whose schedule changed
    const activeKeys = new Set();
    tasks.forEach(t => {
      if (!t.completed && t.dueDate && t.dueTime) {
        activeKeys.add(`${t.id}_${t.dueDate}_${t.dueTime}_30min`);
        activeKeys.add(`${t.id}_${t.dueDate}_${t.dueTime}_exact`);
        activeKeys.add(`${t.id}_${t.dueDate}_${t.dueTime}_overdue`);
      }
    });
    for (const key of notifiedTasksRef.current) {
      if (!activeKeys.has(key)) {
        notifiedTasksRef.current.delete(key);
      }
    }

    const timeouts = [];
    const now = new Date().getTime();

    tasks.forEach(task => {
      if (task.completed || !task.dueDate || !task.dueTime) return;

      const [year, month, day] = task.dueDate.split('-').map(Number);
      const [hour, minute] = task.dueTime.split(':').map(Number);
      const dueDateTime = new Date(year, month - 1, day, hour, minute).getTime();

      const msUntilDue = dueDateTime - now;
      const msUntil30Min = msUntilDue - (30 * 60 * 1000);

      const triggerNotification = (type) => {
        const key = `${task.id}_${task.dueDate}_${task.dueTime}_${type}`;
        if (notifiedTasksRef.current.has(key)) return;
        
        let title, body, msg;
        if (type === '30min') {
          title = 'Upcoming Task (30 min)';
          body = `${task.title}\nCategory: ${task.category || 'Personal'}\nTime: ${task.dueTime.substring(0, 5)}`;
          msg = `"${task.title}" is due in 30 minutes!`;
        } else if (type === 'exact') {
          title = 'Task Due Now';
          body = `${task.title}\nCategory: ${task.category || 'Personal'}\nTime: ${task.dueTime.substring(0, 5)}`;
          msg = `"${task.title}" is due now!`;
        } else if (type === 'overdue') {
          title = 'Task Overdue';
          body = `${task.title}\nCategory: ${task.category || 'Personal'}`;
          msg = `"${task.title}" is overdue!`;
        }

        if (Notification.permission === 'granted') {
          try {
            new Notification(title, {
              body,
              icon: "/favicon.ico"
            });
          } catch (err) {
            console.error("Browser Notification Error:", err);
          }
        }
        
        createNotification(msg, type, task.id, task.title);
        notifiedTasksRef.current.add(key);
      };

      // Handle Overdue (if overdue within the last 24h)
      if (msUntilDue < 0 && msUntilDue > -86400000) {
        triggerNotification('overdue');
      }

      // Max timeout limit in JS is ~24.8 days (2147483647 ms)
      if (msUntil30Min > 0 && msUntil30Min <= 2147483647) {
        timeouts.push(setTimeout(() => triggerNotification('30min'), msUntil30Min));
      }
      
      if (msUntilDue > 0 && msUntilDue <= 2147483647) {
        timeouts.push(setTimeout(() => triggerNotification('exact'), msUntilDue));
      }
    });

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [tasks, notificationsEnabled, notificationPermission]);

  // Load user data on successful auth verification
  useEffect(() => {
    if (user) {
      fetchTasksFromDB(user);
      fetchCategoriesFromDB(user);
      fetchNotifications(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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

  const onLogoutClick = () => {
    handleLogout(clearTasksAndCategories);
  };

  // Filter & Sort Tasks
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
          const catMatch = t.category ? t.category.toLowerCase().includes(q) : false;
          return titleMatch || descMatch || catMatch;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
        if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
        if (sortBy === 'dueDate') {
          const statusA = calculateTaskStatus(a);
          const statusB = calculateTaskStatus(b);
          
          const rank = {
            'Overdue': 1,
            'Due Today': 2,
            'Upcoming': 3,
            'No Due Date': 4,
            'Completed': 5
          };
          
          if (rank[statusA] !== rank[statusB]) {
            return rank[statusA] - rank[statusB];
          }
          
          if (a.dueDate && b.dueDate) {
            const dateA = new Date(`${a.dueDate}T${a.dueTime || '00:00:00'}`);
            const dateB = new Date(`${b.dueDate}T${b.dueTime || '00:00:00'}`);
            return dateA - dateB;
          }
          
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        if (sortBy === 'priority') {
          const pRank = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
          return pRank[b.priority] - pRank[a.priority];
        }
        return 0;
      });
  }, [tasks, searchQuery, statusFilter, categoryFilter, sortBy]);

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
    return (
      <Suspense fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)' }}>
          <div className="auth-spinner" />
        </div>
      }>
        <AuthPage onAuthSuccess={(mode, payload) => handleAuthSubmit(mode, payload, fetchTasksFromDB, fetchCategoriesFromDB)} />
      </Suspense>
    );
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      {/* Top Scroll Progress Bar */}
      <div className="scroll-progress-bar" style={{ width: `${scrollProgress}%` }} />

      {/* Executive Luxury Ambient Background */}
      <div className="aurora-bg">
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
          onLogout={onLogoutClick}
          notifications={notifications}
          unreadCount={unreadCount}
          hasMoreNotifications={hasMore}
          onOpenSettingsModal={() => setIsSettingsOpen(true)}
          onPermissionChange={setNotificationPermission}
          onMarkAsReadNotification={markAsRead}
          onMarkAllAsReadNotification={markAllAsRead}
          onDeleteNotification={deleteNotification}
          onLoadMoreNotifications={() => fetchNotifications(false)}
        />

        {/* Dynamic Page Rendering with Suspense Code Splitting */}
        <Suspense fallback={
          <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="auth-spinner" />
          </div>
        }>
          <AnimatePresence mode="wait">
            {activePage === 'home' && (
              <HomePage 
                key="home"
                tasks={tasks}
                user={user}
                categories={categories}
                onPageChange={setActivePage}
                onToggleComplete={(id) => handleToggleComplete(id, notificationsEnabled, notifyTaskCompleted)}
              />
            )}

            {activePage === 'tasks' && (
              <TasksPage 
                key="tasks"
                tasks={filteredTasks}
                categories={categories}
                isLoading={isLoading}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                categoryFilter={categoryFilter}
                onCategoryFilterChange={setCategoryFilter}
                sortBy={sortBy}
                onSortByChange={setSortBy}
                onToggleComplete={(id) => handleToggleComplete(id, notificationsEnabled, notifyTaskCompleted)}
                onEdit={(t) => { setTaskToEdit(t); setIsTaskModalOpen(true); }}
                onDelete={handleDeleteTask}
                onClearCompleted={handleClearCompleted}
                onOpenCreateModal={() => { setTaskToEdit(null); setIsTaskModalOpen(true); }}
                onSaveTask={(data) => handleSaveTask(data, null, null)}
                onRescheduleTask={handleRescheduleTask}
                onUpdateKanbanStatus={updateTaskStatusLocally}
              />
            )}

            {activePage === 'analytics' && (
              <AnalyticsPage 
                key="analytics"
                tasks={tasks}
                notifications={notifications}
              />
            )}

            {activePage === 'about' && (
              <AboutPage 
                key="about"
                onNavigateToTasks={() => setActivePage('tasks')}
              />
            )}
          </AnimatePresence>
        </Suspense>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton onClick={() => { setTaskToEdit(null); setIsTaskModalOpen(true); }} />

      {/* Back to Top Button */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            aria-label="Scroll back to top of page"
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
        onSave={(data) => handleSaveTask(data, taskToEdit, setTaskToEdit)}
        taskToEdit={taskToEdit}
        categories={categories}
        onCreateCategory={handleCreateCategory}
      />

      {/* Database Inspector Modal */}
      <DatabaseModal 
        isOpen={isDBModalOpen}
        onClose={() => setIsDBModalOpen(false)}
        tasks={tasks}
        onSeedData={handleSeedData}
        onResetDB={() => handleResetDB(setIsDBModalOpen)}
      />

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        notificationsEnabled={notificationsEnabled}
        onToggleNotifications={() => setNotificationsEnabled(prev => {
          const next = !prev;
          try {
            localStorage.setItem('notifications_enabled', JSON.stringify(next));
          } catch {}
          return next;
        })}
        onNavigateAbout={() => setActivePage('about')}
      />

      {/* Toast Notification Container */}
      <Toast toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
