import { Module } from '@nestjs/common';
import { CitasController } from './citas.controller';
import { AppointmentsModule } from '../appointments/appointments.module';
import { OfferedServicesModule } from '../offered-services/offered-services.module';

@Module({
  imports: [AppointmentsModule, OfferedServicesModule],
  controllers: [CitasController],
})
export class CitasModule {}