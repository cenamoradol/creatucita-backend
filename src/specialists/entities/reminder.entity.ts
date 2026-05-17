import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Specialist } from '../../specialists/entities/specialist.entity';

@Entity('reminders')
export class Reminder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'time' })
  time: string;

  @Column({ default: 'media' }) // baja, media, alta
  priority: string;

  @Column({ default: false })
  completed: boolean;

  @ManyToOne(() => Specialist)
  specialist: Specialist;
}
