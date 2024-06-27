import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}
  async findChatsByUserId(
    userId: string,
    participantName: string,
  ): Promise<any> {
    try {
      const userChats = await this.prisma.chat.findMany({
        where: {
          participants: {
            some: {
              id: userId,
            },
          },
        },
        include: {
          participants: {
            where: {
              NOT: { id: { equals: userId } },
            },
          },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      });
      console.log('user chats',userChats)
      // Filter chats by exact participant name if provided
      const filteredChats = participantName
        ? userChats.filter((chat) =>
            chat.participants.some(
              (participant) => participant.name === participantName,
            ),
          )
        : userChats;
      console.log('this is the chat',filteredChats);
      return filteredChats;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  async CreateChat(id: string, userId: string) {
    try {
      const existingChat = await this.prisma.chat.findFirst({
        where: {
          AND: [
            { participants: { some: { id } } },
            { participants: { some: { id: userId } } },
          ],
        },
      });
      if (existingChat) {
        return existingChat;
      }
      const chat = await this.prisma.chat.create({
        data: {
          participants: {
            connect: [{ id }, { id: userId }],
          },
        },
        include: {
          messages: true,
        },
      });
      return chat;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
  async getMessages(userId: string, id: string) {
    try {
      const chat = await this.prisma.chat.findUnique({
        where: { id },
        include: {
          messages: true,
          participants: {
            where: {
              NOT: { id: { equals: userId } },
            },
          },
        },
      });
      return chat;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
  async createMessage(
    chatId: string,
    senderId: string,
    content: string,
  ): Promise<any> {
    try {
      const message = await this.prisma.message.create({
        data: {
          chat: {
            connect: { id: chatId },
          },
          sender: {
            connect: { id: senderId },
          },
          content: content,
          createdAt: new Date(),
        },
      });

      return message;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  async Notification(userId: string): Promise<any> {
    try {
      const Notification = await this.prisma.chat.findMany({
        where: {
          participants: { some: { id: userId } },
          messages: {
            some: {
              status: 'UNSEEN',
              senderId: { not: userId },
            },
          },
        },
        include: {
          participants: {
            where: {
              id: { not: userId },
            },
          },
          messages: {
            where: {
              status: 'UNSEEN',
              senderId: { not: userId },
            },
            orderBy: { createdAt: 'desc' },
            include: {
              sender: true,
            },
          },
        },
      });
      return Notification;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
  async deleteAll() {
    const deleteMessages = this.prisma.message.deleteMany();
    return deleteMessages;
  }
  async deleteAllChats(){
    const deleteChats=this.prisma.chat.deleteMany()
  }
}
