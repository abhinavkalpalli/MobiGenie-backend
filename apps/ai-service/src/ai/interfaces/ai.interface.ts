export interface ISuggestRequest {
  query: string;
  parsedFilters: {
    maxPrice?: number;
    minPrice?: number;
    ram?: number;
    battery?: number;
    camera?: number;
    network?: string;
    brand?: string;
    storage?: number;
    queryType?: string;
  };
  phones: IPhoneContext[];
  userId?: string;
}

export interface IPhoneContext {
  _id: string;
  name: string;
  brand: string;
  price: { current: number; currency: string };
  specs: {
    ram: number;
    storage: number;
    battery: { capacity: number; charging: number };
    camera: { rear: { main: number }; front: number };
    display: { size: number; type: string; refreshRate: number };
    connectivity: { network: string; nfc: boolean };
    processor: string;
    os: string;
  };
  rating: number;
  tags: string[];
}

export interface ISuggestStreamRequest extends ISuggestRequest {
  replyTo: string;
  correlationId: string;
}

export interface ISuggestResponse {
  text: string;
  recommendedIds: string[];
  tokensUsed: number;
  classification?: {
    category: string;
    confidence: number;
    tags: string[];
  };
}
