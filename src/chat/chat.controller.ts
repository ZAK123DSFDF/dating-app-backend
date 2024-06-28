import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Request,
  Response,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chat: ChatService,
    private jwt: JwtService,
  ) {}
  @Get('user')
  @UseGuards(JwtAuthGuard)
  async Chat(@Request() req, @Response() res, @Query('name') name: string) {
    try {
      const id = await this.jwt.decode(req.cookies['token']).user;
      const AllChat = await this.chat.findChatsByUserId(id, name);
      console.log('this is all chats', AllChat);
      res.status(200).json(AllChat);
    } catch (error) {
      console.log(error);
      res.status(500).json(error);
    }
  }
  @Post('create/:userId')
  @UseGuards(JwtAuthGuard)
  async CreateChat(
    @Request() req,
    @Response() res,
    @Param('userId') userId: string,
  ) {
    try {
      const id = await this.jwt.decode(req.cookies['token']).user;
      const createdChat = await this.chat.CreateChat(id, userId);
      res.status(200).json(createdChat);
    } catch (error) {
      console.log(error);
      res.status(500).json(error.message);
    }
  }
  @Get('allmessages/:id')
  @UseGuards(JwtAuthGuard)
  async GetMessages(
    @Request() req,
    @Response() res,
    @Param('id') chatId: string,
  ) {
    try {
      const id = await this.jwt.decode(req.cookies['token']).user;
      const AllMessage = await this.chat.getMessages(id, chatId);
      res.status(200).json(AllMessage);
    } catch (error) {
      console.log(error);
      res.status(500).json(error.message);
    }
  }
  @Post('message/:chatId')
  @UseGuards(JwtAuthGuard)
  async CreateMessage(
    @Request() req,
    @Response() res,
    @Param('chatId') chatId: string,
    @Body() body: { content: string },
  ) {
    try {
      const id = await this.jwt.decode(req.cookies['token']).user;
      const { content } = body;
      const Message = await this.chat.createMessage(chatId, id, content);
      console.log('message sent successfully');
      res.status(200).json(Message);
    } catch (error) {
      console.log(error);
      res.status(500).json(error.message);
    }
  }
  @Get('notification')
  @UseGuards(JwtAuthGuard)
  async Notification(@Request() req, @Response() res) {
    try {
      const id = await this.jwt.decode(req.cookies['token']).user;
      const Notification = await this.chat.Notification(id);
      res.status(200).json(Notification);
    } catch (error) {
      console.log(error);
      res.status(500).json(error.message);
    }
  }
  @Delete('allMessages')
  async DeleteAll() {
    try {
      const deleted = await this.chat.deleteAll();
      return deleted;
    } catch (error) {
      console.log(error);
    }
  }
  @Delete('allChats')
  async DeleteAllChats() {
    try {
      const deletedChats = await this.chat.deleteAllChats();
      return deletedChats;
    } catch (error) {
      console.log(error);
    }
  }
}
