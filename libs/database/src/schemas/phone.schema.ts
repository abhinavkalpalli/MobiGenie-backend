import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PhoneDocument = HydratedDocument<Phone>;

@Schema({ timestamps: true })
export class Phone {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  brand!: string;

  @Prop({ required: true, unique: true })
  slug!: string;

  @Prop({ default: '' })
  image!: string;

  @Prop({ type: [String], default: [] })
  images!: string[];

  @Prop({
    type: {
      original: { type: Number, required: true },
      current: { type: Number, required: true },
      currency: { type: String, default: 'INR' },
      discount: { type: Number, default: 0 },
    },
    required: true,
  })
  price!: {
    original: number;
    current: number;
    currency: string;
    discount: number;
  };

  @Prop({
    type: {
      ram: Number,
      storage: Number,
      processor: String,
      processorSpeed: Number,
      display: {
        _id: false,
        size: Number,
        type: { type: String },
        resolution: String,
        refreshRate: Number,
        brightness: Number,
      },
      camera: {
        _id: false,
        rear: {
          _id: false,
          main: Number,
          ultrawide: Number,
          macro: Number,
        },
        front: Number,
      },
      battery: {
        _id: false,
        capacity: Number,
        charging: Number,
        wireless: Boolean,
      },
      connectivity: {
        _id: false,
        network: String,
        wifi: String,
        bluetooth: String,
        nfc: Boolean,
        usb: String,
      },
      os: String,
      ui: String,
    },
    _id: false,
  })
  specs!: {
    ram: number;
    storage: number;
    processor: string;
    processorSpeed: number;
    display: {
      size: number;
      type: string;
      resolution: string;
      refreshRate: number;
      brightness: number;
    };
    camera: {
      rear: {
        main: number;
        ultrawide: number;
        macro: number;
      };
      front: number;
    };
    battery: {
      capacity: number;
      charging: number;
      wireless: boolean;
    };
    connectivity: {
      network: string;
      wifi: string;
      bluetooth: string;
      nfc: boolean;
      usb: string;
    };
    os: string;
    ui: string;
  };

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ default: 0 })
  rating!: number;

  @Prop({ default: 0 })
  reviewCount!: number;

  @Prop({
    default: 'available',
    enum: ['available', 'discontinued', 'upcoming'],
  })
  availability!: string;
}

export const PhoneSchema = SchemaFactory.createForClass(Phone);

// Indexes for fast queries
PhoneSchema.index({ 'price.current': 1 });
PhoneSchema.index({ brand: 1 });
PhoneSchema.index({ 'specs.ram': 1 });
PhoneSchema.index({ 'specs.battery.capacity': 1 });
PhoneSchema.index({ tags: 1 });
PhoneSchema.index({ name: 'text', brand: 'text' });
