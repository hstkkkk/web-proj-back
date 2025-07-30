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
 * 评论实体类
 * 管理活动评论信息
 */
@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'int', default: 5 })
  rating: number; // 1-5 星级评分

  @CreateDateColumn()
  createdAt: Date;

  // 关联关系
  @ManyToOne(() => User, user => user.comments)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @ManyToOne(() => Activity, activity => activity.comments)
  @JoinColumn({ name: 'activityId' })
  activity: Activity;

  @Column()
  activityId: number;
}
