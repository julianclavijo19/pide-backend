import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto, AssignDriverDto } from './dto/order.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { PaginationDto } from '../common/dto';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Create a new order' })
  async create(@CurrentUser('sub') userId: string, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(userId, dto);
  }

  @Get('me')
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Get my orders as client' })
  async getMyOrders(@CurrentUser('sub') userId: string, @Query() pagination: PaginationDto) {
    return this.ordersService.findByClient(userId, pagination);
  }

  @Get('restaurant/:restaurantId')
  @Roles(Role.RESTAURANT, Role.ADMIN)
  @ApiOperation({ summary: 'Get orders for a restaurant' })
  async getRestaurantOrders(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.ordersService.findByRestaurant(restaurantId, pagination);
  }

  @Get('driver/me')
  @Roles(Role.DRIVER)
  @ApiOperation({ summary: 'Get my orders as driver' })
  async getDriverOrders(@CurrentUser('sub') userId: string, @Query() pagination: PaginationDto) {
    return this.ordersService.findByDriver(userId, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.findById(id);
  }

  @Patch(':id/status')
  @Roles(Role.RESTAURANT, Role.DRIVER, Role.ADMIN)
  @ApiOperation({ summary: 'Update order status (validated transitions)' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto);
  }

  @Patch(':id/assign-driver')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Assign a driver to an order' })
  async assignDriver(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignDriverDto,
  ) {
    return this.ordersService.assignDriver(id, dto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all orders (Admin)' })
  async findAll(@Query() pagination: PaginationDto) {
    return this.ordersService.findAll(pagination);
  }
}
