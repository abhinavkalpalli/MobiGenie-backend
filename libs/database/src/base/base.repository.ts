import type { HydratedDocument, Model, mongo, UpdateQuery } from 'mongoose';

type FilterQuery<T> = mongo.Filter<T>;
export type Doc<T> = HydratedDocument<T>;

export abstract class BaseRepository<TSchema> {
  protected readonly model: Model<TSchema>;

  constructor(model: Model<TSchema>) {
    this.model = model;
  }

  async findAll(filter: FilterQuery<TSchema> = {}) {
    return this.model.find(filter as any).exec();
  }

  async findOne(filter: FilterQuery<TSchema>): Promise<Doc<TSchema> | null> {
    return this.model.findOne(filter as any).exec() as Promise<Doc<TSchema> | null>;
  }

  async findById(id: string): Promise<Doc<TSchema> | null> {
    return this.model.findById(id).exec() as Promise<Doc<TSchema> | null>;
  }

  async create(data: Partial<TSchema>): Promise<Doc<TSchema>> {
    return this.model.create(data as any) as unknown as Doc<TSchema>;
  }

  async update(id: string, data: UpdateQuery<TSchema>) {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<Doc<TSchema> | null> {
    return this.model.findByIdAndDelete(id).exec() as Promise<Doc<TSchema> | null>;
  }

  async count(filter: FilterQuery<TSchema> = {}): Promise<number> {
    return this.model.countDocuments(filter as any).exec();
  }

  async paginate(
    filter: FilterQuery<TSchema> = {},
    page: number = 1,
    limit: number = 10,
  ) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.model.find(filter as any).skip(skip).limit(limit).exec(),
      this.model.countDocuments(filter as any).exec(),
    ]);
    return { data, total, page, limit };
  }
}
