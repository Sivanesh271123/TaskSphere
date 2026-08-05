import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, ListTodo, AlertTriangle } from 'lucide-react';

export default function StatsOverview({ tasks }) {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = total - completed;
  
  const todayStr = new Date().setHours(0,0,0,0);
  const overdue = tasks.filter(t => !t.completed && new Date(t.dueDate) < new Date(todayStr)).length;

  const stats = [
    { title: 'Total Tasks', value: total, icon: <ListTodo size={20} />, color: '#6366f1', pct: 100 },
    { title: 'Completed', value: completed, icon: <CheckCircle2 size={20} />, color: 'var(--success-color)', pct: total > 0 ? Math.round((completed/total)*100) : 0 },
    { title: 'In Progress', value: pending, icon: <Clock size={20} />, color: 'var(--warning-color)', pct: total > 0 ? Math.round((pending/total)*100) : 0 },
    { title: 'Overdue', value: overdue, icon: <AlertTriangle size={20} />, color: 'var(--danger-color)', pct: total > 0 ? Math.round((overdue/total)*100) : 0 }
  ];

  return (
    <div className="stats-grid">
      {stats.map((s, idx) => (
        <motion.div 
          key={s.title}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: idx * 0.08 }}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className="glass-panel stat-card-luxury"
        >
          <div className="stat-info-group">
            <div className="stat-value-animated" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-title">{s.title}</div>
          </div>

          <div className="progress-ring-container">
            <svg width="56" height="56" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={s.color}
                strokeWidth="3"
                strokeDasharray={`${s.pct}, 100`}
                transition="stroke-dasharray 0.5s ease"
              />
            </svg>
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', 
              alignItems: 'center', justifyContent: 'center', color: s.color
            }}>
              {s.icon}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
