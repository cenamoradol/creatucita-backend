import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Specialist, SpecialistStatus } from './entities/specialist.entity';
import { Note } from './entities/note.entity';
import { Reminder } from './entities/reminder.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { SchedulesService } from '../schedules/schedules.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { ApplySpecialistDto } from './dto/apply-specialist.dto';

@Injectable()
export class SpecialistsService {
  constructor(
    @InjectRepository(Specialist)
    private readonly specialistRepository: Repository<Specialist>,
    @InjectRepository(Note)
    private readonly noteRepository: Repository<Note>,
    @InjectRepository(Reminder)
    private readonly reminderRepository: Repository<Reminder>,
    @Inject(forwardRef(() => SchedulesService))
    private readonly schedulesService: SchedulesService,
    @Inject(forwardRef(() => AppointmentsService))
    private readonly appointmentsService: AppointmentsService,
  ) {}

  async getDashboardData(userId: string) {
    const specialist = await this.findByUser(userId);
    if (!specialist) throw new NotFoundException('Especialista no encontrado');

    const appointments = await this.appointmentsService.findBySpecialist(specialist.id);
    const notes = await this.noteRepository.find({
      where: { specialist: { id: specialist.id } },
      order: { createdAt: 'DESC' },
    });
    const reminders = await this.reminderRepository.find({
      where: { specialist: { id: specialist.id } },
      order: { date: 'ASC', time: 'ASC' },
    });

    return {
      appointments,
      notas: notes,
      recordatorios: reminders,
    };
  }

  async getNotes(specialistId: string) {
    return await this.noteRepository.find({
      where: { specialist: { id: specialistId } },
      order: { createdAt: 'DESC' },
    });
  }

  async createNote(specialistId: string, data: any) {
    const specialist = await this.findOne(specialistId);
    const note = this.noteRepository.create({
      ...data,
      specialist,
    });
    return await this.noteRepository.save(note);
  }

  async toggleNoteArchive(id: string) {
    const note = await this.noteRepository.findOne({ where: { id } });
    if (!note) throw new NotFoundException('Nota no encontrada');
    note.archived = !note.archived;
    return await this.noteRepository.save(note);
  }

  async deleteNote(id: string) {
    const result = await this.noteRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Nota no encontrada');
    return { success: true };
  }

  async getReminders(specialistId: string) {
    return await this.reminderRepository.find({
      where: { specialist: { id: specialistId } },
      order: { date: 'ASC', time: 'ASC' },
    });
  }

  async createReminder(specialistId: string, data: any) {
    const specialist = await this.findOne(specialistId);
    const reminder = this.reminderRepository.create({
      ...data,
      specialist,
    });
    return await this.reminderRepository.save(reminder);
  }

  async updateReminder(id: string, data: any) {
    const reminder = await this.reminderRepository.findOne({ where: { id } });
    if (!reminder) throw new NotFoundException('Recordatorio no encontrado');
    Object.assign(reminder, data);
    return await this.reminderRepository.save(reminder);
  }

  async deleteReminder(id: string) {
    const result = await this.reminderRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Recordatorio no encontrado');
    return { success: true };
  }

  async create(user: User): Promise<Specialist> {
    const specialist = this.specialistRepository.create({
      user,
    });
    return await this.specialistRepository.save(specialist);
  }

  async findByUser(userId: string): Promise<Specialist | null> {
    return await this.specialistRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }

  async apply(user: User, applyDto: ApplySpecialistDto): Promise<Specialist> {
    const { subcategoryIds, ...rest } = applyDto;
    
    let specialist = await this.findByUser(user.id);
    
    if (specialist) {
      // Update existing application
      Object.assign(specialist, rest);
      specialist.status = SpecialistStatus.PENDING; // Reset to pending if they update it
    } else {
      // Create new application
      specialist = this.specialistRepository.create({
        ...rest,
        user,
        status: SpecialistStatus.PENDING,
      });
    }

    if (subcategoryIds) {
      specialist.subcategories = subcategoryIds.map(id => ({ id } as any));
    }

    return await this.specialistRepository.save(specialist);
  }

  async findAll(filters: { categoryId?: string; subcategoryId?: string; search?: string } = {}) {
    const query = this.specialistRepository.createQueryBuilder('specialist')
      .leftJoinAndSelect('specialist.user', 'user')
      .leftJoinAndSelect('specialist.subcategories', 'subcategory')
      .leftJoinAndSelect('subcategory.category', 'category')
      .where('specialist.status = :status', { status: SpecialistStatus.APPROVED });

    if (filters.categoryId) {
      query.andWhere('category.id = :categoryId', { categoryId: filters.categoryId });
    }

    if (filters.subcategoryId) {
      query.andWhere('subcategory.id = :subcategoryId', { subcategoryId: filters.subcategoryId });
    }

    if (filters.search) {
      query.andWhere(
        '(user.name ILIKE :search OR specialist.bio ILIKE :search OR category.name ILIKE :search OR subcategory.name ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    return await query.getMany();
  }

  async findOne(id: string) {
    const specialist = await this.specialistRepository.findOne({
      where: { id },
      relations: ['user', 'subcategories', 'subcategories.category', 'schedules', 'offeredServices'],
    });
    if (!specialist) throw new NotFoundException('Especialista no encontrado');
    return specialist;
  }

  async updateSubcategories(id: string, subcategoryIds: string[]) {
    const specialist = await this.findOne(id);
    // Note: In a real app we'd validate the IDs exist, but for now we trust the client or handle DB error
    specialist.subcategories = subcategoryIds.map(subId => ({ id: subId } as any));
    return await this.specialistRepository.save(specialist);
  }

  async getAvailability(id: string, dateStr: string) {
    const specialist = await this.findOne(id);
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();

    const schedules = await this.schedulesService.findByDay(id, dayOfWeek);
    if (schedules.length === 0) return [];

    const appointments = await this.appointmentsService.findAllByDate(id, dateStr);

    const availableSlots: { start: string; end: string }[] = [];
    const slotDuration = 30; // 30 minutes

    for (const schedule of schedules) {
      let currentTime = this.timeToMinutes(schedule.startTime);
      const endTime = this.timeToMinutes(schedule.endTime);

      while (currentTime + slotDuration <= endTime) {
        const slotStart = this.minutesToTime(currentTime);
        const slotEnd = this.minutesToTime(currentTime + slotDuration);

        const isOccupied = appointments.some(app => {
          const appStart = this.timeToMinutes(app.startTime);
          const appEnd = this.timeToMinutes(app.endTime);
          return (currentTime < appEnd && (currentTime + slotDuration) > appStart);
        });

        if (!isOccupied) {
          availableSlots.push({
            start: slotStart,
            end: slotEnd,
          });
        }

        currentTime += slotDuration;
      }
    }

    return availableSlots;
  }

  async updateProfile(userId: string, data: { name?: string; phone?: string; bio?: string }) {
    const specialist = await this.findByUser(userId);
    if (!specialist) throw new NotFoundException('Especialista no encontrado');

    if (data.name) {
      specialist.user.name = data.name;
      await this.specialistRepository.manager.save(specialist.user);
    }

    if (data.phone !== undefined) {
      specialist.phone = data.phone;
    }

    if (data.bio !== undefined) {
      specialist.bio = data.bio;
    }

    return await this.specialistRepository.save(specialist);
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`;
  }

  async findPending(): Promise<Specialist[]> {
    return await this.specialistRepository.find({
      where: { status: SpecialistStatus.PENDING },
      relations: ['user', 'subcategories'],
    });
  }

  async approve(id: string): Promise<Specialist> {
    const specialist = await this.specialistRepository.findOne({ 
      where: { id },
      relations: ['user'] 
    });
    if (!specialist) throw new NotFoundException('Especialista no encontrado');
    
    specialist.status = SpecialistStatus.APPROVED;
    specialist.user.role = UserRole.SPECIALIST;
    
    await this.specialistRepository.manager.save(specialist.user);
    return await this.specialistRepository.save(specialist);
  }

  async reject(id: string): Promise<Specialist> {
    const specialist = await this.specialistRepository.findOne({ 
      where: { id },
      relations: ['user'] 
    });
    if (!specialist) throw new NotFoundException('Especialista no encontrado');
    
    specialist.status = SpecialistStatus.REJECTED;
    return await this.specialistRepository.save(specialist);
  }

  async findAllSpecialists(): Promise<Specialist[]> {
    return await this.specialistRepository.find({
      relations: ['user', 'subcategories'],
    });
  }
}
