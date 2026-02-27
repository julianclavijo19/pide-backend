import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RestaurantsService } from './restaurants.service';
import { CreateRestaurantDto, UpdateRestaurantDto } from './dto/restaurant.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Role } from '../common/enums/role.enum';
import { PaginationDto } from '../common/dto';

@ApiTags('Restaurants')
@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Post()
  @Roles(Role.RESTAURANT, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new restaurant' })
  async create(@CurrentUser('sub') userId: string, @Body() dto: CreateRestaurantDto) {
    return this.restaurantsService.create(userId, dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all active restaurants' })
  async findAll(@Query() pagination: PaginationDto) {
    return this.restaurantsService.findAll(pagination);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get restaurant details with menu' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.restaurantsService.findById(id);
  }

  @Get('owner/me')
  @Roles(Role.RESTAURANT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get restaurants owned by current user' })
  async findMyRestaurants(@CurrentUser('sub') userId: string) {
    return this.restaurantsService.findByOwner(userId);
  }

  @Patch(':id')
  @Roles(Role.RESTAURANT, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update restaurant' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRestaurantDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.restaurantsService.update(id, dto, userId, userRole);
  }

  @Patch(':id/toggle-open')
  @Roles(Role.RESTAURANT, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle restaurant open/closed status' })
  async toggleOpen(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.restaurantsService.toggleOpen(id, userId, userRole);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete restaurant (Admin only)' })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.restaurantsService.delete(id);
    return { message: 'Restaurant deleted' };
  }
}
