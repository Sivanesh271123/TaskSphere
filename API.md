# TaskSphere REST API Documentation

This document describes the API endpoints, authentication flows, parameter requirements, and request/response payloads for TaskSphere Version 1.0.

---

## 🔐 1. Authentication Endpoints

### Register User
* **Method & Route**: `POST /api/auth/register`
* **Headers**: `Content-Type: application/json`
* **Request Payload**:
  ```json
  {
    "name": "Alex Mercer",
    "email": "alex@example.com",
    "password": "SecurePassword123!"
  }
  ```
* **Success Response (201 Created)**:
  * *Sets httpOnly session cookie:* `Set-Cookie: token=[jwt_value]; Path=/; HttpOnly; SameSite=Lax`
  ```json
  {
    "message": "Registration successful.",
    "user": {
      "id": 12,
      "name": "Alex Mercer",
      "email": "alex@example.com"
    }
  }
  ```

### Login User
* **Method & Route**: `POST /api/auth/login`
* **Request Payload**:
  ```json
  {
    "email": "alex@example.com",
    "password": "SecurePassword123!",
    "rememberMe": true
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "message": "Login successful.",
    "user": {
      "id": 12,
      "name": "Alex Mercer",
      "email": "alex@example.com"
    }
  }
  ```

---

## 🎨 2. Category Endpoints

### Fetch Categories
* **Method & Route**: `GET /api/categories`
* **Success Response (200 OK)**:
  ```json
  [
    { "id": 1, "userId": null, "name": "Study", "color": "#3b82f6" },
    { "id": 7, "userId": 12, "name": "Sprint Planning", "color": "#ff5733" }
  ]
  ```

### Create Custom Category
* **Method & Route**: `POST /api/categories`
* **Request Payload**:
  ```json
  {
    "name": "Marketing Sprint",
    "color": "#e0a96d"
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "id": 8,
    "userId": 12,
    "name": "Marketing Sprint",
    "color": "#e0a96d",
    "createdAt": "2026-08-06T11:15:00.000Z"
  }
  ```

---

## 📝 3. Task Endpoints

### Fetch Tasks (with Range-bound Occurrences)
* **Method & Route**: `GET /api/tasks`
* **Query Parameters** (Optional):
  * `start` — Range start date (Format: `YYYY-MM-DD`, default `today - 30 days`)
  * `end` — Range end date (Format: `YYYY-MM-DD`, default `today + 90 days`)
* **Success Response (200 OK)**:
  ```json
  [
    {
      "id": "14_2026-08-10",
      "title": "Daily Standup",
      "description": "Sync with developers.",
      "category": "Work",
      "priority": "High",
      "dueDate": "2026-08-10",
      "dueTime": "10:00:00",
      "repeatType": "Daily",
      "repeatInterval": 1,
      "startDate": "2026-08-08",
      "endDate": "2026-08-15",
      "completed": false,
      "createdAt": "2026-08-08T09:00:00.000Z",
      "status": "Upcoming",
      "isOccurrence": true,
      "parentTaskId": 14
    }
  ]
  ```

### Create Task Definition
* **Method & Route**: `POST /api/tasks`
* **Request Payload**:
  ```json
  {
    "title": "Practice DSA Problems",
    "description": "Solve daily algorithmic challenges.",
    "category": "Study",
    "priority": "Medium",
    "dueDate": "2026-08-10",
    "dueTime": "18:00",
    "repeatType": "Daily",
    "repeatInterval": 1,
    "startDate": "2026-08-10",
    "endDate": "2026-08-20"
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "id": 15,
    "title": "Practice DSA Problems",
    "description": "Solve daily algorithmic challenges.",
    "category": "Study",
    "priority": "Medium",
    "dueDate": null,
    "dueTime": "18:00:00",
    "repeatType": "Daily",
    "repeatInterval": 1,
    "startDate": "2026-08-10",
    "endDate": "2026-08-20",
    "completed": false,
    "createdAt": "2026-08-06T11:15:30.000Z",
    "status": "No Due Date"
  }
  ```

### Toggle Completion Status
* **Method & Route**: `PATCH /api/tasks/:id/toggle`
* **Parameters**:
  * `:id` — Standard task ID (e.g. `15`) or dynamic occurrence ID (e.g. `15_2026-08-12`)
* **Success Response (200 OK)**:
  ```json
  {
    "id": "15_2026-08-12",
    "title": "Practice DSA Problems",
    "completed": true,
    "isOccurrence": true,
    "parentTaskId": 15
  }
  ```

### Purge All Tasks (Optimized Batch Wipe)
* **Method & Route**: `DELETE /api/tasks`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "All tasks deleted."
  }
  ```
