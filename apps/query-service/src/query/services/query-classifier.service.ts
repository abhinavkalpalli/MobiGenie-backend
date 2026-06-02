import { Injectable } from '@nestjs/common';

@Injectable()
export class QueryClassifierService {
  // Is this a comparison query?
  isComparison(query: string): boolean {
    const comparisonKeywords = [
      'compare',
      'vs',
      'versus',
      'difference between',
      'better than',
      'which is better',
      'or',
    ];
    return comparisonKeywords.some((k) => query.toLowerCase().includes(k));
  }

  // Is this asking for the best phone?
  isBestPhone(query: string): boolean {
    const bestKeywords = [
      'best',
      'top',
      'recommend',
      'suggestion',
      'which phone',
      'what phone',
      'good phone',
    ];
    return bestKeywords.some((k) => query.toLowerCase().includes(k));
  }

  // Is this a gaming query?
  isGaming(query: string): boolean {
    const gamingKeywords = ['gaming', 'game', 'pubg', 'bgmi', 'fps'];
    return gamingKeywords.some((k) => query.toLowerCase().includes(k));
  }

  // Is this a camera query?
  isCameraFocused(query: string): boolean {
    const cameraKeywords = [
      'camera',
      'photo',
      'photography',
      'selfie',
      'portrait',
      'video',
    ];
    return cameraKeywords.some((k) => query.toLowerCase().includes(k));
  }

  // Get query intent tags
  getIntentTags(query: string): string[] {
    const tags: string[] = [];
    if (this.isGaming(query)) tags.push('gaming');
    if (this.isCameraFocused(query)) tags.push('camera');
    if (this.isComparison(query)) tags.push('comparison');
    if (this.isBestPhone(query)) tags.push('recommendation');
    return tags;
  }
}
