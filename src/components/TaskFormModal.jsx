import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Save } from 'lucide-react';
import useFocusTrap from '../hooks/useFocusTrap.js';

export default function TaskFormModal({ isOpen, onClose, onSave, taskToEdit, categories = [], onCreateCategory }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Personal');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [repeatType, setRepeatType] = useState('None');
  const [repeatInterval, setRepeatInterval] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');



  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || '');
      setDescription(taskToEdit.description || '');
      setCategory(taskToEdit.category || 'Personal');
      setPriority(taskToEdit.priority || 'Medium');
      setDueDate(taskToEdit.dueDate || '');
      setDueTime(taskToEdit.dueTime ? taskToEdit.dueTime.substring(0, 5) : '');
      setRepeatType(taskToEdit.repeatType || 'None');
      setRepeatInterval(taskToEdit.repeatInterval || 1);
      setStartDate(taskToEdit.startDate || '');
      setEndDate(taskToEdit.endDate || '');
    } else {
      setTitle('');
      setDescription('');
      setCategory('Personal');
      setPriority('Medium');
      setDueDate('');
      setDueTime('');
      setRepeatType('None');
      setRepeatInterval(1);
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
    }
    

  }, [taskToEdit, isOpen, categories]);

  const modalRef = useFocusTrap(isOpen, onClose);

  if (!isOpen) return null;



  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title,
      description,
      category,
      priority,
      dueDate: dueDate || null,
      dueTime: dueTime || null,
      repeatType,
      repeatInterval: repeatType !== 'None' ? parseInt(repeatInterval, 10) : 1,
      startDate: repeatType !== 'None' ? startDate : null,
      endDate: repeatType !== 'None' ? (endDate || null) : null
    });

    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div 
        className="modal-overlay" 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              {taskToEdit ? '✏️ Edit Task Details' : '✨ Add New Task'}
            </h2>
            <button type="button" className="action-icon-btn" onClick={onClose} aria-label="Close modal">
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="taskTitle">Task Title *</label>
              <input 
                id="taskTitle"
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
              <label htmlFor="taskDesc">Description / Notes</label>
              <textarea 
                id="taskDesc"
                className="form-control" 
                rows="3"
                placeholder="Add details, links, or context..."
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="taskCategory">Category</label>
                <select 
                  id="taskCategory"
                  className="form-control" 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Personal">Personal</option>
                  <option value="Study">Study</option>
                  <option value="Work">Work</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Health">Health</option>
                  <option value="Finance">Finance</option>
                  <option value="Others">Others</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="taskPriority">Priority</label>
                <select 
                  id="taskPriority"
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

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="taskDueDate">Due Date</label>
                <input 
                  id="taskDueDate"
                  type="date" 
                  className="form-control" 
                  value={dueDate} 
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="taskDueTime">Due Time</label>
                <input 
                  id="taskDueTime"
                  type="time" 
                  className="form-control" 
                  value={dueTime} 
                  onChange={(e) => setDueTime(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="taskRepeatType">Repeat Type</label>
              <select 
                id="taskRepeatType"
                className="form-control" 
                value={repeatType} 
                onChange={(e) => setRepeatType(e.target.value)}
              >
                <option value="None">None</option>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Custom">Custom Interval</option>
              </select>
            </div>

            {repeatType !== 'None' && (
              <>
                <div className="form-group">
                  <label htmlFor="taskRepeatInterval">Repeat Every ({repeatType === 'Daily' || repeatType === 'Custom' ? 'Days' : repeatType === 'Weekly' ? 'Weeks' : 'Months'})</label>
                  <input 
                    id="taskRepeatInterval"
                    type="number" 
                    min="1" 
                    className="form-control" 
                    value={repeatInterval} 
                    onChange={(e) => setRepeatInterval(e.target.value)}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="taskStartDate">Start Date</label>
                    <input 
                      id="taskStartDate"
                      type="date" 
                      className="form-control" 
                      value={startDate} 
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="taskEndDate">End Date (Optional)</label>
                    <input 
                      id="taskEndDate"
                      type="date" 
                      className="form-control" 
                      value={endDate} 
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {taskToEdit ? <Save size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
                {taskToEdit ? 'Update Task' : 'Save Task'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
