// AI Proctoring Service using TensorFlow.js and face-api.js
import * as faceapi from 'face-api.js';

// Types
export interface DetectionResult {
  faceDetected: boolean;
  faceCount: number;
  multipleFaces: boolean;
  lookingAway: boolean;
  phoneDetected: boolean;
  violations: ViolationInfo[];
}

export interface ViolationInfo {
  type: string;
  message: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: Date;
}

// State variables
let isModelLoaded = false;
let isLoading = false;
let loadingProgress = 0;

// Miss counters
let faceMissCount = 0;
let multipleFaceCount = 0;
let lookingAwayCount = 0;

// Thresholds
const FACE_MISS_THRESHOLD = 3;
const MULTIPLE_FACE_THRESHOLD = 2;
const LOOKING_AWAY_THRESHOLD = 3;

// Load face-api.js models
export async function loadModels(onProgress?: (progress: number) => void): Promise<boolean> {
  if (isModelLoaded) {
    console.log('✅ AI Models already loaded');
    return true;
  }
  
  if (isLoading) {
    console.log('⏳ Models already loading...');
    return false;
  }
  
  isLoading = true;
  loadingProgress = 0;
  
  try {
    console.log('🤖 Loading AI Proctoring Models...');
    
    // Load models from CDN
    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model';
    
    // Load TinyFaceDetector (fastest, good enough for proctoring)
    console.log('📦 Loading TinyFaceDetector...');
    onProgress?.(10);
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    loadingProgress = 30;
    onProgress?.(30);
    
    // Load Face Landmark Model (for eye tracking)
    console.log('📦 Loading FaceLandmark68TinyNet...');
    await faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL);
    loadingProgress = 60;
    onProgress?.(60);
    
    // Load Face Expression Model (optional, for attention detection)
    console.log('📦 Loading FaceExpression...');
    await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
    loadingProgress = 90;
    onProgress?.(90);
    
    isModelLoaded = true;
    isLoading = false;
    loadingProgress = 100;
    onProgress?.(100);
    
    console.log('✅ All AI Models loaded successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Error loading AI models:', error);
    isLoading = false;
    
    // Try fallback - use simpler detection
    console.log('⚠️ Using fallback detection mode');
    isModelLoaded = true; // Set to true so fallback mode works
    onProgress?.(100);
    return true;
  }
}

// Main detection function
export async function detectFaces(video: HTMLVideoElement): Promise<DetectionResult> {
  const result: DetectionResult = {
    faceDetected: false,
    faceCount: 0,
    multipleFaces: false,
    lookingAway: false,
    phoneDetected: false,
    violations: []
  };
  
  if (!video || video.readyState < 2) {
    console.log('⚠️ Video not ready for detection');
    return result;
  }
  
  try {
    if (isModelLoaded && faceapi.nets.tinyFaceDetector.isLoaded) {
      // Use face-api.js for detection
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({
          inputSize: 224,
          scoreThreshold: 0.5
        }))
        .withFaceLandmarks(true);
      
      result.faceCount = detections.length;
      result.faceDetected = detections.length > 0;
      result.multipleFaces = detections.length > 1;
      
      console.log(`👤 Detected ${detections.length} face(s)`);
      
      // Check if looking away (using landmarks)
      if (detections.length === 1) {
        const landmarks = detections[0].landmarks;
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();
        // const nose = landmarks.getNose(); // Reserved for future use
        
        // Simple looking away detection based on face position
        const faceBox = detections[0].detection.box;
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        
        const faceCenterX = faceBox.x + faceBox.width / 2;
        const faceCenterY = faceBox.y + faceBox.height / 2;
        
        // Check if face is not centered (looking away)
        const xOffset = Math.abs(faceCenterX - videoWidth / 2) / videoWidth;
        const yOffset = Math.abs(faceCenterY - videoHeight / 2) / videoHeight;
        
        if (xOffset > 0.35 || yOffset > 0.35) {
          result.lookingAway = true;
          console.log(`👀 Looking away: xOffset=${xOffset.toFixed(2)}, yOffset=${yOffset.toFixed(2)}`);
        }
        
        // Check eye aspect ratio for closed eyes / looking away
        if (leftEye && rightEye) {
          const leftEyeAspect = getEyeAspectRatio(leftEye);
          const rightEyeAspect = getEyeAspectRatio(rightEye);
          
          if (leftEyeAspect < 0.2 || rightEyeAspect < 0.2) {
            // Eyes might be closed or looking away
            console.log('👀 Eyes may be closed or looking away');
          }
        }
      }
      
      // Process violations
      processDetectionResults(result);
      
    } else {
      // Fallback: Use pixel-based detection
      console.log('🔄 Using fallback detection...');
      const fallbackResult = await fallbackDetection(video);
      Object.assign(result, fallbackResult);
      processDetectionResults(result);
    }
    
  } catch (error) {
    console.error('❌ Detection error:', error);
    // Use fallback on error
    const fallbackResult = await fallbackDetection(video);
    Object.assign(result, fallbackResult);
  }
  
  return result;
}

// Calculate eye aspect ratio
function getEyeAspectRatio(eye: faceapi.Point[]): number {
  if (eye.length < 6) return 1;
  
  // Vertical distances
  const v1 = Math.sqrt(Math.pow(eye[1].x - eye[5].x, 2) + Math.pow(eye[1].y - eye[5].y, 2));
  const v2 = Math.sqrt(Math.pow(eye[2].x - eye[4].x, 2) + Math.pow(eye[2].y - eye[4].y, 2));
  
  // Horizontal distance
  const h = Math.sqrt(Math.pow(eye[0].x - eye[3].x, 2) + Math.pow(eye[0].y - eye[3].y, 2));
  
  return (v1 + v2) / (2 * h);
}

// Fallback detection using pixel analysis
async function fallbackDetection(video: HTMLVideoElement): Promise<Partial<DetectionResult>> {
  const result: Partial<DetectionResult> = {
    faceDetected: false,
    faceCount: 0,
    multipleFaces: false,
    lookingAway: false,
    phoneDetected: false
  };
  
  try {
    const canvas = document.createElement('canvas');
    const scale = 0.25; // Reduce for performance
    canvas.width = video.videoWidth * scale;
    canvas.height = video.videoHeight * scale;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return result;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    let skinPixels = 0;
    let bluePixels = 0;
    let darkPixels = 0;
    const totalPixels = data.length / 4;
    
    // Analyze pixels
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Skin detection (improved)
      const isSkin = (
        r > 95 && g > 40 && b > 20 &&
        r > g && r > b &&
        Math.abs(r - g) > 15 &&
        Math.max(r, g, b) - Math.min(r, g, b) > 15
      );
      
      if (isSkin) skinPixels++;
      
      // Blue light (phone/screen)
      if (b > 150 && b > r * 1.2 && b > g * 1.1) {
        bluePixels++;
      }
      
      // Dark pixels
      if (r < 50 && g < 50 && b < 50) {
        darkPixels++;
      }
    }
    
    const skinRatio = skinPixels / totalPixels;
    const blueRatio = bluePixels / totalPixels;
    const darkRatio = darkPixels / totalPixels;
    
    console.log(`📊 Fallback: Skin=${(skinRatio*100).toFixed(1)}%, Blue=${(blueRatio*100).toFixed(1)}%, Dark=${(darkRatio*100).toFixed(1)}%`);
    
    // Face detection
    result.faceDetected = skinRatio > 0.02 && skinRatio < 0.5;
    
    // Multiple faces (high skin ratio)
    result.multipleFaces = skinRatio > 0.35;
    if (result.multipleFaces) {
      result.faceCount = 2;
    } else if (result.faceDetected) {
      result.faceCount = 1;
    }
    
    // Phone/screen detection (blue light + dark areas)
    result.phoneDetected = blueRatio > 0.05 && darkRatio > 0.3;
    
    // Looking away (face not centered - check skin distribution)
    // This is approximate in fallback mode
    
  } catch (error) {
    console.error('❌ Fallback detection error:', error);
  }
  
  return result;
}

// Process detection results and generate violations
function processDetectionResults(result: DetectionResult): void {
  // Face missing
  if (!result.faceDetected) {
    faceMissCount++;
    console.log(`👤 Face missing! Count: ${faceMissCount}/${FACE_MISS_THRESHOLD}`);
    
    if (faceMissCount >= FACE_MISS_THRESHOLD) {
      result.violations.push({
        type: 'FACE_MISSING',
        message: '👤 Face not detected! Please look at the camera.',
        severity: 'HIGH',
        timestamp: new Date()
      });
      faceMissCount = 0;
    }
  } else {
    faceMissCount = Math.max(0, faceMissCount - 1);
  }
  
  // Multiple faces
  if (result.multipleFaces) {
    multipleFaceCount++;
    console.log(`👥 Multiple faces! Count: ${multipleFaceCount}/${MULTIPLE_FACE_THRESHOLD}`);
    
    if (multipleFaceCount >= MULTIPLE_FACE_THRESHOLD) {
      result.violations.push({
        type: 'MULTIPLE_FACES',
        message: '👥 Multiple people detected! Only one person allowed.',
        severity: 'HIGH',
        timestamp: new Date()
      });
      multipleFaceCount = 0;
    }
  } else {
    multipleFaceCount = 0;
  }
  
  // Looking away
  if (result.lookingAway) {
    lookingAwayCount++;
    console.log(`👀 Looking away! Count: ${lookingAwayCount}/${LOOKING_AWAY_THRESHOLD}`);
    
    if (lookingAwayCount >= LOOKING_AWAY_THRESHOLD) {
      result.violations.push({
        type: 'LOOKING_AWAY',
        message: '👀 Please look at the screen! Focus on the exam.',
        severity: 'HIGH',
        timestamp: new Date()
      });
      lookingAwayCount = 0;
    }
  } else {
    lookingAwayCount = Math.max(0, lookingAwayCount - 1);
  }
  
  // Phone detected
  if (result.phoneDetected) {
    result.violations.push({
      type: 'PHONE_DETECTED',
      message: '📱 Phone/device detected! Please remove it.',
      severity: 'HIGH',
      timestamp: new Date()
    });
  }
}

// Reset counters (call when exam starts)
export function resetCounters(): void {
  faceMissCount = 0;
  multipleFaceCount = 0;
  lookingAwayCount = 0;
  console.log('🔄 AI Proctoring counters reset');
}

// Get model status
export function getModelStatus(): { loaded: boolean; loading: boolean; progress: number } {
  return {
    loaded: isModelLoaded,
    loading: isLoading,
    progress: loadingProgress
  };
}

// Cleanup
export function cleanup(): void {
  resetCounters();
  console.log('🧹 AI Proctoring cleanup complete');
}
