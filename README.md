# TalentOS Backend

AI-powered workforce intelligence API with dual-role authentication, productivity analytics, and Web3 task verification.

**Production URL:** https://talentos-backend.onrender.com  
**Docker Hub:** [praneeth0331](https://app.docker.com/accounts/praneeth0331) — image: `praneeth0331/talentos-backend:latest`

## Tech Stack

- **Runtime:** Node.js 24 + Express 5
- **Language:** TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **AI:** Google Gemini 1.5 Flash
- **Email:** Resend
- **Auth:** JWT (dual-role: admin + employee)
- **Validation:** Zod
- **Web3:** Metamask

## Setup

### Local (Node)

```bash
# Use Node.js 24
nvm use 24

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Start development server
npm run dev
```

### Docker (pull pre-built image)

```bash
# Pull from Docker Hub
docker pull praneeth0331/talentos-backend:latest

# Run backend + Postgres
cp .env.example .env   # set JWT_SECRET, GEMINI_API_KEY, FRONTEND_URL, DATABASE_URL for postgres service
docker compose up -d
# API at http://localhost:5001
```

`docker-compose.yml` uses the image `praneeth0331/talentos-backend:latest` and starts a local Postgres. Set `JWT_SECRET`, `GEMINI_API_KEY`, and `FRONTEND_URL` in `.env` (or export them).

### Docker (build locally and run)

```bash
npm run docker:build
docker compose -f docker-compose.build.yml up -d
```

### Docker (build and push to Docker Hub)

```bash
# Requires Docker login: docker login
npm run docker:push
# Or manually:
# docker build --platform linux/amd64 -t praneeth0331/talentos-backend:latest .
# docker push praneeth0331/talentos-backend:latest
```

## Environment Variables

Create a `.env` file in the backend root:

```env
# Required
DATABASE_URL="postgresql://user:pass@localhost:5432/talentos"
JWT_SECRET="your-secret-key"
GEMINI_API_KEY="your-gemini-api-key"

# Optional
PORT=5000
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"
RESEND_API_KEY="re_xxxxxxxx"
RESEND_FROM_EMAIL="TalentOS <noreply@yourdomain.com>"
```

## Architecture

**3 layers:** Route → Controller → Service → (Prisma | Gemini | Resend)

```
  Request → Routes → [auth | requireAdmin/Employee | validate] → Controller → Service → DB/AI/Email
                                                                                    → errorMiddleware → Response
```

Full diagram and layer rules: **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)**

## Project Structure

```
backend/
├── src/
│   ├── config/          # Environment validation (Zod)
│   ├── controllers/     # HTTP request handlers
│   ├── services/        # Business logic + DB queries
│   ├── routes/          # Route definitions + middleware chains
│   ├── middleware/       # Auth, validation, role guards, error handling
│   ├── lib/             # Singletons (Prisma, Gemini)
│   ├── types/           # TypeScript interfaces
│   ├── utils/           # Helper functions
│   └── index.ts         # Express app entry point
├── prisma/
│   └── schema.prisma    # Database schema (Organization, Employee, Task, AiCache)
├── docs/
│   └── API_REFERENCE.md # Detailed API documentation with examples
├── openapi.yaml         # OpenAPI 3.0 specification (26 endpoints)
└── package.json
```

## API Endpoints (26 total)

### Auth (4 endpoints)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | None | Register organization |
| POST | `/api/auth/login` | None | Admin login |
| POST | `/api/auth/employee-login` | None | Employee login |
| POST | `/api/auth/change-password` | Employee | Change password |

### Employees (8 endpoints)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/employees` | Admin | List all employees |
| POST | `/api/employees` | Admin | Create employee (auto-generates password + sends email) |
| GET | `/api/employees/me` | Employee | Get own profile with tasks |
| GET | `/api/employees/me/score` | Employee | Get own productivity score |
| GET | `/api/employees/:id` | Admin | Get employee by ID with tasks |
| PUT | `/api/employees/:id` | Admin | Update employee |
| DELETE | `/api/employees/:id` | Admin | Delete employee (cascades tasks) |
| GET | `/api/employees/:id/score` | Admin | Get employee productivity score |

### Tasks (8 endpoints)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/tasks` | Admin | List all tasks (filterable) |
| POST | `/api/tasks` | Admin | Create task |
| GET | `/api/tasks/my-tasks` | Employee | Get own tasks |
| GET | `/api/tasks/:id` | Admin | Get task by ID |
| PUT | `/api/tasks/:id` | Admin | Update task |
| DELETE | `/api/tasks/:id` | Admin | Delete task |
| PATCH | `/api/tasks/:id/status` | Any | Update task status (ownership enforced) |
| PATCH | `/api/tasks/:id/txhash` | Any | Store Web3 tx hash (ownership enforced) |

### Dashboard (3 endpoints)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/dashboard/stats` | Any | Stats (response differs by role) |
| GET | `/api/dashboard/leaderboard` | Admin | Top 5 by productivity score |
| GET | `/api/dashboard/activity` | Any | Recent activity (scoped by role) |

### AI Intelligence (6 endpoints)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/ai/chat` | Admin | AI HR assistant (Gemini) |
| GET | `/api/ai/skill-gap` | Admin | Org-wide skill gap analysis |
| GET | `/api/ai/skill-gap/me` | Employee | Personal skill gap + learning plan |
| GET | `/api/ai/daily-insight` | Admin | Daily AI insight |
| POST | `/api/ai/smart-assign` | Admin | AI task assignment recommendation |
| POST | `/api/ai/extract-skills` | Any | Extract skills from resume PDF |

## API Documentation

- **Interactive API Docs (live):** [talentos-api.praneethd.xyz](https://talentos-api.praneethd.xyz/)
- **OpenAPI Spec:** [`openapi.yaml`](./openapi.yaml) — import into Swagger UI, Postman, Insomnia, or Apidog
- **Detailed Docs:** [`docs/API_REFERENCE.md`](./docs/API_REFERENCE.md) — full curl examples and response samples

## Rate Limiting

- **General endpoints:** 500 requests / 15 minutes
- **AI endpoints:** 30 requests / 15 minutes

## Productivity Scoring

```
Final Score = Completion (40%) + Deadline (35%) + Priority (25%)

Completion = (completedTasks / totalTasks) * 40
Deadline   = (onTimeTasks / completedTasks) * 35
Priority   = (highPriorityCompleted / highPriorityTotal) * 25
```

## Scripts

```bash
npm run dev              # Start dev server with hot reload
npm run build            # Compile TypeScript
npm start                # Run compiled JS (production)
npm run prisma:studio    # Open Prisma Studio GUI
npm run prisma:migrate   # Run database migrations
npm run seed:dummy       # Seed dummy data
npm run docker:build     # Build Docker image
npm run docker:run       # Run with Docker Compose
npm run docker:push      # Build and push to registry
```

## Deployment

- **Render:** Set env vars in dashboard. Build: `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`. Start: `npm start`.
- **Docker (self-host):** Use `docker pull praneeth0331/talentos-backend:latest` and `docker compose up -d` with a `.env` that has `DATABASE_URL`, `JWT_SECRET`, `GEMINI_API_KEY`, `FRONTEND_URL`. See [Docker Hub — praneeth0331](https://app.docker.com/accounts/praneeth0331).
