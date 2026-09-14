import { Controller, Get, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { User } from './entities/user.entity.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto): User {
    return this.usersService.create(createUserDto);
  }

  @Get('count')
  count(): { count: number } {
    return { count: this.usersService.count() };
  }

  @Get()
  findAll(): User[] {
    return this.usersService.findAll();
  }
}
