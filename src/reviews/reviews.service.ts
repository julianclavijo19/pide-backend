import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { CreateReviewDto } from './dto/review.dto';
import { ReviewTargetType } from '../common/enums/review-target-type.enum';
import { PaginationDto, PaginatedResponseDto } from '../common/dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
  ) {}

  async create(clientId: string, dto: CreateReviewDto): Promise<Review> {
    // Check if review already exists for this order + target
    const existing = await this.reviewRepository.findOne({
      where: {
        orderId: dto.orderId,
        clientId,
        targetId: dto.targetId,
        targetType: dto.targetType,
      },
    });
    if (existing) {
      throw new BadRequestException('Review already exists for this order and target');
    }

    const review = this.reviewRepository.create({
      ...dto,
      clientId,
    });
    return this.reviewRepository.save(review);
  }

  async findByTarget(
    targetId: string,
    targetType: ReviewTargetType,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<Review>> {
    const { page, limit } = pagination;
    const [data, total] = await this.reviewRepository.findAndCount({
      where: { targetId, targetType },
      relations: ['client'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return new PaginatedResponseDto(data, total, page, limit);
  }

  async getAverageRating(
    targetId: string,
    targetType: ReviewTargetType,
  ): Promise<number> {
    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avg')
      .where('review.target_id = :targetId', { targetId })
      .andWhere('review.target_type = :targetType', { targetType })
      .getRawOne();
    return result?.avg ? parseFloat(result.avg) : 0;
  }

  async findByOrder(orderId: string): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { orderId },
      relations: ['client'],
    });
  }
}
