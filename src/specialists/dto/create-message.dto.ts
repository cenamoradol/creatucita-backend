import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty({ message: 'El asunto es obligatorio' })
  @MaxLength(200, { message: 'El asunto no puede exceder 200 caracteres' })
  subject: string;

  @IsString()
  @IsNotEmpty({ message: 'El mensaje es obligatorio' })
  @MaxLength(2000, { message: 'El mensaje no puede exceder 2000 caracteres' })
  body: string;
}
