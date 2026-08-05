import React, { useState } from 'react';
import { 
  Sparkles, Home, LayoutList, Kanban, Calendar, BarChart3, 
  Command, Bell, Sun, Moon, Plus, Database, Settings, Search, LogOut, UserCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar({ 
  activePage,
  onPageChange,
  onOpenCreateModal, 
  onOpenCmdPalette, 
  onOpenDBModal,
  theme, 
  onToggleTheme,
  user,
  onLogout,
  notifications = []
}) {
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.length;

  return (
    <div className="navbar-wrapper">
      <nav className="floating-navbar">
        {/* Brand Logo */}
        <div className="nav-brand" onClick={() => onPageChange('home')}>
          <motion.div 
            className="nav-logo-mark"
            style={{ width: 52, height: 52, borderRadius: 16 }}
            whileHover={{ scale: 1.08, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Sparkles size={26} />
          </motion.div>
          <div>
            <div className="nav-title" style={{ fontSize: '1.6rem' }}>TaskSphere</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-gold)', fontWeight: 700 }}>EXECUTIVE SAAS</div>
          </div>
        </div>

        {/* Main Navigation Pages */}
        <div className="view-tabs">
          <button 
            className={`view-tab-btn ${activePage === 'home' ? 'active' : ''}`}
            onClick={() => onPageChange('home')}
          >
            <Home size={18} />
            <span>Home</span>
          </button>

          <button 
            className={`view-tab-btn ${activePage === 'tasks' ? 'active' : ''}`}
            onClick={() => onPageChange('tasks')}
          >
            <LayoutList size={18} />
            <span>Tasks Workspace</span>
          </button>

          <button 
            className={`view-tab-btn ${activePage === 'analytics' ? 'active' : ''}`}
            onClick={() => onPageChange('analytics')}
          >
            <BarChart3 size={18} />
            <span>Goals & Progress</span>
          </button>
        </div>

        {/* Right Controls */}
        <div className="nav-controls">
          {/* Command Palette Search Button */}
          <button className="cmd-k-badge" onClick={onOpenCmdPalette} title="Search & Commands (Ctrl + K)">
            <Search size={14} style={{ color: 'var(--accent-gold-main)' }} />
            <span style={{ color: 'var(--text-muted)', flex: 1 }}>Search or type a command...</span>
            <span style={{ 
              display: 'flex', alignItems: 'center', gap: 3,
              padding: '2px 7px', borderRadius: 6,
              background: 'rgba(212, 175, 55, 0.1)',
              border: '1px solid var(--border-color)',
              fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-gold)'
            }}>
              <Command size={10} /> K
            </span>
          </button>

          {/* User / Logout */}
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.8rem' }}>
                <UserCircle2 size={16} />
                <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>{user.name}</span>
              </div>
              <button className="btn btn-secondary btn-icon" onClick={onLogout} title="Logout">
                <LogOut size={16} />
              </button>
            </div>
          )}

          {/* Database Inspector */}
          <button className="btn btn-secondary btn-icon" onClick={onOpenDBModal} title="Database Manager">
            <Database size={16} />
          </button>

          {/* Theme Toggle */}
          <button className="btn btn-secondary btn-icon" onClick={onToggleTheme} title="Toggle Theme">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Notifications Bell — REAL NOTIFICATIONS */}
          <div style={{ position: 'relative' }}>
            <button 
              className="btn btn-secondary btn-icon"
              onClick={() => { setShowNotifications(!showNotifications); }}
              title="Notifications"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: 4, right: 4, width: 8, height: 8, 
                  borderRadius: '50%', background: 'var(--accent-gold-main)'
                }} />
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="glass-panel"
                  style={{
                    position: 'absolute', right: 0, top: '120%', width: 320,
                    padding: '1rem', zIndex: 100, borderRadius: 'var(--radius-md)',
                    maxHeight: 360, overflowY: 'auto'
                  }}
                >
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-gold)', marginBottom: '0.75rem' }}>
                    Notifications & Activity
                  </div>
                  {notifications.length > 0 ? (
                    notifications.slice(0, 10).map(n => (
                      <div key={n.id} style={{ fontSize: '0.78rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                        <div style={{ fontWeight: 600 }}>{n.text}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{n.time}</div>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '1rem 0', textAlign: 'center' }}>
                      No notifications yet. Start managing tasks!
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* New Task Button */}
          <motion.button 
            className="btn btn-primary"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenCreateModal}
          >
            <Plus size={16} /> <span>New Task</span>
          </motion.button>
        </div>
      </nav>
    </div>
  );
}
