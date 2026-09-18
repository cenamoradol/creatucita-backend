import { Transform, Type } from 'class-transformer';
import { IsNotEmpty, IsString, IsArray, IsOptional } from 'class-validator';

export class ApplySpecialistDto {
  @IsString()
  @IsNotEmpty({ message: 'El RTN es obligatorio' })
  rtn: string;

  @IsString()
  @IsNotEmpty({ message: 'El DNI es obligatorio' })
  dni: string;

  @IsString()
  @IsNotEmpty({ message: 'La dirección del consultorio es obligatoria' })
  clinicAddress: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',').filter(Boolean) : value,
  )
  @IsArray()
  @IsNotEmpty({ message: 'Debe seleccionar al menos una subcategoría' })
  subcategoryIds: string[];
}
