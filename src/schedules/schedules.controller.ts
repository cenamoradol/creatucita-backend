import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

import { BulkCreateScheduleDto } from './dto/bulk-create-schedule.dto';

@ApiTags('Horarios')
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SPECIALIST)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Definir un horario de atención (Solo Especialistas)' })
  create(@Request() req, @Body() createScheduleDto: CreateScheduleDto) {
    return this.schedulesService.create(req.user, createScheduleDto);
  }

  @Post('bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SPECIALIST)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Definir múltiples horarios de atención (Sobreescribe los anteriores)' })
  createBulk(@Request() req, @Body() bulkCreateDto: BulkCreateScheduleDto) {
    return this.schedulesService.createBulk(req.user, bulkCreateDto.schedules);
  }

  @Get('specialist/:id')
  @ApiOperation({ summary: 'Obtener los horarios de un especialista por su ID de perfil' })
  findAllBySpecialist(@Param('id') id: string) {
    return this.schedulesService.findAllBySpecialist(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SPECIALIST)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar un horario de atención' })
  remove(@Request() req, @Param('id') id: string) {
    return this.schedulesService.remove(id, req.user);
  }
}
