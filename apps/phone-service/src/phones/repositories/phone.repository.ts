import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter } from 'mongoose';
import { BaseRepository, Phone, PhoneDocument } from '@app/database';
import { FilterPhoneDto } from '../dto/filter-phone.dto';

@Injectable()
export class PhoneRepository extends BaseRepository<Phone> {
  constructor(@InjectModel('Phone') model: Model<PhoneDocument>) {
    super(model);
  }
  findByBudget(
    maxPrice: number,
    minPrice: number = 0,
  ): Promise<PhoneDocument[]> {
    return this.model
      .find({
        'price.current': { $gte: minPrice, $lte: maxPrice },
      })
      .sort({ 'price.current': 1 })
      .exec();
  }
  async findByFilters(filters: FilterPhoneDto): Promise<{
    data: PhoneDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const query: QueryFilter<Phone> = { availability: 'available' };
    // Price filter
    if (filters.maxPrice || filters.minPrice) {
      query['price.current'] = {};
      if (filters.minPrice) query['price.current'].$gte = filters.minPrice;
      if (filters.maxPrice) query['price.current'].$lte = filters.maxPrice;
    }

    // Brand filter
    if (filters.brand) {
      query.brand = { $regex: filters.brand, $options: 'i' };
    }

    // Specs filters
    if (filters.ram) {
      query['specs.ram'] = { $gte: filters.ram };
    }

    if (filters.storage) {
      query['specs.storage'] = { $gte: filters.storage };
    }

    if (filters.battery) {
      query['specs.battery.capacity'] = { $gte: filters.battery };
    }

    if (filters.camera) {
      query['specs.camera.rear.main'] = { $gte: filters.camera };
    }

    if (filters.network) {
      query['specs.connectivity.network'] = filters.network;
    }

    if (filters.nfc !== undefined) {
      query['specs.connectivity.nfc'] = filters.nfc;
    }

    if (filters.refreshRate) {
      query['specs.display.refreshRate'] = { $gte: filters.refreshRate };
    }

    if (filters.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags };
    }
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.model
        .find(query)
        .sort({ rating: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.model.countDocuments(query).exec(),
    ]);

    return { data, total, page, limit };
  }
  searchPhones(keyword: string, limit: number = 10): Promise<PhoneDocument[]> {
    return this.model
      .find({
        $or: [
          { name: { $regex: keyword, $options: 'i' } },
          { brand: { $regex: keyword, $options: 'i' } },
          { tags: { $in: [new RegExp(keyword, 'i')] } },
        ],
        availability: 'available',
      })
      .limit(limit)
      .exec();
  }
  findBySlug(slug: string): Promise<PhoneDocument | null> {
    return this.model.findOne({ slug }).exec();
  }
  findByBrand(brand: string): Promise<PhoneDocument[]> {
    return this.model
      .find({
        brand: { $regex: brand, $options: 'i' },
        availability: 'available',
      })
      .exec();
  }
  comparePhones(ids: string[]): Promise<PhoneDocument[]> {
    return this.model
      .find({
        _id: { $in: ids },
        availability: 'available',
      })
      .exec();
  }
  getAllBrands(): Promise<string[]> {
    return this.model.distinct('brand', { availability: 'available' }).exec();
  }
}
