import { IsNotEmpty, IsString, IsArray, IsOptional } from 'class-validator';

export class ApplySpecialistDto {
  @IsString()
  @IsNotEmpty({ message: 'El RTN es obligatorio' })
  rtn: string;

  @IsString()
  @IsNotEmpty({ message: 'La dirección del consultorio es obligatoria' })
  clinicAddress: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsArray()
  @IsNotEmpty({ message: 'Debe seleccionar al menos una subcategoría' })
  subcategoryIds: string[];
}
