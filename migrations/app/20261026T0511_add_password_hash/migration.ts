#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/04db65cc4da77bf0d698b383318c926cdff88b5144cd5e77c91b2642b64b6176/contract';
import endContract from '../../snapshots/04db65cc4da77bf0d698b383318c926cdff88b5144cd5e77c91b2642b64b6176/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/635bc1afbca70c0b94adb5b791d5748346cfb1523fa1f83d5869052c6e88e52b/contract';
import startContract from '../../snapshots/635bc1afbca70c0b94adb5b791d5748346cfb1523fa1f83d5869052c6e88e52b/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'user',
        column: col('passwordHash', 'text', { notNull: true, default: { kind: 'value', value: '' }, codecRef: { codecId: 'pg/text@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
