# NestJS Base with AI

A production-ready NestJS 12 starter project built with **Prisma 8** (PostgreSQL), **TypeScript 6**, and modern tooling (Vitest, oxlint, Prettier). Features a clean layered architecture with repository pattern and dependency injection.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [API Reference](#api-reference)
- [Prisma 8 Workflow](#prisma-8-workflow)
- [Database Migrations](#database-migrations)
- [Testing](#testing)
- [Scripts Reference](#scripts-reference)
- [Configuration Files](#configuration-files)
- [Tech Stack](#tech-stack)
- [License](#license)

---

## Prerequisites

| Tool                                          | Version  |
| --------------------------------------------- | -------- |
| [Node.js](https://nodejs.org/)                | ≥ 20     |
| [Docker](https://www.docker.com/) & Compose   | Latest   |
| npm                                           | ≥ 10     |

---

## Getting Started

### 1. Clone & install

```bash
git clone <repository-url>
cd nestjs-base-with-ai
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` — set real values for `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, and make sure `DATABASE_URL` uses the same credentials.

> **Note:** `.env` is git-ignored. Only `.env.example` (with placeholders) is tracked.

### 3. Start PostgreSQL

```bash
docker compose -f docker-compose.postgres.yml up -d
```

Manage the database container:

```bash
# Stop (preserves data)
docker compose -f docker-compose.postgres.yml down

# Stop and DELETE all data
docker compose -f docker-compose.postgres.yml down -v
```

### 4. Run database migrations

```bash
npm run db:migrate
```

### 5. Start the application

```bash
# Development (watch mode — recommended)
npm run start:dev

# Standard
npm run start

# Production
npm run build && npm run start:prod
```

The app is available at **http://localhost:3000**.

---

## Environment Variables

All variables are validated at startup via `class-validator`. The app **will not start** if required variables are missing or invalid.

| Variable             | Required | Default       | Description                                    |
| -------------------- | -------- | ------------- | ---------------------------------------------- |
| `NODE_ENV`           | ✅        | `development` | `development` · `production` · `test`          |
| `PORT`               | ✅        | `3000`        | HTTP listen port (must be ≥ 1)                 |
| `DATABASE_URL`       | ✅        | —             | PostgreSQL connection string                   |
| `POSTGRES_IMAGE`     | ✅*       | —             | Docker image (e.g. `postgres:18-alpine`)       |
| `POSTGRES_USER`      | ✅*       | —             | DB username (Docker Compose)                   |
| `POSTGRES_PASSWORD`  | ✅*       | —             | DB password (Docker Compose)                   |
| `POSTGRES_DB`        | ✅*       | —             | DB name (Docker Compose)                       |
| `POSTGRES_HOST_PORT` | ✅*       | —             | Host port mapped to container 5432             |

> \* Only required when running the Docker Compose file for local PostgreSQL.

Validation logic: [`src/config/env.validation.ts`](src/config/env.validation.ts)

---

## Project Structure

```
nestjs-base-with-ai/
├── src/
│   ├── main.ts                              # Bootstrap & global pipes
│   ├── app.module.ts                        # Root module (config, DB, feature modules)
│   ├── app.controller.ts                    # GET / → "Hello World!"
│   ├── app.service.ts                       # Root service
│   ├── app.controller.spec.ts               # Unit test for AppController
│   │
│   ├── config/
│   │   ├── app.config.ts                    # Namespaced config: app.nodeEnv, app.port
│   │   ├── database.config.ts               # Namespaced config: database.url
│   │   └── env.validation.ts                # class-validator env schema + validate()
│   │
│   ├── common/
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts           # Global ValidationPipe (whitelist + transform)
│   │   └── utils/                           # (Reserved for shared utilities)
│   │
│   ├── database/
│   │   ├── index.ts                         # Barrel export (DatabaseModule, DB_FACADE)
│   │   ├── database.module.ts               # @Global() module: Prisma client + repositories
│   │   ├── db-facade.token.ts               # DI token: Symbol('DB_FACADE')
│   │   └── prisma-users.repository.ts       # Prisma implementation of UsersRepository
│   │
│   ├── prisma/
│   │   ├── contract.prisma                  # Prisma 8 schema (User model)
│   │   ├── contract.json                    # Emitted contract (auto-generated)
│   │   ├── contract.d.ts                    # TypeScript types (auto-generated)
│   │   └── db.ts                            # createDb() factory + Db type
│   │
│   └── modules/
│       └── users/
│           ├── users.module.ts              # Feature module
│           ├── users.controller.ts          # REST endpoints: POST, GET, GET /count
│           ├── users.service.ts             # Business logic layer
│           ├── users.repository.ts          # Repository interface + USERS_REPOSITORY token
│           └── dto/
│               └── create-user.dto.ts       # Validated DTO (name, email)
│
├── migrations/
│   ├── app/
│   │   ├── 20260916T0900_baseline/          # Baseline migration (creates User table)
│   │   │   ├── migration.ts                 # Type-safe migration code
│   │   │   ├── migration.json               # Migration metadata
│   │   │   └── ops.json                     # Migration operations
│   │   └── refs/
│   │       └── db.json                      # Tracks which migration the DB is at
│   └── snapshots/
│       └── <hash>/                          # Contract snapshot at migration time
│           ├── contract.d.ts                # Frozen TypeScript types
│           └── contract.json                # Frozen contract JSON
│
├── test/
│   └── app.e2e-spec.ts                      # E2E test (supertest)
│
├── prisma.config.ts                         # Prisma CLI config (contract path + DB URL)
├── docker-compose.postgres.yml              # Local PostgreSQL 18 container
├── tsconfig.json                            # TypeScript 6 config (ESM, NodeNext)
├── tsconfig.build.json                      # Build-specific TS config
├── vitest.config.ts                         # Unit test config
├── vitest.config.e2e.ts                     # E2E test config
├── nest-cli.json                            # NestJS CLI config
├── oxlint.json                              # Linter config
├── .prettierrc                              # Prettier config (singleQuote, trailingComma)
├── .env.example                             # Environment template
└── package.json                             # Dependencies & scripts
```

---

## Architecture

### Layered Architecture

```
┌─────────────────────────────────────────────────┐
│                   HTTP Request                  │
└───────────────────────┬─────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────┐
│              Controller Layer                   │
│  (Routing, validation, HTTP concerns)           │
│  e.g. UsersController                           │
└───────────────────────┬─────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────┐
│               Service Layer                     │
│  (Business logic, orchestration)                │
│  e.g. UsersService                              │
└───────────────────────┬─────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────┐
│             Repository Layer                    │
│  (Data access via interface + DI token)         │
│  Interface: UsersRepository                     │
│  Implementation: PrismaUsersRepository          │
└───────────────────────┬─────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────┐
│           Prisma 8 / PostgreSQL                 │
│  (DB_FACADE → PostgresClient)                   │
└─────────────────────────────────────────────────┘
```

### Key Design Patterns

| Pattern                          | Where                                                  | Why                                                                                |
| -------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| **Repository Pattern**           | `users.repository.ts` (interface) → `prisma-users.repository.ts` (impl) | Decouples business logic from data access; easy to swap Prisma for another ORM      |
| **DI Token (Symbol)**            | `DB_FACADE`, `USERS_REPOSITORY`                        | Enables interface-based injection (TypeScript interfaces erased at runtime)          |
| **Global Module**                | `DatabaseModule` (`@Global()`)                         | Prisma client & repositories available everywhere without re-importing              |
| **Namespaced Config**            | `registerAs('app', ...)`, `registerAs('database', ...)` | Type-safe, structured config access via `ConfigService.get('app.port')`             |
| **Env Validation at Boot**       | `env.validation.ts`                                    | Fail fast on missing/invalid env vars                                               |
| **Global Validation Pipe**       | `GlobalValidationPipe` in `main.ts`                    | Whitelist + transform + forbidNonWhitelisted on every incoming request               |
| **Graceful Shutdown**            | `DatabaseModule.onApplicationShutdown()`               | Closes Prisma DB connection on app shutdown                                         |

### Data Flow Example: `POST /users`

```
1. Request → UsersController.create(@Body() dto: CreateUserDto)
2. GlobalValidationPipe validates + transforms the body
3. Controller delegates to UsersService.create(dto)
4. Service delegates to UsersRepository.create(dto)  (injected via USERS_REPOSITORY token)
5. PrismaUsersRepository calls db.orm.public.User.create(dto)
6. On duplicate email → catches PostgreSQL 23505 → throws ConflictException (409)
7. Response ← { id, name, email }
```

---

## API Reference

### Health Check

```
GET /
```

**Response:** `200 OK` — `Hello World!`

---

### Users

#### Create User

```
POST /users
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

| Field   | Type   | Validation                                    |
| ------- | ------ | --------------------------------------------- |
| `name`  | string | Required, non-empty, auto-trimmed             |
| `email` | string | Required, valid email format, auto-trimmed    |

**Responses:**

| Status | Description                              |
| ------ | ---------------------------------------- |
| `201`  | User created — returns `{ id, name, email }` |
| `400`  | Validation error (missing/invalid fields)|
| `409`  | Conflict — email already exists          |

#### List All Users

```
GET /users
```

**Response:** `200 OK` — `User[]`

```json
[
  { "id": 1, "name": "John Doe", "email": "john@example.com" }
]
```

#### Count Users

```
GET /users/count
```

**Response:** `200 OK`

```json
{ "count": 42 }
```

---

## Prisma 8 Workflow

This project uses **Prisma 8** (RC) with the new contract-based approach — no more `npx prisma generate`. The schema, contract, and migrations are all TypeScript-native.

### Schema Location

The Prisma schema lives at [`src/prisma/contract.prisma`](src/prisma/contract.prisma):

```prisma
model User {
  id    Int    @id @default(autoincrement())
  name  String
  email String @unique
}
```

### Emit Contract (after schema changes)

```bash
npm run contract:emit
```

This regenerates:
- `src/prisma/contract.json` — runtime contract
- `src/prisma/contract.d.ts` — TypeScript types

### Prisma Client Setup

The Prisma client is created in [`src/prisma/db.ts`](src/prisma/db.ts) via the `createDb(url)` factory. The `DatabaseModule` owns the lifecycle:
- Creates the client with the database URL from `ConfigService`
- Closes the connection on application shutdown

### Configuration

CLI configuration is in [`prisma.config.ts`](prisma.config.ts):

```ts
export default definePrismaConfig({
  orm: ormConfig({
    contract: "./src/prisma/contract.prisma",
    db: {
      connection: process.env['DATABASE_URL']!,
    },
  }),
});
```

---

## Database Migrations

Prisma 8 uses **TypeScript-native, type-safe migrations**.

### Commands

```bash
# Plan a new migration (preview changes)
npm run migration:plan

# Check migration status
npm run migration:check

# Apply pending migrations
npm run db:migrate

# Verify database state
npm run db:verify
```

### Migration Structure

```
migrations/
├── app/
│   └── 20260916T0900_baseline/
│       ├── migration.ts      # Type-safe migration code (createTable, addUnique, etc.)
│       ├── migration.json    # Metadata
│       └── ops.json          # Operation details
└── snapshots/                # Contract snapshots used for diffing
```

### Workflow

1. Edit `src/prisma/contract.prisma`
2. Run `npm run contract:emit` to regenerate types
3. Run `npm run migration:plan` to generate a migration
4. Review the generated migration in `migrations/app/`
5. Run `npm run db:migrate` to apply

---

## Testing

The project uses [**Vitest**](https://vitest.dev/) with global test APIs and tsconfig path resolution.

### Unit Tests

```bash
npm run test           # Run all unit tests
npm run test:watch     # Watch mode
npm run test:cov       # With coverage report (v8)
npm run test:debug     # Debug mode (--inspect-brk)
```

Config: [`vitest.config.ts`](vitest.config.ts) — matches `**/*.spec.ts`

### E2E Tests

```bash
npm run test:e2e
```

Config: [`vitest.config.e2e.ts`](vitest.config.e2e.ts) — matches `**/*.e2e-spec.ts`  
Uses [supertest](https://github.com/ladjs/supertest) for HTTP assertions.

---

## Scripts Reference

| Command                  | Description                                          |
| ------------------------ | ---------------------------------------------------- |
| `npm run start`          | Start the application                                |
| `npm run start:dev`      | Start in watch mode (development)                    |
| `npm run start:debug`    | Start in debug + watch mode                          |
| `npm run start:prod`     | Start the production build (`dist/main`)             |
| `npm run build`          | Compile the project via `nest build`                 |
| `npm run lint`           | Lint `src/` and `test/` with oxlint                  |
| `npm run format`         | Format code with Prettier                            |
| `npm run test`           | Run unit tests (Vitest)                              |
| `npm run test:watch`     | Run tests in watch mode                              |
| `npm run test:cov`       | Run tests with v8 coverage                           |
| `npm run test:debug`     | Run tests with inspector for debugging               |
| `npm run test:e2e`       | Run end-to-end tests                                 |
| `npm run contract:emit`  | Emit Prisma contract (JSON + types) from schema      |
| `npm run migration:plan` | Plan a new database migration                        |
| `npm run migration:check`| Check if migrations are up-to-date                   |
| `npm run db:migrate`     | Apply pending migrations                             |
| `npm run db:verify`      | Verify database schema matches contract              |

---

## Configuration Files

| File                  | Purpose                                                       |
| --------------------- | ------------------------------------------------------------- |
| `tsconfig.json`       | TypeScript 6 — ESM (`module: nodenext`), strict, decorators   |
| `tsconfig.build.json` | Build subset — excludes tests, `node_modules`, `dist`         |
| `nest-cli.json`       | NestJS CLI — `deleteOutDir: true`                             |
| `prisma.config.ts`    | Prisma 8 CLI — contract path + DB connection                  |
| `vitest.config.ts`    | Unit tests — globals, tsconfig paths, `*.spec.ts`             |
| `vitest.config.e2e.ts`| E2E tests — `*.e2e-spec.ts`                                  |
| `oxlint.json`         | Linter — `no-explicit-any` off, `no-floating-promises` warn  |
| `.prettierrc`         | Formatter — single quotes, trailing commas                    |
| `.env.example`        | Environment variable template                                |

---

## Tech Stack

| Category       | Technology                                                              |
| -------------- | ----------------------------------------------------------------------- |
| **Framework**  | [NestJS](https://nestjs.com/) v12                                       |
| **Language**   | TypeScript 6 (ESM, `nodenext` module resolution)                        |
| **ORM**        | [Prisma 8](https://www.prisma.io/) RC (contract-based, `@prisma/orm-postgres`) |
| **Database**   | PostgreSQL 18 (via Docker)                                              |
| **Runtime**    | Node.js ≥ 20                                                           |
| **Validation** | class-validator + class-transformer                                     |
| **Testing**    | Vitest 4 + supertest                                                    |
| **Linting**    | oxlint                                                                  |
| **Formatting** | Prettier                                                                |
| **HTTP**       | Express (via `@nestjs/platform-express`)                                |
| **Config**     | `@nestjs/config` (namespaced, validated)                                |

---

## License

This project is [UNLICENSED](package.json).
