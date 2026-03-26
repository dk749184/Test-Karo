// AI Proctoring Service
// Uses TensorFlow.js for face detection, eye tracking, and object detection

import * as tf from '@tensorflow/tfjs';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

// Types
export interface ProctoringViolation {
  type: string;
  message: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  screenshot?: string;
}

export interface ProctoringState {
  isInitialized: boolean;
  isCameraActive: boolean;
  isMicrophoneActive: boolean;
  faceDetected: boolean;
  faceCount: number;
  eyesOnScreen: boolean;
  phoneDetected: boolean;
  voiceDetected: boolean;
  violations: ProctoringViolation[];
  violationCount: number;
  warningCount: number;
  lastCheckTime: Date | null;
}

export interface ProctoringConfig {
  enableFaceDetection: boolean;
  enableEyeTracking: boolean;
  enablePhoneDetection: boolean;
  enableVoiceDetection: boolean;
  maxViolations: number;
  maxWarnings: number;
  checkIntervalMs: number;
  eyeOffScreenThresholdMs: number;
  noFaceThresholdMs: number;
}

// Default configuration
export const DEFAULT_PROCTORING_CONFIG: ProctoringConfig = {
  enableFaceDetection: true,
  enableEyeTracking: true,
  enablePhoneDetection: true,
  enableVoiceDetection: true,
  maxViolations: 5,
  maxWarnings: 10,
  checkIntervalMs: 2000,
  eyeOffScreenThresholdMs: 3000,
  noFaceThresholdMs: 5000,
};

// Initialize state
export const createInitialProctoringState = (): ProctoringState => ({
  isInitialized: false,
  isCameraActive: false,
  isMicrophoneActive: false,
  faceDetected: false,
  faceCount: 0,
  eyesOnScreen: true,
  phoneDetected: false,
  voiceDetected: false,
  violations: [],
  violationCount: 0,
  warningCount: 0,
  lastCheckTime: null,
});

// Proctoring Class
export class ProctoringService {
  private state: ProctoringState;
  private config: ProctoringConfig;
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private audioContext: AudioContext | null = null;
  private audioAnalyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private faceModel: faceLandmarksDetection.FaceLandmarksDetector | null = null;
  private objectModel: cocoSsd.ObjectDetection | null = null;
  private checkInterval: NodeJS.Timeout | null = null;
  private onViolationCallback: ((violation: ProctoringViolation) => void) | null = null;
  private onStateChangeCallback: ((state: ProctoringState) => void) | null = null;
  private eyeOffScreenStartTime: number | null = null;
  private noFaceStartTime: number | null = null;

  constructor(config: Partial<ProctoringConfig> = {}) {
    this.config = { ...DEFAULT_PROCTORING_CONFIG, ...config };
    this.state = createInitialProctoringState();
  }

  // Initialize TensorFlow and models
  async initialize(): Promise<boolean> {
    try {
      console.log('🔧 Initializing AI Proctoring...');
      
      // Initialize TensorFlow.js
      await tf.ready();
      console.log('✅ TensorFlow.js ready');

      // Load face detection model
      if (this.config.enableFaceDetection || this.config.enableEyeTracking) {
        console.log('📦 Loading face detection model...');
        this.faceModel = await faceLandmarksDetection.createDetector(
          faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
          {
            runtime: 'tfjs',
            refineLandmarks: true,
            maxFaces: 5,
          }
        );
        console.log('✅ Face detection model loaded');
      }

      // Load object detection model for phone detection
      if (this.config.enablePhoneDetection) {
        console.log('📦 Loading object detection model...');
        this.objectModel = await cocoSsd.load();
        console.log('✅ Object detection model loaded');
      }

      this.state.isInitialized = true;
      this.notifyStateChange();
      console.log('✅ AI Proctoring initialized successfully!');
      return true;
    } catch (error) {
      console.error('❌ Error initializing proctoring:', error);
      return false;
    }
  }

  // Start camera and microphone
  async startCamera(videoElement: HTMLVideoElement, canvasElement: HTMLCanvasElement): Promise<boolean> {
    try {
      this.videoElement = videoElement;
      this.canvasElement = canvasElement;

      // Request camera and microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: this.config.enableVoiceDetection,
      });

      // Set video source
      this.videoElement.srcObject = this.mediaStream;
      await this.videoElement.play();
      this.state.isCameraActive = true;

      // Setup audio analysis for voice detection
      if (this.config.enableVoiceDetection) {
        this.setupAudioAnalysis();
      }

      this.notifyStateChange();
      console.log('✅ Camera started');
      return true;
    } catch (error) {
      console.error('❌ Error starting camera:', error);
      this.addViolation({
        type: 'camera_blocked',
        message: 'Camera access was denied or blocked',
        severity: 'critical',
      });
      return false;
    }
  }

  // Setup audio analysis for voice detection
  private setupAudioAnalysis(): void {
    if (!this.mediaStream) return;

    try {
      this.audioContext = new AudioContext();
      const audioSource = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.audioAnalyser = this.audioContext.createAnalyser();
      this.audioAnalyser.fftSize = 256;
      audioSource.connect(this.audioAnalyser);
      this.state.isMicrophoneActive = true;
      console.log('✅ Audio analysis setup complete');
    } catch (error) {
      console.error('❌ Error setting up audio:', error);
    }
  }

  // Start monitoring
  startMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(() => {
      this.performCheck();
    }, this.config.checkIntervalMs);

    console.log('🔍 Proctoring monitoring started');
  }

  // Stop monitoring
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    console.log('⏹️ Proctoring monitoring stopped');
  }

  // Perform a single check
  private async performCheck(): Promise<void> {
    if (!this.state.isInitialized || !this.videoElement) return;

    try {
      // Face detection
      if (this.config.enableFaceDetection && this.faceModel) {
        await this.checkFace();
      }

      // Eye tracking
      if (this.config.enableEyeTracking && this.faceModel) {
        await this.checkEyes();
      }

      // Phone detection
      if (this.config.enablePhoneDetection && this.objectModel) {
        await this.checkForPhone();
      }

      // Voice detection
      if (this.config.enableVoiceDetection && this.audioAnalyser) {
        this.checkVoice();
      }

      this.state.lastCheckTime = new Date();
      this.notifyStateChange();
    } catch (error) {
      console.error('Error during proctoring check:', error);
    }
  }

  // Check for face
  private async checkFace(): Promise<void> {
    if (!this.faceModel || !this.videoElement) return;

    try {
      const faces = await this.faceModel.estimateFaces(this.videoElement);
      this.state.faceCount = faces.length;
      this.state.faceDetected = faces.length > 0;

      // No face detected
      if (faces.length === 0) {
        if (!this.noFaceStartTime) {
          this.noFaceStartTime = Date.now();
        } else if (Date.now() - this.noFaceStartTime > this.config.noFaceThresholdMs) {
          this.addViolation({
            type: 'no_face',
            message: 'No face detected. Please stay visible on camera.',
            severity: 'high',
          });
          this.noFaceStartTime = Date.now(); // Reset timer
        }
      } else {
        this.noFaceStartTime = null;
      }

      // Multiple faces detected
      if (faces.length > 1) {
        this.addViolation({
          type: 'multiple_faces',
          message: `${faces.length} faces detected! Only one person should be visible.`,
          severity: 'critical',
        });
      }
    } catch (error) {
      console.error('Face check error:', error);
    }
  }

  // Check eye movement
  private async checkEyes(): Promise<void> {
    if (!this.faceModel || !this.videoElement) return;

    try {
      const faces = await this.faceModel.estimateFaces(this.videoElement);
      
      if (faces.length === 1) {
        const face = faces[0];
        const keypoints = face.keypoints;
        
        // Get eye landmarks
        const leftEye = keypoints.filter(kp => kp.name?.includes('leftEye'));
        const rightEye = keypoints.filter(kp => kp.name?.includes('rightEye'));
        const nose = keypoints.find(kp => kp.name === 'noseTip');

        if (leftEye.length > 0 && rightEye.length > 0 && nose) {
          // Calculate eye center positions
          const leftEyeCenter = this.getCenter(leftEye);
          const rightEyeCenter = this.getCenter(rightEye);
          
          // Check if eyes are looking at screen (simplified check)
          const eyeMidpointX = (leftEyeCenter.x + rightEyeCenter.x) / 2;
          const noseX = nose.x;
          
          // If eye midpoint is significantly different from nose, eyes may be looking away
          const lookingAwayThreshold = 30; // pixels
          const isLookingAway = Math.abs(eyeMidpointX - noseX) > lookingAwayThreshold;
          
          if (isLookingAway) {
            if (!this.eyeOffScreenStartTime) {
              this.eyeOffScreenStartTime = Date.now();
            } else if (Date.now() - this.eyeOffScreenStartTime > this.config.eyeOffScreenThresholdMs) {
              this.state.eyesOnScreen = false;
              this.addViolation({
                type: 'looking_away',
                message: 'You are looking away from the screen repeatedly.',
                severity: 'medium',
              });
              this.eyeOffScreenStartTime = Date.now(); // Reset timer
            }
          } else {
            this.eyeOffScreenStartTime = null;
            this.state.eyesOnScreen = true;
          }
        }
      }
    } catch (error) {
      console.error('Eye tracking error:', error);
    }
  }

  // Helper to get center point of landmarks
  private getCenter(keypoints: Array<{x: number; y: number}>): {x: number; y: number} {
    const sum = keypoints.reduce(
      (acc, kp) => ({ x: acc.x + kp.x, y: acc.y + kp.y }),
      { x: 0, y: 0 }
    );
    return {
      x: sum.x / keypoints.length,
      y: sum.y / keypoints.length,
    };
  }

  // Check for phone/suspicious objects
  private async checkForPhone(): Promise<void> {
    if (!this.objectModel || !this.videoElement) return;

    try {
      const predictions = await this.objectModel.detect(this.videoElement);
      
      // Check for phones, laptops, books, etc.
      const suspiciousObjects = ['cell phone', 'laptop', 'book', 'remote'];
      const detected = predictions.filter(p => 
        suspiciousObjects.includes(p.class) && p.score > 0.5
      );

      if (detected.length > 0) {
        this.state.phoneDetected = true;
        const objects = detected.map(d => d.class).join(', ');
        this.addViolation({
          type: 'suspicious_object',
          message: `Suspicious object detected: ${objects}`,
          severity: 'high',
        });
      } else {
        this.state.phoneDetected = false;
      }
    } catch (error) {
      console.error('Phone detection error:', error);
    }
  }

  // Check for voice/noise
  private checkVoice(): void {
    if (!this.audioAnalyser) return;

    try {
      const bufferLength = this.audioAnalyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      this.audioAnalyser.getByteFrequencyData(dataArray);

      // Calculate average volume
      const average = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
      const voiceThreshold = 50; // Adjust based on testing

      if (average > voiceThreshold) {
        if (!this.state.voiceDetected) {
          this.state.voiceDetected = true;
          this.addViolation({
            type: 'voice_detected',
            message: 'Background voice or noise detected.',
            severity: 'medium',
          });
        }
      } else {
        this.state.voiceDetected = false;
      }
    } catch (error) {
      console.error('Voice detection error:', error);
    }
  }

  // Add a violation
  private addViolation(violation: Omit<ProctoringViolation, 'timestamp'>): void {
    const fullViolation: ProctoringViolation = {
      ...violation,
      timestamp: new Date(),
    };

    this.state.violations.push(fullViolation);
    
    if (violation.severity === 'critical' || violation.severity === 'high') {
      this.state.violationCount++;
    } else {
      this.state.warningCount++;
    }

    // Capture screenshot for evidence
    if (this.canvasElement && this.videoElement) {
      try {
        const ctx = this.canvasElement.getContext('2d');
        if (ctx) {
          this.canvasElement.width = this.videoElement.videoWidth;
          this.canvasElement.height = this.videoElement.videoHeight;
          ctx.drawImage(this.videoElement, 0, 0);
          fullViolation.screenshot = this.canvasElement.toDataURL('image/jpeg', 0.8);
        }
      } catch {
        // Ignore screenshot errors
      }
    }

    this.notifyStateChange();
    
    if (this.onViolationCallback) {
      this.onViolationCallback(fullViolation);
    }

    console.log(`⚠️ Violation: ${violation.type} - ${violation.message}`);
  }

  // Notify state change
  private notifyStateChange(): void {
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback({ ...this.state });
    }
  }

  // Set callbacks
  onViolation(callback: (violation: ProctoringViolation) => void): void {
    this.onViolationCallback = callback;
  }

  onStateChange(callback: (state: ProctoringState) => void): void {
    this.onStateChangeCallback = callback;
  }

  // Get current state
  getState(): ProctoringState {
    return { ...this.state };
  }

  // Check if should auto-submit
  shouldAutoSubmit(): boolean {
    return this.state.violationCount >= this.config.maxViolations;
  }

  // Stop everything
  stop(): void {
    this.stopMonitoring();
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.state.isCameraActive = false;
    this.state.isMicrophoneActive = false;
    console.log('🛑 Proctoring stopped');
  }
}

// Singleton instance
let proctoringInstance: ProctoringService | null = null;

export const getProctoring = (config?: Partial<ProctoringConfig>): ProctoringService => {
  if (!proctoringInstance) {
    proctoringInstance = new ProctoringService(config);
  }
  return proctoringInstance;
};

export const resetProctoring = (): void => {
  if (proctoringInstance) {
    proctoringInstance.stop();
    proctoringInstance = null;
  }
};
