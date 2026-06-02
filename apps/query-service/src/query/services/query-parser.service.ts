import { Injectable, Logger } from '@nestjs/common';
import { ParsedQuery, QueryType } from '../interfaces/parsed-query.interface';

@Injectable()
export class QueryParserService {
  private readonly logger = new Logger(QueryParserService.name);

  // Known brands
  private readonly brands = [
    'samsung',
    'apple',
    'oneplus',
    'xiaomi',
    'redmi',
    'poco',
    'realme',
    'vivo',
    'oppo',
    'motorola',
    'nothing',
    'google',
    'iqoo',
    'nokia',
    'lg',
  ];

  // ─── Main Parse Method ──────────────────────
  parse(query: string): ParsedQuery {
    const lowerQuery = query.toLowerCase();
    this.logger.log(`Parsing query: "${query}"`);

    const parsed: ParsedQuery = {
      queryType: 'general',
      originalQuery: query,
    };

    // Extract all components
    this.extractBudget(lowerQuery, parsed);
    this.extractRAM(lowerQuery, parsed);
    this.extractStorage(lowerQuery, parsed);
    this.extractBattery(lowerQuery, parsed);
    this.extractCamera(lowerQuery, parsed);
    this.extractNetwork(lowerQuery, parsed);
    this.extractNFC(lowerQuery, parsed);
    this.extractRefreshRate(lowerQuery, parsed);
    this.extractBrand(lowerQuery, parsed);

    // Classify query type
    parsed.queryType = this.classify(parsed);

    this.logger.log(`Parsed result: ${JSON.stringify(parsed)}`);
    return parsed;
  }

  // ─── Extract Budget ─────────────────────────
  private extractBudget(query: string, parsed: ParsedQuery) {
    // Patterns: "under 40000", "below 40k", "less than 40000",
    //           "budget of 40000", "within 40000", "40000 budget"
    //           "between 20000 and 40000"

    // Between range
    const betweenMatch = query.match(
      /between\s+(\d+(?:\.\d+)?)\s*(?:k|thousand)?\s+(?:and|to|-)\s+(\d+(?:\.\d+)?)\s*(?:k|thousand)?/,
    );
    if (betweenMatch) {
      parsed.minPrice = this.parseAmount(betweenMatch[1]);
      parsed.maxPrice = this.parseAmount(betweenMatch[2]);
      return;
    }

    // Under/below/less than/within/budget
    const underMatch = query.match(
      /(?:under|below|less\s+than|within|budget\s+of|upto|up\s+to|max|maximum)\s+(?:rs\.?|inr|₹)?\s*(\d+(?:\.\d+)?)\s*(?:k|thousand)?/,
    );
    if (underMatch) {
      parsed.maxPrice = this.parseAmount(underMatch[1]);
      return;
    }

    // "40000 budget" or "40k budget"
    const budgetMatch = query.match(
      /(?:rs\.?|inr|₹)?\s*(\d+(?:\.\d+)?)\s*(?:k|thousand)?\s+(?:budget|price|cost)/,
    );
    if (budgetMatch) {
      parsed.maxPrice = this.parseAmount(budgetMatch[1]);
      return;
    }

    // Above/more than/over (min price)
    const aboveMatch = query.match(
      /(?:above|over|more\s+than|starting\s+from|minimum)\s+(?:rs\.?|inr|₹)?\s*(\d+(?:\.\d+)?)\s*(?:k|thousand)?/,
    );
    if (aboveMatch) {
      parsed.minPrice = this.parseAmount(aboveMatch[1]);
    }
  }

  // ─── Extract RAM ────────────────────────────
  private extractRAM(query: string, parsed: ParsedQuery) {
    // "8GB RAM", "8 GB ram", "8gb", "atleast 8GB RAM"
    const ramMatch = query.match(
      /(?:atleast|at\s+least|minimum|min)?\s*(\d+)\s*gb\s*(?:ram|memory)?|(\d+)\s*gb\s*ram/,
    );
    if (ramMatch) {
      parsed.ram = parseInt(ramMatch[1] || ramMatch[2]);
    }
  }

  // ─── Extract Storage ────────────────────────
  private extractStorage(query: string, parsed: ParsedQuery) {
    // "128GB storage", "256 GB internal"
    const storageMatch = query.match(
      /(\d+)\s*gb\s*(?:storage|internal|rom|memory(?!\s*ram))/,
    );
    if (storageMatch) {
      parsed.storage = parseInt(storageMatch[1]);
    }
  }

  // ─── Extract Battery ────────────────────────
  private extractBattery(query: string, parsed: ParsedQuery) {
    // "5000mah", "5000 mah battery", "big battery"
    const batteryMatch = query.match(/(\d+)\s*mah/);
    if (batteryMatch) {
      parsed.battery = parseInt(batteryMatch[1]);
      return;
    }

    // "big battery" or "long battery life"
    if (
      query.includes('big battery') ||
      query.includes('long battery') ||
      query.includes('good battery')
    ) {
      parsed.battery = 4500; // minimum threshold
    }
  }

  // ─── Extract Camera ─────────────────────────
  private extractCamera(query: string, parsed: ParsedQuery) {
    // "50MP camera", "108 mp", "good camera"
    const cameraMatch = query.match(/(\d+)\s*mp\s*(?:camera)?/);
    if (cameraMatch) {
      parsed.camera = parseInt(cameraMatch[1]);
      return;
    }

    // "good camera" or "best camera"
    if (
      query.includes('good camera') ||
      query.includes('best camera') ||
      query.includes('camera phone')
    ) {
      parsed.camera = 50; // minimum threshold
    }
  }

  // ─── Extract Network ────────────────────────
  private extractNetwork(query: string, parsed: ParsedQuery) {
    if (query.includes('5g')) {
      parsed.network = '5G';
    } else if (query.includes('4g')) {
      parsed.network = '4G';
    }
  }

  // ─── Extract NFC ────────────────────────────
  private extractNFC(query: string, parsed: ParsedQuery) {
    if (query.includes('nfc')) {
      parsed.nfc = true;
    }
  }

  // ─── Extract Refresh Rate ───────────────────
  private extractRefreshRate(query: string, parsed: ParsedQuery) {
    // "120hz", "144 hz"
    const refreshMatch = query.match(/(\d+)\s*hz/);
    if (refreshMatch) {
      parsed.refreshRate = parseInt(refreshMatch[1]);
    }
  }

  // ─── Extract Brand ──────────────────────────
  private extractBrand(query: string, parsed: ParsedQuery) {
    for (const brand of this.brands) {
      if (query.includes(brand)) {
        parsed.brand = brand.charAt(0).toUpperCase() + brand.slice(1);
        return;
      }
    }
  }

  // ─── Classify Query Type ────────────────────
  private classify(parsed: ParsedQuery): QueryType {
    const hasBudget =
      parsed.maxPrice !== undefined || parsed.minPrice !== undefined;
    const hasSpecs =
      parsed.ram !== undefined ||
      parsed.battery !== undefined ||
      parsed.camera !== undefined ||
      parsed.storage !== undefined ||
      parsed.network !== undefined;
    const hasBrand = parsed.brand !== undefined;

    if (hasBudget && hasSpecs) return 'budget_spec';
    if (hasBudget && hasBrand) return 'brand';
    if (hasBudget) return 'budget';
    if (hasSpecs) return 'spec';
    if (hasBrand) return 'brand';
    return 'general';
  }

  // ─── Parse Amount ────────────────────────────
  // handles "40k" → 40000, "40000" → 40000
  private parseAmount(value: string): number {
    const num = parseFloat(value);
    // if original query had 'k' multiply by 1000
    return num < 1000 ? num * 1000 : num;
  }
}
