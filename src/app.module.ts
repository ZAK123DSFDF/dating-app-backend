import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { SocChatModule } from './soc-chat/soc-chat.module';
import { StripeModule } from './stripe/stripe.module';
import { SocChatService } from './soc-chat/soc-chat.service';
import { SocChatGateway } from './soc-chat/soc-chat.gateway';

@Module({
  imports: [
    AuthModule,
    ChatModule,
    CloudinaryModule,
    SocChatModule,
    StripeModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
