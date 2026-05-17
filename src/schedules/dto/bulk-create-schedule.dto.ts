import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { CreateScheduleDto } from './create-schedule.dto';
import { ApiProperty } from '@nestjs/swagger';

export class BulkCreateScheduleDto {
  @ApiProperty({ type: [CreateScheduleDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateScheduleDto)
  schedules: CreateScheduleDto[];
}
