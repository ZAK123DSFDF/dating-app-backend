import { Module } from '@nestjs/common';
import { SocChatService } from './soc-chat.service';
import { SocChatGateway } from './soc-chat.gateway';
import { JwtService } from '@nestjs/jwt';

@Module({
  providers: [SocChatGateway, SocChatService, JwtService],
})
export class SocChatModule {}
