import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}

