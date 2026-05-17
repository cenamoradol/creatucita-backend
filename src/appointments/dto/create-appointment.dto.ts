import { IsNotEmpty, IsString, IsUUID, Matches, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiProperty({ example: 'uuid-del-especialista' })
  @IsUUID()
  @IsNotEmpty()
  specialistId: string;

  @ApiProperty({ example: '2026-05-20', description: 'Fecha de la cita (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ example: '10:00:00', description: 'Hora de inicio (HH:mm:ss)' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):?([0-5]\d):?([0-5]\d)$/)
  startTime: string;

  @ApiProperty({ example: 'Propósito de la cita', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: 'uuid-del-servicio', required: false })
  @IsOptional()
  @IsString()
  serviceId?: string;

  @ApiProperty({ example: 500, required: false })
  @IsOptional()
  price?: number;
}
