import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StorageService } from '../storage/storage.service';

@ApiTags('Usuarios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get('deleted')
  findAllWithDeleted() {
    return this.usersService.findAllWithDeleted();
  }

  @Get('clients')
  findAllClients() {
    return this.usersService.findAllClients();
  }

  @Get('specialists')
  findAllSpecialists() {
    return this.usersService.findAllSpecialists();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Patch(':id/restore')
  restore(@Param('id') id: string) {
    return this.usersService.restore(id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Actualizar mi perfil (sin email)' })
  updateMe(
    @Request() req,
    @Body() body: { name?: string; telephone?: string; locationCountry?: string; locationCity?: string },
  ) {
    return this.usersService.update(req.user.id, body);
  }

  @Post('me/avatar')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Subir foto de perfil' })
  @ApiBody({ schema: { type: 'object', properties: { avatar: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('avatar', {
    storage: memoryStorage(),
    fileFilter: (_req, file, cb) => {
      const allowed = /\.(jpg|jpeg|png|webp|gif)$/i;
      if (!allowed.test(extname(file.originalname))) {
        return cb(new BadRequestException('Solo se permiten imágenes (jpg, png, webp, gif)'), false);
      }
      cb(null, true);
    },
    limits: { fileSize: 3 * 1024 * 1024 },
  }))
  async uploadAvatar(@Request() req, @UploadedFile() avatar: any) {
    if (!avatar) throw new BadRequestException('Falta el archivo avatar');
    const url = await this.storageService.upload(
      `avatars/${req.user.id}`,
      avatar.buffer,
      avatar.mimetype,
      avatar.originalname,
    );
    return this.usersService.update(req.user.id, { profilePicture: url });
  }
}
