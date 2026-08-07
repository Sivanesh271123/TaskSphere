import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, PieChart, TrendingUp, CheckCircle2, Flame, Trophy, 
  Clock, AlertCircle, CalendarRange, ListTodo, Zap, ShieldCheck,
  Tag, ArrowUpRight, Award, Activity, Sparkles, Check, ChevronRight,
  Bell, PlusCircle, Edit3
} from 'lucide-react';
import { calculateTaskStatus } from '../utils/statusHelper.js';

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

export default function AnalyticsView({ tasks = [], gamification, notifications = [] }) {
  // SECTION 1: Top Statistics Calculations
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = tasks.filter(t => !t.completed).length;
  const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  const dueTodayCount = tasks.filter(t => calculateTaskStatus(t) === 'Due Today').length;
  const upcomingCount = tasks.filter(t => calculateTaskStatus(t) === 'Upcoming').length;
  const overdueCount = tasks.filter(t => calculateTaskStatus(t) === 'Overdue').length;

  // SECTION 2: Weekly Productivity Data (Mon -> Sun)
  const weeklyData = useMemo(() => {
    const daysOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    const dayOfWeek = (today.getDay() + 6) % 7; // 0 = Mon, 6 = Sun
    
    // Find Monday of current week
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek);
    monday.setHours(0, 0, 0, 0);

    const counts = daysOrder.map((dayName, idx) => {
      const dayStart = new Date(monday);
      dayStart.setDate(monday.getDate() + idx);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const dayYMD = dayStart.toISOString().split('T')[0];

      const count = tasks.filter(t => {
        if (!t.completed) return false;
        // Check completed date or created/updated date fallback
        const compDate = t.completedAt ? t.completedAt.split('T')[0] : (t.updatedAt ? t.updatedAt.split('T')[0] : (t.dueDate || ''));
        return compDate === dayYMD;
      }).length;

      return { day: dayName, count, isToday: idx === dayOfWeek };
    });

    return counts;
  }, [tasks]);

  const maxWeeklyCount = Math.max(...weeklyData.map(d => d.count), 1);
  const thisWeekCompletedTotal = weeklyData.reduce((sum, d) => sum + d.count, 0);

  // SECTION 3: Task Category Distribution
  const categoryConfig = [
    { name: 'Work', color: 'var(--category-work)' },
    { name: 'Personal', color: 'var(--category-personal)' },
    { name: 'Study', color: 'var(--category-study)' },
    { name: 'Health', color: 'var(--category-health)' },
    { name: 'Shopping', color: 'var(--category-shopping)' },
    { name: 'Finance', color: 'var(--category-finance)' },
    { name: 'Others', color: 'var(--category-others)' }
  ];

  const categoryDistribution = useMemo(() => {
    return categoryConfig.map(cat => {
      const count = tasks.filter(t => (t.category || 'Personal') === cat.name).length;
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      return { ...cat, count, pct };
    }).filter(c => c.count > 0 || c.name === 'Work' || c.name === 'Personal' || c.name === 'Study');
  }, [tasks, total]);

  // SECTION 5: Activity Heatmap (Last 12 Weeks = 84 days)
  const heatmapData = useMemo(() => {
    const today = new Date();
    const days = [];
    const daysToGenerate = 84; // 12 weeks

    for (let i = daysToGenerate - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      const count = tasks.filter(t => {
        if (!t.completed) return false;
        const compDate = t.completedAt ? t.completedAt.split('T')[0] : (t.updatedAt ? t.updatedAt.split('T')[0] : (t.dueDate || ''));
        return compDate === dateStr;
      }).length;

      let level = 0;
      if (count >= 3) level = 3;
      else if (count === 2) level = 2;
      else if (count === 1) level = 1;

      days.push({ dateStr, count, level, dayName: d.toLocaleDateString('en-US', { weekday: 'short' }) });
    }
    return days;
  }, [tasks]);

  // SECTION 6: Upcoming Deadlines Timeline
  const upcomingTimeline = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const endOfWeek = new Date();
    endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
    const endOfWeekStr = endOfWeek.toISOString().split('T')[0];

    const pendingTasks = tasks.filter(t => !t.completed && t.dueDate);

    return {
      today: pendingTasks.filter(t => t.dueDate === todayStr),
      tomorrow: pendingTasks.filter(t => t.dueDate === tomorrowStr),
      thisWeek: pendingTasks.filter(t => t.dueDate > tomorrowStr && t.dueDate <= endOfWeekStr),
      nextWeek: pendingTasks.filter(t => t.dueDate > endOfWeekStr)
    };
  }, [tasks]);

  // SECTION 7: Recent Activity Feed
  const recentActivities = useMemo(() => {
    const acts = [];

    // Add recent completed tasks
    tasks.filter(t => t.completed).slice(-4).forEach(t => {
      acts.push({
        id: `comp_${t.id}`,
        type: 'completed',
        title: `Completed task "${t.title}"`,
        time: t.completedAt ? new Date(t.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
        icon: <CheckCircle2 size={16} style={{ color: 'var(--success-color)' }} />
      });
    });

    // Add recent created tasks
    tasks.slice(-4).forEach(t => {
      acts.push({
        id: `create_${t.id}`,
        type: 'created',
        title: `Created new task "${t.title}"`,
        time: t.createdAt ? new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today',
        icon: <PlusCircle size={16} style={{ color: 'var(--info-color)' }} />
      });
    });

    // Add recent notifications
    (notifications || []).slice(0, 3).forEach(n => {
      acts.push({
        id: `notif_${n.id || Math.random()}`,
        type: 'notification',
        title: n.title || n.message,
        time: n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
        icon: <Bell size={16} style={{ color: 'var(--text-gold)' }} />
      });
    });

    return acts.slice(0, 6);
  }, [tasks, notifications]);

  // SECTION 8: Achievements
  const streak = gamification?.streak || 0;
  const milestones = [
    { title: '🏆 First Task', desc: 'Complete your 1st task', unlocked: completed >= 1, color: 'var(--info-color)' },
    { title: '🔥 7 Day Streak', desc: 'Maintain a 7-day focus streak', unlocked: streak >= 7, color: 'var(--warning-color)' },
    { title: '💯 100 Tasks Completed', desc: 'Reach 100 resolved tasks', unlocked: completed >= 100 || completed >= 10, color: 'var(--text-gold)' },
    { title: '⚡ Productivity Master', desc: 'Maintain an 80%+ completion rate', unlocked: completionPercentage >= 80 && total >= 5, color: 'var(--status-upcoming)' }
  ];

  // SECTION 9: Productivity Score Calculation (0 - 100)
  const productivityScore = useMemo(() => {
    const compWeight = completionPercentage * 0.5; // Max 50 pts
    const streakBonus = Math.min(20, streak * 3); // Max 20 pts
    const xpBonus = Math.min(20, Math.round(((gamification?.totalXP || 0) / 400) * 20)); // Max 20 pts
    const overduePenalty = Math.min(15, overdueCount * 5); // Penalty up to 15 pts

    const raw = Math.round(compWeight + streakBonus + xpBonus - overduePenalty);
    const score = Math.max(5, Math.min(100, raw));

    let grade = 'Needs Focus';
    let gradeColor = 'var(--danger-color)';
    if (score >= 90) { grade = 'Exceptional'; gradeColor = 'var(--text-gold)'; }
    else if (score >= 75) { grade = 'Excellent'; gradeColor = 'var(--success-color)'; }
    else if (score >= 60) { grade = 'Good Progress'; gradeColor = 'var(--info-color)'; }
    else if (score >= 40) { grade = 'Steady'; gradeColor = 'var(--warning-color)'; }

    return { score, grade, gradeColor };
  }, [completionPercentage, streak, gamification, overdueCount]);

  // SECTION 10: AI Insights Generation
  const aiInsights = useMemo(() => {
    const insights = [];

    // Busiest day insight
    const busiestDay = [...weeklyData].sort((a, b) => b.count - a.count)[0];
    if (busiestDay && busiestDay.count > 0) {
      insights.push({
        text: `You complete most tasks on ${busiestDay.day}s with ${busiestDay.count} tasks resolved.`,
        type: 'success',
        icon: <Activity size={18} style={{ color: 'var(--success-color)' }} />
      });
    } else {
      insights.push({
        text: 'Tuesday and Thursday are typically your highest productivity days.',
        type: 'info',
        icon: <Activity size={18} style={{ color: 'var(--info-color)' }} />
      });
    }

    // Top Category workload insight
    const topCat = [...categoryDistribution].sort((a, b) => b.count - a.count)[0];
    if (topCat && topCat.count > 0) {
      insights.push({
        text: `${topCat.name} tasks account for ${topCat.pct}% of your active workload.`,
        type: 'info',
        icon: <PieChart size={18} style={{ color: topCat.color }} />
      });
    }

    // Overdue warning insight
    if (overdueCount > 0) {
      insights.push({
        text: `You currently have ${overdueCount} overdue task${overdueCount > 1 ? 's' : ''} that require urgent attention.`,
        type: 'warning',
        icon: <AlertCircle size={18} style={{ color: 'var(--danger-color)' }} />
      });
    } else {
      insights.push({
        text: 'Zero overdue tasks! Your workspace queue is completely up to date.',
        type: 'success',
        icon: <ShieldCheck size={18} style={{ color: 'var(--success-color)' }} />
      });
    }

    // Weekly completion pace
    insights.push({
      text: `Your overall completion velocity is at ${completionPercentage}% across ${total} tasks.`,
      type: 'gold',
      icon: <Sparkles size={18} style={{ color: 'var(--text-gold)' }} />
    });

    return insights;
  }, [weeklyData, categoryDistribution, overdueCount, completionPercentage, total]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}
    >
      {/* SECTION 1: TOP STATISTICS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '24px' }}>
        {[
          { label: 'Total Tasks', value: total, color: 'var(--info-color)', icon: <ListTodo size={22} /> },
          { label: 'Completed', value: completed, color: 'var(--success-color)', icon: <CheckCircle2 size={22} /> },
          { label: 'Pending', value: pending, color: 'var(--warning-color)', icon: <Clock size={22} /> },
          { label: 'Due Today', value: dueTodayCount, color: 'var(--accent-gold)', icon: <Zap size={22} /> },
          { label: 'Upcoming', value: upcomingCount, color: 'var(--status-upcoming)', icon: <CalendarRange size={22} /> },
          { label: 'Overdue', value: overdueCount, color: 'var(--danger-color)', icon: <AlertCircle size={22} /> }
        ].map(s => (
          <motion.div
            key={s.label}
            className="glass-panel"
            whileHover={{ y: -4, transition: { duration: 0.25 } }}
            style={{
              padding: '24px',
              background: 'var(--bg-card)',
              borderRadius: '18px',
              border: '1px solid var(--border-color)',
              borderTop: `3px solid ${s.color}`,
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center'
            }}
          >
            <div style={{ color: s.color, marginBottom: '0.4rem' }}>
              {s.icon}
            </div>
            <div style={{ fontSize: '34px', fontWeight: 700, color: s.color, lineHeight: 1 }}>
              <AnimatedNumber value={s.value} duration={800} />
            </div>
            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
              {s.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* SECTION 2 & SECTION 3: WEEKLY PRODUCTIVITY CHART & CATEGORY DISTRIBUTION */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.9fr', gap: '24px' }}>
        {/* SECTION 2: Weekly Productivity Chart */}
        <div className="glass-panel" style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '18px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>📊 Weekly Productivity Chart</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 2 }}>Completed tasks breakdown for each day of the week</p>
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.35rem 0.75rem', borderRadius: 20, background: 'var(--success-bg)',
              border: '1px solid var(--border-color)', color: 'var(--success-color)', fontSize: '13px', fontWeight: 700
            }}>
              <TrendingUp size={14} /> {thisWeekCompletedTotal} Completed This Week
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 210, paddingTop: 20, paddingBottom: 10, borderBottom: '1px solid var(--border-color)', gap: '1rem' }}>
            {weeklyData.map(d => {
              const heightPct = Math.max((d.count / maxWeeklyCount) * 100, d.count > 0 ? 15 : 6);
              return (
                <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: d.count > 0 ? 'var(--text-gold)' : 'var(--text-dim)', marginBottom: 6 }}>
                    {d.count}
                  </div>
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    style={{
                      width: '100%',
                      maxWidth: 36,
                      borderRadius: '8px 8px 4px 4px',
                      background: d.isToday 
                        ? 'var(--accent-gradient)' 
                        : d.count > 0 ? 'var(--surface-strong)' : 'var(--surface-subtle)',
                      boxShadow: d.isToday ? 'var(--accent-glow)' : 'none',
                      border: d.count > 0 ? '1px solid var(--border-glow)' : '1px dashed var(--border-subtle)'
                    }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: d.isToday ? 700 : 500, color: d.isToday ? 'var(--text-gold)' : 'var(--text-secondary)', marginTop: 10 }}>
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 3: Task Category Distribution */}
        <div className="glass-panel" style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '18px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>🍩 Category Distribution</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>Workload ratio across task categories</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {categoryDistribution.map(cat => (
              <div key={cat.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: cat.color, display: 'inline-block' }} />
                    {cat.name}
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>{cat.count} tasks ({cat.pct}%)</span>
                </div>
                <div style={{ height: 7, borderRadius: 10, background: 'var(--surface-subtle)', overflow: 'hidden' }}>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${cat.pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    style={{ height: '100%', background: cat.color, borderRadius: 10 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 4, 5, 9: COMPLETION RATE, PRODUCTIVITY SCORE, AI INSIGHTS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
        {/* SECTION 4: Circular Completion Rate */}
        <div className="glass-panel" style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '18px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>🎯 Completion Rate</h3>
          
          <div style={{ position: 'relative', width: 120, height: 120, margin: '0.5rem 0 1rem' }}>
            <svg width="120" height="120" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="var(--surface-strong)"
                strokeWidth="3.5"
              />
              <motion.path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="var(--accent-gold-main)"
                strokeWidth="3.5"
                strokeDasharray={`${completionPercentage}, 100`}
                transition={{ duration: 1.0, ease: 'easeOut' }}
              />
            </svg>
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center'
            }}>
              <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-gold)', lineHeight: 1 }}>{completionPercentage}%</span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: 2 }}>Completed</span>
            </div>
          </div>

          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>{completed}</strong> of <strong style={{ color: 'var(--text-primary)' }}>{total}</strong> tasks resolved
          </div>
        </div>

        {/* SECTION 9: Productivity Score */}
        <div className="glass-panel" style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '18px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>⚡ Productivity Score</h3>
          
          <div style={{ fontSize: '42px', fontWeight: 800, color: productivityScore.gradeColor, lineHeight: 1, margin: '0.25rem 0' }}>
            <AnimatedNumber value={productivityScore.score} duration={800} /> <span style={{ fontSize: '20px', color: 'var(--text-secondary)' }}>/ 100</span>
          </div>

          <div style={{
            padding: '0.3rem 0.85rem', borderRadius: 20,
            background: `${productivityScore.gradeColor}15`,
            border: `1px solid ${productivityScore.gradeColor}40`,
            color: productivityScore.gradeColor, fontSize: '13px', fontWeight: 700, margin: '0.5rem 0 1rem'
          }}>
            {productivityScore.grade}
          </div>

          <div style={{ width: '100%', height: 6, borderRadius: 10, background: 'var(--surface-subtle)', overflow: 'hidden' }}>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${productivityScore.score}%` }}
              transition={{ duration: 1.0, ease: 'easeOut' }}
              style={{ height: '100%', background: productivityScore.gradeColor }}
            />
          </div>
        </div>

        {/* SECTION 10: AI Insights */}
        <div className="glass-panel" style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '18px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={18} style={{ color: 'var(--text-gold)' }} /> AI Productivity Insights
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {aiInsights.map((insight, idx) => (
              <div 
                key={idx}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.65rem',
                  padding: '0.65rem 0.75rem', borderRadius: 12,
                  background: 'var(--surface-subtle)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4
                }}
              >
                <div style={{ marginTop: 2, flexShrink: 0 }}>{insight.icon}</div>
                <div>{insight.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 5: ACTIVITY HEATMAP */}
      <div className="glass-panel" style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '18px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>🔥 Activity Contribution Heatmap</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 2 }}>Task completion history over the past 12 weeks</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span>Less</span>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--bg-card)', border: '1px solid var(--border-color)', display: 'inline-block' }} />
            <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--surface-subtle)', display: 'inline-block' }} />
            <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--surface-strong)', display: 'inline-block' }} />
            <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--accent-gold-main)', display: 'inline-block' }} />
            <span>More</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {Array.from({ length: 12 }).map((_, weekIdx) => (
            <div key={weekIdx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {heatmapData.slice(weekIdx * 7, (weekIdx + 1) * 7).map((d, dayIdx) => (
                <div 
                  key={d.dateStr || dayIdx}
                  title={`${d.dateStr}: ${d.count} task${d.count !== 1 ? 's' : ''} completed`}
                  style={{
                    width: 14, height: 14, borderRadius: 4,
                    background: d.level === 3 ? 'var(--accent-gold-main)' : d.level === 2 ? 'var(--surface-strong)' : d.level === 1 ? 'var(--surface-subtle)' : 'var(--bg-primary)',
                    border: d.level > 0 ? '1px solid var(--border-glow)' : '1px solid var(--border-subtle)',
                    boxShadow: d.level === 3 ? 'var(--accent-glow)' : 'none',
                    cursor: 'pointer', transition: 'all 200ms ease'
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 6, 7, 8: UPCOMING DEADLINES, RECENT ACTIVITY, ACHIEVEMENTS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
        {/* SECTION 6: Upcoming Deadlines Timeline */}
        <div className="glass-panel" style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '18px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <CalendarRange size={18} style={{ color: 'var(--text-gold)' }} /> Upcoming Deadlines
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { label: 'Today', items: upcomingTimeline.today, color: 'var(--danger-color)' },
              { label: 'Tomorrow', items: upcomingTimeline.tomorrow, color: 'var(--warning-color)' },
              { label: 'This Week', items: upcomingTimeline.thisWeek, color: 'var(--accent-gold)' },
              { label: 'Next Week', items: upcomingTimeline.nextWeek, color: 'var(--info-color)' }
            ].map(group => (
              <div key={group.label}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: group.color, textTransform: 'uppercase', marginBottom: 4 }}>
                  {group.label} ({group.items.length})
                </div>
                {group.items.length === 0 ? (
                  <div style={{ fontSize: '13px', color: 'var(--text-dim)', fontStyle: 'italic' }}>No tasks scheduled</div>
                ) : (
                  group.items.slice(0, 2).map(t => (
                    <div key={t.id} style={{ fontSize: '13px', color: 'var(--text-primary)', padding: '0.35rem 0.5rem', background: 'var(--surface-subtle)', borderRadius: 6, marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', flexShrink: 0, marginLeft: 6 }}>{t.dueTime || 'All Day'}</span>
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 7: Recent Activity Feed */}
        <div className="glass-panel" style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '18px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Activity size={18} style={{ color: 'var(--info-color)' }} /> Recent Activity
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentActivities.length === 0 ? (
              <div style={{ fontSize: '13px', color: 'var(--text-dim)', fontStyle: 'italic' }}>No recent activity logged</div>
            ) : (
              recentActivities.map(act => (
                <div key={act.id} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.45rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ flexShrink: 0 }}>{act.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {act.title}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{act.time}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SECTION 8: Achievements */}
        <div className="glass-panel" style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '18px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Award size={18} style={{ color: 'var(--text-gold)' }} /> Achievements & Badges
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {milestones.map(m => (
              <div 
                key={m.title}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.6rem 0.75rem', borderRadius: 12,
                  background: m.unlocked ? 'var(--surface-subtle)' : 'transparent',
                  border: `1px solid ${m.unlocked ? 'var(--border-glow)' : 'var(--border-subtle)'}`
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: m.unlocked ? 'var(--accent-gradient)' : 'var(--surface-subtle)',
                  color: m.unlocked ? 'var(--text-on-accent)' : 'var(--text-dim)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Award size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: m.unlocked ? 'var(--text-primary)' : 'var(--text-dim)' }}>
                    {m.title}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{m.desc}</div>
                </div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: m.unlocked ? 'var(--success-color)' : 'var(--text-dim)' }}>
                  {m.unlocked ? '✓ UNLOCKED' : 'LOCKED'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
