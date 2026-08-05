import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, User, Lock, Eye, EyeOff, ArrowRight, UserPlus, LogIn, 
  AlertCircle, Mail, CheckCircle2, Shield
} from 'lucide-react';

// Password strength calculator
function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: 'Weak', color: '#f87171' };
  if (score === 2) return { score: 2, label: 'Fair', color: '#fbbf24' };
  if (score === 3) return { score: 3, label: 'Good', color: '#38bdf8' };
  if (score >= 4) return { score: 4, label: 'Strong', color: '#34d399' };
  return { score: 0, label: '', color: '' };
}

export default function AuthPage({ onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  const toggleMode = () => {
    setMode(prev => prev === 'login' ? 'signup' : 'login');
    setError('');
    setSuccessMsg('');
    setPassword('');
    setConfirmPassword('');
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // Validation
    if (mode === 'signup') {
      if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
        setError('All fields are required.');
        return;
      }
      if (fullName.trim().length < 2) {
        setError('Full name must be at least 2 characters.');
        return;
      }
      if (!validateEmail(email)) {
        setError('Please enter a valid email address.');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    } else {
      if (!email.trim() || !password) {
        setError('Email and password are required.');
        return;
      }
      if (!validateEmail(email)) {
        setError('Please enter a valid email address.');
        return;
      }
    }

    setIsLoading(true);
    try {
      await onAuthSuccess(mode, { fullName: fullName.trim(), email: email.trim(), password, rememberMe });
      if (mode === 'signup') {
        setSuccessMsg('Account created successfully! Redirecting to login...');
        setTimeout(() => {
          setMode('login');
          setSuccessMsg('');
          setPassword('');
          setConfirmPassword('');
          setFullName('');
        }, 1500);
      }
    } catch (err) {
      const message = err.message || "Something went wrong. Please try again.";
      if (/network/i.test(message)) {
        setError("Unable to reach the server. Check your network connection and try again.");
      } else if (/expired|unauthorized|login/i.test(message)) {
        setError("Invalid credentials or session expired. Please try again.");
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="aurora-bg">
        <div className="aurora-orb aurora-orb-1" />
        <div className="aurora-orb aurora-orb-2" />
        <div className="aurora-orb aurora-orb-3" />
        <div className="noise-overlay" />
      </div>

      <motion.div 
        className="auth-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Brand */}
        <div className="auth-brand">
          <motion.div 
            className="auth-logo-mark"
            whileHover={{ scale: 1.08, rotate: 5 }}
            animate={{ 
              boxShadow: [
                '0 0 20px rgba(212, 175, 55, 0.3)',
                '0 0 40px rgba(212, 175, 55, 0.5)',
                '0 0 20px rgba(212, 175, 55, 0.3)'
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles size={32} />
          </motion.div>
          <h1 className="auth-title">TaskSphere</h1>
          <p className="auth-subtitle">Executive Productivity Platform</p>
        </div>

        {/* Auth Card */}
        <div className="auth-card">
          <div className="auth-tabs">
            <button className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => { if (mode !== 'login') toggleMode(); }}>
              <LogIn size={16} /> Sign In
            </button>
            <button className={`auth-tab ${mode === 'signup' ? 'active' : ''}`} onClick={() => { if (mode !== 'signup') toggleMode(); }}>
              <UserPlus size={16} /> Create Account
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              initial={{ opacity: 0, x: mode === 'login' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === 'login' ? 20 : -20 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleSubmit}
              className="auth-form"
            >
              <h2 className="auth-form-title">
                {mode === 'login' ? 'Welcome Back' : 'Join TaskSphere'}
              </h2>
              <p className="auth-form-desc">
                {mode === 'login' 
                  ? 'Sign in to access your tasks from any device' 
                  : 'Create your account to start managing tasks'
                }
              </p>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div className="auth-error" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Success */}
              <AnimatePresence>
                {successMsg && (
                  <motion.div className="auth-success" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                    <CheckCircle2 size={16} />
                    <span>{successMsg}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Full Name (signup) */}
              {mode === 'signup' && (
                <div className="auth-field">
                  <label htmlFor="fullName">Full Name</label>
                  <div className="auth-input-wrapper">
                    <User size={18} className="auth-input-icon" />
                    <input id="fullName" type="text" placeholder="Enter your full name" value={fullName} onChange={e => setFullName(e.target.value)} autoComplete="name" />
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="auth-field">
                <label htmlFor="email">Email Address</label>
                <div className="auth-input-wrapper">
                  <Mail size={18} className="auth-input-icon" />
                  <input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required />
                </div>
              </div>

              {/* Password */}
              <div className="auth-field">
                <label htmlFor="password">Password</label>
                <div className="auth-input-wrapper">
                  <Lock size={18} className="auth-input-icon" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={mode === 'signup' ? 'Minimum 8 characters' : 'Enter your password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    required
                  />
                  <button type="button" className="auth-eye-btn" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Password Strength Indicator (signup only) */}
                {mode === 'signup' && password.length > 0 && (
                  <div className="password-strength">
                    <div className="password-strength-bar">
                      {[1, 2, 3, 4].map(level => (
                        <div
                          key={level}
                          className="password-strength-segment"
                          style={{
                            background: passwordStrength.score >= level ? passwordStrength.color : 'rgba(255,255,255,0.08)'
                          }}
                        />
                      ))}
                    </div>
                    <span className="password-strength-label" style={{ color: passwordStrength.color }}>
                      <Shield size={12} /> {passwordStrength.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm Password (signup) */}
              {mode === 'signup' && (
                <div className="auth-field">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <div className="auth-input-wrapper">
                    <Lock size={18} className="auth-input-icon" />
                    <input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--danger-color)', marginTop: 2 }}>Passwords do not match</span>
                  )}
                  {confirmPassword && password === confirmPassword && confirmPassword.length >= 8 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--success-color)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle2 size={12} /> Passwords match
                    </span>
                  )}
                </div>
              )}

              {/* Remember Me (login only) */}
              {mode === 'login' && (
                <label className="remember-me-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="remember-me-checkbox"
                  />
                  <span className="remember-me-checkmark" />
                  <span>Remember me</span>
                </label>
              )}

              {/* Submit */}
              <motion.button type="submit" className="auth-submit-btn" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={isLoading}>
                {isLoading ? (
                  <span className="auth-spinner" />
                ) : (
                  <>
                    <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </motion.button>

              {/* Toggle Link */}
              <p className="auth-toggle-text">
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button type="button" className="auth-toggle-link" onClick={toggleMode}>
                  {mode === 'login' ? 'Create one' : 'Sign in'}
                </button>
              </p>
            </motion.form>
          </AnimatePresence>
        </div>

        <p className="auth-footer">🔒 Your data is stored securely in MySQL and accessible from any device</p>
      </motion.div>
    </div>
  );
}

