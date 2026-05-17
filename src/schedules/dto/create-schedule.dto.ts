import { IsInt, IsNotEmpty, IsString, Matches, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateScheduleDto {
  @ApiProperty({ example: 1, description: 'Día de la semana (0 = Domingo, 1 = Lunes, ..., 6 = Sábado)' })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({ example: '09:00:00', description: 'Hora de inicio en formato HH:mm:ss' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):?([0-5]\d):?([0-5]\d)$/, { message: 'El formato de hora debe ser HH:mm:ss' })
  startTime: string;

  @ApiProperty({ example: '17:00:00', description: 'Hora de fin en formato HH:mm:ss' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):?([0-5]\d):?([0-5]\d)$/, { message: 'El formato de hora debe ser HH:mm:ss' })
  endTime: string;
}
