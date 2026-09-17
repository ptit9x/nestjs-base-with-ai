import { Inject, Injectable } from '@nestjs/common';
import type { CreateUserDto } from './dto/create-user.dto.js';
import { USERS_REPOSITORY, type UsersRepository, type User } from './users.repository.js';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY) private readonly users: UsersRepository,
  ) {}

  create(dto: CreateUserDto): Promise<User> {
    return this.users.create(dto);
  }

  findAll(): Promise<User[]> {
    return this.users.findAll();
  }

  count(): Promise<number> {
    return this.users.count();
  }
}
