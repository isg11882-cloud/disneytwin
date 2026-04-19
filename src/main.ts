import './style.css'
import { loadMagicModel, predict } from './ai'
import { getCharacterByName } from './disney'
import { cameraManager } from './lib/camera-manager'

/** 
 * --- V9.0 FINAL CONFIG ---
 * Forcing stable Teachable Machine Integration
 */
const DEFAULT_MODEL_URL = 'https://teachablemachine.withgoogle.com/models/cykQNH7aH/';
let MODEL_URL = localStorage.getItem('disney_model_url') || DEFAULT_MODEL_URL;

// DOM Elements
const portal = document.querySelector('#portal') as HTMLElement;
const fileInput = document.querySelector('#file-input') as HTMLInputElement;

let model: any = null;

/**
 * Stage 1: Awakening
 */
async function initMagicMirror() {
  console.log('🔮 Magic Mirror: Awakening v9.0-FINAL...');
  
  if (!MODEL_URL) {
    showSetupUI();
    return;
  }

  showLoadingUI('마법의 거울이 깨어나는 중... (v13.0)');
  try {
    model = await loadMagicModel(MODEL_URL);
    console.log('🔮 Magic Mirror: Model loaded successfully.');
    showReadyUI();
  } catch (err) {
    console.error('🔮 Magic Mirror: Load Failed!', err);
    alert('마법의 거울 로딩에 실패했습니다. 사이트를 새로고침하거나 URL을 확인해 주세요.');
    showSetupUI();
  }
}

/**
 * UI: Show Setup State
 */
function showSetupUI() {
  portal.innerHTML = `
    <div class="setup-container animate-fade-in">
      <h2 class="magic-text">설정이 필요합니다</h2>
      <p>모델 URL을 입력하지 않으셨습니다.</p>
      <input type="text" id="model-url-input" placeholder="URL을 입력하세요..." style="padding:10px; margin: 10px 0; border-radius:5px; width:80%"/>
      <button class="btn-main" id="btn-save-model">저장 후 시작</button>
    </div>
  `;

  document.querySelector('#btn-save-model')?.addEventListener('click', () => {
    const input = document.querySelector('#model-url-input') as HTMLInputElement;
    if (input.value) {
      localStorage.setItem('disney_model_url', input.value);
      location.reload();
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
      <h2 class="magic-text">준비되었습니다</h2>
      <p>거울 앞에 서거나 사진을 보여주세요</p>
      
      <div class="action-buttons" style="display:flex; gap:10px; justify-content:center; margin-top:20px;">
        <button class="btn-main" id="btn-camera">📸 카메라 촬영</button>
        <button class="btn-secondary" id="btn-upload">📁 파일 업로드</button>
      </div>
      <p style="font-size:0.8rem; margin-top:20px; opacity:0.5; cursor:pointer;" id="btn-reset-model">설정 초기화</p>
    </div>
  `;
  
  document.querySelector('#btn-upload')?.addEventListener('click', () => fileInput.click());
  document.querySelector('#btn-camera')?.addEventListener('click', startCameraMode);
  document.querySelector('#btn-reset-model')?.addEventListener('click', () => {
    localStorage.removeItem('disney_model_url');
    location.reload();
  });
}

/**
 * Stage 2: Camera
 */
async function startCameraMode() {
  portal.innerHTML = `
    <div class="camera-container animate-fade-in" style="display: flex; flex-direction: column; align-items: center;">
      <div class="video-portal" style="width:300px; height:300px; border-radius:50%; overflow:hidden; border:4px solid gold;">
        <video id="webcam" autoplay playsinline muted style="width:100%; height:100%; object-fit:cover; transform:scaleX(-1);"></video>
      </div>
      <div class="camera-controls" style="margin-top:20px;">
        <button class="btn-shutter" id="btn-capture" style="width:80px; height:80px; border-radius:50%; border:5px solid gold; font-weight:bold;">촬영</button>
        <button class="btn-text" id="btn-cancel" style="display:block; margin: 10px auto;">취소</button>
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
    alert('카메라 시작 실패!');
    showReadyUI();
  }
}

/**
 * Stage 3: Analyze
 */
async function analyzeImage(element: HTMLImageElement | HTMLCanvasElement) {
  if (!model) {
    alert('거울이 아직 로딩 중입니다.');
    return;
  }

  showLoadingUI('당신의 영혼을 분석 중...');
  try {
    const res = await predict(model, element);
    console.log('🔮 Found match:', res);
    const charData = await getCharacterByName(res.label);
    showResultUI(res.label, res.confidence, charData);
  } catch (err) {
    console.error('🔮 Analysis error:', err);
    alert('분석 중 오류 발생!');
    showReadyUI();
  }
}

function showResultUI(name: string, confidence: number, data: any) {
  const percent = Math.round(confidence * 100);
  const imageUrl = data?.imageUrl || 'https://via.placeholder.com/300?text=Disney';
  const films = data?.films?.slice(0, 3).join(', ') || '정보 없음';

  portal.innerHTML = `
    <div class="result-container animate-reveal" style="text-align:center;">
      <h2 class="magic-text">매칭 결과</h2>
      <h1 style="color: gold; font-size: 2.5rem; margin-bottom: 20px;">${name}</h1>
      <div class="result-card" style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 20px;">
        <img src="${imageUrl}" style="width:200px; height:200px; border-radius:15px; border:3px solid gold;" />
        <p style="margin-top:10px;">일치도: ${percent}%</p>
        <p style="font-size:0.9rem; opacity:0.8;">출연작: ${films}</p>
      </div>
      <button class="btn-main" onclick="location.reload()" style="margin-top:20px;">다시 하기</button>
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

// Boot the Mirror
initMagicMirror();
