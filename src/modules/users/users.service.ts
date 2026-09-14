import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import { User } from './entities/user.entity.js';

@Injectable()
export class UsersService {
  private readonly users: User[] = [];
  private idCounter = 1;

  create(createUserDto: CreateUserDto): User {
    const newUser: User = {
      id: this.idCounter++,
      ...createUserDto,
    };
    this.users.push(newUser);
    return newUser;
  }

  findAll(): User[] {
    return this.users;
  }

  count(): number {
    return this.users.length;
  }
}
