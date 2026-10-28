import {
  Controller,
  Get,
  Query,
  Res,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import type { Response } from 'express';
import { StorageService } from './storage.service';

@Controller('uploads')
export class FilesController {
  constructor(private readonly storageService: StorageService) {}

  // El dominio publico de R2 (pub-*.r2.dev) responde 401, asi que las imagenes
  // (fotos de perfil, DNI) se sirven a traves de la API.
  @Get()
  async get(@Query('key') key: string, @Res() res: Response) {
    if (!key || key.includes('..')) {
      throw new BadRequestException('Clave de archivo inválida');
    }

    const file = await this.storageService.getObject(key);
    if (!file) throw new NotFoundException('Archivo no encontrado');

    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(file.body);
  }
}
