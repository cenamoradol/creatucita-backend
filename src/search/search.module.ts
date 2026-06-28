import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { OfferedServicesModule } from '../offered-services/offered-services.module';

@Module({
  imports: [OfferedServicesModule],
  controllers: [SearchController],
})
export class SearchModule {}