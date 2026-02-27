import { Module, Global, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

const logger = new Logger('RedisModule');

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const url = configService.get<string>('redis.url');
        if (!url) {
          logger.warn('REDIS_URL is not defined, using mock Redis client');
          return null;
        }
        const client = new Redis(url, {
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          tls: url.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
        });
        client.on('error', (err) => logger.error('Redis error:', err.message));
        client.on('connect', () => logger.log('Connected to Redis (Upstash)'));
        return client;
      },
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
