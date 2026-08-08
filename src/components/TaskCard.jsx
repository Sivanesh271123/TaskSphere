import React from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Check, Edit2, Trash2, Calendar, Clock, AlertCircle } from 'lucide-react';
import { calculateTaskStatus, formatTime12Hour } from '../utils/statusHelper.js';

const TaskCard = React.memo(function TaskCard({ task, onToggleComplete, onEdit, onDelete, categories = [] }) {
  const status = React.useMemo(() => calculateTaskStatus(task), [task]);
  const isOverdue = status === 'Overdue';

  const statusConfigs = {
    'Upcoming': { text: '🟢 Upcoming', color: 'var(--status-upcoming)' },
    'Due Today': { text: '🟡 Due Today', color: 'var(--status-due-today)' },
    'Overdue': { text: '🔴 Overdue', color: 'var(--status-overdue)' },
    'Completed': { text: '✅ Completed', color: 'var(--status-completed)' }
  };
  const statusInfo = statusConfigs[status];

  const getRepeatBadgeText = () => {
    const type = task.repeatType;
    const interval = task.repeatInterval || 1;
    if (!type || type === 'None') return null;
    if (type === 'Daily') {
      return interval === 1 ? '🔁 Daily' : `🔁 Every ${interval} days`;
    }
    if (type === 'Weekly') {
      return interval === 1 ? '🔁 Weekly' : `🔁 Every ${interval} weeks`;
    }
    if (type === 'Monthly') {
      return interval === 1 ? '🔁 Monthly' : `🔁 Every ${interval} months`;
    }
    if (type === 'Custom') {
      return `🔁 Every ${interval} days`;
    }
    return null;
  };
  const repeatText = getRepeatBadgeText();

  const categoryConfigs = {
    'Personal': { icon: '👤', color: '#6b7280' },
    'Study': { icon: '📘', color: '#3b82f6' },
    'Work': { icon: '💼', color: '#8b5cf6' },
    'Shopping': { icon: '🛒', color: '#f97316' },
    'Health': { icon: '❤️', color: '#22c55e' },
    'Finance': { icon: '💰', color: '#10b981' },
    'Others': { icon: '📦', color: '#64748b' }
  };

  const currentCategory = task.category || 'Personal';
  const categoryConfig = categoryConfigs[currentCategory] || categoryConfigs['Personal'];

  const badgeStyle = {
    backgroundColor: `${categoryConfig.color}12`,
    color: categoryConfig.color,
    borderColor: `${categoryConfig.color}40`,
    textShadow: `0 0 8px ${categoryConfig.color}30`
  };

  const handleCheckClick = () => {
    if (!task.completed) {
      // Trigger golden celebration confetti
      confetti({
        particleCount: 50,
        spread: 65,
        origin: { y: 0.7 },
        colors: ['#ffd700', '#d4af37', '#fcf6ba', '#ffffff']
      });
    }
    onToggleComplete(task.id);
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 15, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={`glass-panel card-luxury card-priority-${task.priority} ${task.completed ? 'completed' : ''}`}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', marginBottom: '0.65rem' }}>
          <motion.button 
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            className={`check-btn ${task.completed ? 'checked' : ''}`}
            onClick={handleCheckClick}
            title={task.completed ? "Mark Incomplete" : "Mark Complete"}
            aria-label="Toggle task completion status"
          >
            {task.completed && <Check size={14} strokeWidth={3} />}
          </motion.button>

          <h3 className="card-title">{task.title}</h3>
        </div>

        {task.description && (
          <p className="card-desc">{task.description}</p>
        )}
      </div>

      <div className="card-meta-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span className="badge-tag" style={badgeStyle}>
            <span style={{ display: 'inline', marginRight: 4, fontSize: '1.1em' }}>{categoryConfig.icon}</span>
            {currentCategory}
          </span>

          {repeatText && (
            <span className="badge-tag" style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: 'var(--text-gold)',
              borderColor: 'rgba(212, 175, 55, 0.25)',
              fontWeight: 700
            }}>
              {repeatText}
            </span>
          )}

          {statusInfo && (
            <span className="badge-tag" style={{
              backgroundColor: `${statusInfo.color}12`,
              color: statusInfo.color,
              borderColor: `${statusInfo.color}40`,
              textShadow: `0 0 8px ${statusInfo.color}30`,
              fontWeight: 800
            }}>
              {statusInfo.text}
            </span>
          )}

          {task.dueDate && (
            <span className="meta-chip-date" title={`Due Date: ${task.dueDate}`}>
              <Calendar size={14} className="icon-calendar" />
              <span>{task.dueDate}</span>
              {task.dueTime && (
                <span className="meta-chip-time" style={{ marginLeft: 4 }} title={`Due Time: ${formatTime12Hour(task.dueTime)}`}>
                  <Clock size={14} className="icon-clock" />
                  <span>{formatTime12Hour(task.dueTime)}</span>
                </span>
              )}
              {isOverdue && <AlertCircle size={14} className="icon-overdue" style={{ marginLeft: 2 }} />}
            </span>
          )}
        </div>

        <div className="task-actions">
          <button 
            className="action-icon-btn" 
            onClick={() => onEdit(task)}
            title="Edit Task"
            aria-label="Edit task"
          >
            <Edit2 size={14} aria-hidden="true" />
          </button>

          <button 
            className="action-icon-btn delete" 
            onClick={() => onDelete(task.id)}
            title="Delete Task"
            aria-label="Delete task"
          >
            <Trash2 size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    </motion.div>
  );
});

export default TaskCard;
