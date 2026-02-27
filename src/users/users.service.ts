import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Address } from './entities/address.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { PaginationDto, PaginatedResponseDto } from '../common/dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
  ) {}

  async findAll(pagination: PaginationDto): Promise<PaginatedResponseDto<User>> {
    const { page, limit } = pagination;
    const [data, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      select: ['id', 'name', 'email', 'phone', 'role', 'isActive', 'createdAt'],
    });
    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['addresses'],
      select: ['id', 'name', 'email', 'phone', 'role', 'isActive', 'createdAt', 'updatedAt'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    Object.assign(user, dto);
    return this.userRepository.save(user);
  }

  async updateFcmToken(userId: string, fcmToken: string): Promise<void> {
    await this.userRepository.update(userId, { fcmToken });
  }

  async addAddress(userId: string, dto: CreateAddressDto): Promise<Address> {
    await this.findById(userId);
    const address = this.addressRepository.create({ ...dto, userId });
    return this.addressRepository.save(address);
  }

  async getAddresses(userId: string): Promise<Address[]> {
    return this.addressRepository.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async deleteAddress(userId: string, addressId: string): Promise<void> {
    const address = await this.addressRepository.findOne({
      where: { id: addressId, userId },
    });
    if (!address) {
      throw new NotFoundException('Address not found');
    }
    await this.addressRepository.remove(address);
  }

  async deactivate(id: string): Promise<void> {
    const user = await this.findById(id);
    user.isActive = false;
    await this.userRepository.save(user);
  }
}
