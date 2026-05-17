import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schedule } from './entities/schedule.entity';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { SpecialistsService } from '../specialists/specialists.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    @Inject(forwardRef(() => SpecialistsService))
    private readonly specialistsService: SpecialistsService,
  ) {}

  async create(user: User, createScheduleDto: CreateScheduleDto) {
    // Find the specialist profile associated with the user
    const specialist = await this.specialistsService.findByUser(user.id);
    if (!specialist) throw new NotFoundException('Perfil de especialista no encontrado');

    const schedule = this.scheduleRepository.create({
      ...createScheduleDto,
      specialist,
    });
    return await this.scheduleRepository.save(schedule);
  }

  async createBulk(user: User, schedulesDto: CreateScheduleDto[]) {
    const specialist = await this.specialistsService.findByUser(user.id);
    if (!specialist) throw new NotFoundException('Perfil de especialista no encontrado');

    // Eliminar horarios existentes del especialista
    await this.scheduleRepository.delete({ specialist: { id: specialist.id } });

    // Crear los nuevos
    const newSchedules = schedulesDto.map(dto => 
      this.scheduleRepository.create({
        ...dto,
        specialist,
      })
    );

    return await this.scheduleRepository.save(newSchedules);
  }

  async findAllBySpecialist(specialistId: string) {
    return await this.scheduleRepository.find({
      where: { specialist: { id: specialistId }, isActive: true },
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }

  async findByDay(specialistId: string, dayOfWeek: number) {
    return await this.scheduleRepository.find({
      where: { 
        specialist: { id: specialistId }, 
        dayOfWeek, 
        isActive: true 
      },
    });
  }

  async remove(id: string, user: User) {
    const schedule = await this.scheduleRepository.findOne({
      where: { id },
      relations: ['specialist', 'specialist.user'],
    });

    if (!schedule) throw new NotFoundException('Horario no encontrado');
    if (schedule.specialist.user.id !== user.id) {
      throw new ForbiddenException('No tienes permiso para eliminar este horario');
    }

    return await this.scheduleRepository.remove(schedule);
  }
}
