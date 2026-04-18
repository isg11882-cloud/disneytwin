import './style.css'
import { loadMagicModel, predictCharacter } from './ai'
import { getCharacterByName } from './disney'

// Configuration (User: Please replace this URL with your Teachable Machine model URL)
let MODEL_URL = ""; 

// DOM Elements
const app = document.querySelector('#app') as HTMLDivElement;
const portal = document.querySelector('#portal') as HTMLElement;
const uploadBtn = document.querySelector('#upload-btn') as HTMLButtonElement;
const fileInput = document.querySelector('#file-input') as HTMLInputElement;

/**
 * Initialize the application
 */
async function init() {
  console.log('Disney Twin Finder Initialized');
  
  // Create a simple settings button to input model URL
  addSettingsUI();
}

/**
 * Handle image upload and start the magic
 */
async function handleFile(file: File) {
  if (!MODEL_URL) {
    alert('마법의 거울을 설정해주세요! (티처블 머신 URL을 입력해야 합니다)');
    return;
  }

  // 1. Show analysis state
  showAnalysisUI();

  // 2. Load model (if not already loaded)
  const isLoaded = await loadMagicModel(MODEL_URL);
  if (!isLoaded) {
    alert('거울을 불러오는 데 실패했습니다. URL을 확인해주세요.');
    resetUI();
    return;
  }

  // 3. Process image
  const reader = new FileReader();
  reader.onload = async (e) => {
    const img = new Image();
    img.src = e.target?.result as string;
    img.onload = async () => {
      try {
        // 4. Predict
        const prediction = await predictCharacter(img);
        console.log('Prediction:', prediction);

        // 5. Fetch Disney Info
        const characterData = await getCharacterByName(prediction.className);
        
        // 6. Show Result
        showResultUI(prediction.className, prediction.probability, characterData);
      } catch (err) {
        console.error(err);
        alert('분석 중 오류가 발생했습니다.');
        resetUI();
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
      <div class="magic-circle"></div>
      <div class="sparkle-orbit">✨</div>
      <h2 class="magic-text">마법의 기운을 모으는 중...</h2>
      <p>당신의 영혼과 닮은 캐릭터를 찾고 있습니다</p>
    </div>
  `;
}

/**
 * UI: Show Result State
 */
function showResultUI(name: string, confidence: number, data: any) {
  const confidencePercent = Math.round(confidence * 100);
  const imageUrl = data?.imageUrl || 'https://via.placeholder.com/300?text=Disney+Character';
  const films = data?.films?.slice(0, 3).join(', ') || '정보 없음';

  portal.innerHTML = `
    <div class="result-container animate-reveal">
      <div class="result-header">
        <h2 class="match-title">당신의 디즈니 단짝은...</h2>
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
          <p class="magic-desc">"진정한 마법은 당신의 마음속에 있습니다."</p>
        </div>
      </div>

      <button class="btn-retry" onclick="window.location.reload()">다시 하기</button>
    </div>
  `;
}

function resetUI() {
  window.location.reload();
}

/**
 * Add a simple settings overlay to input the model URL
 */
function addSettingsUI() {
  const settingsBtn = document.createElement('button');
  settingsBtn.className = 'btn-settings';
  settingsBtn.innerHTML = '⚙️ 설정';
  app.appendChild(settingsBtn);

  settingsBtn.onclick = () => {
    const url = prompt('티처블 머신 모델 URL을 입력해주세요:', MODEL_URL);
    if (url) {
      MODEL_URL = url.endsWith('/') ? url : url + '/';
      localStorage.setItem('DISNEY_MODEL_URL', MODEL_URL);
      alert('설정이 저장되었습니다!');
    }
  };

  // Load from storage if exists
  const savedUrl = localStorage.getItem('DISNEY_MODEL_URL');
  if (savedUrl) MODEL_URL = savedUrl;
}

// Global Event Listeners
uploadBtn?.addEventListener('click', () => fileInput.click());
fileInput?.addEventListener('change', (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) handleFile(file);
});

// Drag and Drop (Reuse from previous version or keep clean)
portal.addEventListener('dragover', (e) => e.preventDefault());
portal.addEventListener('drop', (e) => {
  e.preventDefault();
  const file = e.dataTransfer?.files[0];
  if (file) handleFile(file);
});

init();
