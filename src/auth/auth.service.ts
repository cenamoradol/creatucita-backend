import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { SpecialistsService } from '../specialists/specialists.service';
import { MailService } from '../mail/mail.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly specialistsService: SpecialistsService,
    private readonly mailService: MailService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const user = await this.usersService.create({
      ...createUserDto,
      role: UserRole.CLIENT,
    });
    return this.generateToken(user);
  }

  async registerSpecialist(createUserDto: CreateUserDto) {
    const user = await this.usersService.create({
      ...createUserDto,
      role: UserRole.SPECIALIST,
    });
    
    await this.specialistsService.create(user);
    
    return this.generateToken(user);
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.usersService.findByEmail(email);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.generateToken(user);
  }

  private generateToken(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        telephone: user.telephone,
        locationCountry: user.locationCountry,
        locationCity: user.locationCity,
      },
    };
  }

  async createAdmin(body: { email: string; password: string; name: string }) {
    const user = await this.usersService.create({
      email: body.email,
      password: body.password,
      name: body.name,
      role: UserRole.ADMIN,
    });
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return { message: 'Si el correo existe, se envió el código de recuperación' };
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetCodeExpires = new Date(Date.now() + 60 * 60 * 1000);

    await this.usersService.update(user.id, {
      resetCode,
      resetCodeExpires,
    });

    await this.mailService.sendPasswordResetEmail(email, resetCode);

    return { message: 'Si el correo existe, se envió el código de recuperación' };
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (!user.resetCode || user.resetCode !== code) {
      throw new UnauthorizedException('Código de recuperación inválido');
    }

    if (!user.resetCodeExpires || new Date() > user.resetCodeExpires) {
      throw new UnauthorizedException('El código de recuperación ha expirado');
    }

    await this.usersService.updatePassword(user.id, newPassword);
    await this.usersService.update(user.id, { resetCode: undefined, resetCodeExpires: undefined });

    return { message: 'Contraseña actualizada exitosamente' };
  }
}
