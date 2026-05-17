import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Specialist } from '../../specialists/entities/specialist.entity';

@Entity('offered_services')
export class OfferedService {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Specialist, { onDelete: 'CASCADE' })
  specialist: Specialist;

  @Column()
  specialty: string;

  @Column()
  specialties: string; // The specific name of the service

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'int' })
  duration: number; // in minutes

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
