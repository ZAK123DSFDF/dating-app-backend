import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketServer,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { SocChatService } from './soc-chat.service';
import { Server } from 'socket.io';
import { CustomSocket } from 'types';
import { OnModuleInit } from '@nestjs/common';

@WebSocketGateway({
  handlePreflightRequest: false,
  cors: {
    origin: 'https://dating-app-front-two.vercel.app',
    credentials: true,
  },
})
export class SocChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  constructor(private readonly socChatService: SocChatService) {}

  @WebSocketServer() server: Server;
  private connectedUsers = new Map<string, CustomSocket>();
  onModuleInit() {
    console.log('this is websockets and its working');
    this.socChatService.setAllUsersOffline();
  }
  async handleConnection(client: CustomSocket) {
    const userId = client.handshake.query.id as string;
    client.userId = userId;

    if (this.connectedUsers.has(userId)) {
      console.warn(
        'User with ID',
        userId,
        'already connected, disconnecting old instance',
      );
      const oldSocket = this.connectedUsers.get(userId);
      this.connectedUsers.delete(userId);
      oldSocket.disconnect(true);
    }

    console.log('Client connected:', client.id);
    this.connectedUsers.set(userId, client);
    const userChats = await this.socChatService.getUserChats(userId);
    userChats.forEach((chat) => {
      client.join(chat.id);
    });

    await this.socChatService.updateUserStatus(userId, 'ONLINE');
  }

  async handleDisconnect(client: CustomSocket) {
    const userId = client.userId;
    console.log('Client disconnected:', client.id);
    if (this.connectedUsers.get(userId)?.id === client.id) {
      this.connectedUsers.delete(userId);
      await this.socChatService.updateUserStatus(userId, 'OFFLINE');
    }
  }

  @SubscribeMessage('newMessage')
  async handleNewMessage(
    @ConnectedSocket() client: CustomSocket,
    @MessageBody() payload: { chatId: string; content: string },
  ) {
    const userId = client.userId;
    const { chatId, content } = payload;
    console.log(`Received new message for chat ${chatId}: ${content}`);
    try {
      const message = await this.socChatService.createMessage(
        chatId,
        userId,
        content,
      );
      this.server.to(chatId).emit('newMessage1', message);
      const participants = await this.socChatService.getOtherParticipant(
        chatId,
        userId,
      );
      const deduct = await this.socChatService.deductCredits(userId, 2);
      client.emit('deduct', deduct);
      participants.forEach((participant) => {
        if (this.connectedUsers.has(participant.id)) {
          this.connectedUsers.get(participant.id).emit('notification', message);
        }
      });

      return message;
    } catch (error) {
      console.error('Error creating message:', error);
    }
  }

  @SubscribeMessage('markAsSeen')
  async handleMarkAsSeen(
    @ConnectedSocket() client: CustomSocket,
    @MessageBody() payload: { chatId: string; senderId: string },
  ) {
    const { chatId, senderId } = payload;
    console.log(
      `Marking messages as seen for chat ${chatId} by user ${senderId}`,
    );

    try {
      const updatedMessages = await this.socChatService.markMessagesAsSeen(
        chatId,
        senderId,
      );

      this.server.to(chatId).emit('messageSeen', { senderId, message: 'SEEN' });
      return updatedMessages;
    } catch (error) {
      console.error('Error marking messages as seen:', error);
    }
  }
  @SubscribeMessage('notificationSeen')
  async notificationSeen(
    @ConnectedSocket() client: CustomSocket,
    @MessageBody() payload: { chatId: string; senderId: string },
  ) {
    const { chatId, senderId } = payload;
    console.log(`message received from ${senderId} and ${chatId}`);
    const updatedMessages = await this.socChatService.markMessagesAsSeen(
      chatId,
      senderId,
    );
    this.server.to(chatId).emit('messageSeen1', { senderId, message: 'SEEN' });
    return updatedMessages;
  }
  @SubscribeMessage('testMessage')
  sendTestMessage() {
    console.log('Received test message');
    this.sendRandomMessage(this.server);
  }

  sendRandomMessage(server: Server) {
    server.emit('testMessage', {
      message: 'This is a test message from the server',
    });
    this.logEmittedUsers([...this.connectedUsers.keys()]);
  }

  sendMessage(server: Server, message: any) {
    server.emit('newMessage1', message);
  }

  sendMessageToParticipant(participantId: string, message: any) {
    this.server.to(participantId).emit('newMessage', message);
  }

  logEmittedUsers(userIds: string[]) {
    console.log('Message emitted to the following users:', userIds);
  }
  @SubscribeMessage('createChat')
  async createChat(
    client: CustomSocket,
    payload: { userId: string; otherUserId: string },
  ) {
    const { userId, otherUserId } = payload;
    const chat = await this.socChatService.CreateChat(userId, otherUserId);
    client.join(chat.id);
    const otherUserSocket = this.connectedUsers.get(otherUserId);
    if (otherUserSocket) {
      otherUserSocket.join(chat.id);
    }

    this.server.to(chat.id).emit('chatCreated', { chatId: chat.id, userId });
    return chat;
  }
  @SubscribeMessage('addCredit')
  async addCredit(client: CustomSocket, payload: { cardNumber: number }) {
    const { cardNumber } = payload;
    console.log('message received', cardNumber);
    const userId = client.userId;
    const credits = await this.socChatService.addCredits(userId, cardNumber);
    client.emit('addCredit', credits);
  }
}
