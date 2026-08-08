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
import { createTransporter } from './services/emailService.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dns from 'dns';
import net from 'net';

async function diagnoseSMTPPort465(host = 'smtp.gmail.com', port = 465) {
  console.log(`\n  🔍 [SMTP DIAGNOSTIC] Starting DNS & TCP test for ${host}:${port}...`);

  try {
    const addresses = await dns.promises.resolve4(host);
    console.log(`  🔍 [SMTP DIAGNOSTIC] DNS A (IPv4) resolved for ${host}:`, addresses);
  } catch (err) {
    console.error(`  ⚠️ [SMTP DIAGNOSTIC] DNS Resolution Failed for ${host}:`, err.message);
  }

  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(7000);
    console.log(`  🔍 [SMTP DIAGNOSTIC] Attempting raw TCP socket connection to ${host}:${port}...`);

    socket.on('connect', () => {
      console.log(`  ✅ [SMTP DIAGNOSTIC] Raw TCP socket CONNECTED to ${host}:${port} successfully!`);
      socket.destroy();
      resolve(true);
    });

    socket.on('timeout', () => {
      console.error(`  ⚠️ [SMTP DIAGNOSTIC] Raw TCP socket TIMEOUT after 7000ms connecting to ${host}:${port}`);
      socket.destroy();
      resolve(false);
    });

    socket.on('error', (err) => {
      console.error(`  ⚠️ [SMTP DIAGNOSTIC] Raw TCP socket ERROR on ${host}:${port}:`, err.message);
      socket.destroy();
      resolve(false);
    });

    socket.connect(port, host);
  });
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'https://tasksphere-app.onrender.com';
const envOrigins = CLIENT_ORIGIN.split(',').map(origin => origin.trim()).filter(Boolean);
const localhostOrigins = ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:5173', 'http://127.0.0.1:3000'];
const allowedOrigins = [...new Set([...envOrigins, ...localhostOrigins])];

app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(cors({
  origin: (origin, callback) => {
    console.log(`[CORS Debug] Incoming request origin: ${origin || 'none'}`);
    console.log(`[CORS Debug] Allowed origins:`, allowedOrigins);
    
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.includes(origin);
    
    if (isAllowed) {
      return callback(null, true);
    }
    
    console.warn(`[CORS Debug] Blocked origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json());

// Serve static assets whenever build output exists
const distPath = path.resolve(__dirname, '../dist');
const indexPath = path.resolve(distPath, 'index.html');
const distExists = fs.existsSync(indexPath);

if (distExists) {
  app.use(express.static(distPath));
}

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/notifications', notificationRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'TaskSphere API is running', timestamp: new Date().toISOString() });
});

// Wildcard handler for SPA client-side routing (Express v5 safe)
if (distExists) {
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile('index.html', { root: distPath }, (err) => {
      if (err) {
        console.error(`[Static Files ERROR] Failed to send index.html:`, err.message);
        next(err);
      }
    });
  });
}

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

    // Verify Gmail SMTP (Port 465 SSL) configuration on startup
    try {
      const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
      const port = parseInt(process.env.EMAIL_PORT || '465', 10);
      
      await diagnoseSMTPPort465(host, port);

      const transporter = createTransporter();
      await transporter.verify();
      console.log(`  📧 Gmail SMTP Server Verified: Successfully connected on Port ${port} (SSL)`);
    } catch (smtpErr) {
      console.error(`  ⚠️ Gmail SMTP Verification Warning:`, smtpErr.message || smtpErr);
    }

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
