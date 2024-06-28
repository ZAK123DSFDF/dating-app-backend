import { Module } from '@nestjs/common';
import { SocChatService } from './soc-chat.service';
import { SocChatGateway } from './soc-chat.gateway';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma.service';

@Module({
  providers: [SocChatGateway, SocChatService, JwtService, PrismaService],
})
export class SocChatModule {}
