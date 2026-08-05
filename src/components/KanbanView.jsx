import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import TaskCard from './TaskCard';

export default function KanbanView({ tasks, onToggleComplete, onEdit, onDelete, onOpenCreateModal }) {
  const pendingTasks = tasks.filter(t => !t.completed && t.priority !== 'Urgent');
  const inProgressTasks = tasks.filter(t => !t.completed && t.priority === 'Urgent');
  const completedTasks = tasks.filter(t => t.completed);

  const columns = [
    { id: 'pending', title: '📋 Backlog / To Do', color: 'var(--accent-primary)', tasks: pendingTasks },
    { id: 'in_progress', title: '🔥 In Progress / Urgent', color: 'var(--warning-color)', tasks: inProgressTasks },
    { id: 'completed', title: '✅ Completed', color: 'var(--success-color)', tasks: completedTasks }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="kanban-board"
    >
      {columns.map(col => (
        <div key={col.id} className="kanban-column">
          <div className="kanban-col-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '0.95rem' }}>
              <span>{col.title}</span>
              <span className="kanban-count-pill" style={{ borderLeft: `3px solid ${col.color}` }}>
                {col.tasks.length}
              </span>
            </div>
            <button className="action-icon-btn" onClick={onOpenCreateModal} title="Add Task">
              <Plus size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, overflowY: 'auto' }}>
            {col.tasks.length > 0 ? (
              col.tasks.map(task => (
                <TaskCard 
                  key={task.id}
                  task={task}
                  onToggleComplete={onToggleComplete}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            ) : (
              <div style={{ 
                padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-dim)', 
                fontSize: '0.8rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' 
              }}>
                No tasks in this column
              </div>
            )}
          </div>
        </div>
      ))}
    </motion.div>
  );
}
