import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { UseGuards, Inject, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@WebSocketGateway({
  namespace: '/tracking',
  cors: { origin: '*' },
})
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(TrackingGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('jwt.accessSecret'),
      });

      (client as any).user = payload;
      this.logger.log(`Client connected to tracking: ${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from tracking: ${client.id}`);
  }

  @SubscribeMessage('driver:update-location')
  async handleDriverLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { lat: number; lng: number; orderId?: string },
  ) {
    const user = (client as any).user;
    if (!user || user.role !== 'DRIVER') return;

    // Store in Redis
    const key = `driver:location:${user.sub}`;
    await this.redis.set(
      key,
      JSON.stringify({ lat: data.lat, lng: data.lng, updatedAt: new Date().toISOString() }),
      'EX',
      300,
    );

    // Broadcast to order room if orderId provided
    if (data.orderId) {
      this.server.to(`order:${data.orderId}`).emit('driver:location', {
        driverId: user.sub,
        lat: data.lat,
        lng: data.lng,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('order:subscribe')
  async handleSubscribeOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string },
  ) {
    await client.join(`order:${data.orderId}`);
    this.logger.log(`Client ${client.id} joined order room: ${data.orderId}`);
  }

  @SubscribeMessage('order:unsubscribe')
  async handleUnsubscribeOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string },
  ) {
    await client.leave(`order:${data.orderId}`);
  }

  // Called from OrdersService when status changes
  emitOrderStatusUpdate(orderId: string, status: string) {
    this.server.to(`order:${orderId}`).emit('order:status-updated', {
      orderId,
      status,
      timestamp: new Date().toISOString(),
    });
  }
}
