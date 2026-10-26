import { IsEnum, IsInt, IsNotEmpty, IsString, Min, MinLength, validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsInt()
  @Min(1)
  PORT: number = 3000;

  @IsString()
  DATABASE_URL: string;

  @IsString()
  @MinLength(32)
  JWT_ACCESS_SECRET: string;

  @IsString()
  @IsNotEmpty()
  JWT_ISSUER: string;

  @IsString()
  @IsNotEmpty()
  JWT_AUDIENCE: string;
}

export function validate(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(`Config validation failed:\n${errors.toString()}`);
  }
  return validated;
}
