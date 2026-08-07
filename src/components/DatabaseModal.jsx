import React from 'react';
import { X, Database, Download, RefreshCw, Trash } from 'lucide-react';
import useFocusTrap from '../hooks/useFocusTrap.js';

export default function DatabaseModal({ isOpen, onClose, tasks, onSeedData, onResetDB }) {
  const modalRef = useFocusTrap(isOpen, onClose);

  if (!isOpen) return null;

  // Format completed status as "Yes" / "No" as requested by user
  const formattedTasks = tasks.map(task => ({
    ...task,
    completed: task.completed ? "Yes" : "No"
  }));

  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(formattedTasks, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TaskForge_DB_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div ref={modalRef} className="modal-content" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Database className="brand-icon" style={{ width: 32, height: 32 }} size={18} />
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-gold)' }}>MySQL/PostgreSQL Database Manager</h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Relational database inspector ({tasks.length} records returned)
              </p>
            </div>
          </div>
          <button className="action-icon-btn" onClick={onClose} aria-label="Close database inspector">
            <X size={20} />
          </button>
        </div>

        {/* Formatted JSON displaying completed as "Yes" / "No" */}
        <div className="json-viewer">
          {JSON.stringify(formattedTasks, null, 2)}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" onClick={handleExportJSON} aria-label="Export database contents to JSON file">
              <Download size={15} /> Export JSON ("Yes" / "No" Status)
            </button>
            <button className="btn btn-secondary" onClick={onSeedData} aria-label="Seed sample demo tasks to database">
              <RefreshCw size={15} /> Seed Sample Tasks
            </button>
          </div>

          <button className="btn btn-danger" onClick={onResetDB} aria-label="Wipe and clear all database tasks">
            <Trash size={15} /> Wipe DB
          </button>
        </div>
      </div>
    </div>
  );
}
