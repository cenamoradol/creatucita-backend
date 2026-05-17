import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OfferedServicesService } from './offered-services.service';
import { OfferedServicesController } from './offered-services.controller';
import { OfferedService } from './entities/offered-service.entity';
import { SpecialistsModule } from '../specialists/specialists.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([OfferedService]),
    forwardRef(() => SpecialistsModule),
  ],
  controllers: [OfferedServicesController],
  providers: [OfferedServicesService],
  exports: [OfferedServicesService],
})
export class OfferedServicesModule {}
