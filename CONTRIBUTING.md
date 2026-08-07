# Contributing to TaskSphere

We are excited that you are interested in contributing to TaskSphere! To maintain high code quality, security, and performance standards, please follow these development guidelines.

---

## 🛠 Local Setup

1. Fork and clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your local MySQL or PostgreSQL database.
4. Copy the environment template and fill in your local credentials:
   ```bash
   cp .env.example .env
   ```
5. Start development servers:
   ```bash
   npm run dev
   ```

---

## 📐 Development Guidelines

### 1. Code Standards
* **Hooks Architecture**: Keep UI views simple. Decouple networking operations, states, and toast logs into hooks located in `src/hooks/`.
* **Database Operations**: Write parameterized query placeholders (`?`) exclusively to prevent SQL Injection. Do not hardcode connection settings or port numbers.
* **Date & Time Safety**: Always parse dates timezone-neutrally using local components (`date.getFullYear()`, `date.getMonth()`, etc.) instead of UTC conversions (`.toISOString()`) to avoid offset shifting.

### 2. Styling Rules
* Use vanilla CSS and custom tokens inside `src/index.css` to build glass-morphic styles.
* Use rich colors, HSL gradients, and Framer Motion micro-animations for hover and loading actions.

### 3. Accessibility (a11y)
* Any new interactive controls must include:
  * Screen-reader labels (`aria-label` or `aria-describedby`).
  * Visible focus state highlights.
  * Keyboard navigation support (tab indexes, key triggers).

---

## 🧪 Testing Verification

Before submitting any Pull Request, you must verify the changes locally:
1. Build the production package to check bundler issues:
   ```bash
   npm run build
   ```
2. Start the API backend:
   ```bash
   node server/server.js
   ```
3. Run E2E automated test suites:
   * **Due date/time formats**: `node brain/[conversation_id]/scratch/due_test.js`
   * **Automatic status calculation**: `node brain/[conversation_id]/scratch/status_test.js`
   * **Recurring tasks engine**: `node brain/[conversation_id]/scratch/recurrence_test.js`
   * **Release integration**: `node brain/[conversation_id]/scratch/release_verification_test.js`
