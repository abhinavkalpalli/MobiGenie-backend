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
} from '@nestjs/common';
import { PhonesService } from '../services/phones.service';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { FilterPhoneDto } from '../dto/filter-phone.dto';

@Controller('phones')
export class PhonesController {
  constructor(private readonly phonesService: PhonesService) {}

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
}
