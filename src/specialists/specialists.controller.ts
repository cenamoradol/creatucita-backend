import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, NotFoundException, Patch, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { SpecialistsService } from './specialists.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApplySpecialistDto } from './dto/apply-specialist.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Especialistas')
@Controller('specialists')
export class SpecialistsController {
  constructor(private readonly specialistsService: SpecialistsService) {}

  @Get('my-application')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener el estado de mi solicitud de especialista' })
  async getMyApplication(@Request() req) {
    return this.specialistsService.findByUser(req.user.id);
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener los datos del dashboard del especialista' })
  async getDashboard(@Request() req) {
    return this.specialistsService.getDashboardData(req.user.id);
  }

  @Get('notes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener mis notas' })
  async getNotes(@Request() req) {
    const specialist = await this.specialistsService.findByUser(req.user.id);
    if (!specialist) throw new NotFoundException('Especialista no encontrado');
    return this.specialistsService.getNotes(specialist.id);
  }

  @Post('notes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una nota' })
  async createNote(@Request() req, @Body() body: any) {
    const specialist = await this.specialistsService.findByUser(req.user.id);
    if (!specialist) throw new NotFoundException('Especialista no encontrado');
    return this.specialistsService.createNote(specialist.id, body);
  }

  @Patch('notes/:id/archive')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Archivar/Desarchivar una nota' })
  async archiveNote(@Param('id') id: string) {
    return this.specialistsService.toggleNoteArchive(id);
  }

  @Delete('notes/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar una nota' })
  async deleteNote(@Param('id') id: string) {
    return this.specialistsService.deleteNote(id);
  }

  @Get('reminders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener mis recordatorios' })
  async getReminders(@Request() req) {
    const specialist = await this.specialistsService.findByUser(req.user.id);
    if (!specialist) throw new NotFoundException('Especialista no encontrado');
    return this.specialistsService.getReminders(specialist.id);
  }

  @Post('reminders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un recordatorio' })
  async createReminder(@Request() req, @Body() body: any) {
    const specialist = await this.specialistsService.findByUser(req.user.id);
    if (!specialist) throw new NotFoundException('Especialista no encontrado');
    return this.specialistsService.createReminder(specialist.id, body);
  }

  @Patch('reminders/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar un recordatorio' })
  async updateReminder(@Param('id') id: string, @Body() body: any) {
    return this.specialistsService.updateReminder(id, body);
  }

  @Delete('reminders/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar un recordatorio' })
  async deleteReminder(@Param('id') id: string) {
    return this.specialistsService.deleteReminder(id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los especialistas con filtros' })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'subcategoryId', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @Query('categoryId') categoryId?: string,
    @Query('subcategoryId') subcategoryId?: string,
    @Query('search') search?: string,
  ) {
    return this.specialistsService.findAll({ categoryId, subcategoryId, search });
  }

  @Post('my-specialties')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SPECIALIST)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Asociar subcategorías al perfil del especialista' })
  async updateMySpecialties(@Request() req, @Body('subcategoryIds') subcategoryIds: string[]) {
    const specialist = await this.specialistsService.findByUser(req.user.id);
    if (!specialist) {
      throw new NotFoundException('Perfil de especialista no encontrado');
    }
    return this.specialistsService.updateSubcategories(specialist.id, subcategoryIds);
  }

  @Post('apply')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aplicar como especialista (RTN, Dirección, etc.)' })
  async apply(@Request() req, @Body() applyDto: ApplySpecialistDto) {
    return this.specialistsService.apply(req.user, applyDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener perfil de un especialista' })
  findOne(@Param('id') id: string) {
    return this.specialistsService.findOne(id);
  }

  @Get(':id/availability')
  @ApiOperation({ summary: 'Consultar disponibilidad de un especialista para una fecha' })
  @ApiQuery({ name: 'date', example: '2026-05-20', description: 'Fecha en formato YYYY-MM-DD' })
  getAvailability(
    @Param('id') id: string,
    @Query('date') date: string,
  ) {
    return this.specialistsService.getAvailability(id, date);
  }
}
