import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Order } from '../orders/entities/order.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { Driver } from '../drivers/entities/driver.entity';
import { AdminUpdateUserDto } from '../users/dto/update-user.dto';
import { OrderStatus } from '../common/enums/order-status.enum';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
  ) {}

  async getDashboardStats() {
    const [totalUsers, totalRestaurants, totalDrivers, totalOrders] = await Promise.all([
      this.userRepository.count(),
      this.restaurantRepository.count(),
      this.driverRepository.count(),
      this.orderRepository.count(),
    ]);

    const activeOrders = await this.orderRepository.count({
      where: [
        { status: OrderStatus.PENDING },
        { status: OrderStatus.CONFIRMED },
        { status: OrderStatus.PREPARING },
        { status: OrderStatus.READY },
        { status: OrderStatus.PICKED_UP },
      ],
    });

    const revenue = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.total)', 'total')
      .where('order.status = :status', { status: OrderStatus.DELIVERED })
      .getRawOne();

    return {
      totalUsers,
      totalRestaurants,
      totalDrivers,
      totalOrders,
      activeOrders,
      totalRevenue: revenue?.total ? parseFloat(revenue.total) : 0,
    };
  }

  async updateUser(userId: string, dto: AdminUpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }
    Object.assign(user, dto);
    return this.userRepository.save(user);
  }

  async deactivateUser(userId: string): Promise<void> {
    await this.userRepository.update(userId, { isActive: false });
  }

  async activateUser(userId: string): Promise<void> {
    await this.userRepository.update(userId, { isActive: true });
  }
}
