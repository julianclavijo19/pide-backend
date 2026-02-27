import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Role } from '../../common/enums/role.enum';
import { Address } from './address.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ unique: true, length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone!: string | null;

  @Column({ name: 'password_hash' })
  passwordHash!: string;

  @Column({ type: 'enum', enum: Role, default: Role.CLIENT })
  role!: Role;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ type: 'varchar', name: 'fcm_token', nullable: true })
  fcmToken!: string | null;

  @Column({ type: 'varchar', name: 'refresh_token', nullable: true })
  refreshToken!: string | null;

  @OneToMany(() => Address, (address) => address.user, { cascade: true })
  addresses!: Address[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
