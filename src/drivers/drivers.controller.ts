import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DriversService } from './drivers.service';
import { CreateDriverProfileDto, UpdateDriverProfileDto, UpdateLocationDto } from './dto/driver.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { PaginationDto } from '../common/dto';

@ApiTags('Drivers')
@ApiBearerAuth()
@Controller('drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Post('profile')
  @Roles(Role.DRIVER)
  @ApiOperation({ summary: 'Create driver profile' })
  async createProfile(@CurrentUser('sub') userId: string, @Body() dto: CreateDriverProfileDto) {
    return this.driversService.createProfile(userId, dto);
  }

  @Get('profile/me')
  @Roles(Role.DRIVER)
  @ApiOperation({ summary: 'Get my driver profile' })
  async getMyProfile(@CurrentUser('sub') userId: string) {
    return this.driversService.getProfile(userId);
  }

  @Patch('profile/me')
  @Roles(Role.DRIVER)
  @ApiOperation({ summary: 'Update my driver profile' })
  async updateProfile(@CurrentUser('sub') userId: string, @Body() dto: UpdateDriverProfileDto) {
    return this.driversService.updateProfile(userId, dto);
  }

  @Post('location')
  @Roles(Role.DRIVER)
  @ApiOperation({ summary: 'Update current location (stored in Redis)' })
  async updateLocation(@CurrentUser('sub') userId: string, @Body() dto: UpdateLocationDto) {
    await this.driversService.updateLocation(userId, dto);
    return { message: 'Location updated' };
  }

  @Patch('toggle-online')
  @Roles(Role.DRIVER)
  @ApiOperation({ summary: 'Toggle online/offline status' })
  async toggleOnline(@CurrentUser('sub') userId: string) {
    return this.driversService.toggleOnline(userId);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List all drivers (Admin)' })
  async findAll(@Query() pagination: PaginationDto) {
    return this.driversService.findAll(pagination);
  }

  @Get('online')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get online drivers' })
  async findOnline() {
    return this.driversService.findOnlineDrivers();
  }

  @Get(':userId/location')
  @Roles(Role.ADMIN, Role.CLIENT)
  @ApiOperation({ summary: 'Get driver current location from Redis' })
  async getLocation(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.driversService.getLocation(userId);
  }
}
