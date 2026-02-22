# TalentOS API Reference

> **Base URL:** `https://talentos-backend.onrender.com/api`
> **Detailed interactive docs:** [talentos-api.praneethd.xyz](https://talentos-api.praneethd.xyz/)

All endpoints return JSON with a consistent envelope:

```json
// Success
{ "success": true, "data": { ... }, "message": "..." }

// Error
{ "success": false, "error": "Description", "statusCode": 400 }
```

---

## Table of Contents

| # | Section | Endpoints |
|---|---------|-----------|
| 1 | [Authentication](#1-authentication) | Register, Admin Login, Employee Login, Change Password |
| 2 | [Employees](#2-employees) | List, Create, Get, Update, Delete, Score, My Profile, My Score |
| 3 | [Tasks](#3-tasks) | List, Create, Get, Update, Delete, Update Status, Update TxHash, My Tasks |
| 4 | [Dashboard](#4-dashboard) | Stats, Leaderboard, Activity |
| 5 | [AI Intelligence](#5-ai-intelligence) | Chat, Skill Gap, Skill Gap (Me), Daily Insight, Smart Assign, Extract Skills |

---

## Authentication

All protected endpoints require a JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

**Two types of tokens:**
- **Admin token** — returned by `/auth/register` and `/auth/login`. Does NOT contain `employeeId`.
- **Employee token** — returned by `/auth/employee-login`. Contains `employeeId` and `roleType`.

**Role guards:**
| Middleware | Access |
|-----------|--------|
| `requireAdmin` | Admin only |
| `requireEmployee` | Employee only |
| `authMiddleware` | Any authenticated user |

---

## 1. Authentication

### 1.1 Register Organization

Creates a new organization and returns a JWT admin token.

```
POST /api/auth/register
```

**Auth:** None

**Request Body:**

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `name` | string | Yes | Min 2 characters |
| `email` | string | Yes | Valid email format |
| `password` | string | Yes | Min 8 characters |

**Example Request:**

```bash
curl -X POST https://talentos-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corp",
    "email": "admin@acmecorp.com",
    "password": "SecurePass123"
  }'
```

**Example Response (201):**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "organization": {
      "id": "cm5abc123def456",
      "name": "Acme Corp",
      "email": "admin@acmecorp.com"
    }
  },
  "message": "Organization registered successfully"
}
```

**Errors:**

| Status | Error | When |
|--------|-------|------|
| 400 | Validation failed | Missing/invalid fields |
| 409 | Organization with this email already exists | Duplicate email |

---

### 1.2 Admin Login

Authenticates an organization admin.

```
POST /api/auth/login
```

**Auth:** None

**Request Body:**

| Field | Type | Required |
|-------|------|----------|
| `email` | string | Yes |
| `password` | string | Yes |

**Example Request:**

```bash
curl -X POST https://talentos-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@acmecorp.com",
    "password": "SecurePass123"
  }'
```

**Example Response (200):**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "organization": {
      "id": "cm5abc123def456",
      "name": "Acme Corp",
      "email": "admin@acmecorp.com"
    }
  },
  "message": "Login successful"
}
```

**Errors:**

| Status | Error |
|--------|-------|
| 401 | Invalid email or password |

---

### 1.3 Employee Login

Authenticates an employee. Returns a token with `employeeId` embedded.

```
POST /api/auth/employee-login
```

**Auth:** None

> **Note:** Employee credentials are auto-generated when an admin creates them. The password is sent via welcome email.

**Request Body:**

| Field | Type | Required |
|-------|------|----------|
| `email` | string | Yes |
| `password` | string | Yes |

**Example Request:**

```bash
curl -X POST https://talentos-backend.onrender.com/api/auth/employee-login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "emp1@org.com",
    "password": "aB3xK9mP"
  }'
```

**Example Response (200):**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "employee": {
      "id": "cm5emp001",
      "name": "Jane Smith",
      "email": "emp1@org.com",
      "role": "Frontend Engineer",
      "department": "Engineering"
    }
  },
  "message": "Employee login successful"
}
```

**Errors:**

| Status | Error |
|--------|-------|
| 401 | Invalid email or password |

---

### 1.4 Change Password

Allows an employee to change their password.

```
POST /api/auth/change-password
```

**Auth:** Employee only (`requireEmployee`)

**Request Body:**

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `currentPassword` | string | Yes | — |
| `newPassword` | string | Yes | Min 8 characters |

**Example Request:**

```bash
curl -X POST https://talentos-backend.onrender.com/api/auth/change-password \
  -H "Authorization: Bearer EMPLOYEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "aB3xK9mP",
    "newPassword": "MyNewSecurePass1"
  }'
```

**Example Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "cm5emp001",
    "name": "Jane Smith",
    "email": "emp1@org.com"
  },
  "message": "Password changed successfully"
}
```

**Errors:**

| Status | Error |
|--------|-------|
| 401 | Current password is incorrect |
| 403 | Employee access required |

---

## 2. Employees

### 2.1 List All Employees

```
GET /api/employees
```

**Auth:** Admin only (`requireAdmin`)

**Example Request:**

```bash
curl https://talentos-backend.onrender.com/api/employees \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Example Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "cm5emp001",
      "orgId": "cm5abc123def456",
      "name": "Jane Smith",
      "email": "emp1@org.com",
      "role": "Frontend Engineer",
      "department": "Engineering",
      "skills": ["React", "TypeScript", "Tailwind CSS"],
      "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD38",
      "roleType": "EMPLOYEE",
      "isActive": true,
      "createdAt": "2026-02-20T10:30:00.000Z",
      "updatedAt": "2026-02-20T10:30:00.000Z"
    },
    {
      "id": "cm5emp002",
      "orgId": "cm5abc123def456",
      "name": "Bob Johnson",
      "email": "emp2@org.com",
      "role": "Backend Engineer",
      "department": "Engineering",
      "skills": ["Node.js", "PostgreSQL", "Docker"],
      "walletAddress": null,
      "roleType": "EMPLOYEE",
      "isActive": true,
      "createdAt": "2026-02-20T10:35:00.000Z",
      "updatedAt": "2026-02-20T10:35:00.000Z"
    }
  ]
}
```

---

### 2.2 Create Employee

Creates a new employee. A random password is generated and a welcome email is sent.

```
POST /api/employees
```

**Auth:** Admin only (`requireAdmin`)

**Request Body:**

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `name` | string | Yes | Min 2 chars |
| `email` | string | Yes | Valid email, unique per org |
| `role` | string | Yes | Min 2 chars |
| `department` | string | Yes | Min 2 chars |
| `skills` | string[] | No | Default: `[]` |
| `walletAddress` | string | No | Ethereum address |

**Example Request:**

```bash
curl -X POST https://talentos-backend.onrender.com/api/employees \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "emp1@org.com",
    "role": "Frontend Engineer",
    "department": "Engineering",
    "skills": ["React", "TypeScript", "Tailwind CSS"],
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD38"
  }'
```

**Example Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "cm5emp001",
    "orgId": "cm5abc123def456",
    "name": "Jane Smith",
    "email": "emp1@org.com",
    "role": "Frontend Engineer",
    "department": "Engineering",
    "skills": ["React", "TypeScript", "Tailwind CSS"],
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD38",
    "roleType": "EMPLOYEE",
    "isActive": true,
    "createdAt": "2026-02-20T10:30:00.000Z",
    "updatedAt": "2026-02-20T10:30:00.000Z"
  },
  "message": "Employee created successfully"
}
```

**Errors:**

| Status | Error |
|--------|-------|
| 400 | Validation failed |
| 409 | Email already exists in organization |

---

### 2.3 Get Employee by ID

Returns an employee with their assigned tasks.

```
GET /api/employees/:id
```

**Auth:** Admin only (`requireAdmin`)

**Example Request:**

```bash
curl https://talentos-backend.onrender.com/api/employees/cm5emp001 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Example Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "cm5emp001",
    "orgId": "cm5abc123def456",
    "name": "Jane Smith",
    "email": "emp1@org.com",
    "role": "Frontend Engineer",
    "department": "Engineering",
    "skills": ["React", "TypeScript", "Tailwind CSS"],
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD38",
    "roleType": "EMPLOYEE",
    "isActive": true,
    "createdAt": "2026-02-20T10:30:00.000Z",
    "updatedAt": "2026-02-20T10:30:00.000Z",
    "tasks": [
      {
        "id": "cm5task001",
        "title": "Build Dashboard UI",
        "description": "Create responsive dashboard with charts",
        "status": "IN_PROGRESS",
        "priority": "HIGH",
        "deadline": "2026-03-01T00:00:00.000Z",
        "completedAt": null
      }
    ]
  }
}
```

**Errors:**

| Status | Error |
|--------|-------|
| 404 | Employee not found |

---

### 2.4 Update Employee

Updates employee details. All fields are optional.

```
PUT /api/employees/:id
```

**Auth:** Admin only (`requireAdmin`)

**Request Body (all optional):**

| Field | Type | Rules |
|-------|------|-------|
| `name` | string | Min 2 chars |
| `email` | string | Valid email |
| `role` | string | Min 2 chars |
| `department` | string | Min 2 chars |
| `skills` | string[] | Replaces entire array |
| `walletAddress` | string | — |
| `isActive` | boolean | Deactivate with `false` |

**Example Request:**

```bash
curl -X PUT https://talentos-backend.onrender.com/api/employees/cm5emp001 \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "skills": ["React", "TypeScript", "Tailwind CSS", "Next.js"],
    "walletAddress": "0xNewWalletAddress123"
  }'
```

**Example Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "cm5emp001",
    "name": "Jane Smith",
    "email": "emp1@org.com",
    "role": "Frontend Engineer",
    "department": "Engineering",
    "skills": ["React", "TypeScript", "Tailwind CSS", "Next.js"],
    "walletAddress": "0xNewWalletAddress123",
    "roleType": "EMPLOYEE",
    "isActive": true
  },
  "message": "Employee updated successfully"
}
```

**Errors:**

| Status | Error |
|--------|-------|
| 404 | Employee not found |
| 409 | Email already exists in organization |

---

### 2.5 Delete Employee

Permanently deletes an employee and **all their tasks** (cascade).

```
DELETE /api/employees/:id
```

**Auth:** Admin only (`requireAdmin`)

**Example Request:**

```bash
curl -X DELETE https://talentos-backend.onrender.com/api/employees/cm5emp001 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Example Response (200):**

```json
{
  "success": true,
  "data": null,
  "message": "Employee deleted successfully"
}
```

> **Tip:** Consider deactivating instead: `PUT /api/employees/:id` with `{ "isActive": false }`.

---

### 2.6 Get Employee Productivity Score

Returns a detailed productivity breakdown for a specific employee.

```
GET /api/employees/:id/score
```

**Auth:** Admin only (`requireAdmin`)

**Scoring Formula:**
- **Completion Rate (40%):** `(completed / total) * 40`
- **Deadline Adherence (35%):** `(onTime / completed) * 35`
- **Priority Score (25%):** `(highPriorityCompleted / highPriorityTotal) * 25`

**Example Request:**

```bash
curl https://talentos-backend.onrender.com/api/employees/cm5emp001/score \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Example Response (200):**

```json
{
  "success": true,
  "data": {
    "employeeId": "cm5emp001",
    "finalScore": 78.5,
    "completionRate": 75.0,
    "deadlineScore": 85.0,
    "priorityScore": 80.0,
    "breakdown": {
      "totalTasks": 8,
      "completedTasks": 6,
      "onTimeTasks": 5,
      "overdueTasks": 1,
      "highPriorityCompleted": 3,
      "highPriorityTotal": 4
    }
  }
}
```

---

### 2.7 Get My Profile (Employee Self)

Returns the authenticated employee's profile with their tasks.

```
GET /api/employees/me
```

**Auth:** Employee only (`requireEmployee`)

**Example Request:**

```bash
curl https://talentos-backend.onrender.com/api/employees/me \
  -H "Authorization: Bearer EMPLOYEE_TOKEN"
```

**Example Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "cm5emp001",
    "name": "Jane Smith",
    "email": "emp1@org.com",
    "role": "Frontend Engineer",
    "department": "Engineering",
    "skills": ["React", "TypeScript", "Tailwind CSS"],
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD38",
    "roleType": "EMPLOYEE",
    "isActive": true,
    "createdAt": "2026-02-20T10:30:00.000Z",
    "tasks": [
      {
        "id": "cm5task001",
        "title": "Build Dashboard UI",
        "status": "IN_PROGRESS",
        "priority": "HIGH",
        "deadline": "2026-03-01T00:00:00.000Z",
        "completedAt": null,
        "txHash": null,
        "createdAt": "2026-02-21T09:00:00.000Z"
      }
    ]
  }
}
```

---

### 2.8 Get My Productivity Score (Employee Self)

```
GET /api/employees/me/score
```

**Auth:** Employee only (`requireEmployee`)

**Example Request:**

```bash
curl https://talentos-backend.onrender.com/api/employees/me/score \
  -H "Authorization: Bearer EMPLOYEE_TOKEN"
```

**Example Response (200):**

```json
{
  "success": true,
  "data": {
    "employeeId": "cm5emp001",
    "employeeName": "Jane Smith",
    "finalScore": 78.5,
    "completionRate": 75.0,
    "deadlineScore": 85.0,
    "priorityScore": 80.0,
    "breakdown": {
      "totalTasks": 8,
      "completedTasks": 6,
      "onTimeTasks": 5,
      "overdueTasks": 1,
      "highPriorityCompleted": 3,
      "highPriorityTotal": 4
    }
  }
}
```

---

## 3. Tasks

### 3.1 List All Tasks

Returns all tasks with optional filters.

```
GET /api/tasks
```

**Auth:** Admin only (`requireAdmin`)

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `employeeId` | string | Filter by employee |
| `status` | string | Filter by status: `TODO`, `IN_PROGRESS`, `COMPLETED` |

**Example Requests:**

```bash
# All tasks
curl https://talentos-backend.onrender.com/api/tasks \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Filter by employee
curl "https://talentos-backend.onrender.com/api/tasks?employeeId=cm5emp001" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Filter by status
curl "https://talentos-backend.onrender.com/api/tasks?status=IN_PROGRESS" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Combined filters
curl "https://talentos-backend.onrender.com/api/tasks?employeeId=cm5emp001&status=TODO" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Example Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "cm5task001",
      "orgId": "cm5abc123def456",
      "employeeId": "cm5emp001",
      "title": "Build Dashboard UI",
      "description": "Create responsive dashboard with charts",
      "status": "IN_PROGRESS",
      "priority": "HIGH",
      "deadline": "2026-03-01T00:00:00.000Z",
      "completedAt": null,
      "txHash": null,
      "skillRequired": "React",
      "createdAt": "2026-02-21T09:00:00.000Z",
      "updatedAt": "2026-02-21T09:00:00.000Z",
      "employee": {
        "id": "cm5emp001",
        "name": "Jane Smith",
        "email": "emp1@org.com",
        "role": "Frontend Engineer"
      }
    }
  ]
}
```

---

### 3.2 Create Task

Creates a task assigned to an employee. Initial status is `TODO`.

```
POST /api/tasks
```

**Auth:** Admin only (`requireAdmin`)

**Request Body:**

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `title` | string | Yes | Min 3 chars |
| `description` | string | No | — |
| `employeeId` | string | Yes | Must exist |
| `priority` | string | No | `LOW`, `MEDIUM` (default), `HIGH` |
| `deadline` | string | No | ISO 8601 datetime |
| `skillRequired` | string | No | — |

**Example Request:**

```bash
curl -X POST https://talentos-backend.onrender.com/api/tasks \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Build Dashboard UI",
    "description": "Create responsive dashboard with charts and analytics",
    "employeeId": "cm5emp001",
    "priority": "HIGH",
    "deadline": "2026-03-01T00:00:00.000Z",
    "skillRequired": "React"
  }'
```

**Example Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "cm5task001",
    "orgId": "cm5abc123def456",
    "employeeId": "cm5emp001",
    "title": "Build Dashboard UI",
    "description": "Create responsive dashboard with charts and analytics",
    "status": "TODO",
    "priority": "HIGH",
    "deadline": "2026-03-01T00:00:00.000Z",
    "completedAt": null,
    "txHash": null,
    "skillRequired": "React",
    "createdAt": "2026-02-21T09:00:00.000Z",
    "updatedAt": "2026-02-21T09:00:00.000Z"
  },
  "message": "Task created successfully"
}
```

**Errors:**

| Status | Error |
|--------|-------|
| 400 | Validation failed |
| 404 | Employee not found |

---

### 3.3 Get Task by ID

Returns a task with employee details.

```
GET /api/tasks/:id
```

**Auth:** Admin only (`requireAdmin`)

**Example Request:**

```bash
curl https://talentos-backend.onrender.com/api/tasks/cm5task001 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Example Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "cm5task001",
    "orgId": "cm5abc123def456",
    "employeeId": "cm5emp001",
    "title": "Build Dashboard UI",
    "description": "Create responsive dashboard with charts",
    "status": "IN_PROGRESS",
    "priority": "HIGH",
    "deadline": "2026-03-01T00:00:00.000Z",
    "completedAt": null,
    "txHash": null,
    "skillRequired": "React",
    "employee": {
      "id": "cm5emp001",
      "name": "Jane Smith",
      "email": "emp1@org.com",
      "role": "Frontend Engineer"
    }
  }
}
```

---

### 3.4 Update Task

Updates task details. All fields are optional.

```
PUT /api/tasks/:id
```

**Auth:** Admin only (`requireAdmin`)

**Example Request:**

```bash
curl -X PUT https://talentos-backend.onrender.com/api/tasks/cm5task001 \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Build Dashboard UI v2",
    "priority": "HIGH",
    "deadline": "2026-03-15T00:00:00.000Z"
  }'
```

**Example Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "cm5task001",
    "title": "Build Dashboard UI v2",
    "priority": "HIGH",
    "deadline": "2026-03-15T00:00:00.000Z",
    "status": "IN_PROGRESS"
  },
  "message": "Task updated successfully"
}
```

---

### 3.5 Delete Task

Permanently deletes a task.

```
DELETE /api/tasks/:id
```

**Auth:** Admin only (`requireAdmin`)

**Example Request:**

```bash
curl -X DELETE https://talentos-backend.onrender.com/api/tasks/cm5task001 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Example Response (200):**

```json
{
  "success": true,
  "data": null,
  "message": "Task deleted successfully"
}
```

---

### 3.6 Update Task Status

Updates a task's status. Both admins and employees can use this.

```
PATCH /api/tasks/:id/status
```

**Auth:** Any authenticated user (`authMiddleware`)

**Ownership Rule:** Employees can only update their own tasks. Admins can update any task.

**Request Body:**

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `status` | string | Yes | `TODO`, `IN_PROGRESS`, `COMPLETED` |

> When status changes to `COMPLETED`, `completedAt` is auto-set. When changed away from `COMPLETED`, `completedAt` is cleared.

**Example Request:**

```bash
curl -X PATCH https://talentos-backend.onrender.com/api/tasks/cm5task001/status \
  -H "Authorization: Bearer EMPLOYEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "status": "COMPLETED" }'
```

**Example Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "cm5task001",
    "title": "Build Dashboard UI",
    "status": "COMPLETED",
    "completedAt": "2026-02-25T16:30:00.000Z"
  },
  "message": "Task status updated successfully"
}
```

**Errors:**

| Status | Error |
|--------|-------|
| 403 | You can only update your own tasks |
| 404 | Task not found |

---

### 3.7 Update Task Transaction Hash (Web3)

Stores a blockchain transaction hash for task verification.

```
PATCH /api/tasks/:id/txhash
```

**Auth:** Any authenticated user (`authMiddleware`)

**Ownership Rule:** Employees can only update their own tasks.

**Request Body:**

| Field | Type | Required |
|-------|------|----------|
| `txHash` | string | Yes |

**Example Request:**

```bash
curl -X PATCH https://talentos-backend.onrender.com/api/tasks/cm5task001/txhash \
  -H "Authorization: Bearer EMPLOYEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "txHash": "0x8a4c1e2f3b5d6c7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d" }'
```

**Example Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "cm5task001",
    "title": "Build Dashboard UI",
    "status": "COMPLETED",
    "txHash": "0x8a4c1e2f3b5d6c7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d"
  },
  "message": "Task verification hash updated successfully"
}
```

**Errors:**

| Status | Error |
|--------|-------|
| 403 | You can only update your own tasks |
| 404 | Task not found |

---

### 3.8 Get My Tasks (Employee Self)

Returns all tasks assigned to the authenticated employee.

```
GET /api/tasks/my-tasks
```

**Auth:** Employee only (`requireEmployee`)

**Example Request:**

```bash
curl https://talentos-backend.onrender.com/api/tasks/my-tasks \
  -H "Authorization: Bearer EMPLOYEE_TOKEN"
```

**Example Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "cm5task001",
      "title": "Build Dashboard UI",
      "description": "Create responsive dashboard with charts",
      "status": "IN_PROGRESS",
      "priority": "HIGH",
      "deadline": "2026-03-01T00:00:00.000Z",
      "completedAt": null,
      "txHash": null,
      "skillRequired": "React",
      "createdAt": "2026-02-21T09:00:00.000Z",
      "updatedAt": "2026-02-22T14:00:00.000Z"
    },
    {
      "id": "cm5task002",
      "title": "Write Unit Tests",
      "status": "TODO",
      "priority": "MEDIUM",
      "deadline": "2026-03-10T00:00:00.000Z",
      "completedAt": null,
      "txHash": null,
      "skillRequired": "Jest"
    }
  ]
}
```

---

## 4. Dashboard

### 4.1 Get Dashboard Statistics

Returns stats that differ based on the caller's role.

```
GET /api/dashboard/stats
```

**Auth:** Any authenticated user (`authMiddleware`)

**Example Request:**

```bash
curl https://talentos-backend.onrender.com/api/dashboard/stats \
  -H "Authorization: Bearer TOKEN"
```

**Admin Response (200):**

```json
{
  "success": true,
  "data": {
    "totalEmployees": 12,
    "activeEmployees": 10,
    "assignedTasks": 45,
    "completedTasks": 32
  }
}
```

**Employee Response (200):**

```json
{
  "success": true,
  "data": {
    "assignedTasks": 8,
    "inProgressTasks": 3,
    "completedTasks": 4,
    "totalTasks": 8,
    "productivityScore": 78.5,
    "recentActivity": [
      {
        "id": "cm5task001",
        "title": "Build Dashboard UI",
        "status": "COMPLETED",
        "priority": "HIGH",
        "updatedAt": "2026-02-25T16:30:00.000Z"
      }
    ]
  }
}
```

---

### 4.2 Get Leaderboard

Returns top 5 employees by productivity score.

```
GET /api/dashboard/leaderboard
```

**Auth:** Admin only (`requireAdmin`)

**Example Request:**

```bash
curl https://talentos-backend.onrender.com/api/dashboard/leaderboard \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Example Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "cm5emp001",
      "name": "Jane Smith",
      "email": "emp1@org.com",
      "role": "Frontend Engineer",
      "department": "Engineering",
      "productivityScore": 92.5,
      "completedTasks": 18,
      "totalTasks": 20
    },
    {
      "id": "cm5emp002",
      "name": "Bob Johnson",
      "email": "emp2@org.com",
      "role": "Backend Engineer",
      "department": "Engineering",
      "productivityScore": 85.0,
      "completedTasks": 12,
      "totalTasks": 15
    }
  ]
}
```

---

### 4.3 Get Recent Activity

Returns recent task activity.

```
GET /api/dashboard/activity
```

**Auth:** Any authenticated user (`authMiddleware`)

- **Admin** sees last 10 tasks across all employees
- **Employee** sees last 10 of their own tasks

**Example Request:**

```bash
curl https://talentos-backend.onrender.com/api/dashboard/activity \
  -H "Authorization: Bearer TOKEN"
```

**Example Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "cm5task001",
      "title": "Build Dashboard UI",
      "status": "COMPLETED",
      "priority": "HIGH",
      "updatedAt": "2026-02-25T16:30:00.000Z",
      "employeeName": "Jane Smith",
      "employeeId": "cm5emp001"
    },
    {
      "id": "cm5task002",
      "title": "Write API Tests",
      "status": "IN_PROGRESS",
      "priority": "MEDIUM",
      "updatedAt": "2026-02-25T14:15:00.000Z",
      "employeeName": "Bob Johnson",
      "employeeId": "cm5emp002"
    }
  ]
}
```

---

## 5. AI Intelligence

> **Rate Limit:** 30 requests per 15 minutes for all AI endpoints.

### 5.1 AI Chat

Ask natural-language questions about your team and organization.

```
POST /api/ai/chat
```

**Auth:** Admin only (`requireAdmin`)

**Request Body:**

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `question` | string | Yes | Min 5 chars |

**Example Request:**

```bash
curl -X POST https://talentos-backend.onrender.com/api/ai/chat \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "question": "Who are our top performers this month?" }'
```

**Example Response (200):**

```json
{
  "success": true,
  "data": {
    "answer": "Based on your organization's data, your top performers this month are:\n\n1. **Jane Smith** (Frontend Engineer) - 92.5% productivity score, completed 6/8 tasks.\n2. **Bob Johnson** (Backend Engineer) - 85% productivity, completed 5/6 tasks.\n\nRecommendation: Consider recognizing their contributions in the next team meeting."
  }
}
```

---

### 5.2 Organization Skill Gap Analysis

Analyzes skill gaps across all employees.

```
GET /api/ai/skill-gap
```

**Auth:** Admin only (`requireAdmin`)

**Query Parameters:**

| Param | Description |
|-------|-------------|
| `refresh=true` | Bypass the 24-hour cache |

**Example Request:**

```bash
curl https://talentos-backend.onrender.com/api/ai/skill-gap \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Force refresh
curl "https://talentos-backend.onrender.com/api/ai/skill-gap?refresh=true" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Example Response (200):**

```json
{
  "success": true,
  "data": {
    "gaps": [
      {
        "employeeName": "Jane Smith",
        "role": "Frontend Engineer",
        "missingSkills": ["Testing", "CI/CD", "GraphQL"]
      },
      {
        "employeeName": "Bob Johnson",
        "role": "Backend Engineer",
        "missingSkills": ["Kubernetes", "AWS", "Terraform"]
      }
    ],
    "orgRecommendation": "Your team lacks DevOps and cloud infrastructure skills. Consider a 2-week training sprint on Docker, Kubernetes, and CI/CD pipelines."
  }
}
```

---

### 5.3 My Skill Gap Analysis (Employee Self)

Personal skill gap analysis with a 30-day learning plan.

```
GET /api/ai/skill-gap/me
```

**Auth:** Employee only (`requireEmployee`)

**Example Request:**

```bash
curl https://talentos-backend.onrender.com/api/ai/skill-gap/me \
  -H "Authorization: Bearer EMPLOYEE_TOKEN"
```

**Example Response (200):**

```json
{
  "success": true,
  "data": {
    "missingSkills": ["Docker", "CI/CD", "Terraform"],
    "coveragePercent": 65,
    "learningPlan": [
      "Week 1-2: Docker fundamentals — containers, images, docker-compose",
      "Week 3-4: CI/CD pipelines — GitHub Actions, automated testing",
      "Week 5-6: Terraform basics — infrastructure as code, state management",
      "Week 7-8: Integration project — combine Docker + CI/CD + Terraform"
    ]
  }
}
```

---

### 5.4 Daily AI Insight

AI-generated daily insight based on organization performance.

```
GET /api/ai/daily-insight
```

**Auth:** Admin only (`requireAdmin`)

**Example Request:**

```bash
curl https://talentos-backend.onrender.com/api/ai/daily-insight \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Example Response (200):**

```json
{
  "success": true,
  "data": {
    "insight": "Your team completed 72% of assigned tasks this week — up 8% from last week. The Engineering department leads with 85% completion. However, 3 high-priority tasks are overdue in Design. Recommendation: Schedule a sync with the Design team to unblock deliverables."
  }
}
```

---

### 5.5 Smart Task Assignment

AI recommendation for the best employee to assign a task to.

```
POST /api/ai/smart-assign
```

**Auth:** Admin only (`requireAdmin`)

**Request Body:**

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `taskTitle` | string | Yes | Min 3 chars |
| `skillRequired` | string | Yes | Min 2 chars |

**Example Request:**

```bash
curl -X POST https://talentos-backend.onrender.com/api/ai/smart-assign \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "taskTitle": "Build real-time notification system",
    "skillRequired": "Node.js"
  }'
```

**Example Response (200):**

```json
{
  "success": true,
  "data": {
    "recommendedEmployee": "Bob Johnson",
    "reason": "Bob Johnson has 'Node.js' in his skill set and currently has only 2 open tasks (lowest on the team). His completion rate of 95% indicates high reliability."
  }
}
```

---

### 5.6 Extract Skills from Resume

Upload a PDF resume and extract skills, name, role, and summary using AI.

```
POST /api/ai/extract-skills
```

**Auth:** Any authenticated user (`authMiddleware`)

**Content-Type:** `multipart/form-data`

**Request Body:**

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `resume` | file | Yes | PDF only, max 5 MB |

**Example Request:**

```bash
curl -X POST https://talentos-backend.onrender.com/api/ai/extract-skills \
  -H "Authorization: Bearer TOKEN" \
  -F "resume=@/path/to/resume.pdf"
```

**Example Response (200):**

```json
{
  "success": true,
  "data": {
    "skills": [
      "TypeScript",
      "React.js",
      "Node.js",
      "PostgreSQL",
      "Docker",
      "AWS",
      "REST APIs",
      "GraphQL",
      "Git",
      "Agile"
    ],
    "name": "Jane Smith",
    "role": "Senior Full Stack Developer",
    "summary": "Experienced full-stack developer with 5+ years building scalable web applications using TypeScript, React, and Node.js."
  }
}
```

**Errors:**

| Status | Error |
|--------|-------|
| 400 | Please upload a PDF file |
| 400 | Could not extract text from PDF |

---

## Error Reference

| Status | Meaning | Common Causes |
|--------|---------|---------------|
| 400 | Bad Request | Validation failure, missing fields, invalid format |
| 401 | Unauthorized | Missing token, invalid token, expired token, wrong password |
| 403 | Forbidden | Admin tried employee endpoint, employee tried admin endpoint, ownership violation |
| 404 | Not Found | Resource doesn't exist or belongs to different org |
| 409 | Conflict | Duplicate email in organization |
| 429 | Too Many Requests | Rate limit exceeded (500/15min general, 30/15min AI) |
| 500 | Internal Server Error | Unexpected server error |
