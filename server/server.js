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
import { initializeDatabase } from './config/db.js';
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
app.use(helmet());
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(__dirname, '../dist');
  
  // Debug Middleware for Static Assets
  app.use((req, res, next) => {
    if (req.path.startsWith('/assets/')) {
      const targetFile = path.join(distPath, req.path);
      console.log(`\n=== [Static Debug] Request: ${req.method} ${req.path} ===`);
      console.log(`[Static Debug] __dirname:          ${__dirname}`);
      console.log(`[Static Debug] process.cwd():      ${process.cwd()}`);
      console.log(`[Static Debug] distPath:          ${distPath}`);
      console.log(`[Static Debug] distPath Exists:    ${fs.existsSync(distPath)}`);
      console.log(`[Static Debug] index.html Exists:  ${fs.existsSync(path.join(distPath, 'index.html'))}`);
      console.log(`[Static Debug] targetFile:        ${targetFile}`);
      console.log(`[Static Debug] targetFile Exists:  ${fs.existsSync(targetFile)}`);
      if (fs.existsSync(distPath)) {
        console.log(`[Static Debug] dist contents:     `, fs.readdirSync(distPath));
        const assetsPath = path.join(distPath, 'assets');
        console.log(`[Static Debug] assets dir exists:  ${fs.existsSync(assetsPath)}`);
        if (fs.existsSync(assetsPath)) {
          console.log(`[Static Debug] assets contents:   `, fs.readdirSync(assetsPath));
        }
      }
      console.log(`==========================================\n`);
    }
    next();
  });

  app.use(express.static(distPath));
}

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

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
