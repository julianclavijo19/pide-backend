import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { AdminUpdateUserDto } from '../users/dto/update-user.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard stats' })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update user details' })
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminUpdateUserDto,
  ) {
    return this.adminService.updateUser(id, dto);
  }

  @Patch('users/:id/deactivate')
  @ApiOperation({ summary: 'Deactivate a user' })
  async deactivateUser(@Param('id', ParseUUIDPipe) id: string) {
    await this.adminService.deactivateUser(id);
    return { message: 'User deactivated' };
  }

  @Patch('users/:id/activate')
  @ApiOperation({ summary: 'Activate a user' })
  async activateUser(@Param('id', ParseUUIDPipe) id: string) {
    await this.adminService.activateUser(id);
    return { message: 'User activated' };
  }
}
