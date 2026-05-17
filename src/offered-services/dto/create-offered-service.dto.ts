import { IsInt, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOfferedServiceDto {
  @ApiProperty({ example: 'Odontología' })
  @IsString()
  @IsNotEmpty()
  specialty: string;

  @ApiProperty({ example: 'Limpieza Dental' })
  @IsString()
  @IsNotEmpty()
  specialties: string;

  @ApiProperty({ example: 50.0 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 30 })
  @IsInt()
  @Min(1)
  duration: number;
}
