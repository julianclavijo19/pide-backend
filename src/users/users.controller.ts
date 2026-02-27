import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Post,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto, CreateAddressDto } from './dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { PaginationDto } from '../common/dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentUser('sub') userId: string) {
    return this.usersService.findById(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateProfile(@CurrentUser('sub') userId: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(userId, dto);
  }

  @Post('me/fcm-token')
  @ApiOperation({ summary: 'Update FCM token for push notifications' })
  async updateFcmToken(
    @CurrentUser('sub') userId: string,
    @Body('fcmToken') fcmToken: string,
  ) {
    await this.usersService.updateFcmToken(userId, fcmToken);
    return { message: 'FCM token updated' };
  }

  @Post('me/addresses')
  @ApiOperation({ summary: 'Add a new address' })
  async addAddress(@CurrentUser('sub') userId: string, @Body() dto: CreateAddressDto) {
    return this.usersService.addAddress(userId, dto);
  }

  @Get('me/addresses')
  @ApiOperation({ summary: 'Get all addresses for current user' })
  async getAddresses(@CurrentUser('sub') userId: string) {
    return this.usersService.getAddresses(userId);
  }

  @Delete('me/addresses/:addressId')
  @ApiOperation({ summary: 'Delete an address' })
  async deleteAddress(
    @CurrentUser('sub') userId: string,
    @Param('addressId', ParseUUIDPipe) addressId: string,
  ) {
    await this.usersService.deleteAddress(userId, addressId);
    return { message: 'Address deleted' };
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List all users (Admin only)' })
  async findAll(@Query() pagination: PaginationDto) {
    return this.usersService.findAll(pagination);
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findById(id);
  }
}
