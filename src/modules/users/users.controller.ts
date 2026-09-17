import { Controller, Get, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import type { User } from './users.repository.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Get('count')
  async count(): Promise<{ count: number }> {
    return { count: await this.usersService.count() };
  }

  @Get()
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }
}

