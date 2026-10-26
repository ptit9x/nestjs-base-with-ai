import type { User } from '../users.repository.js';

/**
 * Public-facing user shape — passwordHash is deliberately excluded.
 * Used by every endpoint that returns user data.
 */
export class UserResponseDto {
  id: number;
  name: string;
  email: string;

  static from(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.name = user.name;
    dto.email = user.email;
    return dto;
  }

  static fromMany(users: User[]): UserResponseDto[] {
    return users.map(UserResponseDto.from);
  }
}
