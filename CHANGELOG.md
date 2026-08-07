# Changelog

All notable changes to the **TaskSphere** project will be documented in this file.

---

## [1.0.0] - 2026-08-06

### 🚀 Added
* **Security Whitelists**: Restrict CORS access to `CLIENT_ORIGIN` variables while supporting same-origin/localhost developers.
* **Express Helmet**: Protection headers enabled globally (conditionally disabling CSP in local environment).
* **Database Index Migrations**: Added performance indexes on `due_date`, `created_at`, `user_id`, and `completed` fields.
* **Cascading Delete Constraints**: Verified and added `ON DELETE CASCADE` mappings to PostgreSQL task entities.
* **Optimized API Structure**: Implemented `DELETE /api/tasks` bulk delete route replacing multi-call client-side loops.
* **React Hooks Architecture**: Refactored `App.jsx` into smaller hooks (`useToast`, `useAuth`, `useTasks`), optimizing memory footprint and rendering cycles.
* **Accessibility Labels**: Integrated `aria-label` screen reader properties across task buttons, modals, and inspectors.
* **Terminology Realignment**: Corrected DatabaseModal inspector naming to "MySQL/PostgreSQL Database Manager".
* **Browser Notifications API**: Reminders alerts on today's tasks,starts-in-1-hour warnings, overdue indicators, achievement alerts, and configurations test utilities.
* **Recurring Tasks Engine**: Projet occurrences generation for daily/weekly/monthly/custom ranges, local timezone conversions, and independent completions.
* **Automatic Status Calculating**: Virtual calculation badges (`🟢 Upcoming`, `🟡 Due Today`, `🔴 Overdue`, `✅ Completed`).
* **Due Date & Time**: Side-by-side pickers with timezone safety.
* **Task Categories Feature**: Pre-seeded default categories, custom categories with hex color pickers, and case-insensitive unique names.

### 🐛 Fixed
* **Double-Escaping XSS Bug**: Replaced backend HTML character entity replacements in `sanitizeString` with active tag-stripping, avoiding double-escaping rendering bugs in React.
* **Timezone Shifting Dates**: Changed UTC `.toISOString()` projections to local timezone formatting parameters, preventing dates shifting 1 day backward or forward.
