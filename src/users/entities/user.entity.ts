import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne } from 'typeorm';
import { Specialist } from '../../specialists/entities/specialist.entity';

export enum UserRole {
  CLIENT = 'client',
  SPECIALIST = 'specialist',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CLIENT,
  })
  role: UserRole;

  @Column({ nullable: true })
  telephone: string;

  @Column({ nullable: true })
  locationCountry: string;

  @Column({ nullable: true })
  locationCity: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => Specialist, (specialist) => specialist.user)
  specialistProfile: Specialist;
}
