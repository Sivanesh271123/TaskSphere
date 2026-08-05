import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Target, Award, ShieldCheck, Zap } from 'lucide-react';
import AnalyticsView from '../components/AnalyticsView';

export default function AnalyticsPage({ tasks }) {
  const completedCount = tasks.filter(t => t.completed).length;

  const milestones = [
    { title: 'Task Apprentice', desc: 'Complete 1st task', unlocked: completedCount >= 1 },
    { title: 'Focus Momentum', desc: 'Complete 3 tasks', unlocked: completedCount >= 3 },
    { title: 'Gold Architect', desc: 'Complete 5 tasks', unlocked: completedCount >= 5 },
    { title: 'Master Strategist', desc: 'Complete 10 tasks', unlocked: completedCount >= 10 }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
    >
      {/* Header Banner */}
      <div className="glass-panel" style={{
        padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'linear-gradient(135deg, rgba(20,20,28,0.85) 0%, rgba(10,10,14,0.95) 100%)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-gold)', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            <Trophy size={16} /> Achievement & Growth Portal
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Goals & Productivity Analytics</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Track your completion velocity, category focus, and earn gold rank milestones.
          </p>
        </div>

        {/* Generated 3D Trophy Image */}
        <img 
          src="/gold_trophy.png" 
          alt="Gold Trophy Achievement" 
          style={{ width: 110, height: 110, objectFit: 'contain', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.8))' }}
        />
      </div>

      {/* Main Analytics View */}
      <AnalyticsView tasks={tasks} />

      {/* Milestones & Badges Grid */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--text-gold)' }}>
          🏆 Unlocked Rank Milestones
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          {milestones.map((m, idx) => (
            <div key={m.title} style={{
              padding: '1.25rem', borderRadius: 'var(--radius-md)',
              background: m.unlocked ? 'rgba(212, 175, 55, 0.12)' : 'var(--bg-card)',
              border: `1px solid ${m.unlocked ? 'var(--accent-gold-main)' : 'var(--border-color)'}`,
              display: 'flex', alignItems: 'center', gap: '1rem'
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: m.unlocked ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.05)',
                color: m.unlocked ? '#050507' : 'var(--text-dim)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Award size={22} />
              </div>

              <div>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: m.unlocked ? 'var(--text-main)' : 'var(--text-dim)' }}>
                  {m.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.desc}</div>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: m.unlocked ? 'var(--success-color)' : 'var(--text-dim)', marginTop: 2 }}>
                  {m.unlocked ? '✓ UNLOCKED' : 'LOCKED'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
