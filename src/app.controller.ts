import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({ summary: 'Liveness probe (usar como cronjob para evitar spin-down en Render)' })
  health() {
    return { status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() };
  }
}
