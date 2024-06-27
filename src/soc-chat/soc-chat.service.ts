import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class SocChatService {
  constructor(private prisma: PrismaService) {}
  async updateUserStatus(
    userId: string,
    status: 'ONLINE' | 'OFFLINE',
  ): Promise<any> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { status },
    });
    return user;
  }
  async setAllUsersOffline() {
    await this.prisma.user.updateMany({
      data: { status: 'OFFLINE' },
    });
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
        include: {
          chat: true,
          sender: true,
        },
      });

      return message;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  async deductCredits(userId: string, amount: number): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }
    if (user.credits < amount) {
      throw new Error('Insufficient credits');
    }

    const value = await this.prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: amount } },
    });
    return value.credits;
  }
  async getOtherParticipant(chatId: string, userId: string): Promise<any[]> {
    try {
      const chat = await this.prisma.chat.findUnique({
        where: { id: chatId },
        include: {
          participants: {
            where: {
              id: {
                not: userId,
              },
            },
          },
        },
      });

      return chat ? chat.participants : [];
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  async getUserChats(userId: string): Promise<{ id: string }[]> {
    const allChat = await this.prisma.chat.findMany({
      where: {
        participants: {
          some: {
            id: userId,
          },
        },
      },
      select: {
        id: true,
      },
    });
    return allChat;
  }
  async markMessagesAsSeen(chatId: string, userId: string) {
    const updatedMessages = this.prisma.message.updateMany({
      where: {
        chatId,
        senderId: userId,
        status: 'UNSEEN',
      },
      data: {
        status: 'SEEN',
      },
    });
    return updatedMessages;
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
  async addCredits(userId: string, cardNumber: number): Promise<number> {
    const validCardNumber = 4242424242424242;
    if (cardNumber !== validCardNumber) {
      throw new Error('Invalid credit card number');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { credits: { increment: 100 } },
    });

    return updatedUser.credits;
  }
}
