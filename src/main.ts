import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import * as cookieParser from 'cookie-parser';
const bodyParser = require('body-parser');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.use(cookieParser());
  app.use('/stripe/webhook', bodyParser.raw({ type: 'application/json' }));
  app.useWebSocketAdapter(new IoAdapter(app));
  app.enableCors({
    origin: [
      'https://dating-app-front.vercel.app',
      'http://localhost:3000',
      'https://dating-app-front.onrender.com',
      'https://dating-app-front-two.vercel.app',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  await app.listen(4000);
}
bootstrap();
