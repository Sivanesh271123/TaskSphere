import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, LayoutList, Kanban, Calendar, BarChart3, 
  Database, Sun, Moon, Download, Sparkles, Info 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useFocusTrap from '../hooks/useFocusTrap.js';

export default function CommandPalette({ 
  isOpen, 
  onClose, 
  onOpenCreateModal, 
  onViewChange, 
  onToggleTheme, 
  onOpenDBModal 
}) {
  const modalRef = useFocusTrap(isOpen, onClose);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands = [
    { id: 'create', title: 'Create New Task', icon: <Plus size={16} />, action: () => { onOpenCreateModal(); onClose(); } },
    { id: 'v-list', title: 'Switch to List View', icon: <LayoutList size={16} />, action: () => { onViewChange('list'); onClose(); } },
    { id: 'v-kanban', title: 'Switch to Kanban Board View', icon: <Kanban size={16} />, action: () => { onViewChange('kanban'); onClose(); } },
    { id: 'v-calendar', title: 'Switch to Calendar View', icon: <Calendar size={16} />, action: () => { onViewChange('calendar'); onClose(); } },
    { id: 'v-analytics', title: 'Switch to Analytics View', icon: <BarChart3 size={16} />, action: () => { onViewChange('analytics'); onClose(); } },
    { id: 'v-about', title: 'About TaskSphere (Mission, Features & Founder)', icon: <Info size={16} />, action: () => { onViewChange('about'); onClose(); } },
    { id: 'theme', title: 'Toggle Light / Dark Theme', icon: <Sun size={16} />, action: () => { onToggleTheme(); onClose(); } },
    { id: 'db', title: 'Open Database Inspector', icon: <Database size={16} />, action: () => { onOpenDBModal(); onClose(); } }
  ];

  const filteredCommands = commands.filter(c => 
    c.title.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation inside Command Palette
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredCommands.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
      } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
        e.preventDefault();
        filteredCommands[selectedIndex].action();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="cmd-modal-overlay" onClick={onClose}>
        <motion.div 
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="cmd-modal-box"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="cmd-input-row">
            <Search size={18} style={{ color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search tasks, categories, or commands..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', background: 'var(--surface-subtle)', padding: '2px 6px', borderRadius: 4 }}>
              ESC
            </span>
          </div>

          <div className="cmd-results-list">
            {filteredCommands.length > 0 ? (
              filteredCommands.map((cmd, idx) => (
                <div 
                  key={cmd.id}
                  className={`cmd-item ${idx === selectedIndex ? 'selected' : ''}`}
                  onClick={cmd.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ color: 'var(--accent-primary)' }}>{cmd.icon}</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{cmd.title}</span>
                  </div>
                  <Sparkles size={12} style={{ opacity: 0.4 }} />
                </div>
              ))
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                No matching commands found.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
