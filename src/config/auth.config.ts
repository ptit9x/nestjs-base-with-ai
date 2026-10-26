import { registerAs } from '@nestjs/config';

export const authConfig = registerAs('auth', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET,
  issuer: process.env.JWT_ISSUER,
  audience: process.env.JWT_AUDIENCE,
  accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
}));
