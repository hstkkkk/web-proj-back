import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Activity } from './Activity';
import { Registration } from './Registration';
import { Comment } from './Comment';
import { Order } from './Order';

/**
 * 用户实体类
 * 实现用户的基本信息存储和管理
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 50 })
  username: string;

  @Column({ length: 100 })
  password: string;

  @Column({ unique: true, length: 100 })
  email: string;

  @Column({ length: 50, nullable: true })
  phone: string;

  @Column({ length: 20, default: 'user' })
  role: string; // 'admin' | 'user'

  @Column({ length: 100, nullable: true })
  realName: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 关联关系
  @OneToMany(() => Activity, activity => activity.creator)
  createdActivities: Activity[];

  @OneToMany(() => Registration, registration => registration.user)
  registrations: Registration[];

  @OneToMany(() => Comment, comment => comment.user)
  comments: Comment[];

  @OneToMany(() => Order, order => order.user)
  orders: Order[];
}
