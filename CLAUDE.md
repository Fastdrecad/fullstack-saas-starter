# Fullstack SaaS Starter

## Project Overview

Reusable SaaS starter template with authentication, monorepo infrastructure, and production-ready tooling. Built as a pnpm monorepo with React frontend and Express backend.

## Tech Stack

| Layer           | Technology                                                          |
| --------------- | ------------------------------------------------------------------- |
| Language        | TypeScript (strict mode, everywhere)                                |
| Frontend        | React 19 · Vite · Tailwind CSS v4 · Zustand · React Query          |
| Backend         | Node.js · Express · Factory functions (NO classes)                  |
| Database        | PostgreSQL 16 · Prisma ORM                                          |
| Cache           | Redis                                                               |
| Auth            | Custom JWT + refresh tokens · OAuth (GitHub, Google)                |
| Validation      | Zod (shared schemas between FE/BE)                                  |
| Testing         | Vitest                                                              |
| i18n            | i18next + react-i18next                                             |
| Email           | Resend                                                              |
| Linting         | ESLint + Prettier                                                   |
| Package Manager | pnpm (workspaces)                                                   |
| Containers      | Docker + docker-compose                                             |
| CI/CD           | GitHub Actions                                                      |

## Monorepo Structure

```
fullstack-saas-starter/
├── apps/
│   ├── web/                  # React + Vite frontend
│   │   ├── src/
│   │   │   ├── components/   # Shared UI components
│   │   │   ├── features/     # Feature modules (auth, settings, etc.)
│   │   │   ├── lib/          # Utilities, API client, i18n
│   │   │   ├── locales/      # i18n translation files
│   │   │   ├── stores/       # Zustand stores
│   │   │   └── styles/       # Global styles, theme
│   │   └── index.html
│   └── api/                  # Node.js + Express backend
│       ├── src/
│       │   ├── config/       # Environment, database, redis config
│       │   ├── features/     # Feature modules (auth, user)
│       │   ├── middleware/   # Express middleware (auth, errors, rate-limit)
│       │   ├── lib/          # Shared utilities (tokens, logger, errors, email)
│       │   └── server.ts     # Express app entry point
│       ├── prisma/
│       │   └── schema.prisma
│       └── Dockerfile
├── packages/
│   └── shared/               # Shared types, Zod schemas, constants
├── docker-compose.yml        # Local dev: PostgreSQL + Redis
├── package.json              # Workspace root
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── .env.example
└── CLAUDE.md
```

## Coding Rules

### General

- **TypeScript strict mode** — no `any` types unless absolutely necessary. Use `unknown` + type narrowing instead.
- **Factory functions** over classes — everywhere. No `class` keyword in the codebase.
- **Named exports** only — no default exports. Exception: route page components for lazy loading.
- **Barrel exports** (`index.ts`) per feature directory — one import path per feature.
- **Zod schemas** are the single source of truth for validation — derive TypeScript types from them with `z.infer<>`.
- **No `enum`** — use `as const` objects instead. Enums are a TypeScript footgun.
- **Absolute imports** — use `@web/*`, `@api/*`, `@shared/*` path aliases. No relative imports beyond `./` and `../` within the same feature.

### Frontend (React)

- **Functional components only** — no class components, ever.
- **Hooks** for all stateful logic. Extract reusable logic into custom hooks in the `hooks/` directory.
- **Zustand** for client state (UI state, auth state). **React Query** for server state (API data, caching).
- **All user-facing strings** go through `t()` from i18next. No hardcoded strings in JSX.
- **i18n translations** — stored in JSON files at `src/locales/{lang}/common.json`, NOT inline in `i18n.ts`. Import JSON files in i18n config.
- **i18n verification** — every `t('key')` used in a component MUST have a corresponding entry in `locales/en/common.json`.
- **Component file naming**: `PascalCase.tsx` for components, `camelCase.ts` for utilities and hooks.
- **Co-locate** component-specific styles, tests, and types with the component.
- **No inline styles**. Use Tailwind classes. For dynamic styles, use `cn()` (clsx + tailwind-merge).

### Backend (Express)

- **Feature-based modules**: each feature has `routes`, `controller`, `service` files.
- **Controllers** handle HTTP concerns (req/res parsing, status codes). **Services** contain business logic. Controllers call services, never the other way around.
- **Factory functions** for services — accept dependencies as arguments (dependency injection without a framework).
- **Zod** for request validation in middleware — validate body, params, and query separately.
- **Centralized error handling** — throw typed errors (`AppError`), catch in error middleware.
- **No `try/catch` in controllers** — use an async wrapper (`asyncHandler`) that forwards errors to Express error middleware.
- **All routes** prefixed with `/api/v1/`.
- **Environment variables** accessed only through `config/env.ts` — never read `process.env` directly in business logic.
- **Logging** — use `logger` from `lib/logger.ts` (pino). Never use `console.log/warn/error` in production code.

### Database (Prisma)

- **Schema file** lives in `apps/api/prisma/schema.prisma`.
- **Snake_case** for database table and column names. Prisma `@@map` and `@map` handle the mapping to camelCase in TypeScript.
- **Soft deletes** — use `deletedAt` timestamp, never hard delete user data.
- **Timestamps** on every table — `createdAt`, `updatedAt` (Prisma handles these automatically).
- **UUIDs** for all primary keys — never expose sequential IDs.

### Testing

- **Vitest** for all tests. File naming: `*.test.ts` or `*.test.tsx`, co-located with source.
- **Unit tests** for services and utilities. **Integration tests** for API routes. **Component tests** for complex UI.
- **No mocking the database in integration tests** — use a test database.

### Docker

- **docker-compose.yml** at project root for local development (PostgreSQL + Redis).
- **Dockerfile** in `apps/api/` for the backend service.
- **Multi-stage builds** — separate build and runtime stages to minimize image size.
- **Never commit `.env` files** — use `.env.example` as template.

### Git Conventions

- **Branch naming**: `feature/description`, `fix/description`, `chore/description`.
- **Commit messages**: imperative mood, max 72 chars. E.g., "Add quiz submission endpoint", not "Added quiz submission endpoint".
- **One feature per branch** — keep PRs focused and reviewable.

## What NOT to Do

- Do NOT use `class` — use factory functions and plain objects
- Do NOT use `enum` — use `as const` objects
- Do NOT use `default export` — use named exports
- Do NOT use `any` — use `unknown` with type guards
- Do NOT read `process.env` directly — go through config
- Do NOT hardcode user-facing strings — use i18next `t()`
- Do NOT use inline styles — use Tailwind classes
- Do NOT mock the database in tests — use a test database
- Do NOT use Redux — use Zustand + React Query
- Do NOT commit `.env` files or secrets
- Do NOT use `var` — use `const` by default, `let` when reassignment is needed
- Do NOT nest ternaries — use early returns or `if/else`
- Do NOT use `console.log/warn/error` — use `logger` from `lib/logger.ts`
