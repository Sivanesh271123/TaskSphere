import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-dark, #0E0E10)',
          color: 'var(--text-main, #FFFFFF)',
          fontFamily: 'var(--font-sans, sans-serif)',
          padding: '2rem'
        }}>
          <div className="glass-panel" style={{
            maxWidth: 480,
            width: '100%',
            padding: '2.5rem',
            borderRadius: '22px',
            background: 'var(--bg-card, #17171B)',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            textAlign: 'center',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'var(--danger-bg, rgba(239, 68, 68, 0.12))',
              color: 'var(--danger-color, #EF4444)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}>
              <AlertTriangle size={28} />
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.5rem', color: 'var(--text-primary, #FFFFFF)' }}>
              Something went wrong
            </h2>
            
            <p style={{ fontSize: '14px', color: 'var(--text-secondary, #B3B3B3)', margin: '0 0 1.5rem', lineHeight: 1.5 }}>
              TaskSphere encountered an unexpected runtime issue. Please reload the application to restore your workspace.
            </p>

            <button 
              className="btn btn-primary"
              onClick={this.handleReload}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', fontWeight: 700 }}
            >
              <RefreshCw size={16} /> <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
