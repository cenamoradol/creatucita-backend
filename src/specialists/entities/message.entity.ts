import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Specialist } from '../../specialists/entities/specialist.entity';
import { User } from '../../users/entities/user.entity';

export enum MessageSenderRole {
  CLIENT = 'client',
  SPECIALIST = 'specialist',
}

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Specialist)
  @Index()
  specialist: Specialist;

  @ManyToOne(() => User)
  @Index()
  client: User;

  @Column({ type: 'varchar', length: 200 })
  subject: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'enum', enum: MessageSenderRole })
  senderRole: MessageSenderRole;

  // Id del mensaje raíz del hilo (null en el primer mensaje).
  @Column({ type: 'uuid', nullable: true })
  inReplyTo: string | null;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
