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

  async findById(serviceId: string) {
    const service = await this.offeredServiceRepository.findOne({
      where: { id: serviceId },
      relations: ['specialist', 'specialist.user'],
    });

    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }

    return {
      id: service.id,
      specialty: service.specialty,
      specialties: service.specialties,
      price: service.price,
      duration: service.duration,
      especialista: {
        id: service.specialist.id,
        name: service.specialist.user.name,
        locationCity: service.specialist.user.locationCity,
        locationCountry: service.specialist.user.locationCountry,
      },
    };
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

  async search(params: {
    q?: string;
    ciudad?: string;
    categoria?: string;
    precioMin?: number;
    precioMax?: number;
    orden?: string;
    userCiudad?: string;
    userPais?: string;
  }) {
    const qb = this.offeredServiceRepository
      .createQueryBuilder('service')
      .innerJoinAndSelect('service.specialist', 'specialist')
      .innerJoinAndSelect('specialist.user', 'user');

    if (params.q) {
      qb.andWhere('(service.specialty ILIKE :q OR service.specialties ILIKE :q)', { q: `%${params.q}%` });
    }

    if (params.categoria) {
      qb.andWhere('service.specialty ILIKE :categoria', { categoria: `%${params.categoria}%` });
    }

    if (params.ciudad) {
      qb.andWhere('user.locationCity ILIKE :ciudad', { ciudad: `%${params.ciudad}%` });
    }

    if (params.precioMin) {
      qb.andWhere('service.price >= :precioMin', { precioMin: params.precioMin });
    }

    if (params.precioMax) {
      qb.andWhere('service.price <= :precioMax', { precioMax: params.precioMax });
    }

    if (params.orden === 'price_asc') {
      qb.orderBy('service.price', 'ASC');
    } else if (params.orden === 'price_desc') {
      qb.orderBy('service.price', 'DESC');
    } else {
      qb.orderBy('service.createdAt', 'DESC');
    }

    const results = await qb.getMany();

    return results.map((service) => ({
      id: service.id,
      specialty: service.specialty,
      specialties: service.specialties,
      price: service.price,
      duration: service.duration,
      especialista: {
        id: service.specialist.id,
        name: service.specialist.user.name,
        locationCity: service.specialist.user.locationCity,
        locationCountry: service.specialist.user.locationCountry,
      },
    }));
  }
}
