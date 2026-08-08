import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, User, Lock, Eye, EyeOff, ArrowRight, UserPlus, LogIn, 
  AlertCircle, Mail, CheckCircle2, Shield, ArrowLeft, KeyRound, RotateCcw
} from 'lucide-react';

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: '' };
  
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  let score = 0;
  if (hasMinLength) score++;
  if (hasUpper && hasLower) score++;
  if (hasDigit) score++;
  if (hasSpecial) score++;

  const isFullyValid = hasMinLength && hasUpper && hasLower && hasDigit && hasSpecial;

  if (isFullyValid) {
    return { score: 4, label: 'Strong', color: '#34d399' };
  }
  if (score === 3) return { score: 3, label: 'Good', color: '#38bdf8' };
  if (score === 2) return { score: 2, label: 'Fair', color: '#fbbf24' };
  return { score: 1, label: 'Weak', color: '#f87171' };
}

export default function AuthPage({ onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Forgot Password State ────────────────────────────────────────────────--
  const [forgotStep, setForgotStep] = useState('email'); // 'email' | 'verify' | 'reset' | 'success'
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState(''); // Stored ONLY in React state (Never in localStorage)
  const [newPassword, setNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef(null);

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
  const resetPasswordStrength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startResendTimer = () => {
    setResendTimer(60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const toggleMode = () => {
    setMode(prev => prev === 'login' ? 'signup' : 'login');
    setError('');
    setSuccessMsg('');
    setPassword('');
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleReturnToLogin = () => {
    setMode('login');
    setForgotStep('email');
    setError('');
    setSuccessMsg('');
    setOtp('');
    setResetToken('');
    setNewPassword('');
    setResetConfirmPassword('');
    if (timerRef.current) clearInterval(timerRef.current);
    setResendTimer(0);
  };

  // ─── Login & Register Submission ───────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (mode === 'signup') {
      if (!fullName.trim() || !email.trim() || !password) {
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
      if (password.length > 64) {
        setError('Password must be at most 64 characters.');
        return;
      }
      if (!/[A-Z]/.test(password)) {
        setError('Password must contain at least one uppercase letter.');
        return;
      }
      if (!/[a-z]/.test(password)) {
        setError('Password must contain at least one lowercase letter.');
        return;
      }
      if (!/[0-9]/.test(password)) {
        setError('Password must contain at least one number.');
        return;
      }
      if (!/[^A-Za-z0-9]/.test(password)) {
        setError('Password must contain at least one special character.');
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
      const response = await onAuthSuccess(mode, { 
        fullName: fullName.trim(), 
        email: email.trim(), 
        password: password, 
        rememberMe 
      });
      if (mode === 'signup') {
        setSuccessMsg('Account created successfully! Redirecting to login...');
        setTimeout(() => {
          setMode('login');
          setSuccessMsg('');
          setPassword('');
          setFullName('');
        }, 1500);
      }
    } catch (err) {
      console.error("[7] Registration error", err);
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

  // ─── Step 1: Forgot Password Email Submission ────────────────────────────────
  const handleForgotEmailSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || isLoading) return;

    setError('');
    setSuccessMsg('');

    const targetEmail = (forgotEmail || email).trim();
    if (!targetEmail || !validateEmail(targetEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setForgotEmail(targetEmail);
    setIsSubmitting(true);
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to send verification code.');
      }

      setSuccessMsg(data.message || 'If an account exists with this email, a verification code has been generated.');
      setForgotStep('verify');
      startResendTimer();
    } catch (err) {
      setError(err.message || 'Failed to send verification code.');
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  };

  // ─── Step 2: Resend Code Handler ─────────────────────────────────────────────
  const handleResendCode = async () => {
    if (resendTimer > 0 || isLoading) return;
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to resend verification code.');
      }

      setSuccessMsg('A new 6-digit verification code has been sent to your email.');
      startResendTimer();
    } catch (err) {
      setError(err.message || 'Failed to resend verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Step 2: Verify OTP Submission ──────────────────────────────────────────
  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanOtp = otp.trim();
    if (!cleanOtp || !/^\d{6}$/.test(cleanOtp)) {
      setError('Please enter a valid 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/verify-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim(), otp: cleanOtp })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Invalid or expired verification code.');
      }

      // Store resetToken securely in React state ONLY (never in localStorage)
      setResetToken(data.resetToken || '');
      setSuccessMsg('Verification code verified! Please enter your new password.');
      setForgotStep('reset');
    } catch (err) {
      setError(err.message || 'Invalid verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Step 3: Reset Password Submission ───────────────────────────────────────
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!newPassword || !resetConfirmPassword) {
      setError('Please fill in both password fields.');
      return;
    }
    if (newPassword !== resetConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
      setError('Password must meet all security requirements.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          resetToken,
          newPassword,
          confirmPassword: resetConfirmPassword
        })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to reset password.');
      }

      // Clear tokens and sensitive password state
      setResetToken('');
      setNewPassword('');
      setResetConfirmPassword('');
      setOtp('');
      setForgotStep('success');
    } catch (err) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('sivanesh39289@gmail.com');
    setPassword('Demo@12345');
    setError('');
  };

  return (
    <div className="auth-page">
      <div className="aurora-bg">
        <div className="noise-overlay" />
      </div>

      <motion.div 
        className="auth-split-wrapper"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Left Showcase Hero Banner */}
        <div className="auth-showcase-banner">
          <div>
            <div className="auth-showcase-header">
              <div className="auth-showcase-brand">
                <img src="/tasksphere-logo.png" alt="TaskSphere Logo" className="auth-showcase-logo" />
                <span className="auth-showcase-title">TaskSphere</span>
              </div>
            </div>

            <div className="auth-showcase-body">
              <h1 className="auth-showcase-headline">
                Level Up Your <span>Task Productivity</span>
              </h1>
              <p className="auth-showcase-desc">
                Organize your tasks, manage projects, track goals, build productive habits, and accomplish more with your all-in-one productivity workspace.
              </p>

              {/* Feature Spotlight Card */}
              <div className="auth-feature-card">
                <span className="auth-feature-tag">DEEP WORK</span>
                <div className="auth-feature-icon">
                  <Sparkles size={20} />
                </div>
                <h3 className="auth-feature-title">Executive Focus Engine</h3>
                <p className="auth-feature-desc">
                  Boost your productivity with custom work sprints, automated break intervals, and real-time activity performance analytics.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Metrics Row */}
          <div className="auth-metrics-row">
            <div className="auth-metric-item">
              <div className="auth-metric-value">99.9%</div>
              <div className="auth-metric-label">Cloud Uptime</div>
            </div>
            <div className="auth-metric-item">
              <div className="auth-metric-value">Verified</div>
              <div className="auth-metric-label">Secure Auth</div>
            </div>
            <div className="auth-metric-item">
              <div className="auth-metric-value">Instant</div>
              <div className="auth-metric-label">Local DB Sync</div>
            </div>
          </div>
        </div>

        {/* Right Interactive Form Panel */}
        <div className="auth-panel-form">
          {mode !== 'forgot' && (
            <div className="auth-tabs">
              <button className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => { if (mode !== 'login') toggleMode(); }}>
                <LogIn size={16} /> Sign In
              </button>
              <button className={`auth-tab ${mode === 'signup' ? 'active' : ''}`} onClick={() => { if (mode !== 'signup') toggleMode(); }}>
                <UserPlus size={16} /> Register
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* ─── LOGIN / SIGNUP MODE ────────────────────────────────────────────── */}
            {mode !== 'forgot' && (
              <motion.form
                key={mode}
                initial={{ opacity: 0, x: mode === 'login' ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: mode === 'login' ? 20 : -20 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleSubmit}
                className="auth-form"
                style={{ padding: '1.75rem 0 0' }}
              >
                <div style={{ marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.78rem', color: '#D4AF37', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Welcome Back!
                  </span>
                  <h2 className="auth-form-title" style={{ marginTop: '2px', margin: '4px 0' }}>
                    {mode === 'login' ? 'Welcome Back!' : 'Create Account'}
                  </h2>
                  <p className="auth-form-desc" style={{ margin: 0 }}>
                    {mode === 'login' 
                      ? 'Sign in to access your task planner & progress dashboard' 
                      : 'Create your account to start managing tasks'
                    }
                  </p>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="auth-error"
                  >
                    <AlertCircle size={18} style={{ flexShrink: 0 }} />
                    <span>{error}</span>
                  </motion.div>
                )}

                {mode === 'signup' && (
                  <div className="auth-field">
                    <label htmlFor="authFullName">Full Name</label>
                    <div className="auth-input-wrapper">
                      <User size={18} className="auth-input-icon" />
                      <input 
                        id="authFullName"
                        name="fullName"
                        autoComplete="name"
                        type="text" 
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                )}

                <div className="auth-field">
                  <label htmlFor="authEmail">Email Address</label>
                  <div className="auth-input-wrapper">
                    <Mail size={18} className="auth-input-icon" />
                    <input 
                      id="authEmail"
                      name="email"
                      autoComplete="email"
                      type="email" 
                      placeholder="alex@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label htmlFor="authPassword">Password</label>
                    {mode === 'login' && (
                      <button 
                        type="button" 
                        className="auth-forgot-link" 
                        onClick={() => {
                          setMode('forgot');
                          setForgotStep('email');
                          setError('');
                          setSuccessMsg('');
                        }}
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div className="auth-input-wrapper">
                    <Lock size={18} className="auth-input-icon" />
                    <input 
                      id="authPassword"
                      name="password"
                      autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                      type={showPassword ? 'text' : 'password'} 
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    <button 
                      type="button" 
                      className="auth-eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      title={showPassword ? 'Hide Password' : 'Show Password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {mode === 'login' && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0.2rem 0' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.84rem', color: '#9CA3AF' }}>
                      <input 
                        type="checkbox" 
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        style={{ accentColor: '#D4AF37', width: 16, height: 16, cursor: 'pointer' }}
                      />
                      <span>Remember me</span>
                    </label>

                    <button 
                      type="button" 
                      onClick={handleFillDemo}
                      style={{ background: 'none', border: 'none', color: '#D4AF37', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Fill Demo Credentials
                    </button>
                  </div>
                )}

                <button 
                  type="submit" 
                  className="auth-submit-btn" 
                  disabled={isLoading || isSubmitting}
                >
                  {isLoading || isSubmitting ? (
                    <div className="btn-spinner" />
                  ) : (
                    <>
                      <span>{mode === 'login' ? 'Sign In to Dashboard' : 'Create Account'}</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </motion.form>
            )}

            {/* ─── FORGOT PASSWORD FLOW ───────────────────────────────────────────── */}
            {mode === 'forgot' && (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="auth-form"
                style={{ padding: '1.75rem 0 0' }}
              >
                {/* Global Error Notice */}
                {error && (
                  <motion.div className="auth-error" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <AlertCircle size={18} style={{ flexShrink: 0 }} />
                    <span>{error}</span>
                  </motion.div>
                )}

                {/* Global Success Notice */}
                {successMsg && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: 10, color: '#22C55E', fontSize: '0.85rem', fontWeight: 600 }}>
                    <CheckCircle2 size={16} />
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* STEP 1: Enter Email */}
                {forgotStep === 'email' && (
                  <form onSubmit={handleForgotEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                    <div>
                      <h2 className="auth-form-title">Forgot Password</h2>
                      <p className="auth-form-desc">
                        Enter your registered email address to receive a 6-digit verification code.
                      </p>
                    </div>

                    <div className="auth-field">
                      <label htmlFor="forgotEmail">Email Address</label>
                      <div className="auth-input-wrapper">
                        <Mail size={18} className="auth-input-icon" />
                        <input 
                          id="forgotEmail"
                          type="email" 
                          placeholder="you@example.com" 
                          value={forgotEmail} 
                          onChange={e => setForgotEmail(e.target.value)}
                          autoComplete="email"
                          required
                        />
                      </div>
                    </div>

                    <button type="submit" className="auth-submit-btn" disabled={isLoading || isSubmitting}>
                      {isLoading || isSubmitting ? (
                        <div className="btn-spinner" />
                      ) : (
                        <>
                          <span>Send Verification Code</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>

                    <button type="button" className="auth-secondary-btn" onClick={handleReturnToLogin} disabled={isLoading}>
                      <ArrowLeft size={16} />
                      <span>Back to Login</span>
                    </button>
                  </form>
                )}

                {/* STEP 2: Verify 6-digit OTP */}
                {forgotStep === 'verify' && (
                  <form onSubmit={handleVerifyOtpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                    <div>
                      <h2 className="auth-form-title">Verify Code</h2>
                      <p className="auth-form-desc">
                        Enter the 6-digit verification code sent to <strong style={{ color: '#F5F5F5' }}>{forgotEmail}</strong>
                      </p>
                    </div>

                    <div className="auth-field">
                      <label htmlFor="forgotOtp">Verification Code</label>
                      <div className="auth-input-wrapper">
                        <KeyRound size={18} className="auth-input-icon" />
                        <input 
                          id="forgotOtp"
                          type="text" 
                          placeholder="123456" 
                          maxLength={6}
                          value={otp} 
                          onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                          required
                        />
                      </div>
                    </div>

                    <button type="submit" className="auth-submit-btn" disabled={isLoading || otp.trim().length !== 6}>
                      {isLoading ? (
                        <div className="btn-spinner" />
                      ) : (
                        <>
                          <span>Verify Code</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button 
                        type="button" 
                        className="auth-secondary-btn" 
                        onClick={handleResendCode} 
                        disabled={resendTimer > 0 || isLoading}
                        style={{ flex: 1 }}
                      >
                        <RotateCcw size={15} />
                        <span>{resendTimer > 0 ? `Resend (${resendTimer}s)` : 'Resend Code'}</span>
                      </button>

                      <button 
                        type="button" 
                        className="auth-secondary-btn" 
                        onClick={() => { setForgotStep('email'); setError(''); setSuccessMsg(''); }} 
                        disabled={isLoading}
                        style={{ flex: 1 }}
                      >
                        <ArrowLeft size={15} />
                        <span>Back</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* STEP 3: Reset Password */}
                {forgotStep === 'reset' && (
                  <form onSubmit={handleResetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                    <div>
                      <h2 className="auth-form-title">Reset Password</h2>
                      <p className="auth-form-desc">
                        Create a strong new password for your account.
                      </p>
                    </div>

                    <div className="auth-field">
                      <label htmlFor="resetNewPassword">New Password</label>
                      <div className="auth-input-wrapper">
                        <Lock size={18} className="auth-input-icon" />
                        <input 
                          id="resetNewPassword"
                          type={showResetPassword ? 'text' : 'password'} 
                          placeholder="Minimum 8 characters" 
                          value={newPassword} 
                          onChange={e => setNewPassword(e.target.value)}
                          required
                        />
                        <button 
                          type="button" 
                          className="auth-eye-btn" 
                          onClick={() => setShowResetPassword(!showResetPassword)} 
                          tabIndex={-1}
                        >
                          {showResetPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="auth-field">
                      <label htmlFor="resetConfirmPassword">Confirm Password</label>
                      <div className="auth-input-wrapper">
                        <Lock size={18} className="auth-input-icon" />
                        <input 
                          id="resetConfirmPassword"
                          type={showResetPassword ? 'text' : 'password'} 
                          placeholder="Re-enter your password" 
                          value={resetConfirmPassword} 
                          onChange={e => setResetConfirmPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                      {isLoading ? (
                        <div className="btn-spinner" />
                      ) : (
                        <>
                          <span>Reset Password</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* STEP 4: Success Screen */}
                {forgotStep === 'success' && (
                  <div style={{ textAlign: 'center', padding: '1rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(34, 197, 94, 0.12)', border: '2px solid #22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22C55E' }}>
                      <CheckCircle2 size={36} />
                    </div>

                    <div>
                      <h2 className="auth-form-title" style={{ margin: '0 0 0.5rem' }}>Password Reset Complete</h2>
                      <p className="auth-form-desc" style={{ margin: 0 }}>
                        Your password has been reset. You can now log in with your new credentials.
                      </p>
                    </div>

                    <button 
                      type="button" 
                      className="auth-submit-btn" 
                      onClick={handleReturnToLogin}
                    >
                      <span>Return to Login</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
