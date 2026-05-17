import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Salud' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Servicios relacionados con bienestar y medicina', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
