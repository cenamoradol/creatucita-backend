import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, ...rest } = createUserDto;

    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      ...rest,
      email,
      password: hashedPassword,
    });

    return await this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find({
      withDeleted: false,
      select: ['id', 'email', 'name', 'role', 'telephone', 'locationCountry', 'locationCity', 'isActive', 'createdAt', 'updatedAt'],
    });
  }

  async findAllWithDeleted(): Promise<User[]> {
    return await this.userRepository.find({
      withDeleted: true,
      select: ['id', 'email', 'name', 'role', 'telephone', 'locationCountry', 'locationCity', 'isActive', 'createdAt', 'updatedAt', 'deletedAt'],
    });
  }

  async findAllClients(): Promise<User[]> {
    return await this.userRepository.find({
      where: { role: UserRole.CLIENT },
      select: ['id', 'email', 'name', 'role', 'telephone', 'locationCountry', 'locationCity', 'isActive', 'createdAt', 'updatedAt'],
    });
  }

  async findAllSpecialists(): Promise<User[]> {
    return await this.userRepository.find({
      where: { role: UserRole.SPECIALIST },
      select: ['id', 'email', 'name', 'role', 'telephone', 'locationCountry', 'locationCity', 'isActive', 'createdAt', 'updatedAt'],
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'name', 'role', 'isActive', 'telephone', 'locationCountry', 'locationCity'], // explicit select password for auth
    });
  }

  async findOne(id: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { id } });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    if (!user) {
      throw new ConflictException('Usuario no encontrado');
    }

    const updatedUser = Object.assign(user, updateUserDto);
    return await this.userRepository.save(updatedUser);
  }

  async remove(id: string): Promise<void> {
    await this.userRepository.softDelete(id);
  }

  async restore(id: string): Promise<User | null> {
    await this.userRepository.restore(id);
    return this.findOne(id);
  }
}
