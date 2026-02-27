import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coupon } from './entities/coupon.entity';
import { CreateCouponDto, UpdateCouponDto } from './dto/coupon.dto';
import { CouponType } from '../common/enums/coupon-type.enum';
import { PaginationDto, PaginatedResponseDto } from '../common/dto';

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
  ) {}

  async create(dto: CreateCouponDto): Promise<Coupon> {
    const coupon = this.couponRepository.create({
      ...dto,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
    });
    return this.couponRepository.save(coupon);
  }

  async findAll(pagination: PaginationDto): Promise<PaginatedResponseDto<Coupon>> {
    const { page, limit } = pagination;
    const [data, total] = await this.couponRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findByCode(code: string): Promise<Coupon> {
    const coupon = await this.couponRepository.findOne({
      where: { code: code.toUpperCase() },
    });
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }
    return coupon;
  }

  async update(id: string, dto: UpdateCouponDto): Promise<Coupon> {
    const coupon = await this.couponRepository.findOne({ where: { id } });
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }
    Object.assign(coupon, dto);
    if (dto.expiresAt) {
      coupon.expiresAt = new Date(dto.expiresAt);
    }
    return this.couponRepository.save(coupon);
  }

  async validate(code: string, orderTotal: number): Promise<{ valid: boolean; discount: number }> {
    try {
      const discount = await this.calculateDiscount(code, orderTotal);
      return { valid: true, discount };
    } catch (error) {
      if (error instanceof BadRequestException) {
        return { valid: false, discount: 0 };
      }
      throw error;
    }
  }

  async calculateDiscount(code: string, orderTotal: number): Promise<number> {
    const coupon = await this.findByCode(code);

    if (!coupon.isActive) {
      throw new BadRequestException('Coupon is not active');
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      throw new BadRequestException('Coupon has expired');
    }

    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
      throw new BadRequestException('Coupon usage limit reached');
    }

    if (orderTotal < Number(coupon.minOrder)) {
      throw new BadRequestException(
        `Minimum order amount is ${coupon.minOrder} COP`,
      );
    }

    if (coupon.type === CouponType.PERCENT) {
      return Math.round((orderTotal * Number(coupon.value)) / 100);
    }

    return Number(coupon.value);
  }

  async incrementUsage(code: string): Promise<void> {
    const coupon = await this.findByCode(code);
    coupon.usedCount += 1;
    await this.couponRepository.save(coupon);
  }

  async delete(id: string): Promise<void> {
    const coupon = await this.couponRepository.findOne({ where: { id } });
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }
    await this.couponRepository.remove(coupon);
  }
}
