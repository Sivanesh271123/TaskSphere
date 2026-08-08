import React, { useState } from 'react';
import { 
  Sparkles, Home, LayoutList, BarChart3, 
  Command, Bell, Sun, Moon, Plus, Database, Settings, Search, LogOut, UserCircle2, Menu, X, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationPanel from './NotificationPanel';
import UserAvatar from './UserAvatar';

const Navbar = React.memo(function Navbar({ 
  activePage,
  onPageChange,
  onOpenCreateModal, 
  onOpenCmdPalette, 
  onOpenDBModal,
  theme, 
  onToggleTheme,
  user,
  onLogout,
  notifications = [],
  unreadCount = 0,
  hasMoreNotifications,
  onOpenSettingsModal,
  onPermissionChange,
  onMarkAsReadNotification,
  onMarkAllAsReadNotification,
  onDeleteNotification,
  onLoadMoreNotifications
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="navbar-wrapper">
      <nav className="floating-navbar" role="navigation" aria-label="Main Navigation">
        {/* Brand Logo */}
        <div className="nav-brand" onClick={() => onPageChange('home')}>
          <motion.div 
            className="nav-logo-mark"
            whileHover={{ scale: 1.05, rotate: 4 }}
            whileTap={{ scale: 0.95 }}
          >
            <img src="/tasksphere-logo.png" alt="TaskSphere Logo" className="nav-logo-img" />
          </motion.div>
          <span className="nav-title">TaskSphere</span>
        </div>

        {/* Desktop View Switcher Tabs */}
        <div className="view-tabs" role="tablist">
          <button 
            className={`view-tab-btn ${activePage === 'home' ? 'active' : ''}`}
            onClick={() => onPageChange('home')}
            role="tab"
            aria-selected={activePage === 'home'}
            aria-label="Home"
          >
            <Home size={16} aria-hidden="true" />
            <span>Home</span>
          </button>

          <button 
            className={`view-tab-btn ${activePage === 'tasks' ? 'active' : ''}`}
            onClick={() => onPageChange('tasks')}
            role="tab"
            aria-selected={activePage === 'tasks'}
            aria-label="Tasks Workspace"
          >
            <LayoutList size={16} aria-hidden="true" />
            <span>Tasks Workspace</span>
          </button>

          <button 
            className={`view-tab-btn ${activePage === 'analytics' ? 'active' : ''}`}
            onClick={() => onPageChange('analytics')}
            role="tab"
            aria-selected={activePage === 'analytics'}
            aria-label="Goals and Progress"
          >
            <BarChart3 size={16} aria-hidden="true" />
            <span>Goals & Progress</span>
          </button>
        </div>

        {/* Right Controls */}
        <div className="nav-controls">
          {/* Command Palette Search Button */}
          <button className="cmd-k-badge desktop-only-btn" onClick={onOpenCmdPalette} title="Search & Commands (Ctrl + K)" aria-label="Open Search and Command Palette">
            <Search size={14} style={{ color: 'var(--accent-gold-main)' }} />
            <span style={{ color: 'var(--text-secondary)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Search tasks, categories...</span>
            <span className="cmd-k-shortcut">
              <Command size={10} /> K
            </span>
          </button>

          {/* User Profile Pill (Desktop) */}
          {user && (
            <div className="nav-user-pill desktop-only-btn">
              <div className="nav-user-badge">
                <UserAvatar user={user} size={28} />
                <span className="nav-user-name">{user?.name || user?.email?.split('@')[0] || 'User'}</span>
              </div>
              <button className="btn btn-secondary btn-icon" onClick={onLogout} title="Logout" aria-label="Logout">
                <LogOut size={16} aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Database Inspector (Desktop) */}
          <button className="btn btn-secondary btn-icon desktop-only-btn" onClick={onOpenDBModal} title="Database Manager" aria-label="Database Manager">
            <Database size={16} aria-hidden="true" />
          </button>

          {/* Settings Inspector (Desktop) */}
          <button className="btn btn-secondary btn-icon desktop-only-btn" onClick={onOpenSettingsModal} title="Notification Settings" aria-label="Notification Settings">
            <Settings size={16} aria-hidden="true" />
          </button>

          {/* Theme Toggle (Desktop) */}
          <button className="btn btn-secondary btn-icon desktop-only-btn" onClick={onToggleTheme} title="Toggle Theme" aria-label={`Toggle Theme. Current theme is ${theme}`}>
            {theme === 'dark' ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
          </button>

          {/* Notifications Bell */}
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <motion.button 
              className="btn btn-secondary btn-icon"
              onClick={() => { setShowNotifications(!showNotifications); }}
              title="Notifications"
              aria-label={`Notifications, ${unreadCount} unread`}
              aria-expanded={showNotifications}
              animate={unreadCount > 0 ? { rotate: [0, -8, 8, -8, 8, 0] } : {}}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 5 }}
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="nav-unread-badge">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </motion.button>

            <NotificationPanel 
              isOpen={showNotifications}
              onClose={() => setShowNotifications(false)}
              notifications={notifications}
              hasMore={hasMoreNotifications}
              onMarkAsRead={onMarkAsReadNotification}
              onMarkAllAsRead={onMarkAllAsReadNotification}
              onDelete={onDeleteNotification}
              onLoadMore={onLoadMoreNotifications}
            />
          </div>

          {/* New Task Button */}
          <motion.button 
            className="btn-nav-primary"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenCreateModal}
          >
            <Plus size={16} /> <span>New Task</span>
          </motion.button>

          {/* Mobile Menu Toggle Button */}
          <button 
            className="btn btn-secondary btn-icon mobile-nav-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* Mobile Responsive Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            className="mobile-tabs-drawer"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* User Profile Info on Mobile */}
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserAvatar user={user} size={32} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{user?.name || 'User'}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{user?.email}</span>
                  </div>
                </div>
                <button className="btn btn-secondary btn-icon" onClick={onLogout} title="Logout" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                  <LogOut size={14} /> <span>Logout</span>
                </button>
              </div>
            )}

            {/* Navigation Pages */}
            <button 
              className={`mobile-tab-btn ${activePage === 'home' ? 'active' : ''}`}
              onClick={() => { onPageChange('home'); setMobileMenuOpen(false); }}
            >
              <Home size={18} />
              <span>Home</span>
            </button>
            <button 
              className={`mobile-tab-btn ${activePage === 'tasks' ? 'active' : ''}`}
              onClick={() => { onPageChange('tasks'); setMobileMenuOpen(false); }}
            >
              <LayoutList size={18} />
              <span>Tasks Workspace</span>
            </button>
            <button 
              className={`mobile-tab-btn ${activePage === 'analytics' ? 'active' : ''}`}
              onClick={() => { onPageChange('analytics'); setMobileMenuOpen(false); }}
            >
              <BarChart3 size={18} />
              <span>Goals & Progress</span>
            </button>

            {/* Search Bar on Mobile */}
            <button 
              className="btn btn-secondary" 
              onClick={() => { onOpenCmdPalette(); setMobileMenuOpen(false); }}
              style={{ width: '100%', justifyContent: 'flex-start', gap: '8px', padding: '10px 14px', fontSize: '0.85rem', marginTop: '4px' }}
            >
              <Search size={16} style={{ color: 'var(--accent-gold-main)' }} />
              <span>Search Tasks & Commands</span>
            </button>

            {/* Additional Quick Action Controls Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginTop: '4px' }}>
              <button className="btn btn-secondary" onClick={() => { onOpenDBModal(); setMobileMenuOpen(false); }} style={{ fontSize: '0.75rem', padding: '8px', flexDirection: 'column', gap: '4px' }}>
                <Database size={16} /> <span>Database</span>
              </button>
              <button className="btn btn-secondary" onClick={() => { onOpenSettingsModal(); setMobileMenuOpen(false); }} style={{ fontSize: '0.75rem', padding: '8px', flexDirection: 'column', gap: '4px' }}>
                <Settings size={16} /> <span>Settings</span>
              </button>
              <button className="btn btn-secondary" onClick={() => { onToggleTheme(); setMobileMenuOpen(false); }} style={{ fontSize: '0.75rem', padding: '8px', flexDirection: 'column', gap: '4px' }}>
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />} <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default Navbar;
