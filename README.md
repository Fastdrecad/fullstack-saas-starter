# Fullstack SaaS Starter

Production-ready SaaS starter template with authentication, monorepo infrastructure, and modern tooling.

## What's Included

- **Monorepo** — pnpm workspaces with shared packages
- **Authentication** — JWT + refresh tokens, password reset, OAuth (GitHub & Google)
- **API** — Express with rate limiting, validation (Zod), structured error handling, Pino logging
- **Frontend** — React 19, Vite, Tailwind CSS v4, Zustand, i18n, dark/light theme
- **Database** — PostgreSQL with Prisma ORM, soft deletes, UUIDs
- **Cache** — Redis for rate limiting
- **CI/CD** — GitHub Actions (lint, test, build)
- **Docker** — docker-compose for local dev, multi-stage Dockerfile for API
- **DX** — ESLint, Prettier, Husky pre-commit hooks, commitlint

## Quick Start

### Prerequisites

- Node.js >= 20
- pnpm >= 9
- Docker (for PostgreSQL & Redis)

### Setup

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/fullstack-saas-starter.git
cd fullstack-saas-starter

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example apps/api/.env

# Edit apps/api/.env — set your JWT secrets (32+ chars each)

# Start PostgreSQL & Redis
docker compose up -d

# Run database migrations
pnpm db:push

# Start development servers
pnpm dev
```

The API runs on `http://localhost:3001` and the web app on `http://localhost:5173`.

## Project Structure

```
├── apps/
│   ├── api/          # Express backend
│   └── web/          # React frontend
├── packages/
│   └── shared/       # Shared Zod schemas & TypeScript types
├── docker-compose.yml
├── .github/workflows/ci.yml
└── CLAUDE.md         # AI agent coding rules
```

## Scripts

| Command             | Description                        |
| ------------------- | ---------------------------------- |
| `pnpm dev`          | Start API + Web dev servers        |
| `pnpm build`        | Build all packages                 |
| `pnpm lint`         | Run ESLint                         |
| `pnpm typecheck`    | Run TypeScript checks              |
| `pnpm test`         | Run tests                          |
| `pnpm db:migrate`   | Run Prisma migrations              |
| `pnpm db:push`      | Push schema to database            |
| `pnpm db:studio`    | Open Prisma Studio                 |

## Auth Features

- Email/password registration & login
- JWT access tokens (15min) + refresh tokens (7d) with rotation
- Refresh token reuse detection (security)
- OAuth login (GitHub & Google)
- Password reset via email (Resend)
- Rate limiting on auth endpoints
- Settings page with OAuth account linking/unlinking

## Customization

1. **Branding** — Update `packages/shared/src/index.ts` (`APP_NAME`), `apps/web/src/locales/en/common.json`, and `apps/web/index.html`
2. **Email sender** — Update `from` address in `apps/api/src/lib/email.ts`
3. **Theme colors** — Edit CSS variables in `apps/web/src/styles/globals.css`
4. **Database models** — Add new models in `apps/api/prisma/schema.prisma`
5. **API features** — Add new feature modules in `apps/api/src/features/`
6. **Frontend pages** — Add new routes in `apps/web/src/App.tsx`

## Environment Variables

See `.env.example` for all available variables. Required for development:

- `DATABASE_URL` — PostgreSQL connection string
- `JWT_ACCESS_SECRET` — 32+ character secret for access tokens
- `JWT_REFRESH_SECRET` — 32+ character secret for refresh tokens

## License

MIT
