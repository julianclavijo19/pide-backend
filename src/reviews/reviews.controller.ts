import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/review.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Role } from '../common/enums/role.enum';
import { ReviewTargetType } from '../common/enums/review-target-type.enum';
import { PaginationDto } from '../common/dto';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @Roles(Role.CLIENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a review for a restaurant or driver' })
  async create(@CurrentUser('sub') userId: string, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(userId, dto);
  }

  @Public()
  @Get('restaurant/:restaurantId')
  @ApiOperation({ summary: 'Get reviews for a restaurant' })
  async getRestaurantReviews(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.reviewsService.findByTarget(restaurantId, ReviewTargetType.RESTAURANT, pagination);
  }

  @Public()
  @Get('driver/:driverId')
  @ApiOperation({ summary: 'Get reviews for a driver' })
  async getDriverReviews(
    @Param('driverId', ParseUUIDPipe) driverId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.reviewsService.findByTarget(driverId, ReviewTargetType.DRIVER, pagination);
  }

  @Public()
  @Get('order/:orderId')
  @ApiOperation({ summary: 'Get reviews for an order' })
  async getOrderReviews(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.reviewsService.findByOrder(orderId);
  }
}
