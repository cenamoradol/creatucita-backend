import { PartialType } from '@nestjs/swagger';
import { CreateOfferedServiceDto } from './create-offered-service.dto';

export class UpdateOfferedServiceDto extends PartialType(CreateOfferedServiceDto) {}
