import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Specialist } from '../../specialists/entities/specialist.entity';

@Entity('schedules')
export class Schedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Specialist, (specialist) => specialist.schedules)
  specialist: Specialist;

  @Column({ type: 'int' }) // 0 (Sunday) to 6 (Saturday)
  dayOfWeek: number;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({ default: true })
  isActive: boolean;
}
