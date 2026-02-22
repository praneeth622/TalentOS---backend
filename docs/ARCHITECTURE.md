# TalentOS Backend — Architecture

Minimal overview of how the API is structured.

---

## Request flow

```
  HTTP Request
       │
       ▼
  ┌─────────────┐   helmet, cors, morgan, express.json, rateLimit
  │  Express    │
  └──────┬──────┘
       │
       ▼
  ┌─────────────┐   /api/auth/*  /api/employees/*  /api/tasks/*  /api/dashboard/*  /api/ai/*
  │   Routes    │   (mount points)
  └──────┬──────┘
       │
       ▼
  ┌─────────────┐   authMiddleware → requireAdmin | requireEmployee → validate(schema)
  │ Middleware  │
  └──────┬──────┘
       │
       ▼
  ┌─────────────┐   parse req.body/params, call one service, return res.json
  │ Controller  │
  └──────┬──────┘
       │
       ▼
  ┌─────────────┐   business logic, Prisma queries, Gemini/Resend calls
  │   Service   │
  └──────┬──────┘
       │
       ├──────────────────┬──────────────────┐
       ▼                  ▼                  ▼
  ┌──────────┐      ┌──────────┐      ┌──────────┐
  │ Prisma   │      │ Gemini   │      │ Resend   │
  │ (Postgres)│      │ (AI)     │      │ (Email)  │
  └──────────┘      └──────────┘      └──────────┘
       │
       ▼
  res.json({ success, data })   or   errorMiddleware → res.status(code).json({ success: false, error })
```

---

## Layers

| Layer        | Role |
|-------------|------|
| **Routes**  | Path + middleware chain only. No logic. |
| **Controller** | Read `req`, call one service, send `res`. No DB, no business rules. |
| **Service** | All logic: validation, Prisma, Gemini, Resend, scoring. Returns typed data. |

---

## Middleware order (per route)

1. **authMiddleware** — JWT decode → `req.org` (orgId, email, employeeId?, roleType?)
2. **requireAdmin** or **requireEmployee** — 403 if wrong role
3. **validate(schema)** — Zod parse body → 400 on failure
4. **controller**

Global: **errorMiddleware** catches thrown `AppError` and sends `{ success: false, error, statusCode }`.

---

## Directory map

```
src/
  index.ts           → app mount, CORS, rate limit, route mounting
  config/env.ts      → Zod env validation (fail fast on missing vars)
  routes/*.ts        → router.get/post/put/patch/delete( path, ...middlewares, controller )
  controllers/*.ts   → async (req, res, next) => { service(); res.json(); }
  services/*.ts      → prisma.*, gemini, resend, scoring
  middleware/*.ts    → auth, requireAdmin, requireEmployee, validate, upload, error
  lib/prisma.ts      → singleton PrismaClient
  lib/gemini.ts      → singleton GenerativeAI model
  types/index.ts     → shared interfaces
  utils/AppError.ts  → throw new AppError(message, statusCode)
prisma/
  schema.prisma      → Organization, Employee, Task, AiCache
```

---

## Data scope

- Every query is scoped by **orgId** from `req.org` (from JWT). No cross-org access.
- Employee-only routes use **req.org.employeeId** to filter (e.g. own tasks, own profile).

---

## Response shape

- Success: `{ success: true, data: T, message?: string }`
- List: `{ success: true, data: T[], total: number, page?: number }`
- Error: `{ success: false, error: string, statusCode: number }`
