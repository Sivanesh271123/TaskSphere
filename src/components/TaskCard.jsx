import React from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Check, Edit2, Trash2, Calendar, Tag, AlertCircle } from 'lucide-react';

export default function TaskCard({ task, onToggleComplete, onEdit, onDelete }) {
  const isOverdue = !task.completed && new Date(task.dueDate) < new Date(new Date().setHours(0, 0, 0, 0));

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
          <span className="badge-tag">
            <Tag size={10} style={{ display: 'inline', marginRight: 4 }} />
            {task.category}
          </span>

          <span style={{ 
            fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem',
            color: isOverdue ? 'var(--danger-color)' : 'var(--text-muted)' 
          }}>
            <Calendar size={12} />
            {task.dueDate}
            {isOverdue && <AlertCircle size={12} style={{ marginLeft: 2 }} />}
          </span>
        </div>

        <div className="task-actions">
          <button 
            className="action-icon-btn" 
            onClick={() => onEdit(task)}
            title="Edit Task"
          >
            <Edit2 size={14} />
          </button>

          <button 
            className="action-icon-btn delete" 
            onClick={() => onDelete(task.id)}
            title="Delete Task"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
