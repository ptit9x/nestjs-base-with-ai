# Architecture Reference

> Loaded on demand by the `nest-feature` skill. Describes the current project structure,
> dependency rules, and layer responsibilities.

## Directory Tree

```
src/
├── main.ts                                  # Bootstrap: NestFactory, global pipes/filters
├── app.module.ts                            # Root: ConfigModule.forRoot, DatabaseModule, feature modules
├── app.controller.ts                        # GET / health endpoint (@Public)
├── app.service.ts                           # Root service
│
├── common/
│   ├── filters/http-exception.filter.ts     # Global catch-all, consistent JSON errors
│   └── pipes/validation.pipe.ts             # whitelist + forbidNonWhitelisted + transform
│
├── config/
│   ├── app.config.ts                        # registerAs('app') — NODE_ENV, PORT
│   ├── auth.config.ts                       # registerAs('auth') — JWT config
│   ├── database.config.ts                   # registerAs('database') — DATABASE_URL
│   └── env.validation.ts                    # class-validator startup gate
│
├── database/
│   ├── database.module.ts                   # @Global — DB_FACADE + all repository bindings
│   ├── db-facade.token.ts                   # Symbol('DB_FACADE')
│   ├── index.ts                             # Barrel export
│   └── prisma-users.repository.ts           # UsersRepository implementation
│
├── modules/
│   ├── auth/                                # Auth feature
│   │   ├── auth.module.ts                   # Imports UsersModule + AuthenticationModule
│   │   ├── auth.controller.ts               # POST /auth/register, POST /auth/login
│   │   ├── auth.service.ts                  # register/login orchestration
│   │   ├── jwt-auth.provider.ts             # Token validation + user loading
│   │   └── dto/
│   │       ├── login.dto.ts
│   │       └── register.dto.ts
│   │
│   └── users/                               # Users feature
│       ├── users.module.ts                  # Exports UsersService
│       ├── users.controller.ts              # CRUD endpoints
│       ├── users.service.ts                 # Business logic via @Inject(USERS_REPOSITORY)
│       ├── users.repository.ts              # Interface + Symbol token (NO Prisma imports)
│       └── dto/
│           ├── create-user.dto.ts
│           └── user-response.dto.ts
│
└── prisma/
    ├── contract.prisma                      # Schema source of truth
    ├── contract.json                        # Emitted contract
    ├── contract.d.ts                        # Generated types
    └── db.ts                                # createDb(url) factory
```

## Dependency Diagram

```
                    ┌─────────────┐
                    │  AppModule  │
                    └──────┬──────┘
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
   │DatabaseModule│ │ UsersModule  │ │  AuthModule   │
   │  (@Global)   │ │              │ │              │
   └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
          │                │                │
          │         UsersController    AuthController
          │                │                │
          │          UsersService ◄──── AuthService
          │             │                   │
          │    @Inject(USERS_REPOSITORY)    │
          │             │                   │
          ▼             ▼                   │
   PrismaUsersRepo ◄── UsersRepository     │
   (implements)        (interface)          │
          │                                 │
     DB_FACADE ◄────────────────────────────┘
     (Prisma Db)       (via UsersService, never direct)
```

### Arrows Mean "Depends On"

- `AuthModule` → `UsersModule` (module import)
- `AuthService` → `UsersService` (constructor injection, via module import)
- `UsersService` → `UsersRepository` interface (Symbol token injection)
- `PrismaUsersRepository` → `DB_FACADE` (Symbol token injection)
- `DatabaseModule` wires: `DB_FACADE` + `USERS_REPOSITORY` → `PrismaUsersRepository`

## Layer Explanation

### Controller Layer

**Purpose:** HTTP boundary — parse request, call service, return DTO.

- One service dependency (its own).
- Returns output DTOs, never raw entities.
- No business logic, no conditionals on domain data.

### Service Layer

**Purpose:** Business logic and orchestration.

- Depends on repository interfaces via `@Inject(SYMBOL_TOKEN)`.
- May depend on other feature services (via module imports).
- May depend on NestJS-provided services (`PasswordHasher`, `TokenService`).
- Never imports from `src/database/` or `@prisma/*`.

### Repository Interface (Port)

**Purpose:** Contract between service and persistence.

- Defines: domain type alias, input data types, method signatures, Symbol token.
- Imports only from `../../prisma/contract.js` (for the type alias).
- No runtime dependencies. No decorators. Pure TypeScript interface.

### Repository Implementation (Adapter)

**Purpose:** Prisma-specific persistence logic.

- Lives in `src/database/prisma-<feature>.repository.ts`.
- Implements the interface from the feature module.
- Translates DB errors to NestJS exceptions (e.g., unique violation → `ConflictException`).
- Injected with `DB_FACADE` to access the Prisma client.

### DatabaseModule

**Purpose:** Owns all database concerns.

- `@Global()` — available everywhere without explicit import.
- Creates `DB_FACADE` from config URL.
- Binds every `*_REPOSITORY` Symbol token to its Prisma implementation.
- Closes DB connection on shutdown (`OnApplicationShutdown`).

### Config Layer

**Purpose:** Environment-aware, typed configuration.

- Each namespace is a `registerAs` factory in `src/config/`.
- All loaded in `AppModule` → `ConfigModule.forRoot({ load: [...] })`.
- Startup validation via `env.validation.ts` — app crashes if config is invalid.

