# TaskSphere — Product Features Catalog

This document details the core features, operational specifications, and functional components built into TaskSphere Version 1.0.

---

## 🔐 1. Authentication & Security Scoping
* **JWT Cookie Sessions**: Secure session tokens stored in client-side cookies using `HttpOnly`, `SameSite=Lax`, and `Secure` attributes.
* **Data Isolation**: All queries (fetch, save, toggle, delete) are dynamically scoped to the authenticated user ID (`req.user.id`) ensuring strict data isolation.
* **Input Sanitization**: Built-in HTML tag-stripping sanitizers block script injection without distorting text formatting characters like `&` or `'` in the UI.

---

## 🎨 2. Category Workspaces
* **Default Setup**: Pre-seeded with 6 globally available categories:
  * 📘 **Study** (`#3b82f6`)
  * 🔮 **Work** (`#8b5cf6`)
  * 🟢 **Personal** (`#10b981`)
  * 🍊 **Shopping** (`#f97316`)
  * 🔴 **Health** (`#ef4444`)
  * 🔘 **Other** (`#6b7280`)
* **Custom Category Creator**: Create custom category headers with names and color pickers.
* **Case-Insensitive Uniqueness**: Database constraints restrict users from duplicating names case-insensitively (e.g. creating `"Work"` if `"work"` already exists).

---

## ⏱ 3. Scheduling & Due Dates
* **Due Date & Time**: Side-by-side pickers enable users to assign optional due dates and times.
* **Timezone Safety**: Dates are formatted timezone-neutrally on both client and server to prevent offset issues (where dates shift 1 day backwards/forwards in non-UTC regions).

---

## 🟢 4. Automatic Status Badges
* Task status is calculated dynamically from dates, times, and completion states:
  * **Completed** (Badge: `✅ Completed`): Task completion boolean is set to `true`.
  * **Overdue** (Badge: `🔴 Overdue`): Task is incomplete, and due date (and due time, if set) is in the past.
  * **Due Today** (Badge: `🟡 Due Today`): Task is incomplete, due date is today, and due time (if set) is in the future.
  * **Upcoming** (Badge: `🟢 Upcoming`): Task is incomplete, and due date is in the future.
  * **No Due Date**: Default fallback. Displays no badge.

---

## 🔁 5. Recurring Tasks Engine
* **Performance-First Design**: Stores only one recurring task definition in the database, expanding occurrences dynamically on the fly within requested range parameters (such as months, weeks, or days).
* **Occurrence Generation Rules**: Supports Daily, Weekly, Monthly, and Custom (every N days) intervals.
* **Independent Completions**: Compiles completed dates inside a separate `task_completions` reference table, allowing users to check off specific days while other occurrences remain active.

---

## 🔔 6. Browser Notifications Service
Fires desktop reminders to ensure users stay on track:
* **Overdue**: Fired immediately when a task falls overdue (`🏃 [Title] is overdue.`).
* **Due Today**: Fired on start when a task falls due today (`📚 [Title] is due today.`).
* **starts in 1 hour**: Fired if a task due time falls within the next 60 minutes (`💼 [Title] starts in 1 hour.`).
* **Success Completions**: Achievements popups (`🎉 Great job! You completed today's [Title] task.`).
* **Duplicate Prevention**: Registers unique notification occurrence keys inside `localStorage` to avoid repeating alerts across updates.

---

## 📋 7. UI Workspace Views
* **Home Dashboard**: Displays overall goal progress rings, task metrics cards, quick-task additions, and daily motivational quotes.
* **Kanban Board**: Groups tasks by priority columns (Urgent, High, Medium, Low) for rapid dragging/re-ordering.
* **Calendar Grid**: Full monthly planner grid rendering dynamic task chips chronologically by their due times.
