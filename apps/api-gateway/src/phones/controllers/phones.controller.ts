import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Body,
  Post,
  Put,
  Delete,
} from '@nestjs/common';
import { PhonesService } from '../services/phones.service';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { FilterPhoneDto } from '../dto/filter-phone.dto';
import { Reflector } from '@nestjs/core';

@Controller('phones')
export class PhonesController {
  constructor(
    private readonly phonesService: PhonesService,
    private readonly reflector: Reflector,
  ) {}

  // ─── GET /api/v1/phones ───────────────────────
  // Get all phones with optional filters
  // ?maxPrice=40000&ram=8&network=5G&page=1&limit=10
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() filters: FilterPhoneDto) {
    const { data, total, page, limit } =
      await this.phonesService.findAll(filters);
    return {
      message: 'Phones retrieved successfully',
      data,
      total,
      page,
      limit,
    };
  }

  // ─── GET /api/v1/phones/budget ────────────────
  // Get phones by budget
  // ?maxPrice=40000&minPrice=20000
  @Get('budget')
  @HttpCode(HttpStatus.OK)
  async findByBudget(
    @Query('maxPrice') maxPrice: number,
    @Query('minPrice') minPrice: number = 0,
  ) {
    const result = await this.phonesService.findByBudget(maxPrice, minPrice);
    return {
      message: 'Phones fetched by budget',
      data: result,
    };
  }

  // ─── POST /api/v1/phones/compare ─────────────
  // Compare 2 or 3 phones
  // Body: { "ids": ["id1", "id2"] }
  @UseGuards(JwtAuthGuard)
  @Post('compare')
  @HttpCode(HttpStatus.OK)
  async compare(@Body('ids') ids: string[]) {
    const result = await this.phonesService.compare(ids);
    return {
      message: 'Phones comparison ready',
      data: result,
    };
  }

  // ─── GET /api/v1/phones/:id ───────────────────
  // Get single phone by ID
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findById(@Param('id') id: string) {
    const result = await this.phonesService.findById(id);
    return {
      message: 'Phone fetched successfully',
      data: result,
    };
  }

  // ─── Admin: GET /api/v1/phones/admin/all ──────
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/all')
  @HttpCode(HttpStatus.OK)
  async adminFindAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    const result = await this.phonesService.findAllAdmin(page, limit);
    return { message: 'All phones retrieved', data: result };
  }

  // ─── Admin: POST /api/v1/phones/admin ─────────
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('admin')
  @HttpCode(HttpStatus.CREATED)
  async adminCreate(@Body() body: any) {
    const result = await this.phonesService.createPhone(body);
    return { message: 'Phone created successfully', data: result };
  }

  // ─── Admin: PUT /api/v1/phones/admin/:id ──────
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put('admin/:id')
  @HttpCode(HttpStatus.OK)
  async adminUpdate(@Param('id') id: string, @Body() body: any) {
    const result = await this.phonesService.updatePhone(id, body);
    return { message: 'Phone updated successfully', data: result };
  }

  // ─── Admin: DELETE /api/v1/phones/admin/:id ───
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('admin/:id')
  @HttpCode(HttpStatus.OK)
  async adminDelete(@Param('id') id: string) {
    const result = await this.phonesService.deletePhone(id);
    return { message: 'Phone deleted successfully', data: result };
  }
}
