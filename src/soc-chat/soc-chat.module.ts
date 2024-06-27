import { Module } from '@nestjs/common';
import { SocChatService } from './soc-chat.service';
import { SocChatGateway } from './soc-chat.gateway';
import { PrismaService } from 'src/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  providers: [SocChatGateway, SocChatService, PrismaService, JwtService],
})
export class SocChatModule {}
