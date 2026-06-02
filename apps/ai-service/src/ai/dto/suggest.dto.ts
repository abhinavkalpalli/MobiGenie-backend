export class SuggestDto {
  query?: string;
  parsedFilters?: Record<string, any>;
  phones?: any[];
  userId?: string;
}

export class EmbedDto {
  text?: string;
}

export class VectorSearchDto {
  embedding?: number[];
  limit?: number;
}
