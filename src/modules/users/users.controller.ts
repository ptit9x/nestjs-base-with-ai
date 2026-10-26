import { Controller, Get, Post, Body } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UserResponseDto } from './dto/user-response.dto.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.usersService.create(createUserDto);
    return UserResponseDto.from(user);
  }

  @Get('me')
  me(@CurrentUser() user: UserResponseDto): UserResponseDto {
    return user;
  }

  @Get('count')
  async count(): Promise<{ count: number }> {
    return { count: await this.usersService.count() };
  }

  @Get()
  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersService.findAll();
    return UserResponseDto.fromMany(users);
  }
}
