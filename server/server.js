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
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS policy: Origin not allowed'));
  },
  credentials: true
}));
app.use(express.json());

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

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
