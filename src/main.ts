import './style.css'
import { magicTrainer, TrainingProgress } from './lib/magic-trainer'
import { getCharacterByName } from './disney'
import { cameraManager } from './lib/camera-manager'

// DOM Elements
const portal = document.querySelector('#portal') as HTMLElement;
const fileInput = document.querySelector('#file-input') as HTMLInputElement;

let isCameraMode = false;

/**
 * Stage 1: Initial Animation & Auto-Training (or Cached Load)
 */
async function initMagicMirror() {
  console.log('Disney Mirror Awakening...');
  
  await magicTrainer.train((progress: TrainingProgress) => {
    updateTrainingUI(progress);
    
    if (progress.status === 'ready' || progress.status === 'cached') {
      setTimeout(() => showReadyUI(), progress.status === 'cached' ? 100 : 1000);
    }
  });
}

/**
 * UI: Show Training State
 */
function updateTrainingUI(p: TrainingProgress) {
  const percent = Math.round((p.count / (p.total || 1)) * 100);
  const statusMsg = p.status === 'loading' ? '마법의 지식을 불러오는 중...' : 
                    p.status === 'cached' ? '기억을 소환했습니다!' : '마법의 기억을 깨우는 중...';

  portal.innerHTML = `
    <div class="training-container">
      <div class="magic-sphere"></div>
      <div class="training-info">
        <h2 class="magic-text">${statusMsg}</h2>
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
      <h2 class="magic-text">거울이 준비되었습니다</h2>
      <p>사진을 찍거나 업로드하여 운명을 확인하세요</p>
      
      <div class="action-buttons">
        <button class="btn-main" id="btn-camera">📸 카메라로 찍기</button>
        <button class="btn-secondary" id="btn-upload">📁 사진 업로드</button>
      </div>
    </div>
  `;
  
  // Bind Events
  document.querySelector('#btn-upload')?.addEventListener('click', () => fileInput.click());
  document.querySelector('#btn-camera')?.addEventListener('click', () => startCameraMode());
}

/**
 * Stage 2: Camera Mode
 */
async function startCameraMode() {
  isCameraMode = true;
  portal.innerHTML = `
    <div class="camera-container animate-fade-in">
      <div class="video-portal">
        <video id="webcam" autoplay playsinline muted></video>
        <div class="portal-overlay"></div>
      </div>
      <div class="camera-controls">
        <button class="btn-shutter" id="btn-capture">✨ 촬영 매칭</button>
        <button class="btn-text" id="btn-cancel">취소</button>
      </div>
    </div>
  `;

  const video = document.querySelector('#webcam') as HTMLVideoElement;
  try {
    await cameraManager.init(video);
    document.querySelector('#btn-capture')?.addEventListener('click', handleCapture);
    document.querySelector('#btn-cancel')?.addEventListener('click', () => {
      cameraManager.stop();
      showReadyUI();
    });
  } catch (err) {
    alert('카메라 접근에 실패했습니다. 파일 업로드 모드를 사용해주세요.');
    showReadyUI();
  }
}

/**
 * Handle Single Frame Capture
 */
async function handleCapture() {
  const canvas = cameraManager.capture();
  cameraManager.stop();
  
  // Show analysis state
  showAnalysisUI();
  
  try {
    const result = await magicTrainer.predict(canvas);
    const characterData = await getCharacterByName(result.label);
    showResultUI(result.label, result.confidence, characterData);
  } catch (err) {
    console.error(err);
    alert('분석 실패');
    showReadyUI();
  }
}

/**
 * Handle File Upload
 */
async function handleFileUpload(file: File) {
  showAnalysisUI();
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.src = e.target?.result as string;
    img.onload = async () => {
      try {
        const result = await magicTrainer.predict(img);
        const characterData = await getCharacterByName(result.label);
        showResultUI(result.label, result.confidence, characterData);
      } catch (err) {
        alert('분석 실패');
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
fileInput?.addEventListener('change', (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) handleFileUpload(file);
});

portal.addEventListener('dragover', (e) => e.preventDefault());
portal.addEventListener('drop', (e) => {
  e.preventDefault();
  const file = e.dataTransfer?.files[0];
  if (file) handleFileUpload(file);
});

// Start the Mirror
initMagicMirror();
