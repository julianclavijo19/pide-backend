import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { CouponType } from '../../common/enums/coupon-type.enum';

@Entity('coupons')
export class Coupon {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 50 })
  code!: string;

  @Column({ type: 'enum', enum: CouponType })
  type!: CouponType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  value!: number;

  @Column({ name: 'min_order', type: 'decimal', precision: 10, scale: 2, default: 0 })
  minOrder!: number;

  @Column({ name: 'max_uses', default: 0 })
  maxUses!: number;

  @Column({ name: 'used_count', default: 0 })
  usedCount!: number;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt!: Date | null;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
