import { Inject, Injectable } from '@nestjs/common';
import { PasswordHasher } from '@nestjs/authentication';
import type { CreateUserDto } from './dto/create-user.dto.js';
import { USERS_REPOSITORY, type UsersRepository, type User } from './users.repository.js';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY) private readonly users: UsersRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const passwordHash = await this.passwordHasher.hash(dto.password);
    return this.users.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
    });
  }

  findAll(): Promise<User[]> {
    return this.users.findAll();
  }

  findByEmail(email: string): Promise<User | null> {
    return this.users.findByEmail(email);
  }

  findById(id: number): Promise<User | null> {
    return this.users.findById(id);
  }

  updatePasswordHash(id: number, passwordHash: string): Promise<void> {
    return this.users.updatePasswordHash(id, passwordHash);
  }

  count(): Promise<number> {
    return this.users.count();
  }
}
