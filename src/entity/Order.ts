import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';

/**
 * 订单实体类
 * 管理活动订单信息
 */
@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 50 })
  orderNumber: string;

  @Column()
  activityId: number;

  @Column({ length: 200 })
  activityTitle: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ length: 50, default: 'pending' })
  status: string; // 'pending' | 'paid' | 'cancelled' | 'refunded'

  @Column({ length: 50, default: 'pending' })
  paymentStatus: string; // 'pending' | 'success' | 'failed'

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 关联关系
  @ManyToOne(() => User, user => user.orders)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;
}
