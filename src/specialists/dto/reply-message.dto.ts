import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ReplyMessageDto {
  @IsString()
  @IsNotEmpty({ message: 'La respuesta es obligatoria' })
  @MaxLength(2000, { message: 'La respuesta no puede exceder 2000 caracteres' })
  body: string;
}
