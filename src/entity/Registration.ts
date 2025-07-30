import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';
import { Activity } from './Activity';

/**
 * 报名实体类
 * 管理用户活动报名信息
 */
@Entity('registrations')
export class Registration {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, default: 'pending' })
  status: string; // 'pending' | 'confirmed' | 'cancelled'

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  // 关联关系
  @ManyToOne(() => User, user => user.registrations)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @ManyToOne(() => Activity, activity => activity.registrations)
  @JoinColumn({ name: 'activityId' })
  activity: Activity;

  @Column()
  activityId: number;
}
