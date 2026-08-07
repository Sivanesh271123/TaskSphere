import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, ListTodo, AlertTriangle } from 'lucide-react';

function AnimatedNumber({ value, duration = 800 }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const endValue = Number(value) || 0;
    if (endValue === 0) {
      setDisplayValue(0);
      return;
    }

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeOutProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(easeOutProgress * endValue));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(endValue);
      }
    };

    const animId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animId);
  }, [value, duration]);

  return <span>{displayValue}</span>;
}

const StatsOverview = React.memo(function StatsOverview({ tasks }) {
  const { total, completed, pending, overdue } = useMemo(() => {
    let t = 0;
    let c = 0;
    let p = 0;
    let o = 0;

    const today = new Date();
    const todayYMD = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    tasks.forEach(task => {
      t++;
      if (task.completed) {
        c++;
      } else {
        if (task.dueDate && task.dueDate < todayYMD) {
          o++;
        } else {
          p++;
        }
      }
    });

    return { total: t, completed: c, pending: p, overdue: o };
  }, [tasks]);

  const stats = [
    { title: 'Total Tasks', value: total, icon: <ListTodo size={22} />, color: 'var(--info-color)', pct: 100 },
    { title: 'Completed Tasks', value: completed, icon: <CheckCircle2 size={22} />, color: 'var(--success-color)', pct: total > 0 ? Math.round((completed/total)*100) : 0 },
    { title: 'Pending Tasks', value: pending, icon: <Clock size={22} />, color: 'var(--warning-color)', pct: total > 0 ? Math.round((pending/total)*100) : 0 },
    { title: 'Overdue Tasks', value: overdue, icon: <AlertTriangle size={22} />, color: 'var(--danger-color)', pct: total > 0 ? Math.round((overdue/total)*100) : 0 }
  ];

  return (
    <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '24px', marginBottom: '32px' }}>
      {stats.map((s, idx) => (
        <motion.div 
          key={s.title}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: idx * 0.08 }}
          whileHover={{ y: -4, transition: { duration: 0.25 } }}
          className="glass-panel"
          style={{
            padding: '24px',
            background: 'var(--bg-card)',
            borderRadius: '18px',
            border: '1px solid var(--border-color)',
            borderTop: `3px solid ${s.color}`,
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div className="stat-info-group">
            <div className="stat-value-animated" style={{ color: s.color, fontSize: '34px', fontWeight: 700, lineHeight: 1.1 }}>
              <AnimatedNumber value={s.value} duration={800} />
            </div>
            <div className="stat-title" style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
              {s.title}
            </div>
          </div>

          <div className="progress-ring-container" style={{ position: 'relative', width: 56, height: 56 }}>
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
              alignItems: 'center', justifyContent: 'center', color: s.color,
              filter: `drop-shadow(0 0 6px ${s.color}40)`
            }}>
              {s.icon}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
});

export default StatsOverview;
