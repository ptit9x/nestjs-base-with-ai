import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PasswordHasher, TokenService } from '@nestjs/authentication';
import { UsersService } from '../users/users.service.js';
import type { RegisterDto } from './dto/register.dto.js';
import type { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
  ) {}

  async register(dto: RegisterDto): Promise<{ accessToken: string }> {
    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      password: dto.password,
    });

    const result = await this.tokenService.issue(String(user.id), {
      claims: { email: user.email },
    });

    return { accessToken: result.accessToken };
  }

  async login(dto: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.usersService.findByEmail(dto.email);

    // Pass undefined when user is absent — PasswordHasher runs a dummy
    // scrypt derivation so the response time is the same as for a real user.
    const isValid = await this.passwordHasher.verify(
      dto.password,
      user?.passwordHash,
    );

    if (!isValid || !user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Transparently rehash if the stored hash uses weaker parameters.
    if (this.passwordHasher.needsRehash(user.passwordHash)) {
      const newHash = await this.passwordHasher.hash(dto.password);
      await this.usersService.updatePasswordHash(user.id, newHash);
      this.logger.log(`Rehashed password for user ${user.id}`);
    }

    const result = await this.tokenService.issue(String(user.id), {
      claims: { email: user.email },
    });

    return { accessToken: result.accessToken };
  }
}
