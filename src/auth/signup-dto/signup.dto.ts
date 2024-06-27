import { IsEmail, IsNotEmpty, MinLength, IsEnum } from 'class-validator';
enum Sex {
  M = 'M',
  F = 'F',
}
export class SignupDto {
  @IsNotEmpty()
  name: string;
  @IsNotEmpty()
  @IsEmail()
  email: string;
  @IsNotEmpty()
  @MinLength(6)
  password: string;
  @IsNotEmpty()
  age: number;
  @IsEnum(Sex)
  sex: Sex;
}
