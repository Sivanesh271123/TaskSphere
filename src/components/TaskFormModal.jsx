import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Save } from 'lucide-react';

export default function TaskFormModal({ isOpen, onClose, onSave, taskToEdit }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Work');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || '');
      setDescription(taskToEdit.description || '');
      setCategory(taskToEdit.category || 'Work');
      setPriority(taskToEdit.priority || 'Medium');
      setDueDate(taskToEdit.dueDate || new Date().toISOString().split('T')[0]);
    } else {
      setTitle('');
      setDescription('');
      setCategory('Work');
      setPriority('Medium');
      setDueDate(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
    }
  }, [taskToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title,
      description,
      category,
      priority,
      dueDate
    });

    onClose();
  };

  return (
    <AnimatePresence>
      <div className="modal-overlay" onClick={onClose}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              {taskToEdit ? '✏️ Edit Task Details' : '✨ Add New Task'}
            </h2>
            <button className="action-icon-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Task Title *</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="e.g. Implement React component state" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Description / Notes</label>
              <textarea 
                className="form-control" 
                rows="3"
                placeholder="Add details, links, or context..."
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category</label>
                <select 
                  className="form-control" 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Work">💻 Work</option>
                  <option value="Personal">🏠 Personal</option>
                  <option value="Urgent">🔥 Urgent</option>
                  <option value="Ideas">💡 Ideas</option>
                </select>
              </div>

              <div className="form-group">
                <label>Priority</label>
                <select 
                  className="form-control" 
                  value={priority} 
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Due Date</label>
              <input 
                type="date" 
                className="form-control" 
                value={dueDate} 
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {taskToEdit ? <Save size={16} /> : <Plus size={16} />}
                {taskToEdit ? 'Update Task' : 'Save Task'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
