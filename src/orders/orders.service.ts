import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { MenuItem } from '../menus/entities/menu-item.entity';
import { CreateOrderDto, UpdateOrderStatusDto, AssignDriverDto } from './dto/order.dto';
import { OrderStatus, ORDER_STATUS_FLOW } from '../common/enums/order-status.enum';
import { PaymentMethod } from '../common/enums/payment-method.enum';
import { PaginationDto, PaginatedResponseDto } from '../common/dto';
import { CouponsService } from '../coupons/coupons.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(MenuItem)
    private readonly menuItemRepository: Repository<MenuItem>,
    private readonly couponsService: CouponsService,
  ) {}

  async create(clientId: string, dto: CreateOrderDto): Promise<Order> {
    // Resolve menu items and calculate subtotal
    let subtotal = 0;
    const orderItems: Partial<OrderItem>[] = [];

    for (const itemDto of dto.items) {
      const menuItem = await this.menuItemRepository.findOne({
        where: { id: itemDto.menuItemId, isAvailable: true },
      });
      if (!menuItem) {
        throw new BadRequestException(`Menu item ${itemDto.menuItemId} not found or unavailable`);
      }
      const lineTotal = Number(menuItem.price) * itemDto.quantity;
      subtotal += lineTotal;
      orderItems.push({
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: itemDto.quantity,
        notes: itemDto.notes || null,
      });
    }

    // Apply coupon discount
    let discount = 0;
    if (dto.couponCode) {
      discount = await this.couponsService.calculateDiscount(dto.couponCode, subtotal);
    }

    const deliveryFee = 3500; // Base delivery fee in COP
    const total = subtotal - discount + deliveryFee;

    const order = this.orderRepository.create({
      clientId,
      restaurantId: dto.restaurantId,
      subtotal,
      deliveryFee,
      discount,
      total,
      status: OrderStatus.PENDING,
      paymentMethod: dto.paymentMethod || PaymentMethod.CASH,
      address: dto.address,
      couponCode: dto.couponCode || null,
      timeline: [{ status: OrderStatus.PENDING, timestamp: new Date().toISOString() }],
    });

    const savedOrder = await this.orderRepository.save(order);

    // Save order items
    const items = orderItems.map((item) =>
      this.orderItemRepository.create({ ...item, orderId: savedOrder.id }),
    );
    await this.orderItemRepository.save(items);

    // Increment coupon usage
    if (dto.couponCode) {
      await this.couponsService.incrementUsage(dto.couponCode);
    }

    return this.findById(savedOrder.id);
  }

  async findById(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'client', 'restaurant', 'driver'],
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async findByClient(clientId: string, pagination: PaginationDto): Promise<PaginatedResponseDto<Order>> {
    const { page, limit } = pagination;
    const [data, total] = await this.orderRepository.findAndCount({
      where: { clientId },
      relations: ['items', 'restaurant'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findByRestaurant(
    restaurantId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<Order>> {
    const { page, limit } = pagination;
    const [data, total] = await this.orderRepository.findAndCount({
      where: { restaurantId },
      relations: ['items', 'client'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findByDriver(
    driverId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<Order>> {
    const { page, limit } = pagination;
    const [data, total] = await this.orderRepository.findAndCount({
      where: { driverId },
      relations: ['items', 'client', 'restaurant'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return new PaginatedResponseDto(data, total, page, limit);
  }

  async updateStatus(orderId: string, dto: UpdateOrderStatusDto): Promise<Order> {
    const order = await this.findById(orderId);
    const allowedTransitions = ORDER_STATUS_FLOW[order.status];

    if (!allowedTransitions.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${dto.status}. Allowed: ${allowedTransitions.join(', ')}`,
      );
    }

    order.status = dto.status;
    order.timeline.push({ status: dto.status, timestamp: new Date().toISOString() });

    return this.orderRepository.save(order);
  }

  async assignDriver(orderId: string, dto: AssignDriverDto): Promise<Order> {
    const order = await this.findById(orderId);
    order.driverId = dto.driverId;
    return this.orderRepository.save(order);
  }

  async findAll(pagination: PaginationDto): Promise<PaginatedResponseDto<Order>> {
    const { page, limit } = pagination;
    const [data, total] = await this.orderRepository.findAndCount({
      relations: ['items', 'client', 'restaurant', 'driver'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return new PaginatedResponseDto(data, total, page, limit);
  }
}
