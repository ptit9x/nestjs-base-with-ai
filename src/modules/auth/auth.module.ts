import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthenticationModule } from '@nestjs/authentication';
import type { Duration } from '@nestjs/authentication';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuth } from './jwt-auth.provider.js';

@Module({
  imports: [
    UsersModule,
    AuthenticationModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        accessToken: {
          key: config.getOrThrow<string>('auth.accessSecret'),
          issuer: config.getOrThrow<string>('auth.issuer'),
          audience: config.getOrThrow<string>('auth.audience'),
          ttl: (config.get<string>('auth.accessTtl') ?? '15m') as Duration,
        },
        refreshToken: false as const,
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuth],
})
export class AuthModule {}
