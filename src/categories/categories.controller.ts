import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
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

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una categoría' })
  updateCategory(@Param('id') id: string, @Body() data: { name?: string; description?: string; image?: string }) {
    return this.categoriesService.updateCategory(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una categoría' })
  deleteCategory(@Param('id') id: string) {
    return this.categoriesService.deleteCategory(id);
  }

  @Patch('subcategories/:id')
  @ApiOperation({ summary: 'Actualizar una subcategoría' })
  updateSubcategory(@Param('id') id: string, @Body() data: { name?: string; description?: string }) {
    return this.categoriesService.updateSubcategory(id, data);
  }

  @Delete('subcategories/:id')
  @ApiOperation({ summary: 'Eliminar una subcategoría' })
  deleteSubcategory(@Param('id') id: string) {
    return this.categoriesService.deleteSubcategory(id);
  }
}
