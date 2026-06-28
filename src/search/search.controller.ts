import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OfferedServicesService } from '../offered-services/offered-services.service';

@ApiTags('Búsqueda')
@Controller('search')
export class SearchController {
  constructor(private readonly offeredServicesService: OfferedServicesService) {}

  @Get()
  @ApiOperation({ summary: 'Buscar servicios de especialistas' })
  search(
    @Query('q') q?: string,
    @Query('ciudad') ciudad?: string,
    @Query('categoria') categoria?: string,
    @Query('precioMin') precioMin?: string,
    @Query('precioMax') precioMax?: string,
    @Query('orden') orden?: string,
    @Query('userCiudad') userCiudad?: string,
    @Query('userPais') userPais?: string,
  ) {
    return this.offeredServicesService.search({
      q,
      ciudad,
      categoria,
      precioMin: precioMin ? parseFloat(precioMin) : undefined,
      precioMax: precioMax ? parseFloat(precioMax) : undefined,
      orden,
      userCiudad,
      userPais,
    });
  }
}