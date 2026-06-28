import { Controller, Get, Post, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AppointmentsService } from '../appointments/appointments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OfferedServicesService } from '../offered-services/offered-services.service';

@ApiTags('Citas (Mobile)')
@Controller('citas')
export class CitasController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly offeredServicesService: OfferedServicesService,
  ) {}

  @Get('mis-citas/:userId')
  @ApiOperation({ summary: 'Obtener citas del usuario' })
  getUserAppointments(@Param('userId') userId: string) {
    return this.appointmentsService.findByClient(userId);
  }

  @Get('detalle/:serviceId')
  @ApiOperation({ summary: 'Obtener detalle de un servicio' })
  async getDetail(@Param('serviceId') serviceId: string) {
    return this.offeredServicesService.findById(serviceId);
  }

  @Get('available-times/:especialistaId/:date')
  @ApiOperation({ summary: 'Obtener horarios disponibles de un especialista' })
  getAvailableTimes(
    @Param('especialistaId') especialistaId: string,
    @Param('date') date: string,
  ) {
    return this.appointmentsService.getAvailableTimes(especialistaId, date);
  }

  @Post('create-payment-intent')
  @ApiOperation({ summary: 'Crear intención de pago (mock)' })
  createPaymentIntent(@Body() body: { amount: number; currency?: string }) {
    return {
      client_secret: `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substring(7)}`,
      amount: body.amount,
      currency: body.currency || 'hnl',
    };
  }

  @Post('agendar-con-pago')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Agendar cita con pago' })
  agendarConPago(@Body() body: {
    idservicio: number;
    especialistaid: number;
    userid: number;
    price: number;
    duration: number;
    date: string;
    hour: string;
    motivo?: string;
    notas_adicionales?: string;
    payment_intent_id: string;
  }) {
    return this.appointmentsService.createWithPayment({
      serviceId: body.idservicio.toString(),
      specialistId: body.especialistaid.toString(),
      userId: body.userid.toString(),
      price: body.price,
      duration: body.duration,
      date: body.date,
      startTime: body.hour,
      notes: body.motivo || body.notas_adicionales || '',
    });
  }

  @Put('cliente/:citaId/confirmar')
  @ApiOperation({ summary: 'Confirmar cita como cliente' })
  confirmarCita(@Param('citaId') citaId: string, @Body() body: { userid: number }) {
    return this.appointmentsService.confirmAppointment(citaId, body.userid.toString());
  }

  @Put(':citaId/cancelar')
  @ApiOperation({ summary: 'Cancelar cita' }
)
  cancelarCita(@Param('citaId') citaId: string) {
    return this.appointmentsService.updateStatus(citaId, 'cancelled' as any);
  }
}