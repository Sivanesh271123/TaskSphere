/**
 * TaskSphere Backend Server
 * Express + MySQL + JWT Authentication
 * Auto-creates database and tables on startup.
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import taskRoutes from './routes/taskRoutes.js';
import authRoutes from './routes/authRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { initializeDatabase } from './config/db.js';
import { initCronScheduler } from './services/cronScheduler.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const allowedOrigins = CLIENT_ORIGIN.split(',').map(origin => origin.trim()).filter(Boolean);

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false
}));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.includes(origin) || 
                      origin.startsWith('http://localhost:') || 
                      origin.startsWith('http://127.0.0.1:');
    if (isAllowed) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(__dirname, '../dist');
  app.use(express.static(distPath));
}

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/notifications', notificationRoutes);

// Wildcard handler for client-side routing in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(__dirname, '../dist');
  app.get(/.*/, (req, res, next) => {
    // Only serve index.html for page navigation requests
    // Skip API endpoints, files with extensions, and requests starting with /assets/
    const isAsset = req.path.includes('.') || req.path.startsWith('/assets/');
    if (req.path.startsWith('/api') || isAsset) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'), (err) => {
      if (err) {
        console.error(`[Static Files ERROR] Failed to send index.html:`, err.message);
        next(err);
      }
    });
  });
}

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'TaskSphere API is running', timestamp: new Date().toISOString() });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.message);
  console.error('Unhandled server error STACK TRACE:', err.stack);
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message || 'Internal server error';
  res.status(status).json({ error: message });
});

// ─── Start Server ────────────────────────────────────────────────────────────

async function start() {
  try {
    await initializeDatabase();
    
    // Initialize scheduled email reminders
    initCronScheduler();

    app.listen(PORT, () => {
      console.log(`\n  ✨ TaskSphere API Server running on http://localhost:${PORT}`);
      console.log(`  📦 Database: ${process.env.DB_NAME || 'tasksphere'}`);
      console.log(`  🔐 Authentication enabled. Task routes are protected by JWT.`);
      console.log(`  ✅ CORS and secure cookie handling are configured for development and production environments.\n`);
    });
  } catch (err) {
    console.error('\n  ❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
