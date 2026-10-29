# Database Schema & Migration Guide

> Cold Memory — read when changing models, adding migrations, or touching database logic.

## Current Schema (`src/prisma/contract.prisma`)

```prisma
// use prisma-8

model User {
  id           Int    @id @default(autoincrement())
  name         String
  email        String @unique
  passwordHash String
}
```

Single model. Integer PK with autoincrement. Unique constraint on `email`.

## Prisma 8 Architecture

This project uses **Prisma 8** (RC), which is fundamentally different from Prisma 7.

```
contract.prisma          ← You edit this (source of truth)
    │
    ▼ prisma contract emit
contract.json + contract.d.ts   ← Generated types, committed to repo
    │
    ▼ prisma migration plan
migrations/app/<timestamp>_<name>/   ← Typed migration class
    │
    ▼ prisma db migrate --advance-ref db
PostgreSQL               ← Applied to database
```

### Key Concepts

| Prisma 8 Concept | Description |
|-------------------|-------------|
| `contract.prisma` | Schema file (replaces `schema.prisma`) |
| `contract.json` + `contract.d.ts` | Emitted types (replaces `prisma generate`) |
| `Migration<Start, End>` | Typed migration class with `operations` getter |
| `DB_FACADE` | Injected via Symbol token, created by `createDb(url)` |
| `db.orm.public.Model` | Query API (replaces `prisma.model`) |

## Migration Workflow

Run these commands **in order** after editing `contract.prisma`:

```bash
# 1. Emit updated contract types
npm run contract:emit        # prisma contract emit

# 2. Plan a new migration (generates migration files)
npm run migration:plan       # prisma migration plan

# 3. Validate the migration is correct
npm run migration:check      # prisma migration check

# 4. Apply to the database
npm run db:migrate           # prisma db migrate --advance-ref db

# 5. Verify database matches contract
npm run db:verify            # prisma db verify
```

### Migration File Structure

Each migration lives in `migrations/app/<timestamp>_<name>/`:

```
migrations/app/20261026T0511_add_password_hash/
├── migration.json          # Metadata
├── migration.ts            # Typed Migration<Start, End> class
└── ops.json                # Serialised operations
```

The migration class imports typed `Start` and `End` contracts from snapshots
and declares operations explicitly:

```typescript
export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'user',
        column: col('passwordHash', 'text', { notNull: true, default: { kind: 'value', value: '' } }),
      }),
    ];
  }
}
```

## Patterns In Use

### DB Factory (`src/prisma/db.ts`)

```typescript
import postgres from '@prisma/orm-postgres/runtime';

export function createDb(url: string) {
  return postgres<Contract>({ contractJson, url });
}
export type Db = ReturnType<typeof createDb>;
```

- The factory **never reads `process.env`** — the URL is passed by `DatabaseModule`.
- `Db` type is inferred, not manually declared.

### Repository Implementation (`src/database/prisma-users.repository.ts`)

```typescript
@Injectable()
export class PrismaUsersRepository implements UsersRepository {
  constructor(@Inject(DB_FACADE) private readonly db: Db) {}

  async create(data: CreateUserData): Promise<User> {
    try {
      return await this.db.orm.public.User.create({ ... });
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('A user with this email already exists');
      }
      throw error;
    }
  }
}
```

- Unique violation detection via PostgreSQL SQLSTATE `23505` on the `sqlState` property.
- DB errors are translated to NestJS HTTP exceptions at the repository layer.

### Lifecycle Management

`DatabaseModule` implements `OnApplicationShutdown` and calls `db.close()`.
No other module manages database connections.

## Banned Prisma 7 Patterns

| ❌ WRONG (Prisma 7) | ✅ CORRECT (Prisma 8) |
|----------------------|-----------------------|
| `import { PrismaClient } from '@prisma/client'` | `import postgres from '@prisma/orm-postgres/runtime'` |
| `const prisma = new PrismaClient()` | `const db = createDb(url)` via `DB_FACADE` token |
| `prisma.user.create({ data: { ... } })` | `db.orm.public.User.create({ ... })` (no `data` wrapper) |
| `prisma.user.findUnique({ where: { email } })` | `db.orm.public.User.where({ email }).first()` |
| `prisma.user.findMany()` | `db.orm.public.User.all()` |
| `prisma.user.update({ where: { id }, data: { ... } })` | `db.orm.public.User.where({ id }).update({ ... })` |
| `prisma.user.count()` | `db.orm.public.User.aggregate(a => ({ total: a.count() }))` |
| File: `prisma/schema.prisma` | File: `src/prisma/contract.prisma` |
| `npx prisma generate` | `npm run contract:emit` |
| `npx prisma migrate dev --name xyz` | `npm run migration:plan` (interactive) |
| `npx prisma db push` | Not available — use the migration workflow |
| `prisma.$connect()` / `prisma.$disconnect()` | `db.close()` in `DatabaseModule.onApplicationShutdown` |
| `prisma.$transaction([...])` | Consult Prisma 8 docs for transaction API |

### Why These Are Banned

- `@prisma/client` does not exist in Prisma 8. Importing it will fail.
- `schema.prisma` is replaced by `contract.prisma` with different syntax (`// use prisma-8` directive).
- `prisma migrate dev` is a Prisma 7 command. Prisma 8 uses `prisma migration plan` + `prisma db migrate`.
- The `{ data: { ... } }` wrapper in `create()` is removed in Prisma 8 — pass fields directly.

