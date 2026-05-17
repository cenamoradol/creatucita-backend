import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OfferedService } from './entities/offered-service.entity';
import { CreateOfferedServiceDto } from './dto/create-offered-service.dto';
import { UpdateOfferedServiceDto } from './dto/update-offered-service.dto';
import { SpecialistsService } from '../specialists/specialists.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class OfferedServicesService {
  constructor(
    @InjectRepository(OfferedService)
    private readonly offeredServiceRepository: Repository<OfferedService>,
    @Inject(forwardRef(() => SpecialistsService))
    private readonly specialistsService: SpecialistsService,
  ) {}

  async create(user: User, createDto: CreateOfferedServiceDto) {
    const specialist = await this.specialistsService.findByUser(user.id);
    if (!specialist) throw new NotFoundException('Perfil de especialista no encontrado');

    const service = this.offeredServiceRepository.create({
      ...createDto,
      specialist,
    });
    return await this.offeredServiceRepository.save(service);
  }

  async findAllBySpecialist(specialistId: string) {
    return await this.offeredServiceRepository.find({
      where: { specialist: { id: specialistId } },
      order: { specialty: 'ASC', specialties: 'ASC' },
    });
  }

  async update(id: string, user: User, updateDto: UpdateOfferedServiceDto) {
    const service = await this.offeredServiceRepository.findOne({
      where: { id },
      relations: ['specialist', 'specialist.user'],
    });

    if (!service) throw new NotFoundException('Servicio no encontrado');
    if (service.specialist.user.id !== user.id) {
      throw new ForbiddenException('No tienes permiso para editar este servicio');
    }

    Object.assign(service, updateDto);
    return await this.offeredServiceRepository.save(service);
  }

  async remove(id: string, user: User) {
    const service = await this.offeredServiceRepository.findOne({
      where: { id },
      relations: ['specialist', 'specialist.user'],
    });

    if (!service) throw new NotFoundException('Servicio no encontrado');
    if (service.specialist.user.id !== user.id) {
      throw new ForbiddenException('No tienes permiso para eliminar este servicio');
    }

    return await this.offeredServiceRepository.remove(service);
  }
}
