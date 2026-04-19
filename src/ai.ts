/**
 * AI Module (v16.0-ULTRA-STABLE)
 * Switched to CDN for maximum build compatibility and stability.
 */

// Declaring global objects from CDN
declare const tmImage: any;
declare const tf: any;

/**
 * Loads the Teachable Machine model from a URL
 */
export async function loadMagicModel(modelURL: string) {
  console.log('🔮 AI Engine: Loading model from CDN globals...');
  const checkpointURL = modelURL + "model.json";
  const metadataURL = modelURL + "metadata.json";

  // Use the global tmImage object loaded from CDN in index.html
  const model = await tmImage.load(checkpointURL, metadataURL);
  return model;
}

/**
 * Predicts the character using the loaded model and image/canvas
 */
export async function predict(model: any, element: HTMLImageElement | HTMLCanvasElement) {
  // Use the model to predict
  const prediction = await model.predict(element);
  
  // Find the label with highest probability
  let bestMatch = { label: '', confidence: 0 };
  for (let i = 0; i < prediction.length; i++) {
    if (prediction[i].probability > bestMatch.confidence) {
      bestMatch = {
        label: prediction[i].className,
        confidence: prediction[i].probability
      };
    }
  }
  
  return bestMatch;
}
