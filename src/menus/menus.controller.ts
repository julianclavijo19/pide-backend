import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MenusService } from './menus.service';
import {
  CreateMenuCategoryDto,
  UpdateMenuCategoryDto,
  CreateMenuItemDto,
  UpdateMenuItemDto,
} from './dto/menu.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('Menus')
@Controller('menus')
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  // ---------- Categories ----------

  @Post('restaurants/:restaurantId/categories')
  @Roles(Role.RESTAURANT, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create menu category for a restaurant' })
  async createCategory(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Body() dto: CreateMenuCategoryDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.menusService.createCategory(restaurantId, dto, userId, userRole);
  }

  @Public()
  @Get('restaurants/:restaurantId/categories')
  @ApiOperation({ summary: 'Get all menu categories with items for a restaurant' })
  async getCategories(@Param('restaurantId', ParseUUIDPipe) restaurantId: string) {
    return this.menusService.getCategories(restaurantId);
  }

  @Patch('categories/:categoryId')
  @Roles(Role.RESTAURANT, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a menu category' })
  async updateCategory(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Body() dto: UpdateMenuCategoryDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.menusService.updateCategory(categoryId, dto, userId, userRole);
  }

  @Delete('categories/:categoryId')
  @Roles(Role.RESTAURANT, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a menu category' })
  async deleteCategory(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    await this.menusService.deleteCategory(categoryId, userId, userRole);
    return { message: 'Category deleted' };
  }

  // ---------- Items ----------

  @Post('categories/:categoryId/items')
  @Roles(Role.RESTAURANT, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a menu item in a category' })
  async createItem(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Body() dto: CreateMenuItemDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.menusService.createItem(categoryId, dto, userId, userRole);
  }

  @Patch('items/:itemId')
  @Roles(Role.RESTAURANT, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a menu item' })
  async updateItem(
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateMenuItemDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.menusService.updateItem(itemId, dto, userId, userRole);
  }

  @Delete('items/:itemId')
  @Roles(Role.RESTAURANT, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a menu item' })
  async deleteItem(
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    await this.menusService.deleteItem(itemId, userId, userRole);
    return { message: 'Item deleted' };
  }
}
