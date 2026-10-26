import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { DB_FACADE } from './db-facade.token.js';
import type { Db } from '../prisma/db.js';
import type { UsersRepository, User, CreateUserData } from '../modules/users/users.repository.js';

@Injectable()
export class PrismaUsersRepository implements UsersRepository {
  constructor(@Inject(DB_FACADE) private readonly db: Db) {}

  async create(data: CreateUserData): Promise<User> {
    try {
      return await this.db.orm.public.User.create({
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
      });
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('A user with this email already exists');
      }
      throw error;
    }
  }

  async findAll(): Promise<User[]> {
    return this.db.orm.public.User.all();
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.db.orm.public.User.where({ email }).first();
    return user ?? null;
  }

  async findById(id: number): Promise<User | null> {
    const user = await this.db.orm.public.User.where({ id }).first();
    return user ?? null;
  }

  async updatePasswordHash(id: number, passwordHash: string): Promise<void> {
    await this.db.orm.public.User.where({ id }).update({ passwordHash });
  }

  async count(): Promise<number> {
    const result = await this.db.orm.public.User.aggregate(
      (a) => ({ total: a.count() }),
    );
    return result.total;
  }

  /**
   * Prisma 8 surfaces native pg errors as SqlQueryError — unique
   * violations carry PostgreSQL SQLSTATE 23505 on the `sqlState` property.
   */
  private isUniqueViolation(error: unknown): boolean {
    return (
      error instanceof Error &&
      'sqlState' in error &&
      (error as { sqlState: string }).sqlState === '23505'
    );
  }
}
