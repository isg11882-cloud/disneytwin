import * as tf from '@tensorflow/tfjs';
import * as tmImage from '@teachablemachine/image';

/**
 * AI Engine using Google Teachable Machine
 */
export async function loadMagicModel(modelUrl: string) {
  const checkpointUrl = modelUrl + 'model.json';
  const metadataUrl = modelUrl + 'metadata.json';

  const model = await tmImage.load(checkpointUrl, metadataUrl);
  return model;
}

export async function predict(model: tmImage.CustomMobileNet, element: HTMLImageElement | HTMLCanvasElement) {
  const prediction = await model.predict(element);
  
  // Find the highest probability
  let highest = prediction[0];
  for (let i = 1; i < prediction.length; i++) {
    if (prediction[i].probability > highest.probability) {
      highest = prediction[i];
    }
  }
  
  return {
    label: highest.className,
    confidence: highest.probability
  };
}
