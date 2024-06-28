import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtService } from '@nestjs/jwt';

import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtService, CloudinaryService],
})
export class AuthModule {}
