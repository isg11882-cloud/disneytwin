import * as tmImage from '@teachablemachine/image';

/**
 * AI Engine Module
 * Handles loading Teachable Machine models and performing predictions.
 */

// Placeholder URL - User will replace this with their actual model URL
// const MODEL_URL = "https://teachablemachine.withgoogle.com/models/YOUR_MODEL_ID/";
export let model: tmImage.CustomMobileNet | null = null;
let labels: string[] = [];

/**
 * Loads the Teachable Machine model from the provided URL
 */
export async function loadMagicModel(url: string) {
  try {
    const modelURL = url + "model.json";
    const metadataURL = url + "metadata.json";

    model = await tmImage.load(modelURL, metadataURL);
    labels = model.getClassLabels();
    console.log('Model loaded successfully with labels:', labels);
    return true;
  } catch (error) {
    console.error('Failed to load Magic Model:', error);
    return false;
  }
}

/**
 * Predicts the character from an image element
 */
export async function predictCharacter(imageElement: HTMLImageElement | HTMLCanvasElement) {
  if (!model) {
    throw new Error('Magic Mirror is not ready. Call loadMagicModel first.');
  }

  // model.predict can take image, canvas or video
  const predictions = await model.predict(imageElement);
  
  // Sort by probability descending
  predictions.sort((a, b) => b.probability - a.probability);
  
  return predictions[0]; // Return the top prediction
}
