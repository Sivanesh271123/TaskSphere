import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, Flame, Trophy, ArrowRight, Plus, CheckCircle2, 
  Clock, Zap, RefreshCw, ChevronRight, Target, ShieldCheck
} from 'lucide-react';

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
  gamification,
  onNavigateToTasks, 
  onOpenCreateModal, 
  onOpenDBModal,
  onToggleComplete 
}) {
  const [quoteIdx, setQuoteIdx] = useState(0);

  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pendingTasks = tasks.filter(t => !t.completed).slice(0, 3);
  const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;

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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
    >
      {/* Hero Encouragement Banner */}
      <div className="glass-panel" style={{
        padding: '2.5rem 2rem',
        display: 'grid',
        gridTemplateColumns: '1.2fr 0.8fr',
        gap: '2rem',
        alignItems: 'center',
        background: 'linear-gradient(135deg, rgba(20, 20, 28, 0.85) 0%, rgba(10, 10, 14, 0.95) 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
            padding: '0.35rem 0.85rem', borderRadius: 20, background: 'rgba(212, 175, 55, 0.15)',
            border: '1px solid var(--border-color)', color: 'var(--text-gold)',
            fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1rem'
          }}>
            <Sparkles size={12} /> 💡 Daily Motivation & Productivity Hub • TaskSphere
          </div>

          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, lineHeight: 1.15, marginBottom: '0.85rem', letterSpacing: '-0.5px' }}>
            Master Your Time, <br />
            <span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Achieve Greatness.
            </span>
          </h1>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.98rem', lineHeight: 1.6, marginBottom: '1.75rem', maxWidth: '520px' }}>
            Welcome back, {user?.name || 'there'}! You have <strong style={{ color: 'var(--text-gold)' }}>{tasks.filter(t => !t.completed).length} active tasks</strong> waiting for you today. Take consistent action and level up your focus.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <motion.button 
              className="btn btn-primary"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={onNavigateToTasks}
            >
              <span>Explore Workspace</span> <ArrowRight size={16} />
            </motion.button>

            <motion.button 
              className="btn btn-secondary"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onOpenCreateModal}
            >
              <Plus size={16} /> <span>Quick Add Task</span>
            </motion.button>
          </div>
        </div>

        {/* 3D Generated Gold Hero Image */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
          <motion.img 
            initial={{ scale: 0.9, rotate: -2 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.6 }}
            src="/hero_gold.png" 
            alt="Productivity Hourglass"
            style={{
              width: '100%',
              maxWidth: 320,
              maxHeight: 280,
              objectFit: 'cover',
              borderRadius: 'var(--radius-xl)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7)',
              border: '1px solid var(--border-glow)'
            }}
          />
        </div>
      </div>

      {/* Encouraging Metrics & Motivational Streak Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {/* Daily Focus Streak Card — REAL DATA */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: 58, height: 58, borderRadius: 16,
            background: 'rgba(212, 175, 55, 0.15)', border: '1px solid var(--border-color)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-gold-main)'
          }}>
            <Flame size={28} />
          </div>

          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-gold)' }}>{gam.streak} {gam.streak === 1 ? 'Day' : 'Days'}</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>Focus Streak 🔥</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--success-color)', marginTop: 2 }}>
              {gam.streak > 0 ? 'Keep the momentum going!' : 'Complete a task today to start your streak!'}
            </div>
          </div>
        </div>

        {/* Level XP Progress Card — REAL DATA */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: 58, height: 58, borderRadius: 16,
            background: 'rgba(212, 175, 55, 0.15)', border: '1px solid var(--border-color)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-gold)'
          }}>
            <Trophy size={28} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-gold)' }}>{gam.currentLevel.title} • Level {gam.currentLevel.level}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{gam.xpDisplay}</div>
            </div>
            <div style={{ height: 8, borderRadius: 10, background: 'rgba(255,255,255,0.06)', margin: '0.5rem 0 0.25rem', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${gam.levelProgress}%`, background: 'var(--accent-gradient)', transition: 'width 0.6s ease' }} />
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
              {gam.nextLevel
                ? `Complete ${gam.tasksToNextLevel} more task${gam.tasksToNextLevel !== 1 ? 's' : ''} to reach Level ${gam.nextLevel.level}!`
                : '🏆 Maximum level reached! You are legendary!'
              }
            </div>
          </div>
        </div>
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
              {pendingTasks.map(t => (
                <div key={t.id} style={{
                  padding: '0.75rem 1rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <button className="check-btn" onClick={() => onToggleComplete(t.id)}>
                      <CheckCircle2 size={14} />
                    </button>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{t.title}</span>
                  </div>
                  <span className="badge-tag">{t.category}</span>
                </div>
              ))}
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
