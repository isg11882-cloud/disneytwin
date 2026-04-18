import './style.css'
import { magicTrainer, TrainingProgress } from './lib/magic-trainer'
import { getCharacterByName } from './disney'

// DOM Elements
const portal = document.querySelector('#portal') as HTMLElement;
const uploadBtn = document.querySelector('#upload-btn') as HTMLButtonElement;
const fileInput = document.querySelector('#file-input') as HTMLInputElement;

/**
 * Stage 1: Initial Animation & Auto-Training
 */
async function initMagicMirror() {
  console.log('Disney Mirror Awakening...');
  
  // Show training progress in the portal
  magicTrainer.train((progress: TrainingProgress) => {
    updateTrainingUI(progress);
    
    if (progress.status === 'ready') {
      setTimeout(() => showReadyUI(), 1000);
    }
  });
}

/**
 * UI: Show Training State
 */
function updateTrainingUI(p: TrainingProgress) {
  const percent = Math.round((p.count / p.total) * 100);
  
  portal.innerHTML = `
    <div class="training-container">
      <div class="magic-sphere"></div>
      <div class="training-info">
        <h2 class="magic-text">마법의 기억을 깨우는 중...</h2>
        <div class="progress-bar-container">
          <div class="progress-bar" style="width: ${percent}%"></div>
        </div>
        <p class="training-subtext">${p.currentCharacter} (${percent}%)</p>
      </div>
    </div>
  `;
}

/**
 * UI: Show Ready State
 */
function showReadyUI() {
  portal.innerHTML = `
    <div class="ready-container animate-fade-in">
      <div class="sparkles-container">✨ ✨ ✨</div>
      <h2 class="magic-text">거울이 당신을 맞이할 준비가 되었습니다</h2>
      <p>사진을 올리거나 이곳으로 끌어다 놓으세요</p>
      <button class="btn-main" id="start-upload">사진 업로드하기</button>
    </div>
  `;
  
  // Re-bind click event
  document.querySelector('#start-upload')?.addEventListener('click', () => fileInput.click());
}

/**
 * Handle image upload and start analysis
 */
async function handleFile(file: File) {
  // 1. Show analysis state
  showAnalysisUI();

  const reader = new FileReader();
  reader.onload = async (e) => {
    const img = new Image();
    img.src = e.target?.result as string;
    img.onload = async () => {
      try {
        // 2. Predict using our In-App Trainer
        const result = await magicTrainer.predict(img);
        console.log('Magic Result:', result);

        // 3. Fetch Disney Info from API
        const characterData = await getCharacterByName(result.label);
        
        // 4. Show Result Reveal
        showResultUI(result.label, result.confidence, characterData);
      } catch (err) {
        console.error(err);
        alert('마법의 거울이 흐려졌습니다. 다시 시도해주세요.');
        showReadyUI();
      }
    };
  };
  reader.readAsDataURL(file);
}

/**
 * UI: Show Analysis State
 */
function showAnalysisUI() {
  portal.innerHTML = `
    <div class="analysis-container">
      <div class="magic-vortex"></div>
      <h2 class="magic-text">당신의 영혼을 투영 중...</h2>
      <p>가장 닮은 캐릭터를 찾는 중입니다</p>
    </div>
  `;
}

/**
 * UI: Show Result State
 */
function showResultUI(name: string, confidence: number, data: any) {
  const confidencePercent = Math.round(confidence * 100);
  const imageUrl = data?.imageUrl || 'https://via.placeholder.com/300?text=Disney+Character';
  const films = data?.films?.slice(0, 3).join(', ') || '마법의 기록 없음';

  portal.innerHTML = `
    <div class="result-container animate-reveal">
      <div class="result-header">
        <h2 class="match-title">당신과 운명적으로 닮은 캐릭터는...</h2>
        <h1 class="character-name">${name}</h1>
      </div>
      
      <div class="result-card">
        <div class="char-image-box">
          <img src="${imageUrl}" alt="${name}" class="char-image" />
          <div class="confidence-badge">${confidencePercent}% 일치</div>
        </div>
        
        <div class="char-info">
          <div class="info-item">
            <span class="label">대표 출연작</span>
            <span class="value">${films}</span>
          </div>
          <p class="magic-desc">"당신의 눈동자에서 ${name}의 용기를 보았습니다."</p>
        </div>
      </div>

      <button class="btn-retry" onclick="window.location.reload()">새로운 운명 찾기</button>
    </div>
  `;
}

// Global Event Listeners
uploadBtn?.addEventListener('click', () => fileInput.click());
fileInput?.addEventListener('change', (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) handleFile(file);
});

portal.addEventListener('dragover', (e) => e.preventDefault());
portal.addEventListener('drop', (e) => {
  e.preventDefault();
  const file = e.dataTransfer?.files[0];
  if (file) handleFile(file);
});

// Start the Mirror
initMagicMirror();
