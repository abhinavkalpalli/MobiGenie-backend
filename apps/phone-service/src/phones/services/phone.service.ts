import { Injectable, Logger } from '@nestjs/common';
import { PhoneRepository } from '../repositories/phone.repository';
import { FilterPhoneDto } from '../dto/filter-phone.dto';
import {
  ResourceNotFoundException,
  ValidationFailedException,
} from '@app/common';

@Injectable()
export class PhoneService {
  private readonly logger = new Logger(PhoneService.name);
  constructor(private readonly phoneRepository: PhoneRepository) {}
  async findByBudget(maxPrice: number, minPrice: number = 0) {
    const phones = await this.phoneRepository.findByBudget(maxPrice, minPrice);
    return { phones, count: phones.length };
  }

  // ─── Find by Filters ─────────────────────────
  async findByFilters(filters: FilterPhoneDto) {
    this.logger.log(`Finding phones with filters: ${JSON.stringify(filters)}`);
    const result = await this.phoneRepository.findByFilters(filters);
    return { phones: result.data, count: result.total };
  }

  // ─── Find by ID ──────────────────────────────
  async findById(id: string) {
    const phone = await this.phoneRepository.findById(id);
    if (!phone) {
      throw new ResourceNotFoundException(`Phone with id ${id}`);
    }
    return phone;
  }

  // ─── Find by Slug ────────────────────────────
  async findBySlug(slug: string) {
    const phone = await this.phoneRepository.findBySlug(slug);
    if (!phone) {
      throw new ResourceNotFoundException(`Phone with slug ${slug}`);
    }
    return phone;
  }

  // ─── Search ──────────────────────────────────
  async search(keyword: string, limit: number = 10) {
    this.logger.log(`Searching phones: "${keyword}"`);
    const phones = await this.phoneRepository.searchPhones(keyword, limit);
    return { phones, count: phones.length };
  }

  // ─── Compare ─────────────────────────────────
  async compare(ids: string[]) {
    if (ids.length < 2 || ids.length > 3) {
      throw new ValidationFailedException([
        'Compare requires 2 or 3 phone IDs',
      ]);
    }
    const phones = await this.phoneRepository.comparePhones(ids);
    return { phones, count: phones.length };
  }

  // ─── Get All Brands ──────────────────────────
  async getAllBrands() {
    const brands = await this.phoneRepository.getAllBrands();
    return { brands };
  }

  // ─── Get All Phones ──────────────────────────
  async findAll(page: number = 1, limit: number = 10) {
    return await this.phoneRepository.paginate({}, page, limit);
  }

  // ─── Admin: Create Phone ─────────────────────
  async create(data: any) {
    const phone = await this.phoneRepository.create(data);
    return phone;
  }

  // ─── Admin: Update Phone ─────────────────────
  async update(id: string, updates: any) {
    const phone = await this.phoneRepository.update(id, updates);
    if (!phone) {
      throw new ResourceNotFoundException(`Phone with id ${id}`);
    }
    return phone;
  }

  // ─── Admin: Delete Phone ─────────────────────
  async delete(id: string) {
    const phone = await this.phoneRepository.delete(id);
    if (!phone) {
      throw new ResourceNotFoundException(`Phone with id ${id}`);
    }
    return { deleted: true, id };
  }
}
