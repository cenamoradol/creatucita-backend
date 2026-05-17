import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Subcategory } from '../../categories/entities/category.entity';
import { Schedule } from '../../schedules/entities/schedule.entity';
import { OfferedService } from '../../offered-services/entities/offered-service.entity';

export enum SpecialistStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('specialists')
export class Specialist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.specialistProfile)
  @JoinColumn()
  user: User;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  rtn: string;

  @Column({ nullable: true })
  clinicAddress: string;

  @Column({
    type: 'enum',
    enum: SpecialistStatus,
    default: SpecialistStatus.PENDING,
  })
  status: SpecialistStatus;

  @Column({ nullable: true })
  profilePicture: string;

  @ManyToMany(() => Subcategory)
  @JoinTable({ name: 'specialist_subcategories' })
  subcategories: Subcategory[];

  @OneToMany(() => Schedule, (schedule) => schedule.specialist)
  schedules: Schedule[];

  @OneToMany(() => OfferedService, (offeredService) => offeredService.specialist)
  offeredServices: OfferedService[];
}
