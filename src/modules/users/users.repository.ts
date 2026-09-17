import type { Models } from '../../prisma/contract.js';
import type { CreateUserDto } from './dto/create-user.dto.js';

export type User = Models.public_User;

export interface UsersRepository {
  create(dto: CreateUserDto): Promise<User>;
  findAll(): Promise<User[]>;
  count(): Promise<number>;
}

/** Injection token for the UsersRepository contract. */
export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');
