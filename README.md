# TaskSphere

TaskSphere is a premium, high-performance, glass-morphic productivity application designed for managing goals, tracking tasks, organizing category workspaces, and tracking schedules with dynamic calendar views. Built with an executive black-and-gold design aesthetic, TaskSphere runs transparently on both MySQL and PostgreSQL databases.

---

## 🚀 Key Features

* **Authentication & Scoped Session Separation**: Secure registration, login, and session preservation using HTTP-only cookies and JWT.
* **Workspaces & Categories**: Manage categories with custom color pickers and unique, case-insensitive naming constraints.
* **Scheduling**: Side-by-side date and time pickers with timezone-neutral local formatting.
* **Automatic Task Status**: Dynamic calculation of task states: `🟢 Upcoming`, `🟡 Due Today`, `🔴 Overdue`, and `✅ Completed`.
* **Dashboard Summary Metrics**: Responsive metrics summary cards showing Total, Completed, Pending, Due Today, Upcoming, and Overdue tasks.
* **Recurring Tasks Engine**: Dynamic range occurrence generator supporting Daily, Weekly, Monthly, and Custom intervals with independent completion tracking.
* **Browser Notifications**: Integrated desktop alerts for task reminders, starts-in-1-hour warnings, overdue indicators, and achievement completion tags.
* **Responsive Layouts**: Fully responsive grid cards, interactive Kanban columns, and month-grid calendar chips.
* **Optimized API Structure**: Single-request database purges and batch transaction indexes on query filters.

---

## 🛠 Tech Stack

* **Frontend**: React (Vite), Framer Motion (premium animations), Lucide Icons, Vanilla CSS.
* **Backend**: Node.js, Express, JSON Web Tokens (JWT), Express Helmet.
* **Database**: MySQL (Developmentfallbacks) / PostgreSQL (Production deployment), `pg` and `mysql2` driver integration pools.

---

## 📐 Architecture & Separation of Concerns

TaskSphere conforms to modular separation rules on both client and server:

### Server-Side (Route-Controller-Model)
```
server/
├── config/       # Database pools, dual-driver bindings, SSL configurations
├── controllers/  # Http payload validations, sanitizers, and routing
├── middleware/   # JWT verification and cookie parsing middleware
├── models/       # Parameterized SQL database operations
└── utils/        # Virtual status and recurrence occurrence generators
```

### Client-Side (Modular Custom Hooks)
The client decouples visual components from network business logic using hooks:
* `useToast.js`: Encapsulates toast notifications arrays and auto-dismiss states.
* `useAuth.js`: Handles session verification, logins, registration, and logouts.
* `useTasks.js`: Houses tasks CRUD, categories creation, DB seeding, and optimized resets.

---

## ⚙ Installation & Setup

### Prerequisites
* Node.js (v18+)
* MySQL or PostgreSQL database instance active on local port.

### 1. Clone the repository and install dependencies
```bash
git clone https://github.com/your-username/tasksphere.git
cd tasksphere
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=tasksphere
JWT_SECRET=your_ultra_secure_secret_jwt_key
PORT=5000
CLIENT_ORIGIN=http://localhost:3000
```

### 3. Database Initial Setup
Start your local database engine. The server automatically initializes tables, seeds default categories, and configures indexes upon launching:
```bash
# Run backend server
npm run dev
```

---

## ⚙ Running Locally

Run both frontend and backend concurrently in development mode:
```bash
# Start concurrently
npm run dev
```
The React dev server runs on `http://localhost:3000` and the Express API server runs on `http://localhost:5000`.

---

## 📈 Future Roadmap

- [ ] **Data Visualization**: Interactive productivity analytics charts.
- [ ] **Collaborative Workspaces**: Shared workspaces for team collaborations.
- [ ] **Subtasks & Checklists**: Nest checklists inside individual task definitions.
- [ ] **Category Color Customization**: Themed custom category selectors.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more details.
