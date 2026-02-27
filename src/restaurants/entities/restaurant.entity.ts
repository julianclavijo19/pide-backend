import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { MenuCategory } from '../../menus/entities/menu-category.entity';

@Entity('restaurants')
export class Restaurant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 150 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'logo_url', nullable: true })
  logoUrl!: string | null;

  @Column({ name: 'cover_url', nullable: true })
  coverUrl!: string | null;

  @Column({ name: 'owner_id' })
  ownerId!: string;

  @Column({ name: 'category_tags', type: 'simple-array', nullable: true })
  categoryTags!: string[] | null;

  @Column({ type: 'jsonb', nullable: true })
  schedule!: Record<string, { open: string; close: string }> | null;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'is_open', default: false })
  isOpen!: boolean;

  @Column({ name: 'avg_rating', type: 'decimal', precision: 3, scale: 2, default: 0 })
  avgRating!: number;

  @Column({ name: 'total_orders', default: 0 })
  totalOrders!: number;

  @Column({ name: 'commission_rate', type: 'decimal', precision: 5, scale: 2, default: 15.0 })
  commissionRate!: number;

  @Column({ length: 255, nullable: true })
  address!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  lat!: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  lng!: number | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner!: User;

  @OneToMany(() => MenuCategory, (category) => category.restaurant, { cascade: true })
  categories!: MenuCategory[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
