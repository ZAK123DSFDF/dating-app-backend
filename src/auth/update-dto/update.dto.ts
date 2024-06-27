import { IsEmail, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class UpdateDto {
  @IsOptional()
  @IsNotEmpty()
  name: string;
  @IsOptional()
  @IsNotEmpty()
  @IsEmail()
  email: string;
  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  age: number;
}
