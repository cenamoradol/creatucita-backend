import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OfferedServicesService } from './offered-services.service';
import { CreateOfferedServiceDto } from './dto/create-offered-service.dto';
import { UpdateOfferedServiceDto } from './dto/update-offered-service.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Servicios Ofrecidos (Cobros)')
@Controller('specialists')
export class OfferedServicesController {
  constructor(private readonly offeredServicesService: OfferedServicesService) {}

  @Post('services')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SPECIALIST)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un servicio ofrecido (Solo Especialistas)' })
  create(@Request() req, @Body() createDto: CreateOfferedServiceDto) {
    return this.offeredServicesService.create(req.user, createDto);
  }

  @Get(':id/services')
  @ApiOperation({ summary: 'Obtener los servicios ofrecidos por un especialista' })
  findAllBySpecialist(@Param('id') id: string) {
    return this.offeredServicesService.findAllBySpecialist(id);
  }

  @Put('services/:serviceId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SPECIALIST)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar un servicio ofrecido' })
  update(
    @Request() req,
    @Param('serviceId') serviceId: string,
    @Body() updateDto: UpdateOfferedServiceDto,
  ) {
    return this.offeredServicesService.update(serviceId, req.user, updateDto);
  }

  @Delete('services/:serviceId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SPECIALIST)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar un servicio ofrecido' })
  remove(@Request() req, @Param('serviceId') serviceId: string) {
    return this.offeredServicesService.remove(serviceId, req.user);
  }
}
