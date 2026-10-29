# NestJS Base with AI

A production-ready NestJS 12 REST API starter built with **Prisma 8** (PostgreSQL), **TypeScript 6**, and modern tooling (Vitest, oxlint, Prettier). Ships with JWT authentication, clean layered architecture, and repository pattern with dependency injection.

## Key Features

- **JWT Authentication** — Register, login, and protected routes via `@nestjs/authentication`
- **Repository Pattern** — Feature modules depend on interfaces, not Prisma; swap ORM without touching business logic
- **Prisma 8 (RC)** — Contract-based schema, typed migrations, no legacy `@prisma/client`
- **Startup Validation** — All env vars validated at boot via `class-validator`; the app crashes fast on misconfiguration
- **Global Error Handling** — Consistent JSON error responses via `HttpExceptionFilter`
- **Input Sanitisation** — Whitelist-only validation pipe strips unknown fields and transforms types

---

## Tech Stack

| Category       | Technology                                                                    |
| -------------- | ----------------------------------------------------------------------------- |
| **Framework**  | [NestJS](https://nestjs.com/) 12                                              |
| **Language**   | TypeScript 6 (ESM, `nodenext` module resolution)                              |
| **ORM**        | [Prisma 8](https://www.prisma.io/) RC (contract-based, `@prisma/orm-postgres`) |
| **Database**   | PostgreSQL 18 (via Docker)                                                    |
| **Auth**       | `@nestjs/authentication` 0.1 (JWT Bearer, scrypt password hashing)            |
| **Runtime**    | Node.js ≥ 20                                                                  |
| **Validation** | class-validator 0.15 + class-transformer                                       |
| **Testing**    | Vitest 4 + supertest                                                          |
| **Linting**    | oxlint                                                                        |
| **Formatting** | Prettier                                                                      |
| **HTTP**       | Express (via `@nestjs/platform-express`)                                       |
| **Config**     | `@nestjs/config` (namespaced `registerAs`, validated)                          |

---

## Prerequisites

| Tool                                        | Version |
| ------------------------------------------- | ------- |
| [Node.js](https://nodejs.org/)              | ≥ 20    |
| [Docker](https://www.docker.com/) & Compose | Latest  |
| npm                                         | ≥ 10    |

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

Edit `.env` — set real values for every placeholder (`YOUR_*`). At minimum:

- `DATABASE_URL` — must match the Postgres credentials below
- `JWT_ACCESS_SECRET` — a random string ≥ 32 characters (e.g. `openssl rand -base64 48`)
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` — Docker Compose credentials

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

## API Endpoints

All endpoints return JSON. Routes are protected by JWT unless marked `@Public`.

### Health

| Method | Path | Auth     | Description    |
| ------ | ---- | -------- | -------------- |
| `GET`  | `/`  | `Public` | Hello / health |

### Auth (`/auth`)

| Method | Path             | Auth     | Description                       |
| ------ | ---------------- | -------- | --------------------------------- |
| `POST` | `/auth/register` | `Public` | Create account, returns JWT       |
| `POST` | `/auth/login`    | `Public` | Authenticate, returns JWT         |

**Register** — `POST /auth/register`
```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "secret1234"
}
```
→ `201` `{ "accessToken": "eyJ..." }`

**Login** — `POST /auth/login`
```json
{
  "email": "alice@example.com",
  "password": "secret1234"
}
```
→ `200` `{ "accessToken": "eyJ..." }`

### Users (`/users`)

| Method | Path          | Auth       | Description                |
| ------ | ------------- | ---------- | -------------------------- |
| `POST` | `/users`      | Bearer JWT | Create a user              |
| `GET`  | `/users/me`   | Bearer JWT | Current authenticated user |
| `GET`  | `/users/count`| Bearer JWT | Total user count           |
| `GET`  | `/users`      | Bearer JWT | List all users             |

Protected endpoints require the header:
```
Authorization: Bearer <accessToken>
```

Response shape (`UserResponseDto`):
```json
{ "id": 1, "name": "Alice", "email": "alice@example.com" }
```

> `passwordHash` is never exposed in responses.

---

## Architecture

### Directory Structure

```
src/
├── main.ts                                  # Bootstrap, global pipes/filters
├── app.module.ts                            # Root: ConfigModule, DatabaseModule, feature modules
├── app.controller.ts                        # Health / hello endpoint (@Public)
│
├── common/
│   ├── filters/http-exception.filter.ts     # Global catch-all, consistent JSON errors
│   └── pipes/validation.pipe.ts             # Global whitelist + transform pipe
│
├── config/
│   ├── app.config.ts                        # registerAs('app') — NODE_ENV, PORT
│   ├── auth.config.ts                       # registerAs('auth') — JWT secrets, issuer, TTL
│   ├── database.config.ts                   # registerAs('database') — DATABASE_URL
│   └── env.validation.ts                    # class-validator schema, crash on invalid
│
├── database/
│   ├── database.module.ts                   # @Global — DB_FACADE lifecycle, repo bindings
│   ├── db-facade.token.ts                   # Symbol('DB_FACADE')
│   └── prisma-users.repository.ts           # Prisma implementation of UsersRepository
│
├── modules/
│   ├── auth/
│   │   ├── auth.module.ts                   # Imports UsersModule + AuthenticationModule
│   │   ├── auth.controller.ts               # POST /auth/register, POST /auth/login
│   │   ├── auth.service.ts                  # Register/login, password hash + JWT issue
│   │   ├── jwt-auth.provider.ts             # JwtBearerProvider — validates tokens, loads user
│   │   └── dto/
│   │       ├── login.dto.ts                 # { email, password }
│   │       └── register.dto.ts              # { name, email, password }
│   │
│   └── users/
│       ├── users.module.ts                  # Exports UsersService for cross-module use
│       ├── users.controller.ts              # CRUD endpoints
│       ├── users.service.ts                 # Business logic via @Inject(USERS_REPOSITORY)
│       ├── users.repository.ts              # Interface + Symbol token (no Prisma imports)
│       └── dto/
│           ├── create-user.dto.ts           # { name, email, password } validated
│           └── user-response.dto.ts         # Static from()/fromMany(), excludes passwordHash
│
└── prisma/
    ├── contract.prisma                      # Prisma 8 schema (source of truth)
    ├── contract.json                        # Emitted contract (committed)
    ├── contract.d.ts                        # Generated TypeScript types
    └── db.ts                                # createDb(url) factory + Db type alias

migrations/                                  # Prisma 8 typed migrations (outside src/)
```

### Dependency Flow

```
Controller → Service → Repository Interface (port)
                              ↑
DatabaseModule wires:  PrismaRepository (adapter) → DB_FACADE (Prisma)
```

**Rules:**

- Controllers call only their own service — no repositories, no DB, no cross-feature services
- Services depend on repository **interfaces** via `@Inject(SYMBOL)` — never import Prisma
- Cross-feature access: import the other module and use its exported service
- Prisma implementations live in `src/database/`, never in feature modules

### Module Graph

```
AppModule
├── ConfigModule.forRoot (global, validated)
├── DatabaseModule (@Global — DB_FACADE + all repository tokens)
├── UsersModule (exports UsersService)
└── AuthModule
    ├── imports UsersModule
    └── imports AuthenticationModule (@nestjs/authentication)
```

### Database Schema

```prisma
model User {
  id           Int    @id @default(autoincrement())
  name         String
  email        String @unique
  passwordHash String
}
```

---

## Environment Variables

All variables are validated at startup via `class-validator`. The app **will not start** if required variables are missing or invalid.

### Application

| Variable           | Required | Default       | Description                            |
| ------------------ | -------- | ------------- | -------------------------------------- |
| `NODE_ENV`         | ✅        | `development` | `development` · `production` · `test`  |
| `PORT`             | ✅        | `3000`        | HTTP listen port (must be ≥ 1)         |
| `DATABASE_URL`     | ✅        | —             | PostgreSQL connection string           |

### Authentication (JWT)

| Variable            | Required | Default | Description                                  |
| ------------------- | -------- | ------- | -------------------------------------------- |
| `JWT_ACCESS_SECRET` | ✅        | —       | Signing secret (≥ 32 characters)             |
| `JWT_ISSUER`        | ✅        | —       | Token issuer (e.g. `http://localhost:3000`)   |
| `JWT_AUDIENCE`      | ✅        | —       | Token audience identifier                    |
| `JWT_ACCESS_TTL`    | ❌        | `15m`   | Access token lifetime (e.g. `1h`, `30m`)     |

### Docker Compose (local PostgreSQL)

| Variable             | Required | Description                            |
| -------------------- | -------- | -------------------------------------- |
| `POSTGRES_IMAGE`     | ✅*       | Docker image (e.g. `postgres:18-alpine`) |
| `POSTGRES_USER`      | ✅*       | DB username                            |
| `POSTGRES_PASSWORD`  | ✅*       | DB password                            |
| `POSTGRES_DB`        | ✅*       | DB name                                |
| `POSTGRES_HOST_PORT` | ✅*       | Host port mapped to container 5432     |

> \* Only required when running the Docker Compose file for local PostgreSQL.

Validation logic: [`env.validation.ts`](src/config/env.validation.ts)

---

## Scripts Reference

| Command                   | Description                                      |
| ------------------------- | ------------------------------------------------ |
| `npm run start`           | Start the application                            |
| `npm run start:dev`       | Start in watch mode (development)                |
| `npm run start:debug`     | Start in debug + watch mode                      |
| `npm run start:prod`      | Start the production build (`dist/main`)         |
| `npm run build`           | Compile the project via `nest build`             |
| `npm run lint`            | Lint `src/` and `test/` with oxlint              |
| `npm run format`          | Format code with Prettier                        |
| `npm run test`            | Run unit tests (Vitest)                          |
| `npm run test:watch`      | Run tests in watch mode                          |
| `npm run test:cov`        | Run tests with v8 coverage                       |
| `npm run test:debug`      | Run tests with inspector for debugging           |
| `npm run test:e2e`        | Run end-to-end tests                             |
| `npm run contract:emit`   | Emit Prisma contract (JSON + types) from schema  |
| `npm run migration:plan`  | Plan a new database migration                    |
| `npm run migration:check` | Check if migrations are up-to-date               |
| `npm run db:migrate`      | Apply pending migrations                         |
| `npm run db:verify`       | Verify database schema matches contract          |

---

## Database Migrations (Prisma 8)

This project uses **Prisma 8**, which replaces `schema.prisma` / `prisma generate` / `prisma migrate dev` with a contract-based workflow.

### Workflow

After editing `src/prisma/contract.prisma`, run these commands **in order**:

```bash
npm run contract:emit      # 1. Emit updated types (contract.json + contract.d.ts)
npm run migration:plan     # 2. Generate a typed migration class
npm run migration:check    # 3. Validate the migration
npm run db:migrate         # 4. Apply to PostgreSQL
npm run db:verify          # 5. Verify DB matches contract
```

### Migration File Structure

Each migration lives in `migrations/app/<timestamp>_<name>/`:

```
migrations/app/20261026T0511_add_password_hash/
├── migration.json     # Metadata
├── migration.ts       # Typed Migration<Start, End> class
└── ops.json           # Serialised operations
```

> **Important:** Do not use Prisma 7 commands (`prisma generate`, `prisma migrate dev`, `prisma db push`). They do not exist in Prisma 8. See [`docs/database-schema.md`](docs/database-schema.md) for the full banned-patterns table.

---

## Testing

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage (v8)
npm run test:cov

# Debug (attach inspector)
npm run test:debug

# End-to-end (supertest)
npm run test:e2e
```

Test files use the `*.spec.ts` convention and live alongside the source files they test.

---

## Troubleshooting

### App refuses to start with config validation error

Every required env var must be present. Run:
```bash
diff <(grep -E '^[A-Z_]+=' .env.example | cut -d= -f1 | sort) \
     <(grep -E '^[A-Z_]+=' .env         | cut -d= -f1 | sort)
```
Make sure `JWT_ACCESS_SECRET` is ≥ 32 characters.

### Database connection refused

1. Verify Postgres is running: `docker ps`
2. Check `DATABASE_URL` matches the `POSTGRES_*` values in `.env`
3. Ensure the host port isn't already in use: `lsof -i :5432`

### Migrations pending / schema drift

```bash
npm run db:migrate     # Apply pending migrations
npm run db:verify      # Check for drift
```

### `@prisma/client` import error

This project uses **Prisma 8**. Import from `@prisma/orm-postgres/runtime`, not `@prisma/client`. See the [banned patterns table](docs/database-schema.md#banned-prisma-7-patterns).

---

## Further Documentation

| Document                                              | When to Read                              |
| ----------------------------------------------------- | ----------------------------------------- |
| [`docs/architecture.md`](docs/architecture.md)        | Changing module boundaries or layers      |
| [`docs/database-schema.md`](docs/database-schema.md)  | Changing models, migrations, or DB logic  |

---

## License

This project is [UNLICENSED](package.json).
