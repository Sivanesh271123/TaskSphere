import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Target, Award, ShieldCheck, Zap } from 'lucide-react';
import AnalyticsView from '../components/AnalyticsView';

export default function AnalyticsPage({ tasks = [], gamification, notifications = [] }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}
    >
      {/* Header Banner */}
      <div className="glass-panel" style={{
        padding: '1.75rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'var(--bg-card)', borderRadius: '18px', border: '1px solid var(--border-color)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-gold)', fontWeight: 800, fontSize: '13px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            <Trophy size={16} /> Achievement & Growth Portal • TaskSphere
          </div>
          <h1 style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.5px' }}>Executive Analytics & Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '0.35rem' }}>
            Track your completion velocity, category workload distribution, streak momentum, and rank score.
          </p>
        </div>

        {/* Generated 3D Trophy Image */}
        <img 
          src="/gold_trophy.png" 
          alt="Gold Trophy Achievement" 
          loading="lazy"
          decoding="async"
          style={{ width: 100, height: 100, objectFit: 'contain', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.6))' }}
        />
      </div>

      {/* Main Executive Analytics View (10 Sections) */}
      <AnalyticsView tasks={tasks} gamification={gamification} notifications={notifications} />
    </motion.div>
  );
}
