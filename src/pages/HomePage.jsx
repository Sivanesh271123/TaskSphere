import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, Flame, Trophy, ArrowRight, Plus, CheckCircle2, 
  Clock, Zap, RefreshCw, ChevronRight, Target, ShieldCheck,
  ListTodo, AlertCircle, CalendarRange
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

const MOTIVATIONAL_QUOTES = [
  "Small daily accomplishments build monumental lifelong success.",
  "Focus on being productive instead of busy.",
  "Your future self will thank you for the effort you put in today.",
  "Action is the foundational key to all success.",
  "Don't wait for opportunity. Create it step by step."
];

export default function HomePage({ 
  tasks, 
  user,
  categories = [],
  gamification,
  onNavigateToTasks, 
  onOpenCreateModal, 
  onOpenDBModal,
  onToggleComplete 
}) {
  const [quoteIdx, setQuoteIdx] = useState(0);

  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = tasks.filter(t => !t.completed).length;
  const pendingTasks = tasks.filter(t => !t.completed).slice(0, 3);
  const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const dueTodayCount = tasks.filter(t => calculateTaskStatus(t) === 'Due Today').length;
  const upcomingCount = tasks.filter(t => calculateTaskStatus(t) === 'Upcoming').length;
  const overdueCount = tasks.filter(t => calculateTaskStatus(t) === 'Overdue').length;

  const cycleQuote = () => {
    setQuoteIdx(prev => (prev + 1) % MOTIVATIONAL_QUOTES.length);
  };

  // Use real gamification data or safe defaults
  const gam = gamification || {
    totalXP: 0,
    currentLevel: { level: 1, title: 'Task Apprentice' },
    nextLevel: { level: 2, xpNeeded: 100 },
    levelProgress: 0,
    xpDisplay: '0 / 100 XP',
    streak: 0,
    weeklyPct: 0,
    tasksToNextLevel: 2
  };

  // Compute XP variables for XP Card
  const totalXP = gam.totalXP || 0;
  const currentXPInLevel = totalXP % 100;
  const xpRemaining = Math.max(0, 100 - currentXPInLevel);
  const progressPct = gam.levelProgress || Math.round((currentXPInLevel / 100) * 100);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}
    >
      {/* Hero Encouragement Banner - Compact 25% Reduced Height */}
      <div className="glass-panel" style={{
        padding: '1.75rem 1.75rem',
        display: 'grid',
        gridTemplateColumns: '1.2fr 0.8fr',
        gap: '24px',
        alignItems: 'center',
        background: 'var(--bg-card)',
        borderRadius: '18px',
        border: '1px solid var(--border-color)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
            padding: '0.3rem 0.75rem', borderRadius: 20, background: 'var(--surface-subtle)',
            border: '1px solid var(--border-color)', color: 'var(--accent-gold)',
            fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.75rem'
          }}>
            <Sparkles size={12} /> 💡 Daily Motivation & Productivity Hub
          </div>

          <h1 style={{ fontSize: '2.1rem', fontWeight: 800, lineHeight: 1.15, marginBottom: '0.6rem', letterSpacing: '-0.5px' }}>
            Master Your Time, <br />
            <span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Achieve Greatness.
            </span>
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.5, marginBottom: '1.25rem', maxWidth: '520px' }}>
            Welcome back, {user?.name || 'there'}! You have <strong style={{ color: 'var(--accent-gold)' }}>{tasks.filter(t => !t.completed).length} active tasks</strong> waiting for you today. Take consistent action and level up your focus.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <motion.button 
              className="btn btn-primary"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={onNavigateToTasks}
              style={{ padding: '14px 28px', fontSize: '14px' }}
            >
              <span>Explore Workspace</span> <ArrowRight size={16} />
            </motion.button>

            <motion.button 
              className="btn btn-secondary"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpenCreateModal}
              style={{ padding: '14px 28px', fontSize: '14px' }}
            >
              <Plus size={16} /> <span>Quick Add Task</span>
            </motion.button>
          </div>
        </div>

        {/* 3D Generated Gold Hero Image - Enlarged 15% & Vertically Centered */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', height: '100%' }}>
          <div className="hero-ambient-glow" />
          <motion.img 
            initial={{ scale: 0.9, rotate: -2 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.6 }}
            src="/hero_gold.png" 
            alt="Productivity Hourglass"
            style={{
              width: '100%',
              maxWidth: 275,
              maxHeight: 240,
              objectFit: 'contain',
              borderRadius: '18px',
              boxShadow: '0 14px 36px rgba(0, 0, 0, 0.65)',
              border: '1px solid var(--border-color)',
              position: 'relative',
              zIndex: 1
            }}
          />
        </div>
      </div>

      {/* Encouraging Metrics & Streak Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        {/* Daily Focus Streak Card */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '1.25rem', background: 'var(--bg-card)', borderRadius: '18px', border: '1px solid var(--border-color)' }}>
          <div style={{
            width: 54, height: 54, borderRadius: 14,
            background: 'var(--warning-bg)', border: '1px solid var(--border-color)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning-color)', flexShrink: 0
          }}>
            <Flame size={26} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-secondary)' }}>🔥 Current Streak</span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-gold)' }}>{gam.streak} {gam.streak === 1 ? 'Day' : 'Days'}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: 'var(--text-secondary)', margin: '0.25rem 0' }}>
              <span>🏆 Longest Streak: <strong style={{ color: 'var(--text-primary)' }}>{gam.longestStreak || gam.streak} Days</strong></span>
              <span>Last: <strong style={{ color: 'var(--text-primary)' }}>{gam.lastStreakDate || 'Today'}</strong></span>
            </div>

            <div style={{ fontSize: '13px', color: 'var(--success-color)', fontWeight: 500, marginTop: '0.25rem' }}>
              {gam.streak > 0 ? '🔥 Keep the momentum going! Every day counts.' : '⚡ Complete a task today to start your streak!'}
            </div>
          </div>
        </div>

        {/* Level XP Progress Card */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '1.25rem', background: 'var(--bg-card)', borderRadius: '18px', border: '1px solid var(--border-color)' }}>
          <div style={{
            width: 54, height: 54, borderRadius: 14,
            background: 'var(--surface-subtle)', border: '1px solid var(--border-color)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-gold)', flexShrink: 0
          }}>
            <Trophy size={26} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <div>
                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{gam.currentLevel.title}</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-gold)', marginLeft: '0.5rem' }}>Level {gam.currentLevel.level}</span>
              </div>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent-gold)' }}>{progressPct}%</span>
            </div>

            {/* Animated Progress Bar */}
            <div style={{ height: 8, borderRadius: 10, background: 'var(--surface-subtle)', margin: '0.5rem 0', overflow: 'hidden' }}>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 1.0, ease: 'easeOut' }}
                style={{ height: '100%', background: 'var(--accent-gradient)' }} 
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <span>{currentXPInLevel} / 100 XP</span>
              <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>{xpRemaining} XP remaining</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Task Status Summary Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '24px' }}>
        {[
          { label: 'Total Tasks', value: total, color: 'var(--info-color)', icon: <ListTodo size={22} /> },
          { label: 'Completed', value: completed, color: 'var(--success-color)', icon: <CheckCircle2 size={22} /> },
          { label: 'Pending', value: pending, color: 'var(--warning-color)', icon: <Clock size={22} /> },
          { label: 'Due Today', value: dueTodayCount, color: 'var(--accent-gold)', icon: <Zap size={22} /> },
          { label: 'Upcoming', value: upcomingCount, color: 'var(--status-upcoming)', icon: <CalendarRange size={22} /> },
          { label: 'Overdue', value: overdueCount, color: 'var(--danger-color)', icon: <AlertCircle size={22} /> }
        ].map((card, i) => (
          <motion.div 
            key={card.label}
            className="glass-panel"
            whileHover={{ y: -4, transition: { duration: 0.25 } }}
            style={{ 
              padding: '24px', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              textAlign: 'center',
              background: 'var(--bg-card)',
              borderRadius: '18px',
              border: '1px solid var(--border-color)',
              borderTop: `3px solid ${card.color}`,
              boxShadow: `var(--shadow-sm)`
            }}
          >
            <div style={{ color: card.color, marginBottom: '0.5rem' }}>{card.icon}</div>
            <div style={{ fontSize: '34px', fontWeight: 700, color: card.color, lineHeight: 1 }}>
              <AnimatedNumber value={card.value} duration={800} />
            </div>
            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{card.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Motivational Quote & Quick Tasks Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Daily Motivational Quote */}
        <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-gold)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                💡 Daily Encouragement
              </span>
              <button className="action-icon-btn" onClick={cycleQuote} title="Next Quote">
                <RefreshCw size={14} />
              </button>
            </div>
            <blockquote style={{ fontStyle: 'italic', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.5 }}>
              "{MOTIVATIONAL_QUOTES[quoteIdx]}"
            </blockquote>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem', color: 'var(--success-color)', fontSize: '0.8rem', fontWeight: 700 }}>
            <ShieldCheck size={16} /> {gam.weeklyPct}% tasks completed this week.{gam.weeklyPct >= 80 ? ' Awesome pace!' : gam.weeklyPct >= 50 ? ' Good progress!' : ' Keep pushing!'}
          </div>
        </div>

        {/* Highlighted Pending Tasks Preview */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>⚡ Up Next For You</h3>
            <button 
              onClick={onNavigateToTasks} 
              style={{ background: 'none', border: 'none', color: 'var(--text-gold)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              View All <ChevronRight size={14} />
            </button>
          </div>

          {pendingTasks.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {pendingTasks.map(t => {
                const status = calculateTaskStatus(t);
                const statusConfigs = {
                  'Upcoming': { text: '🟢 Upcoming', color: 'var(--status-upcoming)' },
                  'Due Today': { text: '🟡 Due Today', color: 'var(--status-due-today)' },
                  'Overdue': { text: '🔴 Overdue', color: 'var(--status-overdue)' },
                  'Completed': { text: '✅ Completed', color: 'var(--status-completed)' }
                };
                const statusInfo = statusConfigs[status];

                const matchedCategory = categories.find(
                  c => c.name.toLowerCase() === (t.category || '').toLowerCase()
                );
                const categoryColor = matchedCategory?.color || '#6b7280';
                const badgeStyle = {
                  backgroundColor: `${categoryColor}12`,
                  color: categoryColor,
                  borderColor: `${categoryColor}40`,
                  textShadow: `0 0 8px ${categoryColor}30`
                };
                return (
                  <div key={t.id} style={{
                    padding: '0.75rem 1rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1 }}>
                      <button className="check-btn" onClick={() => onToggleComplete(t.id)}>
                        <CheckCircle2 size={14} />
                      </button>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{t.title}</span>
                        {t.dueDate && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Due: {t.dueDate}{t.dueTime ? ` @ ${t.dueTime.substring(0, 5)}` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {statusInfo && (
                        <span className="badge-tag" style={{
                          backgroundColor: `${statusInfo.color}12`,
                          color: statusInfo.color,
                          borderColor: `${statusInfo.color}40`,
                          fontSize: '0.7rem',
                          fontWeight: 800
                        }}>
                          {statusInfo.text}
                        </span>
                      )}
                      <span className="badge-tag" style={badgeStyle}>{t.category}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              🎉 All tasks completed! Take a break or add a new task.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
