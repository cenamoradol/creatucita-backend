import { Controller, Get, Post, Body, Param, Patch, UseGuards, Request, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { AppointmentStatus } from './entities/appointment.entity';
import { SpecialistsService } from '../specialists/specialists.service';

@ApiTags('Citas')
@Controller('appointments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly specialistsService: SpecialistsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Agendar una nueva cita' })
  create(@Request() req, @Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentsService.create(req.user, createAppointmentDto);
  }

  @Get('my-appointments')
  @ApiOperation({ summary: 'Ver mis citas (como cliente)' })
  findMy(@Request() req) {
    return this.appointmentsService.findByClient(req.user.id);
  }

  @Get('specialist/upcoming')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SPECIALIST)
  @ApiOperation({ summary: 'Ver citas pendientes (como especialista)' })
  async findSpecialist(@Request() req) {
    const specialist = await this.specialistsService.findByUser(req.user.id);
    if (!specialist) throw new NotFoundException('Perfil de especialista no encontrado');
    return this.appointmentsService.findBySpecialist(specialist.id);
  }

  @Post('specialist/create')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SPECIALIST)
  @ApiOperation({ summary: 'Crear una cita manual (como especialista)' })
  async createManual(@Request() req, @Body() body: any) {
    const specialist = await this.specialistsService.findByUser(req.user.id);
    if (!specialist) throw new NotFoundException('Perfil de especialista no encontrado');
    return this.appointmentsService.createManual(specialist.id, body);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Cambiar el estado de una cita' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: AppointmentStatus,
  ) {
    return this.appointmentsService.updateStatus(id, status);
  }
}
