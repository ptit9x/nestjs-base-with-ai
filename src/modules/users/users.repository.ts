import type { Models } from '../../prisma/contract.js';

export type User = Models.public_User;

export interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
}

export interface UsersRepository {
  create(data: CreateUserData): Promise<User>;
  findAll(): Promise<User[]>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: number): Promise<User | null>;
  updatePasswordHash(id: number, passwordHash: string): Promise<void>;
  count(): Promise<number>;
}

/** Injection token for the UsersRepository contract. */
export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');


