import './style.css'
import { loadMagicModel, predict } from './ai'
import { getCharacterByName } from './disney'
import { cameraManager } from './lib/camera-manager'

// --- Configuration ---
// Default model (Trained by user)
const DEFAULT_MODEL_URL = 'https://teachablemachine.withgoogle.com/models/cykQNH7aH/';
let MODEL_URL = localStorage.getItem('disney_model_url') || DEFAULT_MODEL_URL;

// DOM Elements
const portal = document.querySelector('#portal') as HTMLElement;
const fileInput = document.querySelector('#file-input') as HTMLInputElement;

let model: any = null;

/**
 * Stage 1: Awakening (Loading TM Model)
 */
async function initMagicMirror() {
  if (!MODEL_URL) {
    showSetupUI();
    return;
  }

  showLoadingUI('마법의 거울이 깨어나는 중... (V8.1)');
  try {
    model = await loadMagicModel(MODEL_URL);
    showReadyUI();
  } catch (err) {
    console.error('Model Load Failed:', err);
    alert('모델 로드에 실패했습니다. 올바른 티처블 머신 URL인지 확인해주세요.');
    showSetupUI();
  }
}

/**
 * UI: Show Setup State (When no URL exists)
 */
function showSetupUI() {
  portal.innerHTML = `
    <div class="setup-container animate-fade-in">
      <h2 class="magic-text">마법의 설정을 완료해주세요</h2>
      <p>티처블 머신에서 학습 완료 후 받은<br/>모델 공유 URL을 입력해주세요.</p>
      <div class="input-group">
        <input type="text" id="model-url-input" placeholder="https://teachablemachine.withgoogle.com/models/..." />
        <button class="btn-main" id="btn-save-model">거울 깨우기</button>
      </div>
      <p class="subtext">모델이 없다면 제가 학습 과정을 도와드릴게요!</p>
    </div>
  `;

  document.querySelector('#btn-save-model')?.addEventListener('click', () => {
    const input = document.querySelector('#model-url-input') as HTMLInputElement;
    if (input.value) {
      localStorage.setItem('disney_model_url', input.value);
      MODEL_URL = input.value;
      initMagicMirror();
    }
  });
}

function showLoadingUI(msg: string) {
  portal.innerHTML = `
    <div class="training-container">
      <div class="magic-sphere"></div>
      <div class="training-info">
        <h2 class="magic-text">${msg}</h2>
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
      <h2 class="magic-text">마법의 준비가 끝났습니다</h2>
      <p>자신의 사진을 찍거나 업로드하세요</p>
      
      <div class="action-buttons">
        <button class="btn-main" id="btn-camera">📸 카메라로 찍기</button>
        <button class="btn-secondary" id="btn-upload">📁 사진 업로드</button>
      </div>
      <button class="btn-text" id="btn-reset-model" style="margin-top:2rem">모델 설정 초기화</button>
    </div>
  `;
  
  // Bind Events
  document.querySelector('#btn-upload')?.addEventListener('click', () => fileInput.click());
  document.querySelector('#btn-camera')?.addEventListener('click', startCameraMode);
  document.querySelector('#btn-reset-model')?.addEventListener('click', () => {
    localStorage.removeItem('disney_model_url');
    window.location.reload();
  });
}

/**
 * Stage 2: Camera Mode
 */
async function startCameraMode() {
  portal.innerHTML = `
    <div class="camera-container animate-fade-in">
      <div class="video-portal">
        <video id="webcam" autoplay playsinline muted></video>
        <div class="portal-overlay"></div>
      </div>
      <div class="camera-controls">
        <button class="btn-shutter" id="btn-capture">✨ 매칭</button>
        <button class="btn-text" id="btn-cancel">취소</button>
      </div>
    </div>
  `;

  const video = document.querySelector('#webcam') as HTMLVideoElement;
  try {
    await cameraManager.init(video);
    document.querySelector('#btn-capture')?.addEventListener('click', async () => {
      const canvas = cameraManager.capture();
      cameraManager.stop();
      analyzeImage(canvas);
    });
    document.querySelector('#btn-cancel')?.addEventListener('click', () => {
      cameraManager.stop();
      showReadyUI();
    });
  } catch (err) {
    alert('카메라 접근 권한이 필요합니다.');
    showReadyUI();
  }
}

/**
 * Analyze logic
 */
async function analyzeImage(element: HTMLImageElement | HTMLCanvasElement) {
  console.log('🔮 Magic Mirror: Starting analysis...');
  
  if (!model) {
    console.warn('🔮 Magic Mirror: Model not ready yet.');
    alert('마법의 거울이 아직 깨어나는 중입니다. 잠시만 기다려주세요!');
    return;
  }

  showLoadingUI('영혼을 투영하는 중...');
  try {
    console.log('🔮 Magic Mirror: Predicting soul match...');
    const res = await predict(model, element);
    console.log('🔮 Magic Mirror: Prediction complete:', res);

    console.log('🔮 Magic Mirror: Fetching character artifact...');
    const charData = await getCharacterByName(res.label);
    
    console.log('🔮 Magic Mirror: Revealing destiny...');
    showResultUI(res.label, res.confidence, charData);
  } catch (err) {
    console.error('🔮 Magic Mirror Failure:', err);
    alert('마법의 힘이 부족하여 분석에 실패했습니다. 다시 시도해 주세요.');
    showReadyUI();
  }
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
fileInput?.addEventListener('change', (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.src = ev.target?.result as string;
      img.onload = () => analyzeImage(img);
    };
    reader.readAsDataURL(file);
  }
});

// Start the Mirror
initMagicMirror();
