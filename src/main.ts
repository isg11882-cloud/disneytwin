import './style.css'

// DOM Elements
const dropZone = document.querySelector('#drop-zone') as HTMLDivElement;
const uploadBtn = document.querySelector('#upload-btn') as HTMLButtonElement;
const fileInput = document.querySelector('#file-input') as HTMLInputElement;

// Event Listeners
uploadBtn.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', (e) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    handleFile(target.files[0]);
  }
});

// Drag and Drop Logic
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.parentElement?.classList.add('dragging');
  dropZone.style.borderColor = 'var(--color-gold)';
});

dropZone.addEventListener('dragleave', () => {
  dropZone.parentElement?.classList.remove('dragging');
  dropZone.style.borderColor = 'rgba(251, 191, 36, 0.2)';
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.parentElement?.classList.remove('dragging');
  
  if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
    handleFile(e.dataTransfer.files[0]);
  }
});

/**
 * Handle the uploaded file
 */
function handleFile(file: File) {
  console.log('File selected:', file.name);
  
  // Create a preview or start the magic
  const reader = new FileReader();
  reader.onload = (e) => {
    const previewUrl = e.target?.result as string;
    showPreview(previewUrl);
  };
  reader.readAsDataURL(file);
}

/**
 * Show basic preview of the uploaded image
 */
function showPreview(url: string) {
  const portalInner = document.querySelector('.portal-inner') as HTMLDivElement;
  portalInner.innerHTML = `
    <div class="preview-container">
      <img src="${url}" class="preview-img" alt="Uploaded photo" />
      <div class="magic-loader">
        <div class="sparkle">✨</div>
        <p>마법의 거울이 분석 중입니다...</p>
      </div>
    </div>
  `;
  
  // Add some simple CSS for the preview dynamically or via style.css
  // For now, let's just log it. In the next step we'll implement the AI match.
  setTimeout(() => {
    alert('마법 시스템이 곧 활성화됩니다! (AI 연동 준비 중)');
  }, 1000);
}
