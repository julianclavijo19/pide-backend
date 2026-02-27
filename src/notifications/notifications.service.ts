import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as admin from 'firebase-admin';
import { Notification } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';
import { SendNotificationDto } from './dto/notification.dto';
import { PaginationDto, PaginatedResponseDto } from '../common/dto';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    if (!admin.apps.length) {
      const projectId = this.configService.get<string>('firebase.projectId');
      const clientEmail = this.configService.get<string>('firebase.clientEmail');
      const privateKey = this.configService.get<string>('firebase.privateKey');

      if (projectId && clientEmail && privateKey) {
        admin.initializeApp({
          credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
        });
        this.logger.log('Firebase Admin SDK initialized');
      } else {
        this.logger.warn('Firebase credentials not provided, push notifications disabled');
      }
    }
  }

  async send(dto: SendNotificationDto): Promise<Notification> {
    // Save to database
    const notification = this.notificationRepository.create({
      userId: dto.userId,
      title: dto.title,
      body: dto.body,
      data: dto.data || null,
    });
    const saved = await this.notificationRepository.save(notification);

    // Send FCM push notification
    const user = await this.userRepository.findOne({ where: { id: dto.userId } });
    if (user?.fcmToken && admin.apps.length > 0) {
      try {
        await admin.messaging().send({
          token: user.fcmToken,
          notification: { title: dto.title, body: dto.body },
          data: dto.data ? this.stringifyData(dto.data) : undefined,
        });
      } catch (error) {
        this.logger.error(`Failed to send FCM notification: ${error}`);
      }
    }

    return saved;
  }

  async findByUser(
    userId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<Notification>> {
    const { page, limit } = pagination;
    const [data, total] = await this.notificationRepository.findAndCount({
      where: { userId },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return new PaginatedResponseDto(data, total, page, limit);
  }

  async markAsRead(id: string, userId: string): Promise<void> {
    await this.notificationRepository.update({ id, userId }, { isRead: true });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update({ userId, isRead: false }, { isRead: true });
  }

  private stringifyData(data: Record<string, any>): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = typeof value === 'string' ? value : JSON.stringify(value);
    }
    return result;
  }
}
