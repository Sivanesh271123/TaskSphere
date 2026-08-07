# TaskSphere Deployment Guide

This guide details steps for deploying TaskSphere to production using:
* **Vercel** (Frontend static SPA hosting)
* **Render** (Backend API hosting)
* **PostgreSQL** (Managed production database)

---

## 🐘 1. PostgreSQL Database Configuration
Create a managed PostgreSQL database using provider (e.g. Render, Supabase, Neon).

### Obtain Connection URL
Retrieve the external connection URL formatted as:
`postgres://user:password@host:port/database?sslmode=require`

TaskSphere automatically parses this connection parameters on startup:
* In `db.js`, if the port is not `3306` (MySQL default), it spawns a PostgreSQL `pg.Pool` automatically.
* Since production connections require SSL, the server sets `ssl: { rejectUnauthorized: false }` for non-localhost hosts.

---

## 📦 2. Backend Deployment on Render

1. Create a new **Web Service** on Render.
2. Link your Git repository.
3. Configure the following build configurations:
   * **Root Directory**: `server` (or leave empty if monorepo configuration is managed)
   * **Build Command**: `npm install`
   * **Start Command**: `node server.js`
4. Add the following **Environment Variables**:

| Variable | Description | Example Value |
| :--- | :--- | :--- |
| `DB_HOST` | Database host server | `dpg-xxxxxx.render.com` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USER` | Database user name | `tasksphere_owner` |
| `DB_PASSWORD` | Database password | `xxxxxxxxxxxxxx` |
| `DB_NAME` | Database catalog name | `tasksphere_db` |
| `JWT_SECRET` | Secret key for JWT signatures | `ultra_secure_secret_key` |
| `CLIENT_ORIGIN` | Allowed domains for CORS | `https://tasksphere.vercel.app` |
| `NODE_ENV` | Production environment flag | `production` |

---

## 🎨 3. Frontend Deployment on Vercel

### 1. Configuration File ([vercel.json](file:///c:/Users/Lenovo/.gemini/antigravity-ide/scratch/todo-app/vercel.json))
Ensure your workspace includes a `vercel.json` file to route page navigation calls back to `index.html` (supporting React Router single page navigation routing):
```json
{
  "rewrites": [
    {
      "source": "/((?!api/).*)",
      "destination": "/index.html"
    }
  ]
}
```

### 2. Deploy Steps
1. Create a new project in Vercel.
2. Connect your Git repository.
3. Choose the root folder of your project (or set Build & Development settings):
   * **Framework Preset**: `Vite`
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
4. Add the following **Environment Variables**:
   * `VITE_API_BASE`: Set to your Render backend API service URL (e.g. `https://tasksphere-api.onrender.com/api`).
5. Click **Deploy**. Vercel will build the frontend assets, generate the production bundle, and publish the static page!
