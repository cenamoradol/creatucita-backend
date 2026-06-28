import { Injectable, ConflictException, BadRequestException, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan, And } from 'typeorm';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { SpecialistsService } from '../specialists/specialists.service';
import { SchedulesService } from '../schedules/schedules.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => SpecialistsService))
    private readonly specialistsService: SpecialistsService,
    private readonly schedulesService: SchedulesService,
    private readonly mailService: MailService,
  ) {}

  async create(user: User, createAppointmentDto: CreateAppointmentDto) {
    const { specialistId, date, startTime, notes, serviceId, price } = createAppointmentDto;

    // 1. Verify Specialist
    const specialist = await this.specialistsService.findOne(specialistId);
    if (!specialist) throw new NotFoundException('Especialista no encontrado');

    // 2. Prevent past dates
    const appointmentDate = new Date(`${date}T${startTime}`);
    if (appointmentDate < new Date()) {
      throw new BadRequestException('No se pueden agendar citas en el pasado');
    }

    // 3. Verify Schedule availability for that day (using timezone-safe local parsing)
    const [year, month, day] = date.split('-').map(Number);
    const dayOfWeek = new Date(year, month - 1, day).getDay();
    const schedules = await this.schedulesService.findByDay(specialistId, dayOfWeek);
    
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = startMinutes + 30; // 30 min duration
    const endTime = this.minutesToTime(endMinutes);

    const isInSchedule = schedules.some(s => {
      const sStart = this.timeToMinutes(s.startTime);
      const sEnd = this.timeToMinutes(s.endTime);
      return startMinutes >= sStart && endMinutes <= sEnd;
    });

    if (!isInSchedule) {
      throw new BadRequestException('El especialista no atiende en ese horario');
    }

    // 4. Verify no overlapping appointments
    const existingAppointments = await this.findAllByDate(specialistId, date);
    const isOccupied = existingAppointments.some(app => {
      const appStart = this.timeToMinutes(app.startTime);
      const appEnd = this.timeToMinutes(app.endTime);
      return (startMinutes < appEnd && endMinutes > appStart);
    });

    if (isOccupied) {
      throw new ConflictException('Este horario ya está reservado');
    }

    // Determine service name and price dynamically
    let serviceName = 'Consulta';
    let servicePrice = price || 0;

    if (serviceId && specialist.offeredServices) {
      const offeredSvc = specialist.offeredServices.find(s => s.id === serviceId);
      if (offeredSvc) {
        serviceName = offeredSvc.specialties || offeredSvc.specialty || 'Consulta';
        servicePrice = parseFloat(offeredSvc.price as any);
      }
    }

    // 5. Create Appointment
    const appointment = this.appointmentRepository.create({
      client: user,
      specialist,
      date,
      startTime,
      endTime,
      notes,
      service: serviceName,
      price: servicePrice,
      status: AppointmentStatus.PENDING,
    });

    const savedAppointment = await this.appointmentRepository.save(appointment);

    // Send Emails (Non-blocking)
    try {
      this.mailService.sendAppointmentConfirmation(
        user.email,
        user.name,
        specialist.user.name,
        date,
        startTime,
      );

      this.mailService.sendNewAppointmentNotification(
        specialist.user.email,
        specialist.user.name,
        user.name,
        date,
        startTime,
      );
    } catch (mailErr) {
      console.error('Error enviando correos de cita:', mailErr);
    }

    return savedAppointment;
  }

  async findAllByDate(specialistId: string, date: string) {
    return await this.appointmentRepository.find({
      where: { 
        specialist: { id: specialistId },
        date,
        status: And(MoreThan(AppointmentStatus.CANCELLED), LessThan(AppointmentStatus.COMPLETED)) as any // simplify
      },
    });
  }

  // Override to get all for availability check (excluding cancelled)
  async findAllActiveByDate(specialistId: string, date: string) {
     return await this.appointmentRepository.find({
      where: { 
        specialist: { id: specialistId },
        date,
        status: And(MoreThan(AppointmentStatus.CANCELLED)) as any
      },
    });
  }

  async findByClient(userId: string) {
    return await this.appointmentRepository.find({
      where: { client: { id: userId } },
      relations: ['specialist', 'specialist.user'],
      order: { date: 'DESC', startTime: 'DESC' },
    });
  }

  async findBySpecialist(specialistId: string) {
    return await this.appointmentRepository.find({
      where: { specialist: { id: specialistId } },
      relations: ['client'],
      order: { date: 'DESC', startTime: 'DESC' },
    });
  }

  async createManual(specialistId: string, data: any) {
    const { nombre, email, telefono, fecha, hora, servicio, notas } = data;
    
    // 1. Verify Specialist
    const specialist = await this.specialistsService.findOne(specialistId);
    if (!specialist) throw new NotFoundException('Especialista no encontrado');

    const startMinutes = this.timeToMinutes(hora);
    const endMinutes = startMinutes + 30; // 30 min duration
    const endTime = this.minutesToTime(endMinutes);

    // 2. Create manual Appointment
    const appointment = this.appointmentRepository.create({
      specialist,
      date: fecha,
      startTime: hora,
      endTime,
      notes: notas,
      service: servicio || 'Consulta',
      price: 0,
      clientName: nombre,
      clientEmail: email,
      clientPhone: telefono,
      status: AppointmentStatus.CONFIRMED,
    });

    return await this.appointmentRepository.save(appointment);
  }

  async updateStatus(id: string, status: AppointmentStatus) {
    const appointment = await this.appointmentRepository.findOne({ where: { id } });
    if (!appointment) throw new NotFoundException('Cita no encontrada');
    appointment.status = status;
    return await this.appointmentRepository.save(appointment);
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

  async getAvailableTimes(specialistId: string, date: string) {
    const [year, month, day] = date.split('-').map(Number);
    const dayOfWeek = new Date(year, month - 1, day).getDay();
    const schedules = await this.schedulesService.findByDay(specialistId, dayOfWeek);

    if (!schedules || schedules.length === 0) {
      return { availableTimes: [], message: 'El especialista no atiende este día' };
    }

    const appointments = await this.findAllActiveByDate(specialistId, date);
    const bookedTimes = appointments.map(app => ({
      start: app.startTime,
      end: app.endTime,
    }));

    const availableTimes: string[] = [];

    for (const schedule of schedules) {
      const startMinutes = this.timeToMinutes(schedule.startTime);
      const endMinutes = this.timeToMinutes(schedule.endTime);

      for (let time = startMinutes; time < endMinutes; time += 30) {
        const timeStr = this.minutesToTime(time);
        const isBooked = bookedTimes.some(bt => {
          const btStart = this.timeToMinutes(bt.start);
          const btEnd = this.timeToMinutes(bt.end);
          return time >= btStart && time < btEnd;
        });

        if (!isBooked) {
          availableTimes.push(timeStr);
        }
      }
    }

    return { availableTimes };
  }

  async createWithPayment(data: {
    serviceId: string;
    specialistId: string;
    userId: string;
    price: number;
    duration: number;
    date: string;
    startTime: string;
    notes: string;
  }) {
    const user = await this.usersService.findOne(data.userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const specialist = await this.specialistsService.findOne(data.specialistId);
    if (!specialist) throw new NotFoundException('Especialista no encontrado');

    const endMinutes = this.timeToMinutes(data.startTime) + data.duration;
    const endTime = this.minutesToTime(endMinutes);

    const appointment = this.appointmentRepository.create({
      client: user,
      specialist,
      date: data.date,
      startTime: data.startTime,
      endTime,
      notes: data.notes,
      price: data.price,
      status: AppointmentStatus.CONFIRMED,
    });

    return await this.appointmentRepository.save(appointment);
  }

  async confirmAppointment(citaId: string, userId: string) {
    const appointment = await this.appointmentRepository.findOne({
      where: { id: citaId },
      relations: ['client'],
    });

    if (!appointment) throw new NotFoundException('Cita no encontrada');
    if (appointment.client?.id !== userId) {
      throw new ForbiddenException('No tienes permiso para confirmar esta cita');
    }

    appointment.status = AppointmentStatus.CONFIRMED;
    return await this.appointmentRepository.save(appointment);
  }
}
