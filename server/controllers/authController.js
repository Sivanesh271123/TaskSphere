import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import UserModel from '../models/userModel.js';
import { JWT_SECRET, JWT_EXPIRY, COOKIE_MAX_AGE, COOKIE_SECURE } from '../config/authConfig.js';

// ─── Validation Helpers ──────────────────────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 255;
const MAX_PASSWORD_LENGTH = 128;

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
  } else if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  } else if (password.length > MAX_PASSWORD_LENGTH) {
    errors.push(`Password must be at most ${MAX_PASSWORD_LENGTH} characters.`);
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
