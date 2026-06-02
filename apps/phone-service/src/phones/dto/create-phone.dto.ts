export class CreatePhoneDto {
  name!: string;
  brand!: string;
  slug!: string;
  image?: string;
  images?: string[];
  price!: {
    original: number;
    current: number;
    currency: string;
    discount: number;
  };
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
  tags?: string[];
  rating?: number;
  reviewCount?: number;
  availability?: string;
}
