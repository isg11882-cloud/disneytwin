import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as knnClassifier from '@tensorflow-models/knn-classifier';
import { storage } from './storage';

/**
 * In-App AI Magic Trainer
 * Handles locally training a Disney character classifier using transfer learning.
 * Includes IndexedDB caching for ultra-fast loading.
 */

export interface TrainingProgress {
  count: number;
  total: number;
  currentCharacter: string;
  status: 'loading' | 'training' | 'ready' | 'cached';
}

class MagicTrainer {
  private classifier: knnClassifier.KNNClassifier | null = null;
  private net: mobilenet.MobileNet | null = null;
  private isTrained = false;
  private readonly CACHE_KEY = 'disney_knn_dataset';

  constructor() {
    this.classifier = knnClassifier.create();
  }

  /**
   * Loads the base model and training data
   */
  async train(onProgress?: (progress: TrainingProgress) => void) {
    if (this.isTrained) return;

    // 1. Load MobileNet first (needed for both fresh training and cached loading)
    if (onProgress) onProgress({ count: 0, total: 100, currentCharacter: '마법의 지식 로딩 중...', status: 'loading' });
    this.net = await mobilenet.load();

    // 2. Try to load from cache
    const cachedData = await storage.get(this.CACHE_KEY);
    if (cachedData) {
      console.log('Loading AI mirror from cache...');
      const dataset: any = {};
      Object.keys(cachedData).forEach(label => {
        const { data, shape } = cachedData[label];
        dataset[label] = tf.tensor(data, shape);
      });
      this.classifier?.setClassifierDataset(dataset);
      this.isTrained = true;
      if (onProgress) onProgress({ count: 100, total: 100, currentCharacter: '기억 소환 완료!', status: 'cached' });
      return;
    }

    // 3. Fresh training if no cache
    const response = await fetch('/train_manifest.json');
    const manifest = await response.json();
    
    const characters = Object.keys(manifest);
    let totalImages = 0;
    characters.forEach(char => totalImages += manifest[char].length);
    let processedCount = 0;

    for (const char of characters) {
      const images = manifest[char];
      for (const imgFile of images) {
        processedCount++;
        if (onProgress) onProgress({ count: processedCount, total: totalImages, currentCharacter: char, status: 'training' });

        try {
          const imgEl = await this.loadImage(`/train_data/${char}/${imgFile}`);
          const activation = this.net.infer(imgEl, true);
          this.classifier?.addExample(activation, char);
          activation.dispose();
          imgEl.remove();
        } catch (err) {
          console.warn(`Failed to process ${char}/${imgFile}:`, err);
        }
      }
    }

    // 4. Save to cache for next time
    await this.saveCache();

    this.isTrained = true;
    if (onProgress) onProgress({ count: totalImages, total: totalImages, currentCharacter: '완료!', status: 'ready' });
  }

  private async saveCache() {
    if (!this.classifier) return;
    const dataset = this.classifier.getClassifierDataset();
    const datasetObj: any = {};
    
    Object.keys(dataset).forEach(label => {
      datasetObj[label] = {
        data: Array.from(dataset[label].dataSync()),
        shape: dataset[label].shape
      };
    });
    
    await storage.set(this.CACHE_KEY, datasetObj);
    console.log('AI mirror saved to cache.');
  }

  /**
   * Predicts the character for a given image
   */
  async predict(imgEl: HTMLImageElement | HTMLCanvasElement) {
    if (!this.isTrained || !this.net || !this.classifier) {
      throw new Error('Magic Mirror is not yet trained.');
    }
    const activation = this.net.infer(imgEl, true);
    const result = await this.classifier.predictClass(activation);
    activation.dispose();
    return {
      label: result.label,
      confidence: result.confidences[result.label]
    };
  }

  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
    });
  }
}

export const magicTrainer = new MagicTrainer();
