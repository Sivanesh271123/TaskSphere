import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, PieChart, TrendingUp, CheckCircle, Flame, Layers } from 'lucide-react';

export default function AnalyticsView({ tasks }) {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = total - completed;
  const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Category counts
  const categories = ['Work', 'Personal', 'Urgent', 'Ideas'];
  const categoryCounts = categories.map(cat => ({
    name: cat,
    count: tasks.filter(t => t.category === cat).length
  }));

  // Real weekly activity — compute tasks completed per day over the last 7 days
  const weeklyData = useMemo(() => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 86400000);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const count = tasks.filter(t => {
        if (!t.completed || !t.createdAt) return false;
        const created = new Date(t.createdAt);
        return created >= dayStart && created <= dayEnd && t.completed;
      }).length;

      days.push({
        day: dayNames[date.getDay()],
        count
      });
    }
    return days;
  }, [tasks]);

  const maxWeeklyCount = Math.max(...weeklyData.map(d => d.count), 1);

  // Compute week-over-week change
  const thisWeekTotal = weeklyData.reduce((sum, d) => sum + d.count, 0);
  const lastWeekTotal = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    let count = 0;
    for (let i = 13; i >= 7; i--) {
      const date = new Date(today.getTime() - i * 86400000);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      count += tasks.filter(t => {
        if (!t.completed || !t.createdAt) return false;
        const created = new Date(t.createdAt);
        return created >= dayStart && created <= dayEnd && t.completed;
      }).length;
    }
    return count;
  }, [tasks]);

  const weekChange = lastWeekTotal > 0
    ? Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100)
    : (thisWeekTotal > 0 ? 100 : 0);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="analytics-grid"
    >
      {/* Left Column: Velocity Chart */}
      <div className="glass-panel chart-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Weekly Productivity Velocity</h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Tasks completed per day over the past week</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: weekChange >= 0 ? 'var(--success-color)' : 'var(--danger-color)', fontSize: '0.85rem', fontWeight: 700 }}>
            <TrendingUp size={16} /> {weekChange >= 0 ? '+' : ''}{weekChange}% vs last week
          </div>
        </div>

        <div className="bar-chart-flex">
          {weeklyData.map(d => (
            <div key={d.day} className="bar-column">
              <div 
                className="bar-fill"
                style={{ height: `${(d.count / maxWeeklyCount) * 100}%`, minHeight: d.count > 0 ? '8px' : '2px' }}
              />
              <span className="bar-label">{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Completion Breakdown */}
      <div className="glass-panel chart-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.25rem' }}>Completion Rate</h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Total tasks vs completed ratio</p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ position: 'relative', width: 90, height: 90 }}>
              <svg width="90" height="90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="3.8"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="url(#gradientRing)"
                  strokeWidth="3.8"
                  strokeDasharray={`${completionPercentage}, 100`}
                />
                <defs>
                  <linearGradient id="gradientRing" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </svg>
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', 
                alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem'
              }}>
                {completionPercentage}%
              </div>
            </div>

            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{completed} / {total}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Tasks Resolved</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem' }}>Category Distribution</div>
          {categoryCounts.map(cat => (
            <div key={cat.name} style={{ marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 2 }}>
                <span>{cat.name}</span>
                <span>{cat.count} tasks</span>
              </div>
              <div style={{ height: 6, borderRadius: 10, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    height: '100%', 
                    width: total > 0 ? `${(cat.count / total) * 100}%` : '0%',
                    background: 'var(--accent-gradient)',
                    transition: 'width 0.5s ease'
                  }} 
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
