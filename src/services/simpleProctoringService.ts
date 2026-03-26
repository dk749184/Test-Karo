// Simple Proctoring Service
// Lightweight proctoring without heavy ML models

export interface Violation {
  id: string;
  type: string;
  message: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  screenshot?: string;
}

export interface ProctoringStatus {
  cameraActive: boolean;
  microphoneActive: boolean;
  faceVisible: boolean;
  isFullscreen: boolean;
  tabFocused: boolean;
  violations: Violation[];
  violationCount: number;
  warningCount: number;
}

class SimpleProctoringService {
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private audioAnalyser: AnalyserNode | null = null;
  private checkInterval: NodeJS.Timeout | null = null;
  private faceCheckInterval: NodeJS.Timeout | null = null;
  
  private violations: Violation[] = [];
  private violationCount = 0;
  private warningCount = 0;
  private lastFaceCheckTime = 0;
  private consecutiveNoFaceCount = 0;
  private isInitialized = false;
  
  private onViolationCallback: ((violation: Violation) => void) | null = null;
  private onStatusChangeCallback: ((status: ProctoringStatus) => void) | null = null;
  private onAutoSubmitCallback: (() => void) | null = null;

  private maxViolations = 5;
  private maxWarnings = 10;

  // Initialize proctoring
  async initialize(
    videoElement: HTMLVideoElement,
    canvasElement: HTMLCanvasElement,
    config?: { maxViolations?: number; maxWarnings?: number }
  ): Promise<boolean> {
    this.videoElement = videoElement;
    this.canvasElement = canvasElement;
    
    if (config?.maxViolations) this.maxViolations = config.maxViolations;
    if (config?.maxWarnings) this.maxWarnings = config.maxWarnings;

    try {
      // Request camera and microphone
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: true
      });

      this.videoElement.srcObject = this.mediaStream;
      await this.videoElement.play();

      // Setup audio analysis
      this.setupAudioAnalysis();

      // Setup browser event listeners
      this.setupBrowserMonitoring();

      this.isInitialized = true;
      this.notifyStatusChange();
      
      console.log('✅ Proctoring initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize proctoring:', error);
      this.addViolation('camera_denied', 'Camera/Microphone access denied', 'critical');
      return false;
    }
  }

  // Setup audio analysis for voice detection
  private setupAudioAnalysis(): void {
    if (!this.mediaStream) return;

    try {
      this.audioContext = new AudioContext();
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.audioAnalyser = this.audioContext.createAnalyser();
      this.audioAnalyser.fftSize = 256;
      source.connect(this.audioAnalyser);
    } catch (error) {
      console.error('Audio setup error:', error);
    }
  }

  // Setup browser monitoring
  private setupBrowserMonitoring(): void {
    // Tab visibility change
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    
    // Window blur/focus
    window.addEventListener('blur', this.handleWindowBlur);
    window.addEventListener('focus', this.handleWindowFocus);
    
    // Fullscreen change
    document.addEventListener('fullscreenchange', this.handleFullscreenChange);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyDown);
    
    // Right-click prevention
    document.addEventListener('contextmenu', this.handleContextMenu);
    
    // Copy/paste prevention
    document.addEventListener('copy', this.handleCopyPaste);
    document.addEventListener('paste', this.handleCopyPaste);
    document.addEventListener('cut', this.handleCopyPaste);
    
    // DevTools detection
    this.detectDevTools();
  }

  // Handle visibility change (tab switch)
  private handleVisibilityChange = (): void => {
    if (document.hidden) {
      this.addViolation('tab_switch', 'Tab switched - You left the exam window', 'high');
    }
  };

  // Handle window blur
  private handleWindowBlur = (): void => {
    this.addViolation('window_blur', 'Window lost focus - Possible tab switch or external app', 'medium');
  };

  // Handle window focus
  private handleWindowFocus = (): void => {
    console.log('Window focused');
  };

  // Handle fullscreen change
  private handleFullscreenChange = (): void => {
    if (!document.fullscreenElement) {
      this.addViolation('fullscreen_exit', 'Exited fullscreen mode', 'high');
    }
  };

  // Handle keyboard shortcuts
  private handleKeyDown = (e: KeyboardEvent): void => {
    // Block Alt+Tab, Ctrl+Tab, etc.
    if (e.altKey && e.key === 'Tab') {
      e.preventDefault();
      this.addViolation('alt_tab', 'Alt+Tab attempted', 'medium');
    }
    
    // Block F12 (DevTools)
    if (e.key === 'F12') {
      e.preventDefault();
      this.addViolation('devtools', 'F12 (Developer Tools) attempted', 'high');
    }
    
    // Block Ctrl+Shift+I (DevTools)
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
      e.preventDefault();
      this.addViolation('devtools', 'Ctrl+Shift+I (Developer Tools) attempted', 'high');
    }
    
    // Block Ctrl+Shift+J (Console)
    if (e.ctrlKey && e.shiftKey && e.key === 'J') {
      e.preventDefault();
      this.addViolation('devtools', 'Ctrl+Shift+J (Console) attempted', 'high');
    }
    
    // Block Ctrl+U (View Source)
    if (e.ctrlKey && e.key === 'u') {
      e.preventDefault();
      this.addViolation('view_source', 'Ctrl+U (View Source) attempted', 'medium');
    }
    
    // Block Ctrl+S (Save)
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
    }
    
    // Block Ctrl+P (Print)
    if (e.ctrlKey && e.key === 'p') {
      e.preventDefault();
      this.addViolation('print', 'Ctrl+P (Print) attempted', 'medium');
    }
    
    // Block PrintScreen
    if (e.key === 'PrintScreen') {
      e.preventDefault();
      this.addViolation('screenshot', 'PrintScreen attempted', 'high');
    }
    
    // Block Escape in fullscreen
    if (e.key === 'Escape' && document.fullscreenElement) {
      // Note: Can't prevent ESC from exiting fullscreen
    }
  };

  // Handle right-click
  private handleContextMenu = (e: Event): void => {
    e.preventDefault();
    this.addViolation('right_click', 'Right-click attempted', 'low');
  };

  // Handle copy/paste
  private handleCopyPaste = (e: Event): void => {
    e.preventDefault();
    this.addViolation('copy_paste', `${e.type} attempted`, 'medium');
  };

  // Detect DevTools
  private detectDevTools(): void {
    const threshold = 160;
    const check = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        this.addViolation('devtools_open', 'Developer Tools may be open', 'high');
      }
    };
    
    // Check periodically
    setInterval(check, 5000);
  }

  // Start continuous monitoring
  startMonitoring(): void {
    // Voice detection check
    this.checkInterval = setInterval(() => {
      this.checkVoice();
    }, 2000);

    // Simple face presence check using canvas brightness
    this.faceCheckInterval = setInterval(() => {
      this.checkFacePresence();
    }, 3000);

    console.log('🔍 Monitoring started');
  }

  // Check voice/noise level
  private checkVoice(): void {
    if (!this.audioAnalyser) return;

    const bufferLength = this.audioAnalyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.audioAnalyser.getByteFrequencyData(dataArray);

    const average = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
    
    // High noise level detection
    if (average > 60) {
      // Only trigger every 10 seconds max
      if (Date.now() - this.lastFaceCheckTime > 10000) {
        this.addViolation('background_noise', 'Significant background noise detected', 'low');
        this.lastFaceCheckTime = Date.now();
      }
    }
  }

  // Simple face presence check
  private checkFacePresence(): void {
    if (!this.videoElement || !this.canvasElement) return;

    const ctx = this.canvasElement.getContext('2d');
    if (!ctx) return;

    this.canvasElement.width = 100;
    this.canvasElement.height = 75;
    ctx.drawImage(this.videoElement, 0, 0, 100, 75);

    const imageData = ctx.getImageData(0, 0, 100, 75);
    const data = imageData.data;

    // Calculate average brightness
    let totalBrightness = 0;
    for (let i = 0; i < data.length; i += 4) {
      totalBrightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
    }
    const avgBrightness = totalBrightness / (data.length / 4);

    // Very dark or very bright might indicate covered camera
    if (avgBrightness < 20 || avgBrightness > 250) {
      this.consecutiveNoFaceCount++;
      if (this.consecutiveNoFaceCount >= 3) {
        this.addViolation('camera_covered', 'Camera appears to be covered or blocked', 'high');
        this.consecutiveNoFaceCount = 0;
      }
    } else {
      this.consecutiveNoFaceCount = 0;
    }
  }

  // Add a violation
  addViolation(type: string, message: string, severity: 'low' | 'medium' | 'high' | 'critical'): void {
    const violation: Violation = {
      id: `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      timestamp: new Date(),
      severity,
    };

    // Capture screenshot
    if (this.canvasElement && this.videoElement) {
      try {
        const ctx = this.canvasElement.getContext('2d');
        if (ctx) {
          this.canvasElement.width = this.videoElement.videoWidth || 640;
          this.canvasElement.height = this.videoElement.videoHeight || 480;
          ctx.drawImage(this.videoElement, 0, 0);
          violation.screenshot = this.canvasElement.toDataURL('image/jpeg', 0.6);
        }
      } catch {
        // Ignore screenshot errors
      }
    }

    this.violations.push(violation);

    if (severity === 'critical' || severity === 'high') {
      this.violationCount++;
    } else {
      this.warningCount++;
    }

    console.log(`⚠️ ${severity.toUpperCase()}: ${message}`);

    // Notify callback
    if (this.onViolationCallback) {
      this.onViolationCallback(violation);
    }

    this.notifyStatusChange();

    // Check for auto-submit
    if (this.violationCount >= this.maxViolations) {
      console.log('🚫 Max violations reached - Auto submitting exam');
      if (this.onAutoSubmitCallback) {
        this.onAutoSubmitCallback();
      }
    }
  }

  // Notify status change
  private notifyStatusChange(): void {
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(this.getStatus());
    }
  }

  // Check if initialized
  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  // Check if max warnings reached
  hasMaxWarnings(): boolean {
    return this.warningCount >= this.maxWarnings;
  }

  // Get current status
  getStatus(): ProctoringStatus {
    return {
      cameraActive: !!this.mediaStream?.getVideoTracks()[0]?.enabled,
      microphoneActive: !!this.mediaStream?.getAudioTracks()[0]?.enabled,
      faceVisible: this.consecutiveNoFaceCount < 3,
      isFullscreen: !!document.fullscreenElement,
      tabFocused: !document.hidden,
      violations: [...this.violations],
      violationCount: this.violationCount,
      warningCount: this.warningCount,
    };
  }

  // Get violation summary
  getViolationSummary(): { [key: string]: number } {
    const summary: { [key: string]: number } = {};
    this.violations.forEach(v => {
      summary[v.type] = (summary[v.type] || 0) + 1;
    });
    return summary;
  }

  // Callbacks
  onViolation(callback: (violation: Violation) => void): void {
    this.onViolationCallback = callback;
  }

  onStatusChange(callback: (status: ProctoringStatus) => void): void {
    this.onStatusChangeCallback = callback;
  }

  onAutoSubmit(callback: () => void): void {
    this.onAutoSubmitCallback = callback;
  }

  // Should auto submit
  shouldAutoSubmit(): boolean {
    return this.violationCount >= this.maxViolations;
  }

  // Request fullscreen
  async requestFullscreen(): Promise<boolean> {
    try {
      await document.documentElement.requestFullscreen();
      return true;
    } catch {
      this.addViolation('fullscreen_denied', 'Fullscreen request denied', 'medium');
      return false;
    }
  }

  // Stop proctoring
  stop(): void {
    // Clear intervals
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    if (this.faceCheckInterval) {
      clearInterval(this.faceCheckInterval);
      this.faceCheckInterval = null;
    }

    // Stop media tracks
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    // Remove event listeners
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('blur', this.handleWindowBlur);
    window.removeEventListener('focus', this.handleWindowFocus);
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('contextmenu', this.handleContextMenu);
    document.removeEventListener('copy', this.handleCopyPaste);
    document.removeEventListener('paste', this.handleCopyPaste);
    document.removeEventListener('cut', this.handleCopyPaste);

    // Exit fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    this.isInitialized = false;
    console.log('🛑 Proctoring stopped');
  }

  // Reset violations
  reset(): void {
    this.violations = [];
    this.violationCount = 0;
    this.warningCount = 0;
    this.consecutiveNoFaceCount = 0;
  }
}

// Export singleton
export const proctoringService = new SimpleProctoringService();
