# TalentOS Backend

Backend API for TalentOS workforce intelligence platform.

## Setup

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

## Environment Variables

Copy `.env.example` and create `.env` with:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `GEMINI_API_KEY` - Google Gemini API key
- `PORT` - Server port (default: 5000)
- `FRONTEND_URL` - Frontend URL for CORS
- `NODE_ENV` - Environment (development/production)

## Architecture

**Strict 3-Layer Pattern:**
1. **Routes** - Define endpoints, attach middleware
2. **Controllers** - Parse request, call service, return response
3. **Services** - ALL business logic and database queries

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new organization
- `POST /api/auth/login` - Login organization

## Project Structure

```
backend/
├── src/
│   ├── config/          # Environment validation
│   ├── controllers/     # HTTP request handlers
│   ├── services/        # Business logic + DB queries
│   ├── routes/          # Route definitions
│   ├── middleware/      # Auth, validation, error handling
│   ├── lib/             # Singletons (Prisma, Gemini)
│   ├── types/           # TypeScript interfaces
│   ├── utils/           # Helper functions
│   └── index.ts         # Express app entry point
├── prisma/
│   └── schema.prisma    # Database schema
└── package.json
```

## Development

```bash
# Start dev server with hot reload
npm run dev

# View database in Prisma Studio
npm run prisma:studio

# Create new migration
npx prisma migrate dev --name migration_name
```
