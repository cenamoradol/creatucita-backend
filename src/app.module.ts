import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { SpecialistsModule } from './specialists/specialists.module';
import { CategoriesModule } from './categories/categories.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { SchedulesModule } from './schedules/schedules.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { OfferedServicesModule } from './offered-services/offered-services.module';
import { CitasModule } from './citas/citas.module';
import { SearchModule } from './search/search.module';
import databaseConfig from './config/database.config';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const url = process.env.DATABASE_URL;
        const base = {
          type: 'postgres' as const,
          autoLoadEntities: true,
          synchronize: true, // Only for development
        };
        if (url) {
          return { ...base, url };
        }
        return {
          ...base,
          host: configService.get<string>('database.host'),
          port: configService.get<number>('database.port'),
          username: configService.get<string>('database.username'),
          password: configService.get<string>('database.password'),
          database: configService.get<string>('database.database'),
        };
      },
    }),
    StorageModule,
    UsersModule,
    SpecialistsModule,
    CategoriesModule,
    AppointmentsModule,
    SchedulesModule,
    AuthModule,
    MailModule,
    OfferedServicesModule,
    CitasModule,
    SearchModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
