import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as tf from '@tensorflow/tfjs';

export enum QueryCategory {
  BUDGET = 'budget',
  GAMING = 'gaming',
  CAMERA = 'camera',
  BATTERY = 'battery',
  PERFORMANCE = 'performance',
  SELFIE = 'selfie',
  BUSINESS = 'business',
  GENERAL = 'general',
}

export interface ClassificationResult {
  category: QueryCategory;
  confidence: number;
  allScores: Record<QueryCategory, number>;
  tags: string[];
}

@Injectable()
export class ClassifierService implements OnModuleInit {
  private readonly logger = new Logger(ClassifierService.name);
  private model: any = null;

  private readonly trainingData = {
    [QueryCategory.BUDGET]: [
      'cheap phone',
      'budget phone',
      'affordable mobile',
      'phone under 10000',
      'low price phone',
      'economical phone',
      'best phone under 20000',
      'value for money phone',
      'phone within budget',
      'inexpensive smartphone',
    ],
    [QueryCategory.GAMING]: [
      'gaming phone',
      'pubg phone',
      'bgmi phone',
      'high fps phone',
      'gaming performance phone',
      'phone for games',
      'best gaming mobile',
      'snapdragon gaming phone',
      'high refresh rate gaming',
      'cooling system gaming phone',
    ],
    [QueryCategory.CAMERA]: [
      'best camera phone',
      'good photo phone',
      'photography phone',
      'high mp camera',
      'night mode camera',
      'portrait mode phone',
      'zoom camera phone',
      'pro camera mobile',
      'best camera under 30000',
      'dslr quality phone',
    ],
    [QueryCategory.BATTERY]: [
      'long battery phone',
      'big battery mobile',
      '5000mah phone',
      'battery life phone',
      'phone that lasts all day',
      'best battery phone',
      'fast charging phone',
      'long lasting battery',
      'heavy usage battery phone',
      'power bank phone',
    ],
    [QueryCategory.PERFORMANCE]: [
      'fastest phone',
      'powerful processor',
      'snapdragon 8 gen phone',
      'flagship performance',
      'smooth performance phone',
      'no lag phone',
      'best processor phone',
      'high performance mobile',
      'multitasking phone',
      'speed phone',
    ],
    [QueryCategory.SELFIE]: [
      'selfie phone',
      'front camera phone',
      'best selfie mobile',
      'video call phone',
      'beauty mode phone',
      'wide angle selfie',
      'high mp front camera',
      'instagram phone',
      'portrait selfie phone',
      'vlogging phone',
    ],
    [QueryCategory.BUSINESS]: [
      'business phone',
      'professional mobile',
      'office phone',
      'email phone',
      'productivity phone',
      'secure phone',
      'enterprise mobile',
      'work phone',
      'conference call phone',
      'document phone',
    ],
    [QueryCategory.GENERAL]: [
      'good phone',
      'recommend phone',
      'suggest mobile',
      'which phone to buy',
      'best phone 2024',
      'latest phone',
      'new phone',
      'phone suggestion',
      'what phone should i buy',
      'phone recommendation',
    ],
  };

  // ─── On Startup ──────────────────────────────
  async onModuleInit() {
    await this.initModel();
  }

  // ─── Init — Train in memory ───────────────────
  private async initModel() {
    await this.buildAndTrainModel();
  }

  // ─── Build & Train ────────────────────────────
  private async buildAndTrainModel() {
    try {
      this.logger.log('🧠 Training TensorFlow model...');

      const categories = Object.values(QueryCategory);
      const numCategories = categories.length;

      const { xs, ys } = this.prepareTrainingData(categories);

      this.model = tf.sequential({
        layers: [
          tf.layers.dense({
            inputShape: [100],
            units: 64,
            activation: 'relu',
          }),
          tf.layers.dropout({ rate: 0.3 }),
          tf.layers.dense({
            units: 32,
            activation: 'relu',
          }),
          tf.layers.dense({
            units: numCategories,
            activation: 'softmax',
          }),
        ],
      });

      this.model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy'],
      });

      await this.model.fit(xs, ys, {
        epochs: 50,
        batchSize: 16,
        validationSplit: 0.2,
        verbose: 0,
        callbacks: {
          onEpochEnd: (epoch: number, logs?: tf.Logs) => {
            if (epoch % 10 === 0) {
              this.logger.log(
                `Epoch ${epoch}: loss=${logs?.loss?.toFixed(4)} ` +
                  `acc=${logs?.acc?.toFixed(4)}`,
              );
            }
          },
        },
      });

      this.logger.log('✅ Model trained successfully!');

      xs.dispose();
      ys.dispose();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Training failed: ${message}`);
    }
  }

  // ─── Retrain (manual trigger) ────────────────
  async retrainModel() {
    this.logger.log('🔄 Retraining model...');
    await this.buildAndTrainModel();
    return { message: 'Model retrained successfully' };
  }

  // ─── Prepare Training Data ────────────────────
  private prepareTrainingData(categories: string[]) {
    const inputs: number[][] = [];
    const outputs: number[][] = [];

    categories.forEach((category, categoryIndex) => {
      const examples = this.trainingData[category as QueryCategory] || [];

      examples.forEach((example) => {
        inputs.push(this.textToFeatures(example));

        const label: number[] = new Array<number>(categories.length).fill(0);
        label[categoryIndex] = 1;
        outputs.push(label);
      });
    });

    return {
      xs: tf.tensor2d(inputs),
      ys: tf.tensor2d(outputs),
    };
  }

  // ─── Text to Features ─────────────────────────
  textToFeatures(text: string): number[] {
    const features: number[] = new Array<number>(100).fill(0);
    const words = text.toLowerCase().split(/\s+/);

    const featureGroups = {
      budget: [
        'cheap',
        'budget',
        'affordable',
        'price',
        'under',
        'low',
        'economic',
        'value',
        'inexpensive',
        'cost',
      ],
      gaming: [
        'gaming',
        'game',
        'pubg',
        'bgmi',
        'fps',
        'refresh',
        'performance',
        'lag',
        'cooling',
        'processor',
      ],
      camera: [
        'camera',
        'photo',
        'photography',
        'mp',
        'zoom',
        'portrait',
        'night',
        'dslr',
        'picture',
        'image',
      ],
      battery: [
        'battery',
        'mah',
        'charging',
        'power',
        'lasting',
        'day',
        'fast',
        'wireless',
        'backup',
        'drain',
      ],
      performance: [
        'fast',
        'powerful',
        'snapdragon',
        'flagship',
        'smooth',
        'speed',
        'multitask',
        'ram',
        'processor',
        'benchmark',
      ],
      selfie: [
        'selfie',
        'front',
        'vlog',
        'beauty',
        'wide',
        'instagram',
        'portrait',
        'video',
        'call',
        'filter',
      ],
      business: [
        'business',
        'professional',
        'office',
        'email',
        'productivity',
        'secure',
        'enterprise',
        'work',
        'document',
        'conference',
      ],
      general: [
        'good',
        'best',
        'recommend',
        'suggest',
        'buy',
        'latest',
        'new',
        'which',
        'should',
        'what',
      ],
    };

    Object.values(featureGroups).forEach((keywords, groupIndex) => {
      keywords.forEach((keyword, keywordIndex) => {
        if (words.includes(keyword)) {
          features[groupIndex * 10 + keywordIndex] = 1;
        }
      });
    });

    features[80] = Math.min(words.length / 10, 1);
    features[81] = words.some((w) => /\d+k?/.test(w)) ? 1 : 0;
    features[82] = words.includes('5g') ? 1 : 0;
    features[83] = words.includes('nfc') ? 1 : 0;

    return features;
  }

  // ─── Main Classify ────────────────────────────
  async classify(query: string): Promise<ClassificationResult> {
    try {
      if (!this.model) {
        return this.fallbackClassify(query);
      }

      const features = this.textToFeatures(query);
      const inputTensor = tf.tensor2d([features]);
      const prediction = this.model.predict(inputTensor) as tf.Tensor;
      const scores = (await prediction.data()) as Float32Array;

      inputTensor.dispose();
      prediction.dispose();

      const categories = Object.values(QueryCategory);
      const scoresObj = {} as Record<QueryCategory, number>;

      categories.forEach((cat, i) => {
        scoresObj[cat] = Number(scores[i].toFixed(4));
      });

      const maxScore = Math.max(...Array.from(scores));
      const maxIndex = Array.from(scores).indexOf(maxScore);
      const category = categories[maxIndex];
      const tags = this.getTagsForCategory(category, query);

      this.logger.log(
        `Classified: "${query}" → ${category} ` +
          `(${(maxScore * 100).toFixed(1)}%)`,
      );

      return { category, confidence: maxScore, allScores: scoresObj, tags };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Classify error: ${message}`);
      return this.fallbackClassify(query);
    }
  }

  // ─── Get Tags ─────────────────────────────────
  private getTagsForCategory(category: QueryCategory, query: string): string[] {
    const baseTags: Record<QueryCategory, string[]> = {
      [QueryCategory.BUDGET]: ['budget', 'value'],
      [QueryCategory.GAMING]: ['gaming', 'performance', 'high-refresh-rate'],
      [QueryCategory.CAMERA]: ['camera', 'photography'],
      [QueryCategory.BATTERY]: ['battery', 'long-lasting'],
      [QueryCategory.PERFORMANCE]: ['performance', 'flagship'],
      [QueryCategory.SELFIE]: ['selfie', 'camera'],
      [QueryCategory.BUSINESS]: ['business', 'professional'],
      [QueryCategory.GENERAL]: ['general'],
    };

    const tags = [...(baseTags[category] || [])];

    if (query.includes('5g')) tags.push('5G');
    if (query.includes('nfc')) tags.push('nfc');
    if (query.includes('fast charge')) tags.push('fast-charging');

    return [...new Set(tags)];
  }

  // ─── Fallback ─────────────────────────────────
  private fallbackClassify(query: string): ClassificationResult {
    const lower = query.toLowerCase();
    let category = QueryCategory.GENERAL;

    if (lower.includes('gaming') || lower.includes('pubg'))
      category = QueryCategory.GAMING;
    else if (lower.includes('camera') || lower.includes('photo'))
      category = QueryCategory.CAMERA;
    else if (lower.includes('battery') || lower.includes('mah'))
      category = QueryCategory.BATTERY;
    else if (lower.includes('selfie') || lower.includes('front'))
      category = QueryCategory.SELFIE;
    else if (lower.includes('budget') || lower.includes('cheap'))
      category = QueryCategory.BUDGET;
    else if (lower.includes('fast') || lower.includes('powerful'))
      category = QueryCategory.PERFORMANCE;

    const scores = {} as Record<QueryCategory, number>;
    Object.values(QueryCategory).forEach((cat) => {
      scores[cat] = cat === category ? 0.9 : 0.01;
    });

    return {
      category,
      confidence: 0.9,
      allScores: scores,
      tags: this.getTagsForCategory(category, query),
    };
  }
}
