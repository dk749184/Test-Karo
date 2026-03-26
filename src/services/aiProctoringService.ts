// Simple and Reliable AI Proctoring Service
// Uses TensorFlow.js COCO-SSD for object detection

import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

interface Detection {
  faceDetected: boolean;
  faceCount: number;
  phoneDetected: boolean;
  lookingAway: boolean;
  eyesClosed: boolean;
  objects: string[];
}

interface Violation {
  type: string;
  message: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: Date;
}

class AIProctoringService {
  private cocoModel: cocoSsd.ObjectDetection | null = null;
  private isModelLoaded: boolean = false;
  private videoElement: HTMLVideoElement | null = null;
  private detectionInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  
  // Violation tracking
  private violations: Violation[] = [];
  private violationCallback: ((violation: Violation) => void) | null = null;
  private detectionCallback: ((result: { faceDetected: boolean; personCount: number; phoneDetected: boolean }) => void) | null = null;
  
  // Detection counters
  private faceMissingCount: number = 0;
  private multipleFaceCount: number = 0;
  private phoneCount: number = 0;
  
  // Thresholds - VERY STRICT for cheating detection
  private readonly FACE_MISSING_THRESHOLD = 2; // 2 consecutive = violation (4 seconds)
  private readonly MULTIPLE_FACE_THRESHOLD = 1; // Immediate violation
  private readonly PHONE_THRESHOLD = 1; // Immediate violation
  private readonly DETECTION_INTERVAL = 2000; // Check every 2 seconds
  
  // Cooldown to prevent spam
  private lastViolationTime: { [key: string]: number } = {};
  private readonly VIOLATION_COOLDOWN = 8000; // 8 seconds between same violation type
  
  // Debug mode - used for logging
  private readonly DEBUG_MODE = true;
  
  // Getter for debug mode
  get isDebugMode(): boolean {
    return this.DEBUG_MODE;
  }

  async loadModels(onProgress?: (progress: number, message: string) => void): Promise<boolean> {
    try {
      console.log('🤖🤖🤖 LOADING AI MODEL 🤖🤖🤖');
      
      onProgress?.(10, 'Initializing TensorFlow.js...');
      
      // Load COCO-SSD model
      onProgress?.(30, 'Loading object detection model...');
      console.log('📦 Loading COCO-SSD model...');
      
      this.cocoModel = await cocoSsd.load({
        base: 'lite_mobilenet_v2' // Faster, lighter model
      });
      
      console.log('✅ COCO-SSD model loaded successfully!');
      onProgress?.(80, 'AI Model ready!');
      
      this.isModelLoaded = true;
      
      onProgress?.(100, 'All systems ready!');
      console.log('✅✅✅ AI PROCTORING READY! ✅✅✅');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to load AI model:', error);
      onProgress?.(100, 'AI Model failed - using fallback');
      return false;
    }
  }

  setVideoElement(video: HTMLVideoElement): void {
    this.videoElement = video;
    console.log('📹 Video element set for AI proctoring');
  }

  setViolationCallback(callback: (violation: Violation) => void): void {
    this.violationCallback = callback;
  }

  setDetectionCallback(callback: ((result: { faceDetected: boolean; personCount: number; phoneDetected: boolean }) => void) | null): void {
    this.detectionCallback = callback;
    console.log('📊 Detection callback set:', callback ? 'YES' : 'NO');
  }

  startDetection(): void {
    if (this.isRunning) {
      console.log('⚠️ Detection already running');
      return;
    }
    
    if (!this.videoElement) {
      console.error('❌ No video element set!');
      return;
    }
    
    console.log('');
    console.log('🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍');
    console.log('🔍 STARTING AI DETECTION');
    console.log('🔍 Detection interval: 2 seconds');
    console.log('🔍 Face missing threshold: 2 checks');
    console.log('🔍 Multiple face threshold: 1 check');
    console.log('🔍 Phone threshold: 1 check');
    console.log('🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍');
    console.log('');
    
    this.isRunning = true;
    
    // Reset counters
    this.faceMissingCount = 0;
    this.multipleFaceCount = 0;
    this.phoneCount = 0;
    
    // Start detection loop
    this.detectionInterval = setInterval(() => {
      this.runDetection();
    }, this.DETECTION_INTERVAL);
    
    // Run first detection after 2 seconds (give camera time to stabilize)
    setTimeout(() => this.runDetection(), 2000);
  }

  stopDetection(): void {
    console.log('🛑 Stopping AI detection');
    this.isRunning = false;
    
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }
  }

  private async runDetection(): Promise<void> {
    if (!this.isRunning || !this.videoElement) {
      return;
    }
    
    try {
      const detection = await this.detectObjects();
      this.processDetection(detection);
    } catch (error) {
      console.error('❌ Detection error:', error);
    }
  }

  private async detectObjects(): Promise<Detection> {
    const result: Detection = {
      faceDetected: false,
      faceCount: 0,
      phoneDetected: false,
      lookingAway: false,
      eyesClosed: false,
      objects: []
    };
    
    if (!this.videoElement) {
      console.log('❌ No video element!');
      return result;
    }
    
    if (this.videoElement.readyState < 2) {
      console.log('⚠️ Video not ready, readyState:', this.videoElement.readyState);
      return result;
    }
    
    console.log('🔍 Running detection...');
    
    // Method 1: COCO-SSD Object Detection (PRIMARY)
    if (this.cocoModel && this.isModelLoaded) {
      try {
        const predictions = await this.cocoModel.detect(this.videoElement);
        
        console.log(`📊 COCO-SSD found ${predictions.length} objects`);
        
        let personCount = 0;
        let phoneDetected = false;
        const detectedObjects: string[] = [];
        
        for (const pred of predictions) {
          const label = pred.class.toLowerCase();
          const confidence = Math.round(pred.score * 100);
          detectedObjects.push(`${label}(${confidence}%)`);
          
          // Count persons (faces) - LOW threshold for better detection
          if (label === 'person' && pred.score > 0.25) {
            personCount++;
            console.log(`👤 Person detected with ${confidence}% confidence`);
          }
          
          // Detect phone, laptop, book - LOW threshold
          if ((label === 'cell phone' || label === 'laptop' || label === 'book' || label === 'remote') && pred.score > 0.3) {
            phoneDetected = true;
            console.log('');
            console.log(`📱📱📱📱📱📱📱📱📱📱📱📱📱📱📱📱📱📱📱📱`);
            console.log(`📱 ${label.toUpperCase()} DETECTED! (${confidence}%)`);
            console.log(`📱📱📱📱📱📱📱📱📱📱📱📱📱📱📱📱📱📱📱📱`);
            console.log('');
          }
        }
        
        result.faceDetected = personCount > 0;
        result.faceCount = personCount;
        result.phoneDetected = phoneDetected;
        result.objects = detectedObjects;
        
        // Log detection result
        console.log('');
        console.log('═══════════════════════════════════════');
        console.log(`📊 DETECTION RESULT:`);
        console.log(`   Persons: ${personCount}`);
        console.log(`   Phone: ${phoneDetected ? '⚠️ YES!' : '✓ No'}`);
        console.log(`   Face Detected: ${result.faceDetected ? '✅ YES' : '❌ NO'}`);
        console.log(`   Objects: [${detectedObjects.join(', ')}]`);
        console.log('═══════════════════════════════════════');
        console.log('');
        
      } catch (error) {
        console.error('COCO-SSD error:', error);
      }
    }
    
    // No fallback - rely on COCO-SSD only for accurate detection
    if (!result.faceDetected) {
      console.log('❌ NO FACE DETECTED - Violation may trigger');
    }
    
    return result;
  }
  
  // Removed unused detectSkinTone

  // Skin detection removed - COCO-SSD is more reliable

  private processDetection(detection: Detection): void {
    console.log('');
    console.log('🔄 Processing Detection Results...');
    
    // Send detection result to UI
    if (this.detectionCallback) {
      this.detectionCallback({
        faceDetected: detection.faceDetected,
        personCount: detection.faceCount,
        phoneDetected: detection.phoneDetected
      });
      console.log(`📤 Sent to UI: Face=${detection.faceDetected}, People=${detection.faceCount}, Phone=${detection.phoneDetected}`);
    }
    
    // Check Face Missing
    if (!detection.faceDetected) {
      this.faceMissingCount++;
      console.log('');
      console.log(`👤👤👤 FACE MISSING! 👤👤👤`);
      console.log(`   Count: ${this.faceMissingCount}/${this.FACE_MISSING_THRESHOLD}`);
      console.log(`   Next check in 2 seconds...`);
      
      if (this.faceMissingCount >= this.FACE_MISSING_THRESHOLD) {
        console.log('🚨🚨🚨 FACE MISSING THRESHOLD REACHED! TRIGGERING VIOLATION! 🚨🚨🚨');
        this.triggerViolation('FACE_MISSING', '👤 Face not visible! Look at the camera.', 'HIGH');
        this.faceMissingCount = 0;
      }
    } else {
      if (this.faceMissingCount > 0) {
        console.log(`✅ Face detected again! Resetting count from ${this.faceMissingCount} to 0`);
      }
      this.faceMissingCount = 0;
    }
    
    // Check Multiple Faces - IMMEDIATE violation
    if (detection.faceCount > 1) {
      this.multipleFaceCount++;
      console.log('');
      console.log(`👥👥👥 MULTIPLE FACES DETECTED! 👥👥👥`);
      console.log(`   Faces: ${detection.faceCount}`);
      console.log(`   Count: ${this.multipleFaceCount}/${this.MULTIPLE_FACE_THRESHOLD}`);
      
      if (this.multipleFaceCount >= this.MULTIPLE_FACE_THRESHOLD) {
        console.log('🚨🚨🚨 MULTIPLE FACES THRESHOLD REACHED! TRIGGERING VIOLATION! 🚨🚨🚨');
        this.triggerViolation('MULTIPLE_FACES', `👥 ${detection.faceCount} people detected! Only you should be visible.`, 'HIGH');
        this.multipleFaceCount = 0;
      }
    } else {
      this.multipleFaceCount = 0;
    }
    
    // Check Phone Detection - IMMEDIATE violation
    if (detection.phoneDetected) {
      this.phoneCount++;
      console.log('');
      console.log(`📱📱📱 PHONE/DEVICE DETECTED! 📱📱📱`);
      console.log(`   Count: ${this.phoneCount}/${this.PHONE_THRESHOLD}`);
      
      if (this.phoneCount >= this.PHONE_THRESHOLD) {
        console.log('🚨🚨🚨 PHONE THRESHOLD REACHED! TRIGGERING VIOLATION! 🚨🚨🚨');
        this.triggerViolation('PHONE_DETECTED', '📱 Phone/device detected! Remove it from view.', 'HIGH');
        this.phoneCount = 0;
      }
    } else {
      this.phoneCount = 0;
    }
    
    console.log('');
  }

  private triggerViolation(type: string, message: string, severity: 'HIGH' | 'MEDIUM' | 'LOW'): void {
    const now = Date.now();
    const lastTime = this.lastViolationTime[type] || 0;
    
    // Check cooldown
    if (now - lastTime < this.VIOLATION_COOLDOWN) {
      console.log(`⏱️ Violation ${type} in cooldown (${Math.round((this.VIOLATION_COOLDOWN - (now - lastTime)) / 1000)}s remaining)`);
      return;
    }
    
    this.lastViolationTime[type] = now;
    
    const violation: Violation = {
      type,
      message,
      severity,
      timestamp: new Date()
    };
    
    this.violations.push(violation);
    
    console.log('');
    console.log('╔══════════════════════════════════════════╗');
    console.log('║      🚨🚨🚨 VIOLATION TRIGGERED 🚨🚨🚨      ║');
    console.log('╠══════════════════════════════════════════╣');
    console.log(`║  Type: ${type.padEnd(33)}║`);
    console.log(`║  Message: ${message.substring(0, 30).padEnd(30)}║`);
    console.log(`║  Severity: ${severity.padEnd(29)}║`);
    console.log('╚══════════════════════════════════════════╝');
    console.log('');
    
    if (this.violationCallback) {
      console.log('📢 Sending violation to ExamInterface...');
      this.violationCallback(violation);
    } else {
      console.log('❌ No violation callback set!');
    }
  }

  getViolations(): Violation[] {
    return this.violations;
  }

  isReady(): boolean {
    return this.isModelLoaded;
  }

  cleanup(): void {
    this.stopDetection();
    this.videoElement = null;
    this.violations = [];
    this.violationCallback = null;
    this.faceMissingCount = 0;
    this.multipleFaceCount = 0;
    this.phoneCount = 0;
    console.log('🧹 AI Proctoring cleaned up');
  }
}

export const aiProctoringService = new AIProctoringService();
export type { Detection, Violation };
