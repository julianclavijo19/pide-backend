import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { CreateRestaurantDto, UpdateRestaurantDto } from './dto/restaurant.dto';
import { PaginationDto, PaginatedResponseDto } from '../common/dto';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
  ) {}

  async create(ownerId: string, dto: CreateRestaurantDto): Promise<Restaurant> {
    const restaurant = this.restaurantRepository.create({
      ...dto,
      ownerId,
    });
    return this.restaurantRepository.save(restaurant);
  }

  async findAll(pagination: PaginationDto): Promise<PaginatedResponseDto<Restaurant>> {
    const { page, limit } = pagination;
    const [data, total] = await this.restaurantRepository.findAndCount({
      where: { isActive: true },
      skip: (page - 1) * limit,
      take: limit,
      order: { avgRating: 'DESC' },
    });
    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findById(id: string): Promise<Restaurant> {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id },
      relations: ['categories', 'categories.items'],
    });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }
    return restaurant;
  }

  async findByOwner(ownerId: string): Promise<Restaurant[]> {
    return this.restaurantRepository.find({ where: { ownerId } });
  }

  async update(
    id: string,
    dto: UpdateRestaurantDto,
    userId: string,
    userRole: Role,
  ): Promise<Restaurant> {
    const restaurant = await this.findById(id);
    if (userRole !== Role.ADMIN && restaurant.ownerId !== userId) {
      throw new ForbiddenException('You can only update your own restaurant');
    }
    Object.assign(restaurant, dto);
    return this.restaurantRepository.save(restaurant);
  }

  async toggleOpen(id: string, userId: string, userRole: Role): Promise<Restaurant> {
    const restaurant = await this.findById(id);
    if (userRole !== Role.ADMIN && restaurant.ownerId !== userId) {
      throw new ForbiddenException('You can only update your own restaurant');
    }
    restaurant.isOpen = !restaurant.isOpen;
    return this.restaurantRepository.save(restaurant);
  }

  async updateRating(restaurantId: string, newAvg: number): Promise<void> {
    await this.restaurantRepository.update(restaurantId, { avgRating: newAvg });
  }

  async incrementOrderCount(restaurantId: string): Promise<void> {
    await this.restaurantRepository.increment({ id: restaurantId }, 'totalOrders', 1);
  }

  async delete(id: string): Promise<void> {
    const restaurant = await this.findById(id);
    await this.restaurantRepository.remove(restaurant);
  }
}
