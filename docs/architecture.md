# Architecture

> Cold Memory — read when changing module boundaries, layers, or dependency direction.

## Source Tree

```
src/
├── main.ts                                  # NestFactory bootstrap
├── app.module.ts                            # Root: ConfigModule, DatabaseModule, feature modules
├── app.controller.ts                        # Health / hello endpoint (@Public)
├── app.service.ts                           # Root service
├── app.controller.spec.ts                   # Unit test for root controller
│
├── common/
│   ├── filters/
│   │   └── http-exception.filter.ts         # Global catch-all, consistent JSON errors
│   └── pipes/
│       └── validation.pipe.ts               # Global whitelist + transform pipe
│
├── config/
│   ├── app.config.ts                        # registerAs('app') — NODE_ENV, PORT
│   ├── auth.config.ts                       # registerAs('auth') — JWT secrets, issuer, audience, TTL
│   ├── database.config.ts                   # registerAs('database') — DATABASE_URL
│   └── env.validation.ts                    # class-validator schema, crash-on-invalid startup
│
├── database/
│   ├── database.module.ts                   # @Global, owns DB_FACADE + repository bindings
│   ├── db-facade.token.ts                   # Symbol('DB_FACADE')
│   ├── index.ts                             # Barrel: DatabaseModule, DB_FACADE
│   └── prisma-users.repository.ts           # PrismaUsersRepository implements UsersRepository
│
├── modules/
│   ├── auth/
│   │   ├── auth.module.ts                   # Imports UsersModule, AuthenticationModule
│   │   ├── auth.controller.ts               # POST /auth/register, POST /auth/login (@Public)
│   │   ├── auth.service.ts                  # Orchestrates UsersService + PasswordHasher + TokenService
│   │   ├── jwt-auth.provider.ts             # JwtBearerProvider — validates tokens, loads user
│   │   └── dto/
│   │       ├── login.dto.ts                 # Input: email, password
│   │       └── register.dto.ts              # Input: name, email, password
│   │
│   └── users/
│       ├── users.module.ts                  # Exports UsersService for cross-module use
│       ├── users.controller.ts              # CRUD endpoints, uses UserResponseDto
│       ├── users.service.ts                 # Business logic, @Inject(USERS_REPOSITORY)
│       ├── users.repository.ts              # Interface + CreateUserData type + Symbol token
│       └── dto/
│           ├── create-user.dto.ts           # Input: name, email, password (validated)
│           └── user-response.dto.ts         # Output: static from()/fromMany(), excludes passwordHash
│
└── prisma/
    ├── contract.prisma                      # Prisma 8 schema (source of truth)
    ├── contract.json                        # Emitted contract (prisma contract emit)
    ├── contract.d.ts                        # Generated TypeScript types
    └── db.ts                                # createDb(url) factory + Db type alias
```

## Dependency Diagram

```
┌─────────────────────────────────────────────────────────┐
│                       AppModule                         │
│  ConfigModule.forRoot (global)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ DatabaseModule│  │ UsersModule  │  │  AuthModule   │  │
│  │   (@Global)   │  │              │  │              │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
└─────────┼──────────────────┼──────────────────┼─────────┘
          │                  │                  │
          ▼                  ▼                  ▼
  DB_FACADE (Prisma)   UsersService        AuthService
  PrismaUsersRepo       ↑ @Inject            ↑ depends on
    implements ─────► UsersRepository     UsersService (imported)
    (interface)        (Symbol token)     PasswordHasher (injected)
                                          TokenService (injected)
```

### Module Import Graph

```
AuthModule ──imports──► UsersModule
AuthModule ──imports──► AuthenticationModule (from @nestjs/authentication)
AppModule  ──imports──► DatabaseModule (global), UsersModule, AuthModule
DatabaseModule ────────► provides DB_FACADE + all repository tokens (global)
```

## Layer Responsibilities

| Layer | File Pattern | DOES | FORBIDDEN |
|-------|-------------|------|-----------|
| **Controller** | `*.controller.ts` | Receives HTTP, calls own service, returns DTO | Inject repositories, call DB, import other services, contain business logic |
| **Service** | `*.service.ts` | Orchestrates business logic, calls repository interface via `@Inject(TOKEN)` | Import Prisma, import `database/`, call DB directly, know about HTTP concepts |
| **Repository Interface** | `*.repository.ts` | Defines contract (interface + types + Symbol token) | Import Prisma, `@prisma/*`, or any ORM package |
| **Repository Impl** | `database/prisma-*.repository.ts` | Implements interface using `DB_FACADE` (Prisma), handles DB-specific errors (e.g., unique violation) | Export business types, be imported by feature modules |
| **DTO (input)** | `dto/*.dto.ts` | Declares validated request shape with `class-validator` + `class-transformer` | Contain logic, import services or repositories |
| **DTO (output)** | `dto/*-response.dto.ts` | Maps entity to safe public shape via static `from()` / `fromMany()` | Expose internal fields (e.g., `passwordHash`) |
| **DatabaseModule** | `database/database.module.ts` | `@Global`, creates `DB_FACADE`, binds Symbol tokens to Prisma implementations, closes DB on shutdown | Be imported by feature modules explicitly (it's global) |
| **Config** | `config/*.config.ts` | `registerAs` namespace, reads `process.env` | Contain validation logic (that's in `env.validation.ts`) |
| **Prisma layer** | `prisma/db.ts` | Factory `createDb(url)` returns typed client. Never reads env itself | Be imported outside `database/` |

## Cross-Feature Communication

A feature module that needs another feature's data:
1. `imports: [OtherModule]` in its `@Module` decorator.
2. Injects `OtherService` via constructor.
3. Never bypasses to the other module's repository or DTOs directly.

Example: `AuthModule` imports `UsersModule` and injects `UsersService`.

## Global Providers (registered in `main.ts`)

| Provider | Purpose |
|----------|---------|
| `GlobalValidationPipe` | `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true` |
| `HttpExceptionFilter` | Consistent JSON error shape, hides stack traces from clients |

