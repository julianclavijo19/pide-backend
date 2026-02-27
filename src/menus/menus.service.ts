import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuCategory } from './entities/menu-category.entity';
import { MenuItem } from './entities/menu-item.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import {
  CreateMenuCategoryDto,
  UpdateMenuCategoryDto,
  CreateMenuItemDto,
  UpdateMenuItemDto,
} from './dto/menu.dto';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class MenusService {
  constructor(
    @InjectRepository(MenuCategory)
    private readonly categoryRepository: Repository<MenuCategory>,
    @InjectRepository(MenuItem)
    private readonly itemRepository: Repository<MenuItem>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
  ) {}

  private async validateOwnership(restaurantId: string, userId: string, userRole: Role) {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: restaurantId },
    });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }
    if (userRole !== Role.ADMIN && restaurant.ownerId !== userId) {
      throw new ForbiddenException('Not authorized to manage this restaurant menu');
    }
    return restaurant;
  }

  // Categories
  async createCategory(
    restaurantId: string,
    dto: CreateMenuCategoryDto,
    userId: string,
    userRole: Role,
  ): Promise<MenuCategory> {
    await this.validateOwnership(restaurantId, userId, userRole);
    const category = this.categoryRepository.create({ ...dto, restaurantId });
    return this.categoryRepository.save(category);
  }

  async getCategories(restaurantId: string): Promise<MenuCategory[]> {
    return this.categoryRepository.find({
      where: { restaurantId },
      relations: ['items'],
      order: { position: 'ASC' },
    });
  }

  async updateCategory(
    categoryId: string,
    dto: UpdateMenuCategoryDto,
    userId: string,
    userRole: Role,
  ): Promise<MenuCategory> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    await this.validateOwnership(category.restaurantId, userId, userRole);
    Object.assign(category, dto);
    return this.categoryRepository.save(category);
  }

  async deleteCategory(categoryId: string, userId: string, userRole: Role): Promise<void> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    await this.validateOwnership(category.restaurantId, userId, userRole);
    await this.categoryRepository.remove(category);
  }

  // Items
  async createItem(
    categoryId: string,
    dto: CreateMenuItemDto,
    userId: string,
    userRole: Role,
  ): Promise<MenuItem> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    await this.validateOwnership(category.restaurantId, userId, userRole);
    const item = this.itemRepository.create({ ...dto, categoryId });
    return this.itemRepository.save(item);
  }

  async updateItem(
    itemId: string,
    dto: UpdateMenuItemDto,
    userId: string,
    userRole: Role,
  ): Promise<MenuItem> {
    const item = await this.itemRepository.findOne({
      where: { id: itemId },
      relations: ['category'],
    });
    if (!item) {
      throw new NotFoundException('Menu item not found');
    }
    await this.validateOwnership(item.category.restaurantId, userId, userRole);
    Object.assign(item, dto);
    return this.itemRepository.save(item);
  }

  async deleteItem(itemId: string, userId: string, userRole: Role): Promise<void> {
    const item = await this.itemRepository.findOne({
      where: { id: itemId },
      relations: ['category'],
    });
    if (!item) {
      throw new NotFoundException('Menu item not found');
    }
    await this.validateOwnership(item.category.restaurantId, userId, userRole);
    await this.itemRepository.remove(item);
  }

  async findItemById(id: string): Promise<MenuItem> {
    const item = await this.itemRepository.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException('Menu item not found');
    }
    return item;
  }
}
