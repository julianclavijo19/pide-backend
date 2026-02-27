import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Redis from 'ioredis';
import { Driver } from './entities/driver.entity';
import {
  CreateDriverProfileDto,
  UpdateDriverProfileDto,
  UpdateLocationDto,
} from './dto/driver.dto';
import { PaginationDto, PaginatedResponseDto } from '../common/dto';

@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {}

  async createProfile(userId: string, dto: CreateDriverProfileDto): Promise<Driver> {
    const existing = await this.driverRepository.findOne({ where: { userId } });
    if (existing) {
      throw new ConflictException('Driver profile already exists');
    }
    const driver = this.driverRepository.create({ ...dto, userId });
    return this.driverRepository.save(driver);
  }

  async getProfile(userId: string): Promise<Driver> {
    const driver = await this.driverRepository.findOne({
      where: { userId },
      relations: ['user'],
    });
    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }
    return driver;
  }

  async updateProfile(userId: string, dto: UpdateDriverProfileDto): Promise<Driver> {
    const driver = await this.getProfile(userId);
    Object.assign(driver, dto);
    return this.driverRepository.save(driver);
  }

  async updateLocation(userId: string, dto: UpdateLocationDto): Promise<void> {
    // Store in Redis for real-time performance
    const key = `driver:location:${userId}`;
    await this.redis.set(
      key,
      JSON.stringify({ lat: dto.lat, lng: dto.lng, updatedAt: new Date().toISOString() }),
      'EX',
      300, // expires in 5 minutes
    );
  }

  async getLocation(userId: string): Promise<{ lat: number; lng: number; updatedAt: string } | null> {
    const key = `driver:location:${userId}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async toggleOnline(userId: string): Promise<Driver> {
    const driver = await this.getProfile(userId);
    driver.isOnline = !driver.isOnline;
    return this.driverRepository.save(driver);
  }

  async findAll(pagination: PaginationDto): Promise<PaginatedResponseDto<Driver>> {
    const { page, limit } = pagination;
    const [data, total] = await this.driverRepository.findAndCount({
      relations: ['user'],
      skip: (page - 1) * limit,
      take: limit,
    });
    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findOnlineDrivers(): Promise<Driver[]> {
    return this.driverRepository.find({
      where: { isOnline: true, isVerified: true },
      relations: ['user'],
    });
  }
}
