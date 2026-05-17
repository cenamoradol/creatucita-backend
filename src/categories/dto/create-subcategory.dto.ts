import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubcategoryDto {
  @ApiProperty({ example: 'Medicina General' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
