# AGENTS.md — Hot Memory

> Always loaded. Read this before every task.

## Project Overview

NestJS 12 REST API on Node.js (ESM). Prisma 8 ORM with PostgreSQL.
TypeScript 6 strict mode. Vitest for testing. oxlint for linting.

Two feature modules exist: **Users** (CRUD + repository contract) and
**Auth** (register/login with JWT). Both follow identical conventions.

## Directory Layout

```
src/
├── main.ts                          # Bootstrap, global pipes/filters
├── app.module.ts                    # Root module, imports ConfigModule
├── common/                          # Cross-cutting: pipes, filters
├── config/                          # Namespaced registerAs configs + env validation
├── database/                        # @Global DatabaseModule, Prisma implementations
│   ├── database.module.ts           # Owns DB_FACADE lifecycle, wires repository tokens
│   └── prisma-*.repository.ts       # Concrete repository implementations
├── modules/<feature>/               # One directory per business feature
│   ├── <feature>.module.ts
│   ├── <feature>.controller.ts
│   ├── <feature>.service.ts
│   ├── <feature>.repository.ts      # Interface + Symbol token (NO Prisma imports)
│   └── dto/                         # Input DTOs (class-validator) + output DTOs (static factories)
└── prisma/                          # Prisma 8 contract (schema, generated types, db factory)
migrations/                          # Prisma 8 typed migrations (NOT prisma/migrations/)
```

## Dependency Rules

```
Controller → Service → Repository interface (port)
                              ↑
DatabaseModule wires:  PrismaRepository (adapter) → Prisma DB_FACADE
```

- Controllers call only their own service. No repository, no DB, no cross-feature service.
- Services depend on repository **interfaces** via Symbol injection tokens. Never import Prisma.
- Cross-feature access: import the other module and use its exported service.
- Prisma implementations live in `src/database/`, never in feature modules.

## Database Conventions — Prisma 8

**Read `docs/database-schema.md` when changing any model or migration.**

Workflow: edit `contract.prisma` → `npm run contract:emit` → `npm run migration:plan` →
`npm run migration:check` → `npm run db:migrate` → `npm run db:verify`.

### Banned Prisma 7 Patterns

| Banned (Prisma 7)                | Use Instead (Prisma 8)               |
|----------------------------------|---------------------------------------|
| `@prisma/client`                 | `@prisma/orm-postgres/runtime`        |
| `new PrismaClient()`            | `createDb(url)` factory in `prisma/db.ts` |
| `schema.prisma`                  | `contract.prisma`                     |
| `prisma migrate dev`             | `prisma migration plan` + `db migrate` |
| `prisma generate`                | `prisma contract emit`                |
| `prisma.$connect()` / `$disconnect()` | `db.close()` in `DatabaseModule.onApplicationShutdown` |

## Conditional Reading Rules

| Condition                              | Read                          |
|----------------------------------------|-------------------------------|
| Changing module boundaries or layers   | `docs/architecture.md`        |
| Changing models, migrations, DB logic  | `docs/database-schema.md`     |
| Scaffolding a new feature module       | `.agents/skills/nest-feature/SKILL.md` |

## Environment & Config

- All env vars validated at startup via `src/config/env.validation.ts`.
- Each config namespace is a separate `registerAs` file in `src/config/`.
- Docker Compose for local Postgres: `docker-compose.postgres.yml`.
- `.env.example` lists required variables. Never commit `.env`.

## Testing Commands

```bash
npm run test            # Vitest unit tests (*.spec.ts)
npm run test:watch      # Vitest watch mode
npm run test:cov        # Coverage via @vitest/coverage-v8
npm run test:e2e        # E2e tests (vitest.config.e2e.ts, supertest)
npm run lint            # oxlint src/ test/
npm run format          # Prettier
```

## Agent Workflow

1. **Read** this file and any conditional docs that apply.
2. **Plan** before coding — present the file list and rationale.
3. **Implement** following dependency rules and conventions above.
4. **Verify** — run `npm run lint` and `npm run test` after every change.
5. **Never** bypass the repository interface; never import Prisma in feature modules.

## Import Conventions

- All local imports use explicit `.js` extensions (ESM).
- Type-only imports use `import type { ... }`.
- `"type": "module"` in `package.json`.

## Tech Stack Versions

| Dependency             | Version        |
|------------------------|----------------|
| NestJS                 | 12.x           |
| Prisma ORM (Postgres)  | 8.x (RC)       |
| TypeScript             | 6.x            |
| Node target            | ES2023         |
| Vitest                 | 4.x            |
| class-validator        | 0.15.x         |
| @nestjs/authentication | 0.1.x          |

