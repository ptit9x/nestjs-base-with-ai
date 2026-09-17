import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from './contract.js';
import contractJson from './contract.json' with { type: 'json' };

/**
 * Creates a Prisma 8 PostgresClient bound to the given connection URL.
 * The caller (DatabaseModule) owns the URL — this factory never reads process.env.
 */
export function createDb(url: string) {
  return postgres<Contract>({ contractJson, url });
}

/** Convenience type for the return value of createDb(). */
export type Db = ReturnType<typeof createDb>;
