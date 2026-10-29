---
name: nest-feature
description: |
  Scaffold a new NestJS business feature module.
  USE when: adding a new domain entity with API endpoints, repository, and DTOs.
  DO NOT USE when: modifying an existing feature, adding a global pipe/filter,
  changing config, or working on the database layer directly.
---

# nest-feature — Scaffold a NestJS Feature Module

## Before You Start

Read these references to understand the project architecture:

1. **Always read first:** `AGENTS.md` (repo root)
2. **Architecture reference:** `.agents/skills/nest-feature/references/architecture.md`
3. **Database conventions:** `docs/database-schema.md`

## Rules

### 1. Read References Before Writing Code

Read the three files listed above. Do not skip this step. They contain
dependency rules, banned patterns, and the exact file structure to follow.

### 2. Present a Plan Before Coding

Before creating any file, present a numbered list of files you will create
and their responsibilities. Wait for approval. The plan must include:

- The feature module, controller, service, repository interface, DTOs
- The Prisma repository implementation in `src/database/`
- The repository token binding in `DatabaseModule`
- Any `contract.prisma` model changes

### 3. Thin Controllers

Controllers receive HTTP requests and return responses. They must:

- Call only their own service (one method call per endpoint).
- Map results to output DTOs before returning.
- Contain zero business logic — no conditionals, no data transformation, no error handling beyond what NestJS provides.

```typescript
// ✅ CORRECT — thin controller
@Post()
async create(@Body() dto: CreateOrderDto): Promise<OrderResponseDto> {
  const order = await this.ordersService.create(dto);
  return OrderResponseDto.from(order);
}

// ❌ WRONG — logic in controller
@Post()
async create(@Body() dto: CreateOrderDto) {
  if (dto.quantity > 100) throw new BadRequestException('Too many');
  const order = await this.ordersService.create(dto);
  return { id: order.id, total: order.price * order.quantity };
}
```

### 4. Explicit Business Rules Per Feature

Each service must contain business rules specific to its domain. Do not
create generic CRUD wrappers that simply proxy repository calls. Every
service method should express a business intent.

```typescript
// ✅ CORRECT — business intent
async placeOrder(dto: PlaceOrderDto): Promise<Order> {
  const inventory = await this.inventory.checkStock(dto.productId);
  if (inventory.available < dto.quantity) {
    throw new ConflictException('Insufficient stock');
  }
  return this.orders.create({ ...dto, status: 'confirmed' });
}

// ❌ WRONG — generic CRUD proxy
async create(dto: CreateOrderDto): Promise<Order> {
  return this.orders.create(dto);
}
```

### 5. No Generic CRUD

Do not generate a full set of CRUD endpoints by default. Create only the
endpoints the feature actually needs. Each endpoint must have a reason
stated in your plan.

### 6. Repository Contracts Without Prisma Imports

The repository interface file (`<feature>.repository.ts`) defines:
- A domain type (aliased from Prisma's generated `Models`)
- Input data interfaces
- The repository interface
- A Symbol injection token

It must **never** import `@prisma/orm-postgres`, `DB_FACADE`, or any database package.

```typescript
// ✅ CORRECT — src/modules/orders/orders.repository.ts
import type { Models } from '../../prisma/contract.js';

export type Order = Models.public_Order;

export interface CreateOrderData {
  productId: number;
  quantity: number;
}

export interface OrdersRepository {
  create(data: CreateOrderData): Promise<Order>;
  findById(id: number): Promise<Order | null>;
}

export const ORDERS_REPOSITORY = Symbol('ORDERS_REPOSITORY');
```

The Prisma implementation goes in `src/database/prisma-orders.repository.ts`
and is wired via `DatabaseModule`.

### 7. Prisma 8 Only — Banned Patterns

**These will break the build.** Do not use them under any circumstance:

| Banned | Correct |
|--------|---------|
| `import { PrismaClient } from '@prisma/client'` | `import postgres from '@prisma/orm-postgres/runtime'` |
| `new PrismaClient()` | `createDb(url)` via `DB_FACADE` |
| `prisma.model.create({ data: { ... } })` | `db.orm.public.Model.create({ ... })` |
| `prisma.model.findUnique({ where })` | `db.orm.public.Model.where({ ... }).first()` |
| `schema.prisma` | `contract.prisma` |
| `npx prisma migrate dev` | `npm run migration:plan` + `npm run db:migrate` |
| `npx prisma generate` | `npm run contract:emit` |

### 8. DTO Conventions

**Input DTOs** — use `class-validator` decorators and `@Transform` for sanitisation:

```typescript
export class CreateOrderDto {
  @IsInt()
  @Min(1)
  productId: number;

  @IsInt()
  @Min(1)
  quantity: number;
}
```

**Output DTOs** — static factory methods, explicitly exclude internal fields:

```typescript
export class OrderResponseDto {
  id: number;
  productId: number;
  quantity: number;
  status: string;

  static from(order: Order): OrderResponseDto { ... }
  static fromMany(orders: Order[]): OrderResponseDto[] { ... }
}
```

### 9. Wire the Repository in DatabaseModule

After creating the Prisma implementation, add the binding to
`src/database/database.module.ts`:

```typescript
{
  provide: ORDERS_REPOSITORY,
  useClass: PrismaOrdersRepository,
},
```

Export the token in the `exports` array.

### 10. Verification After Every Change

After creating or modifying any file, run:

```bash
npm run lint            # Must pass with zero errors
npm run test            # Must pass all unit tests
```

If you changed `contract.prisma`, also run the full migration workflow:

```bash
npm run contract:emit
npm run migration:plan
npm run migration:check
npm run db:migrate
npm run db:verify
```

Do not consider the task complete until all checks pass.

