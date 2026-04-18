import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as knnClassifier from '@tensorflow-models/knn-classifier';

/**
 * In-App AI Magic Trainer
 * Handles locally training a Disney character classifier using transfer learning.
 */

export interface TrainingProgress {
  count: number;
  total: number;
  currentCharacter: string;
  status: 'loading' | 'training' | 'ready';
}

class MagicTrainer {
  private classifier: knnClassifier.KNNClassifier | null = null;
  private net: mobilenet.MobileNet | null = null;
  private isTrained = false;

  constructor() {
    this.classifier = knnClassifier.create();
  }

  /**
   * Loads the base model and training data
   */
  async train(onProgress?: (progress: TrainingProgress) => void) {
    if (this.isTrained) return;

    // 1. Load MobileNet
    if (onProgress) onProgress({ count: 0, total: 100, currentCharacter: '마법의 지식 로딩 중...', status: 'loading' });
    this.net = await mobilenet.load();

    // 2. Fetch manifest
    const response = await fetch('/train_manifest.json');
    const manifest = await response.json();
    
    const characters = Object.keys(manifest);
    let totalImages = 0;
    characters.forEach(char => totalImages += manifest[char].length);
    
    let processedCount = 0;

    // 3. Process each character and its images
    for (const char of characters) {
      const images = manifest[char];
      
      for (const imgFile of images) {
        processedCount++;
        if (onProgress) {
          onProgress({ 
            count: processedCount, 
            total: totalImages, 
            currentCharacter: char, 
            status: 'training' 
          });
        }

        try {
          // Load image element safely
          const imgEl = await this.loadImage(`/train_data/${char}/${imgFile}`);
          
          // Get embedding from mobilenet
          const activation = this.net.infer(imgEl, true);
          
          // Add to classifier
          this.classifier?.addExample(activation, char);
          
          // Cleanup to prevent memory leaks
          activation.dispose();
          imgEl.remove();
        } catch (err) {
          console.warn(`Failed to process ${char}/${imgFile}:`, err);
        }
      }
    }

    this.isTrained = true;
    if (onProgress) onProgress({ count: totalImages, total: totalImages, currentCharacter: '완료!', status: 'ready' });
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
