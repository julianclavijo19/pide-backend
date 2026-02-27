import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from './entities/chat-message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
  ) {}

  async saveMessage(orderId: string, senderId: string, content: string): Promise<ChatMessage> {
    const message = this.chatMessageRepository.create({ orderId, senderId, content });
    return this.chatMessageRepository.save(message);
  }

  async getMessages(orderId: string): Promise<ChatMessage[]> {
    return this.chatMessageRepository.find({
      where: { orderId },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
    });
  }
}
