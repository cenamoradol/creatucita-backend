import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpecialistsService } from './specialists.service';
import { SpecialistsController } from './specialists.controller';
import { Specialist } from './entities/specialist.entity';
import { Note } from './entities/note.entity';
import { Reminder } from './entities/reminder.entity';
import { SchedulesModule } from '../schedules/schedules.module';
import { AppointmentsModule } from '../appointments/appointments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Specialist, Note, Reminder]),
    forwardRef(() => SchedulesModule),
    forwardRef(() => AppointmentsModule),
  ],
  controllers: [SpecialistsController],
  providers: [SpecialistsService],
  exports: [SpecialistsService],
})
export class SpecialistsModule {}
