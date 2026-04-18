/**
 * Real-time Camera Management Module
 */
export class CameraManager {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;

  async init(videoEl: HTMLVideoElement): Promise<void> {
    this.videoElement = videoEl;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 640 }
        },
        audio: false
      });
      
      this.videoElement.srcObject = this.stream;
      await this.videoElement.play();
    } catch (err) {
      console.error('Camera access failed:', err);
      throw err;
    }
  }

  stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  capture(): HTMLCanvasElement {
    if (!this.videoElement) throw new Error('Camera not initialized');
    
    const canvas = document.createElement('canvas');
    canvas.width = this.videoElement.videoWidth;
    canvas.height = this.videoElement.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
    }
    
    return canvas;
  }
}

export const cameraManager = new CameraManager();
