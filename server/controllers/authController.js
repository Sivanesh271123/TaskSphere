import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import UserModel from '../models/userModel.js';
import { JWT_SECRET, JWT_EXPIRY, COOKIE_MAX_AGE, COOKIE_SECURE } from '../config/authConfig.js';
import { sendPasswordResetOTP } from '../services/emailService.js';

// ─── Validation Helpers ──────────────────────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 64;
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 255;

function isValidPassword(password) {
  if (!password || typeof password !== 'string') {
    console.log('[PASSWORD REJECT] Password is empty or not a string');
    return false;
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    console.log(`[PASSWORD REJECT] Length ${password.length} is less than minimum ${MIN_PASSWORD_LENGTH}`);
    return false;
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    console.log(`[PASSWORD REJECT] Length ${password.length} exceeds maximum ${MAX_PASSWORD_LENGTH}`);
    return false;
  }
  if (!/[A-Z]/.test(password)) {
    console.log('[PASSWORD REJECT] Missing at least one uppercase letter (A-Z)');
    return false;
  }
  if (!/[a-z]/.test(password)) {
    console.log('[PASSWORD REJECT] Missing at least one lowercase letter (a-z)');
    return false;
  }
  if (!/[0-9]/.test(password)) {
    console.log('[PASSWORD REJECT] Missing at least one numeric digit (0-9)');
    return false;
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    console.log('[PASSWORD REJECT] Missing at least one special character (!@#$%^&* etc)');
    return false;
  }
  return true;
}

function validateRegistration({ name, email, password }) {
  const errors = [];

  if (!name?.trim()) {
    errors.push('Name is required.');
  } else if (name.trim().length < 2) {
    errors.push('Name must be at least 2 characters.');
  } else if (name.trim().length > MAX_NAME_LENGTH) {
    errors.push(`Name must be at most ${MAX_NAME_LENGTH} characters.`);
  }

  if (!email?.trim()) {
    errors.push('Email is required.');
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.push('Please provide a valid email address.');
  } else if (email.trim().length > MAX_EMAIL_LENGTH) {
    errors.push(`Email must be at most ${MAX_EMAIL_LENGTH} characters.`);
  }

  if (!password) {
    errors.push('Password is required.');
  } else {
    if (password.length < MIN_PASSWORD_LENGTH) {
      errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    }
    if (password.length > MAX_PASSWORD_LENGTH) {
      errors.push(`Password must be at most ${MAX_PASSWORD_LENGTH} characters.`);
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter.');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter.');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number.');
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('Password must contain at least one special character.');
    }
  }

  return errors;
}

function validateLogin({ email, password }) {
  const errors = [];

  if (!email?.trim()) {
    errors.push('Email is required.');
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.push('Please provide a valid email address.');
  }

  if (!password) {
    errors.push('Password is required.');
  }

  return errors;
}

// ─── Token Helpers ───────────────────────────────────────────────────────────
function createToken(user, rememberMe = false) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email },
    JWT_SECRET,
    { expiresIn: rememberMe ? '30d' : JWT_EXPIRY }
  );
}

function setAuthCookie(res, token, rememberMe = false) {
  const maxAge = rememberMe ? COOKIE_MAX_AGE.rememberMe : COOKIE_MAX_AGE.standard;
  const secureFlag = COOKIE_SECURE ? '; Secure' : '';

  res.setHeader('Set-Cookie', [
    `token=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax${secureFlag}`
  ]);
}

function clearAuthCookie(res) {
  const secureFlag = COOKIE_SECURE ? '; Secure' : '';
  res.setHeader('Set-Cookie', [`token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${secureFlag}`]);
}

// ─── Controllers ─────────────────────────────────────────────────────────────
export async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    const errors = validateRegistration({ name, email, password });
    if (errors.length > 0) {
      return res.status(400).json({ error: errors[0] });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await UserModel.findByEmail(normalizedEmail);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await UserModel.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword
    });

    const token = createToken(user);
    setAuthCookie(res, token);

    return res.status(201).json({
      message: 'Registration successful.',
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Failed to register user.' });
  }
}

export async function login(req, res) {
  try {
    const { email, password, rememberMe } = req.body;

    const errors = validateLogin({ email, password });
    if (errors.length > 0) {
      return res.status(400).json({ error: errors[0] });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await UserModel.findByEmail(normalizedEmail);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = createToken(user, Boolean(rememberMe));
    setAuthCookie(res, token, Boolean(rememberMe));

    return res.json({
      message: 'Login successful.',
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Failed to log in.' });
  }
}

export async function me(req, res) {
  try {
    return res.json({ user: req.user });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load user.' });
  }
}

export function logout(req, res) {
  clearAuthCookie(res);
  return res.json({ message: 'Logged out.' });
}

let forgotPasswordRequestCounter = 0;
const otpRequestLocks = new Map(); // normalizedEmail -> timestamp

export async function forgotPassword(req, res) {
  console.log(`\n[FORGOT DEBUG 1] Controller entered`);
  try {
    forgotPasswordRequestCounter++;
    const requestId = forgotPasswordRequestCounter;
    const timestamp = new Date().toISOString();
    console.log(`[FORGOT PASSWORD AUDIT] Request #${requestId} received at ${timestamp} for email: "${req.body?.email}"`);
    const { email } = req.body;

    if (!email?.trim() || !EMAIL_REGEX.test(email.trim())) {
      console.log(`[FORGOT DEBUG INVALID EMAIL] Email failed regex validation: "${email}"`);
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    console.log(`[FORGOT DEBUG 2] Email normalized: "${normalizedEmail}"`);

    // Deduplicate concurrent requests hitting backend within 5 seconds
    const now = Date.now();
    const lastRequestTime = otpRequestLocks.get(normalizedEmail) || 0;
    if (now - lastRequestTime < 5000) {
      console.log(`[FORGOT PASSWORD DEDUPLICATED] Ignored duplicate request #${requestId} for ${normalizedEmail} (Within 5s lock)`);
      return res.json({
        message: 'If an account exists with this email, a verification code has been generated.'
      });
    }
    otpRequestLocks.set(normalizedEmail, now);

    console.log(`[FORGOT DEBUG 3] About to find user with email "${normalizedEmail}"`);
    const user = await UserModel.findByEmail(normalizedEmail);
    console.log(`[FORGOT DEBUG 4] User lookup completed for "${normalizedEmail}"`);

    if (!user) {
      console.log(`[FORGOT DEBUG 5] User found: false (No matching account for "${normalizedEmail}")`);
    } else {
      console.log(`[FORGOT DEBUG 5] User found: true (ID: ${user.id})`);
      
      // Check if user already has an active, unexpired OTP (valid for 10 mins) with < 5 attempts
      const hasActiveOTP = user.reset_otp && 
                           user.reset_otp_expires && 
                           new Date(user.reset_otp_expires) > new Date() && 
                           (parseInt(user.reset_otp_attempts || 0, 10) < 5);

      let otp;
      let expiresAt;

      if (hasActiveOTP) {
        otp = user.reset_otp;
        expiresAt = user.reset_otp_expires;
        console.log(`[FORGOT DEBUG 7] Reusing active OTP "${otp}" for ${normalizedEmail} (Expires: ${expiresAt})`);
      } else {
        console.log(`[FORGOT DEBUG 6] About to generate OTP`);
        otp = crypto.randomInt(100000, 1000000).toString();
        expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        console.log(`[FORGOT DEBUG 7] OTP generated: "${otp}" (Expires: ${expiresAt})`);

        console.log(`[FORGOT DEBUG 8] About to save OTP to database for User ID ${user.id}`);
        await UserModel.setResetOTP(user.id, otp, expiresAt);
        console.log(`[FORGOT DEBUG 9] OTP saved successfully in database`);
      }

      console.log(`[FORGOT DEBUG 10] About to call sendPasswordResetOTP for "${normalizedEmail}"`);
      const isSent = await sendPasswordResetOTP(normalizedEmail, otp);
      console.log(`[FORGOT DEBUG 11] sendPasswordResetOTP returned: ${isSent}`);

      if (!isSent) {
        console.error(`[FORGOT DEBUG ERROR] sendPasswordResetOTP failed for "${normalizedEmail}"`);
        return res.status(500).json({ error: 'Failed to send verification email. Please check server logs or email settings.' });
      }
    }

    console.log(`[FORGOT DEBUG 12] Sending response`);
    return res.json({
      message: 'If an account exists with this email, a verification code has been generated.'
    });
  } catch (err) {
    console.error(`[FORGOT CATCH ERROR] Unhandled exception in forgotPassword controller:`, err.stack || err);
    return res.status(500).json({ error: 'Failed to process request due to an internal server error.' });
  }
}

export async function verifyResetOTP(req, res) {
  try {
    const { email, otp } = req.body;

    // Validate email format
    if (!email?.trim() || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Invalid verification code.' });
    }

    // Validate OTP format (must be exactly 6 digits)
    const cleanOtp = String(otp || '').trim();
    if (!/^\d{6}$/.test(cleanOtp)) {
      return res.status(400).json({ success: false, message: 'Invalid verification code.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await UserModel.findByEmail(normalizedEmail);

    console.log(`\n[DEBUG VERIFY] Email: "${normalizedEmail}" | Received OTP: "${otp}" (Clean: "${cleanOtp}")`);
    console.log(`[DEBUG VERIFY] Stored OTP in DB: "${user?.reset_otp}" | Stored Expires: ${user?.reset_otp_expires} | Attempts: ${user?.reset_otp_attempts}\n`);

    // Security: Never reveal if user exists
    if (!user || !user.reset_otp || !user.reset_otp_expires) {
      return res.status(400).json({ success: false, message: 'Invalid verification code.' });
    }

    const currentAttempts = parseInt(user.reset_otp_attempts || 0, 10);

    // Maximum 5 failed attempts check
    if (currentAttempts >= 5) {
      await UserModel.clearResetOTP(user.id);
      return res.status(429).json({
        success: false,
        message: 'Too many failed attempts. Please request a new verification code.'
      });
    }

    // Verify OTP expiry
    const expiryDate = new Date(user.reset_otp_expires);
    if (isNaN(expiryDate.getTime()) || expiryDate < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired.'
      });
    }

    // Check OTP match
    if (cleanOtp !== String(user.reset_otp).trim()) {
      await UserModel.incrementResetOTPAttempts(user.id);
      const newAttempts = currentAttempts + 1;

      if (newAttempts >= 5) {
        await UserModel.clearResetOTP(user.id);
        return res.status(429).json({
          success: false,
          message: 'Too many failed attempts. Please request a new verification code.'
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Invalid verification code.'
      });
    }

    // Success - Generate crypto-secure short-lived reset token (valid for 5 minutes)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await UserModel.setResetToken(user.id, resetToken, tokenExpiresAt);

    return res.status(200).json({
      success: true,
      message: 'Verification code verified successfully.',
      resetToken
    });
  } catch (err) {
    console.error('Verify reset OTP error:', err);
    return res.status(500).json({ success: false, message: 'Failed to verify code.' });
  }
}

export async function resetPassword(req, res) {
  try {
    const { email, resetToken, otp, newPassword, confirmPassword } = req.body;

    // 1. Validate email format
    if (!email?.trim() || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification code.' });
    }

    // 2. Verify newPassword and confirmPassword match
    if (!newPassword || !confirmPassword || newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    // 3. Validate password strength
    if (!isValidPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet security requirements.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await UserModel.findByEmail(normalizedEmail);

    // 4. Verify user has a valid, active reset session token
    if (!user || !user.reset_token || !user.reset_token_expires) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification code.' });
    }

    // Accept token via resetToken property or fallback to otp field if user passed token in otp payload
    const tokenToVerify = String(resetToken || otp || '').trim();
    if (!tokenToVerify || tokenToVerify !== String(user.reset_token).trim()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification code.' });
    }

    // Check token expiry
    const tokenExpiryDate = new Date(user.reset_token_expires);
    if (isNaN(tokenExpiryDate.getTime()) || tokenExpiryDate < new Date()) {
      await UserModel.clearResetOTP(user.id);
      return res.status(400).json({ success: false, message: 'Invalid or expired verification code.' });
    }

    // Verify step 3 verification state was completed
    if (!user.reset_otp_verified) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification code.' });
    }

    // 5. Hash new password using bcrypt (cost factor 10) and update user in DB
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await UserModel.updatePassword(user.id, hashedPassword);

    // 6. Invalidate all reset state & tokens to prevent replay attacks
    await UserModel.clearResetOTP(user.id);

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully.'
    });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
}
