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
import { User } from './User';
import { Registration } from './Registration';
import { Comment } from './Comment';

/**
 * 活动实体类
 * 管理体育活动的基本信息
 */
@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ length: 100 })
  location: string;

  @Column({ type: 'datetime' })
  startTime: Date;

  @Column({ type: 'datetime' })
  endTime: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ default: 0 })
  maxParticipants: number;

  @Column({ default: 0 })
  currentParticipants: number;

  @Column({ length: 500, nullable: true })
  imageUrl: string;

  @Column({ length: 50, default: 'active' })
  status: string; // 'active' | 'cancelled' | 'completed'

  @Column({ length: 100 })
  category: string; // 运动类别

  @Column({ type: 'text', nullable: true })
  requirements: string; // 参与要求

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 关联关系
  @ManyToOne(() => User, user => user.createdActivities)
  @JoinColumn({ name: 'creatorId' })
  creator: User;

  @Column()
  creatorId: number;

  @OneToMany(() => Registration, registration => registration.activity)
  registrations: Registration[];

  @OneToMany(() => Comment, comment => comment.activity)
  comments: Comment[];
}
