# NestJS Base with AI

A production-ready NestJS 12 starter project built with **Prisma 8** (PostgreSQL), **TypeScript 6**, and modern tooling (Vitest, oxlint, Prettier). Features a clean layered architecture with repository pattern and dependency injection.

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
