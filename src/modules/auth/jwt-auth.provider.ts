import { Injectable } from '@nestjs/common';
import { JwtBearerProvider, AuthenticationRegistry } from '@nestjs/authentication';
import type { JwtClaims } from '@nestjs/authentication';
import { UsersService } from '../users/users.service.js';
import { UserResponseDto } from '../users/dto/user-response.dto.js';

/**
 * Credential provider for JWT Bearer tokens.
 *
 * The package's global guard calls `validate()` on every authenticated
 * request. Returning `null` rejects the request with 401.
 */
@Injectable()
export class JwtAuth extends JwtBearerProvider<UserResponseDto> {
  constructor(
    private readonly usersService: UsersService,
    registry: AuthenticationRegistry,
  ) {
    super();
    registry.registerProvider(this);
  }

  /**
   * Called after the token's signature and standard claims (exp, iss, aud)
   * are verified. Loads the current user from the database — if the user
   * was deleted after the token was issued, this returns null and the
   * guard rejects the request.
   */
  async validate({ sub }: JwtClaims): Promise<UserResponseDto | null> {
    if (!sub) return null;

    const userId = typeof sub === 'string' ? parseInt(sub, 10) : sub;
    if (Number.isNaN(userId)) return null;

    const user = await this.usersService.findById(userId);
    return user ? UserResponseDto.from(user) : null;
  }
}
