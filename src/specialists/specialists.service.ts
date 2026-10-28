import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, IsNull, In } from 'typeorm';
import { Specialist, SpecialistStatus } from './entities/specialist.entity';
import { Note } from './entities/note.entity';
import { Reminder } from './entities/reminder.entity';
import { Message, MessageSenderRole } from './entities/message.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { SchedulesService } from '../schedules/schedules.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { ApplySpecialistDto } from './dto/apply-specialist.dto';
import { CreateMessageDto } from './dto/create-message.dto';

const MAX_MESSAGES_PER_HOUR = 5;

@Injectable()
export class SpecialistsService {
  constructor(
    @InjectRepository(Specialist)
    private readonly specialistRepository: Repository<Specialist>,
    @InjectRepository(Note)
    private readonly noteRepository: Repository<Note>,
    @InjectRepository(Reminder)
    private readonly reminderRepository: Repository<Reminder>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @Inject(forwardRef(() => SchedulesService))
    public readonly schedulesService: SchedulesService,
    @Inject(forwardRef(() => AppointmentsService))
    private readonly appointmentsService: AppointmentsService,
  ) {}

  async getDashboardData(userId: string) {
    const specialist = await this.findByUser(userId);
    if (!specialist) throw new NotFoundException('Especialista no encontrado');

    const appointments = await this.appointmentsService.findBySpecialist(
      specialist.id,
    );
    const notes = await this.noteRepository.find({
      where: { specialist: { id: specialist.id } },
      order: { createdAt: 'DESC' },
    });
    const reminders = await this.reminderRepository.find({
      where: { specialist: { id: specialist.id } },
      order: { date: 'ASC', time: 'ASC' },
    });
    const unreadMessages = await this.messageRepository.count({
      where: {
        specialist: { id: specialist.id },
        senderRole: MessageSenderRole.CLIENT,
        readAt: IsNull(),
      },
    });

    return {
      appointments,
      notas: notes,
      recordatorios: reminders,
      mensajesSinLeer: unreadMessages,
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
    if (result.affected === 0)
      throw new NotFoundException('Nota no encontrada');
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
    if (result.affected === 0)
      throw new NotFoundException('Recordatorio no encontrado');
    return { success: true };
  }

  // ===================== MENSAJES =====================

  async createMessageFromClient(
    user: User,
    specialistId: string,
    dto: CreateMessageDto,
  ) {
    const specialist = await this.findOne(specialistId);
    if (specialist.status !== SpecialistStatus.APPROVED) {
      throw new BadRequestException('El especialista no está disponible');
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recent = await this.messageRepository.count({
      where: {
        client: { id: user.id },
        senderRole: MessageSenderRole.CLIENT,
        createdAt: MoreThan(oneHourAgo),
      },
    });
    if (recent >= MAX_MESSAGES_PER_HOUR) {
      throw new BadRequestException(
        'Has enviado demasiados mensajes. Intenta de nuevo en una hora.',
      );
    }

    const message = this.messageRepository.create({
      specialist,
      client: user,
      subject: dto.subject.trim(),
      body: dto.body.trim(),
      senderRole: MessageSenderRole.CLIENT,
      inReplyTo: null,
    });
    return await this.messageRepository.save(message);
  }

  async getInboxForSpecialist(specialistId: string) {
    const roots = await this.messageRepository.find({
      where: {
        specialist: { id: specialistId },
        inReplyTo: IsNull(),
        senderRole: MessageSenderRole.CLIENT,
      },
      relations: ['client', 'specialist.user'],
      order: { createdAt: 'DESC' },
    });
    return this.attachReplies(roots, MessageSenderRole.SPECIALIST);
  }

  async getSentForClient(userId: string) {
    const roots = await this.messageRepository.find({
      where: { client: { id: userId }, inReplyTo: IsNull() },
      relations: ['specialist', 'specialist.user', 'client'],
      order: { createdAt: 'DESC' },
    });
    return this.attachReplies(roots, MessageSenderRole.CLIENT);
  }

  async getThread(user: User, messageId: string) {
    const target = await this.findOneMessage(messageId);
    this.assertParticipant(user, target);
    const rootId = target.inReplyTo || target.id;
    const root =
      rootId === target.id
        ? target
        : await this.findOneMessage(rootId);
    const replies = await this.messageRepository.find({
      where: { inReplyTo: rootId },
      relations: ['client', 'specialist.user'],
      order: { createdAt: 'ASC' },
    });
    await this.markReadMessages([target]);
    return { ...root, replies };
  }

  async replyToMessage(user: User, messageId: string, body: string) {
    const target = await this.findOneMessage(messageId);
    this.assertParticipant(user, target);

    const senderRole = await this.getSenderRole(user, target);
    const rootId = target.inReplyTo || target.id;
    const root =
      rootId === target.id
        ? target
        : await this.findOneMessage(rootId);

    await this.markReadMessages([target]);

    const reply = this.messageRepository.create({
      specialist: root.specialist,
      client: root.client,
      subject: root.subject,
      body: body.trim(),
      senderRole,
      inReplyTo: rootId,
    });
    return await this.messageRepository.save(reply);
  }

  async markMessageAsRead(user: User, messageId: string) {
    const target = await this.findOneMessage(messageId);
    this.assertParticipant(user, target);
    await this.markReadMessages([target]);
    return { success: true };
  }

  async countUnread(user: User) {
    const specialist = await this.findByUser(user.id);
    const where = specialist
      ? {
          specialist: { id: specialist.id },
          senderRole: MessageSenderRole.CLIENT,
        }
      : {
          client: { id: user.id },
          senderRole: MessageSenderRole.SPECIALIST,
        };
    const count = await this.messageRepository.count({
      where: { ...where, readAt: IsNull() },
    });
    return { count };
  }

  private async findOneMessage(id: string) {
    const message = await this.messageRepository.findOne({
      where: { id },
      relations: ['client', 'specialist', 'specialist.user'],
    });
    if (!message) throw new NotFoundException('Mensaje no encontrado');
    return message;
  }

  private async getSenderRole(
    user: User,
    target: Message,
  ): Promise<MessageSenderRole> {
    const specialist = await this.findByUser(user.id);
    if (specialist && target.specialist?.id === specialist.id) {
      return MessageSenderRole.SPECIALIST;
    }
    return MessageSenderRole.CLIENT;
  }

  private assertParticipant(user: User, target: Message) {
    const specialist = target.specialist;
    const client = target.client;
    const isSpecialist = specialist?.user?.id === user.id;
    const isClient = client?.id === user.id;
    if (!isSpecialist && !isClient) {
      throw new ForbiddenException('No tienes acceso a este mensaje');
    }
  }

  private async markReadMessages(messages: Message[]) {
    const pending = messages.filter((m) => !m.readAt);
    if (pending.length === 0) return;
    const now = new Date();
    pending.forEach((m) => (m.readAt = now));
    await this.messageRepository.save(pending);
  }

  private async attachReplies(roots: Message[], viewerRole: MessageSenderRole) {
    if (roots.length === 0) return [];
    const replies = await this.messageRepository.find({
      where: { inReplyTo: In(roots.map((r) => r.id)) },
      relations: ['client'],
      order: { createdAt: 'ASC' },
    });
    const byRoot = new Map<string, Message[]>();
    replies.forEach((reply) => {
      const list = byRoot.get(reply.inReplyTo as string) || [];
      list.push(reply);
      byRoot.set(reply.inReplyTo as string, list);
    });
    return roots.map((root) => {
      const thread = [root, ...(byRoot.get(root.id) || [])];
      return {
        ...root,
        replies: byRoot.get(root.id) || [],
        unread: thread.some(
          (m) => m.senderRole !== viewerRole && !m.readAt,
        ),
        lastMessageAt: thread[thread.length - 1].createdAt,
      };
    });
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
      relations: ['user', 'subcategories', 'subcategories.category'],
    });
  }

  async apply(
    user: User,
    applyDto: ApplySpecialistDto,
    dniFile?: string,
  ): Promise<Specialist> {
    const { subcategoryIds, ...rest } = applyDto;

    let specialist = await this.findByUser(user.id);

    if (specialist) {
      // Update existing application
      Object.assign(specialist, rest);
      if (dniFile) specialist.dniFile = dniFile;
      specialist.status = SpecialistStatus.PENDING; // Reset to pending if they update it
    } else {
      // Create new application
      specialist = this.specialistRepository.create({
        ...rest,
        dniFile,
        user,
        status: SpecialistStatus.PENDING,
      });
    }

    if (subcategoryIds) {
      specialist.subcategories = subcategoryIds.map((id) => ({ id }) as any);
    }

    return await this.specialistRepository.save(specialist);
  }

  async findAll(
    filters: {
      categoryId?: string;
      subcategoryId?: string;
      search?: string;
    } = {},
  ) {
    const query = this.specialistRepository
      .createQueryBuilder('specialist')
      .leftJoinAndSelect('specialist.user', 'user')
      .leftJoinAndSelect('specialist.subcategories', 'subcategory')
      .leftJoinAndSelect('subcategory.category', 'category')
      .where('specialist.status = :status', {
        status: SpecialistStatus.APPROVED,
      });

    if (filters.categoryId) {
      query.andWhere('category.id = :categoryId', {
        categoryId: filters.categoryId,
      });
    }

    if (filters.subcategoryId) {
      query.andWhere('subcategory.id = :subcategoryId', {
        subcategoryId: filters.subcategoryId,
      });
    }

    if (filters.search) {
      query.andWhere(
        '(user.name ILIKE :search OR specialist.bio ILIKE :search OR category.name ILIKE :search OR subcategory.name ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    return await query.getMany();
  }

  async findOne(id: string) {
    const specialist = await this.specialistRepository.findOne({
      where: { id },
      relations: [
        'user',
        'subcategories',
        'subcategories.category',
        'schedules',
        'offeredServices',
      ],
    });
    if (!specialist) throw new NotFoundException('Especialista no encontrado');
    return specialist;
  }

  async updateSubcategories(id: string, subcategoryIds: string[]) {
    const specialist = await this.findOne(id);
    // Note: In a real app we'd validate the IDs exist, but for now we trust the client or handle DB error
    specialist.subcategories = subcategoryIds.map(
      (subId) => ({ id: subId }) as any,
    );
    return await this.specialistRepository.save(specialist);
  }

  async getAvailability(id: string, dateStr: string) {
    const specialist = await this.findOne(id);
    const date = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = date.getDay();

    const schedules = await this.schedulesService.findByDay(id, dayOfWeek);
    if (schedules.length === 0) return [];

    const appointments = await this.appointmentsService.findAllByDate(
      id,
      dateStr,
    );

    const availableSlots: { start: string; end: string }[] = [];
    // Use specialist's appointment duration (default 30 min)
    const slotDuration = specialist.appointmentDuration || 30;

    for (const schedule of schedules) {
      let currentTime = this.timeToMinutes(schedule.startTime);
      const endTime = this.timeToMinutes(schedule.endTime);

      while (currentTime + slotDuration <= endTime) {
        const slotStart = this.minutesToTime(currentTime);
        const slotEnd = this.minutesToTime(currentTime + slotDuration);

        const isOccupied = appointments.some((app) => {
          const appStart = this.timeToMinutes(app.startTime);
          const appEnd = this.timeToMinutes(app.endTime);
          return currentTime < appEnd && currentTime + slotDuration > appStart;
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

  async updateProfile(
    userId: string,
    data: {
      name?: string;
      phone?: string;
      bio?: string;
      clinicAddress?: string;
      rtn?: string;
      locationCountry?: string;
      locationCity?: string;
      appointmentDuration?: number;
      minAdvanceBooking?: number;
    },
  ) {
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

    if (data.clinicAddress !== undefined) {
      specialist.clinicAddress = data.clinicAddress;
    }

    if (data.rtn !== undefined) {
      specialist.rtn = data.rtn;
    }

    if (data.locationCountry !== undefined) {
      specialist.user.locationCountry = data.locationCountry;
      await this.specialistRepository.manager.save(specialist.user);
    }

    if (data.locationCity !== undefined) {
      specialist.user.locationCity = data.locationCity;
      await this.specialistRepository.manager.save(specialist.user);
    }

    if (data.appointmentDuration !== undefined) {
      specialist.appointmentDuration = data.appointmentDuration;
    }

    if (data.minAdvanceBooking !== undefined) {
      specialist.minAdvanceBooking = data.minAdvanceBooking;
    }

    return await this.specialistRepository.save(specialist);
  }

  async setProfilePicture(specialistId: string, url: string): Promise<Specialist> {
    const specialist = await this.findOne(specialistId);
    if (!specialist) throw new NotFoundException('Especialista no encontrado');
    specialist.profilePicture = url;
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
      relations: ['user'],
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
      relations: ['user'],
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

  async getOfferedServices(specialistId: string) {
    const specialist = await this.findOne(specialistId);
    return specialist.offeredServices || [];
  }
}
