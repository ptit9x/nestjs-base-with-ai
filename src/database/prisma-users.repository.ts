import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { DB_FACADE } from './db-facade.token.js';
import type { Db } from '../prisma/db.js';
import type { UsersRepository, User } from '../modules/users/users.repository.js';
import type { CreateUserDto } from '../modules/users/dto/create-user.dto.js';

@Injectable()
export class PrismaUsersRepository implements UsersRepository {
  constructor(@Inject(DB_FACADE) private readonly db: Db) {}

  async create(dto: CreateUserDto): Promise<User> {
    try {
      return await this.db.orm.public.User.create(dto);
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

  async count(): Promise<number> {
    const result = await this.db.orm.public.User.aggregate(
      (a) => ({ total: a.count() }),
    );
    return result.total;
  }

  /**
   * Prisma 8 surfaces native pg errors — unique violations are
   * PostgreSQL SQLSTATE 23505, not the legacy P2002 code.
   */
  private isUniqueViolation(error: unknown): boolean {
    return (
      error instanceof Error &&
      'code' in error &&
      (error as { code: string }).code === '23505'
    );
  }
}
