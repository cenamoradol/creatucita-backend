import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';

@ApiTags('Categorías')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una categoría principal' })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Post(':id/subcategories')
  @ApiOperation({ summary: 'Crear una subcategoría dentro de una categoría' })
  createSubcategory(
    @Param('id') id: string,
    @Body() createSubcategoryDto: CreateSubcategoryDto,
  ) {
    return this.categoriesService.createSubcategory(id, createSubcategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las categorías con sus subcategorías' })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una categoría por ID' })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }
}
