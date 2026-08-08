import React from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, Target, Clock, BarChart3, Flame, Trophy, 
  ShieldCheck, UserCheck, Compass, ArrowRight, CheckCircle2,
  Zap, HeartHandshake, Award
} from 'lucide-react';

export default function AboutPage({ onNavigateToTasks }) {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  const keyFeatures = [
    {
      icon: <CheckCircle2 size={24} style={{ color: 'var(--accent-gold-main)' }} />,
      title: 'Smart Task Management',
      description: 'Create, organize, prioritize, and track tasks effortlessly with intuitive categories, priorities, and flexible views.'
    },
    {
      icon: <Clock size={24} style={{ color: 'var(--accent-gold-main)' }} />,
      title: 'Deadline Management',
      description: 'Stay ahead of important deadlines and never miss critical work with automated browser notifications and email alerts.'
    },
    {
      icon: <BarChart3 size={24} style={{ color: 'var(--accent-gold-main)' }} />,
      title: 'Productivity Tracking',
      description: 'Monitor completed, pending, and upcoming tasks in real-time with dynamic progress stats and analytics.'
    },
    {
      icon: <Trophy size={24} style={{ color: 'var(--accent-gold-main)' }} />,
      title: 'Gamification & Streaks',
      description: 'Earn XP, level up your rank, maintain daily task completion streaks, and turn productivity into a rewarding habit.'
    }
  ];

  const whatIsItems = [
    { name: 'Task Management', icon: <CheckCircle2 size={16} /> },
    { name: 'Deadline Management', icon: <Clock size={16} /> },
    { name: 'Productivity Tracking', icon: <BarChart3 size={16} /> },
    { name: 'Progress Monitoring', icon: <Target size={16} /> },
    { name: 'Streak System', icon: <Flame size={16} /> },
    { name: 'XP & Gamification', icon: <Trophy size={16} /> }
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2.5rem',
        maxWidth: '1100px',
        margin: '0 auto',
        paddingBottom: '3rem'
      }}
    >
      {/* ─── 1. HERO SECTION ──────────────────────────────────────────────── */}
      <motion.div 
        variants={itemVariants}
        className="glass-panel"
        style={{
          padding: '3rem 2rem',
          borderRadius: 'var(--radius-xl, 22px)',
          textAlign: 'center',
          background: 'linear-gradient(180deg, rgba(23, 23, 27, 0.95) 0%, rgba(20, 20, 24, 0.8) 100%)',
          border: '1px solid var(--border-color)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-premium)'
        }}
      >
        {/* Subtle background glow effect */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '400px',
          height: '250px',
          background: 'radial-gradient(circle, rgba(244, 197, 66, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '0.4rem 1rem',
          borderRadius: '99px',
          background: 'var(--surface-subtle)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.82rem',
          fontWeight: 700,
          color: 'var(--text-gold)',
          marginBottom: '1.25rem'
        }}>
          <Sparkles size={14} /> <span>Productivity Platform</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3.25rem)',
          fontWeight: 800,
          lineHeight: 1.15,
          letterSpacing: '-1px',
          marginBottom: '0.75rem',
          background: 'var(--accent-gradient)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          About TaskSphere
        </h1>

        <p style={{
          fontSize: 'clamp(1.1rem, 2.5vw, 1.35rem)',
          fontWeight: 700,
          color: 'var(--text-gold)',
          marginBottom: '1.25rem'
        }}>
          Plan better. Focus deeper. Achieve more.
        </p>

        <p style={{
          fontSize: 'clamp(0.95rem, 2vw, 1.05rem)',
          color: 'var(--text-muted)',
          maxWidth: '740px',
          margin: '0 auto 2rem',
          lineHeight: 1.6
        }}>
          TaskSphere is a modern productivity and task-management platform designed to help individuals organize their work, manage deadlines, track progress, and build consistent productive habits.
        </p>

        {onNavigateToTasks && (
          <button 
            className="btn btn-primary"
            onClick={onNavigateToTasks}
            style={{
              padding: '0.75rem 1.75rem',
              fontSize: '0.95rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>Explore Workspace</span>
            <ArrowRight size={16} />
          </button>
        )}
      </motion.div>

      {/* ─── 2. WHAT IS TASKSPHERE? ───────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="glass-panel" style={{ padding: '2.25rem', borderRadius: 'var(--radius-lg, 18px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
          <Zap size={22} style={{ color: 'var(--accent-gold-main)' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            What is TaskSphere?
          </h2>
        </div>

        <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: '1.5rem' }}>
          TaskSphere combines essential workflow tools into one seamless, unified workspace designed to eliminate clutter, sharpen daily focus, and empower users to accomplish their goals.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '1.5rem'
        }}>
          {whatIsItems.map((item, idx) => (
            <div 
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md, 12px)',
                background: 'var(--surface-subtle)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                fontSize: '0.88rem',
                fontWeight: 600
              }}
            >
              <span style={{ color: 'var(--accent-gold-main)' }}>{item.icon}</span>
              <span>{item.name}</span>
            </div>
          ))}
        </div>

        <div style={{
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-md, 12px)',
          background: 'rgba(244, 197, 66, 0.06)',
          border: '1px solid rgba(244, 197, 66, 0.2)',
          color: 'var(--text-gold)',
          fontSize: '0.92rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Sparkles size={18} style={{ flexShrink: 0 }} />
          <span>The ultimate goal is to make daily productivity more engaging, structured, and deeply rewarding.</span>
        </div>
      </motion.div>

      {/* ─── 3. KEY FEATURES ──────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.35rem 0' }}>
            Key Features
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
            Everything you need to master your time and stay focused
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem'
        }}>
          {keyFeatures.map((feat, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="glass-panel"
              style={{
                padding: '1.5rem',
                borderRadius: 'var(--radius-lg, 18px)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)'
              }}
            >
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '14px',
                background: 'var(--surface-subtle)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {feat.icon}
              </div>

              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                {feat.title}
              </h3>

              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.55, margin: 0 }}>
                {feat.description}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ─── 4. MISSION & 6. VISION DUAL GRID ────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem'
      }}>
        {/* Mission Card */}
        <motion.div variants={itemVariants} className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-lg, 18px)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Target size={22} style={{ color: 'var(--accent-gold-main)' }} />
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-gold)', margin: 0 }}>
              Our Mission
            </h2>
          </div>

          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
            "Make productivity simple, focused, and rewarding."
          </h3>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
            TaskSphere aims to help users stay organized, consistent, and motivated by removing friction from daily task planning and transforming daily effort into measurable achievements.
          </p>
        </motion.div>

        {/* Vision Card */}
        <motion.div variants={itemVariants} className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-lg, 18px)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Compass size={22} style={{ color: 'var(--accent-gold-main)' }} />
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-gold)', margin: 0 }}>
              Our Vision
            </h2>
          </div>

          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
            "To build a productivity platform that helps people turn their goals into consistent action."
          </h3>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
            We envision a world where anyone can define ambitious goals and break them down into actionable daily victories with clarity, motivation, and total peace of mind.
          </p>
        </motion.div>
      </div>

      {/* ─── 5. FOUNDER SECTION ────────────────────────────────────────────── */}
      <motion.div 
        variants={itemVariants} 
        className="glass-panel" 
        style={{ 
          padding: '2.25rem', 
          borderRadius: 'var(--radius-lg, 18px)',
          background: 'linear-gradient(135deg, rgba(23, 23, 27, 0.9) 0%, rgba(30, 30, 36, 0.7) 100%)',
          border: '1px solid var(--border-glow)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
          <UserCheck size={20} style={{ color: 'var(--accent-gold-main)' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-gold)' }}>
            Built By
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: '20px',
            background: 'var(--accent-gradient)',
            color: '#0E0E10',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            fontWeight: 800,
            boxShadow: 'var(--shadow-glow)',
            flexShrink: 0
          }}>
            ES
          </div>

          <div style={{ flex: 1, minWidth: '240px' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.25rem 0' }}>
              E.Sivanesh
            </h3>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-gold)', display: 'block', marginBottom: '0.75rem' }}>
              Founder & Creator of TaskSphere
            </span>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.65, margin: 0 }}>
              TaskSphere was designed and developed by E.Sivanesh with the goal of creating a simple, powerful, and motivating workspace for managing everyday tasks and productivity.
            </p>
          </div>
        </div>
      </motion.div>

      {/* ─── 7. FOOTER SECTION ────────────────────────────────────────────── */}
      <motion.div 
        variants={itemVariants}
        style={{
          marginTop: '1rem',
          paddingTop: '2rem',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem',
          textAlign: 'center'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-gold)' }}>
            TaskSphere
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Plan better. Focus deeper. Achieve more.
          </span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.82rem',
          color: 'var(--text-dim)',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <span>Built & developed by <strong style={{ color: 'var(--text-main)' }}>E.Sivanesh</strong></span>
          <span>•</span>
          <span style={{ color: 'var(--text-gold)' }}>Founder & Creator</span>
        </div>

        <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
          © 2026 TaskSphere. All rights reserved.
        </div>
      </motion.div>
    </motion.div>
  );
}
