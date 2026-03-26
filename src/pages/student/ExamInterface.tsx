import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Exam, Question } from '../../types';
import { aiProctoringService } from '../../services/aiProctoringService';
import { saveExamResultToDatabase } from '../../services/examResultService';
import { useAuth } from '../../context/AuthContext';

interface ExamInterfaceProps {
  exam: Exam;
  onComplete: () => void;
}

interface ViolationRecord {
  type: string;
  message: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: Date;
}

type ExamPhase = 'instructions' | 'loading' | 'exam' | 'results';

const ExamInterface: React.FC<ExamInterfaceProps> = ({ exam, onComplete }) => {
  
  // Auth context
  const { user } = useAuth();

  // Phase management
  const [phase, setPhase] = useState<ExamPhase>('instructions');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  // Loading state
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState('');
  
  // Exam state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{[key: number]: number}>({});
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(exam.duration * 60);
  
  // Violation state
  const [violations, setViolations] = useState<ViolationRecord[]>([]);
  const [highViolationCount, setHighViolationCount] = useState(0);
  const [showViolationAlert, setShowViolationAlert] = useState(false);
  const [currentViolation, setCurrentViolation] = useState<ViolationRecord | null>(null);
  
  // AI Detection state
  const [faceDetected, setFaceDetected] = useState(true);
  const [phoneDetected, setPhoneDetected] = useState(false);
  const [faceCount, setFaceCount] = useState(1);
  const [aiModelLoaded, setAiModelLoaded] = useState(false);
  
  // Results state
  const [results, setResults] = useState({
    score: 0,
    correct: 0,
    wrong: 0,
    skipped: 0,
    passed: false
  });
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const loadingVideoRef = useRef<HTMLVideoElement>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const answersRef = useRef<{[key: number]: number}>({});
  const phaseRef = useRef<ExamPhase>('instructions');
  const streamRef = useRef<MediaStream | null>(null);
  const isSubmittedRef = useRef(false);
  const violationsRef = useRef<ViolationRecord[]>([]);
  
  // Keep refs in sync
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);
  
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    violationsRef.current = violations;
  }, [violations]);
  
  const questions: Question[] = exam.questions || [];

  // Handle violation from AI proctoring
  const handleAIViolation = useCallback((violation: { type: string; message: string; severity: 'HIGH' | 'MEDIUM' | 'LOW'; timestamp: Date }) => {
    if (phaseRef.current !== 'exam' || isSubmittedRef.current) return;
    
    console.log(`🚨 VIOLATION RECEIVED: ${violation.type} | ${violation.severity} | ${violation.message}`);
    
    const record: ViolationRecord = {
      type: violation.type,
      message: violation.message,
      severity: violation.severity,
      timestamp: violation.timestamp
    };
    
    setViolations(prev => [...prev, record]);
    setCurrentViolation(record);
    setShowViolationAlert(true);
    
    // Play beep
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
      console.log('Audio not available');
    }
    
    if (violation.severity === 'HIGH') {
      setHighViolationCount(prev => {
        const newCount = prev + 1;
        console.log(`⚠️ HIGH Violation Count: ${newCount}/5`);
        if (newCount >= 5) {
          console.log('🚫 AUTO-SUBMITTING DUE TO 5 VIOLATIONS!');
          setTimeout(() => submitExam(true), 1000);
        }
        return newCount;
      });
    }
    
    setTimeout(() => setShowViolationAlert(false), 3000);
  }, []);

  // Add browser violation
  const addBrowserViolation = useCallback((type: string, message: string, severity: 'HIGH' | 'MEDIUM' | 'LOW') => {
    if (phaseRef.current !== 'exam' || isSubmittedRef.current) return;
    
    handleAIViolation({
      type,
      message,
      severity,
      timestamp: new Date()
    });
  }, [handleAIViolation]);

  // Setup browser monitoring
  const setupBrowserMonitoring = useCallback(() => {
    console.log('🖥️ Setting up browser monitoring...');
    
    // Tab switch detection
    const handleVisibility = () => {
      if (document.hidden && phaseRef.current === 'exam' && !isSubmittedRef.current) {
        console.log('👁️ TAB SWITCH DETECTED!');
        addBrowserViolation('TAB_SWITCH', '🔄 Tab switch detected! Stay on this tab.', 'HIGH');
      }
    };
    
    // Fullscreen exit detection
    const handleFullscreen = () => {
      if (!document.fullscreenElement && phaseRef.current === 'exam' && !isSubmittedRef.current) {
        console.log('📺 FULLSCREEN EXIT DETECTED!');
        addBrowserViolation('FULLSCREEN_EXIT', '📺 Fullscreen exit detected! Stay in fullscreen.', 'HIGH');
        
        // Try to re-enter fullscreen
        setTimeout(() => {
          if (phaseRef.current === 'exam' && !isSubmittedRef.current) {
            document.documentElement.requestFullscreen?.().catch(() => {});
          }
        }, 1000);
      }
    };
    
    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phaseRef.current !== 'exam' || isSubmittedRef.current) return;
      
      // Block F12, DevTools
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C'))) {
        e.preventDefault();
        addBrowserViolation('DEVTOOLS', '🔧 Developer tools blocked!', 'HIGH');
        return;
      }
      
      // Block copy/paste
      if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'x')) {
        e.preventDefault();
        console.log('📋 Copy/paste blocked');
      }
      
      // Block screenshot
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        addBrowserViolation('SCREENSHOT', '📸 Screenshot blocked!', 'HIGH');
      }
    };
    
    // Right-click
    const handleContextMenu = (e: Event) => {
      if (phaseRef.current === 'exam' && !isSubmittedRef.current) {
        e.preventDefault();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibility);
    document.addEventListener('fullscreenchange', handleFullscreen);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    
    console.log('✅ Browser monitoring active!');
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('fullscreenchange', handleFullscreen);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [addBrowserViolation]);

  // Start exam
  const startExam = async () => {
    // ✅ FIX: Request fullscreen HERE — inside direct user click (user gesture required by browsers)
    try {
      await document.documentElement.requestFullscreen();
      console.log('✅ Fullscreen activated on user gesture!');
    } catch (e) {
      console.log('⚠️ Fullscreen not available or denied:', e);
    }

    setPhase('loading');
    setLoadingProgress(0);
    setLoadingStatus('🔄 Initializing...');
    
    try {
      // Step 1: Start camera (0-30%)
      console.log('📷📷📷 STEP 1: Starting Camera 📷📷📷');
      setLoadingStatus('📷 Requesting camera access...');
      setLoadingProgress(10);
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: false
        });
        streamRef.current = stream;
        
        setLoadingProgress(20);
        setLoadingStatus('📷 Camera connected!');
        console.log('✅ Camera stream obtained!');
        
        // Attach to loading video
        if (loadingVideoRef.current) {
          loadingVideoRef.current.srcObject = stream;
          await loadingVideoRef.current.play();
          console.log('✅ Loading video playing!');
        }
        
        setLoadingProgress(30);
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (camError) {
        console.error('❌ Camera error:', camError);
        alert('Camera access is required! Please allow camera and try again.');
        setPhase('instructions');
        return;
      }
      
      // Step 2: Load AI Model (30-70%)
      console.log('🤖🤖🤖 STEP 2: Loading AI Model 🤖🤖🤖');
      setLoadingStatus('🤖 Loading AI Detection Model...');
      setLoadingProgress(35);
      
      const aiLoaded = await aiProctoringService.loadModels((progress, status) => {
        const adjustedProgress = 35 + (progress * 0.35);
        setLoadingProgress(Math.round(adjustedProgress));
        setLoadingStatus(status);
      });
      
      setAiModelLoaded(aiLoaded);
      setLoadingProgress(70);
      setLoadingStatus(aiLoaded ? '✅ AI Model Ready!' : '⚠️ Using fallback detection');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 3: Initialize AI Proctoring (70-85%)
      console.log('🔍🔍🔍 STEP 3: Initializing AI 🔍🔍🔍');
      setLoadingStatus('🔍 Initializing AI proctoring...');
      setLoadingProgress(75);
      
      // Set video element for AI
      if (loadingVideoRef.current) {
        aiProctoringService.setVideoElement(loadingVideoRef.current);
      }
      
      // Set violation callback
      aiProctoringService.setViolationCallback(handleAIViolation);
      
      setLoadingProgress(85);
      setLoadingStatus('✅ AI Proctoring ready!');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 4: Fullscreen already enabled at start (85-95%)
      console.log('🖥️🖥️🖥️ STEP 4: Fullscreen check 🖥️🖥️🖥️');
      setLoadingStatus('🖥️ Fullscreen mode active...');
      setLoadingProgress(90);
      
      // Re-request fullscreen in case it was dismissed
      if (!document.fullscreenElement) {
        try {
          await document.documentElement.requestFullscreen();
          console.log('✅ Fullscreen re-activated!');
        } catch (e) {
          console.log('⚠️ Fullscreen re-request failed:', e);
        }
      }
      
      setLoadingProgress(95);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Step 5: Start everything (95-100%)
      console.log('⏱️⏱️⏱️ STEP 5: Final Setup ⏱️⏱️⏱️');
      setLoadingStatus('⏱️ Starting exam...');
      
      // Setup browser monitoring
      setupBrowserMonitoring();
      
      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            submitExam(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      // Start AI detection
      aiProctoringService.startDetection();
      
      setLoadingProgress(100);
      setLoadingStatus('✅ All systems ready!');
      console.log('✅✅✅ ALL SYSTEMS READY! ✅✅✅');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // START EXAM
      console.log('🎯🎯🎯 EXAM STARTING NOW! 🎯🎯🎯');
      setPhase('exam');
      
    } catch (error) {
      console.error('❌ Exam start error:', error);
      alert('Failed to start exam. Please try again.');
      setPhase('instructions');
    }
  };

  // Submit exam
  const submitExam = useCallback(async (terminated: boolean = false) => {
    if (isSubmittedRef.current) return;
    isSubmittedRef.current = true;
    
    console.log(`📊 Submitting exam... (Terminated: ${terminated})`);
    
    // Stop AI detection
    aiProctoringService.stopDetection();
    aiProctoringService.cleanup();
    
    // Stop timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    
    // Stop camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Exit fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
    
    // Calculate results
    const currentAnswers = answersRef.current;
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - exam.duration * 60 * 1000);
    let correct = 0, wrong = 0, skipped = 0;
    
    questions.forEach((q, idx) => {
      const userAnswer = currentAnswers[idx];
      if (userAnswer === undefined || userAnswer === null) {
        skipped++;
      } else {
        if (userAnswer === q.correctAnswer) {
          correct++;
        } else {
          wrong++;
        }
      }
    });
    
    const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
    const passed = score >= 40;
    
    console.log(`📊 Results: ${correct} correct, ${wrong} wrong, ${skipped} skipped, ${score}% ${passed ? 'PASSED' : 'FAILED'}`);
    
    // ✅ FIX: Save result to database
    try {
      console.log('💾 Saving exam result to database...');
      const currentViolations = violationsRef.current;
      const saveResult = await saveExamResultToDatabase({
        examId: exam.id,
        examTitle: exam.title,
        subject: exam.subject || '',
        userId: user?.id || 'guest_' + Date.now(),
        userName: user?.name || 'Guest User',
        userEmail: user?.email || '',
        userRollNumber: (user as { rollNumber?: string })?.rollNumber || '',
        startTime,
        endTime,
        duration: exam.duration,
        totalQuestions: questions.length,
        correctAnswers: correct,
        wrongAnswers: wrong,
        skippedAnswers: skipped,
        score,
        passed,
        violationCount: currentViolations.length,
        isTerminated: terminated,
        violations: currentViolations.map(v => ({
          type: v.type,
          message: v.message,
          severity: v.severity,
          timestamp: v.timestamp.toISOString()
        })),
        answers: questions.map((q, idx) => ({
          questionId: q.id,
          questionText: q.text,
          optionA: q.options[0] || '',
          optionB: q.options[1] || '',
          optionC: q.options[2] || '',
          optionD: q.options[3] || '',
          correctAnswer: q.correctAnswer,
          selectedAnswer: currentAnswers[idx] !== undefined ? currentAnswers[idx] : null,
          isCorrect: currentAnswers[idx] === q.correctAnswer
        }))
      });
      
      if (saveResult.success) {
        console.log('✅ Result saved! ID:', saveResult.attemptId);
      } else {
        console.error('⚠️ Result save failed:', saveResult.error);
      }
    } catch (saveError) {
      console.error('❌ Error saving result:', saveError);
    }

    // ✅ FIX: Send result email to student
    if (user?.email) {
      try {
        console.log('📧 Sending result email to:', user.email);
        const { sendResultEmail } = await import('../../services/emailService');
        const grade = score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B+' : score >= 60 ? 'B' : score >= 50 ? 'C' : score >= 40 ? 'D' : 'F';
        await sendResultEmail(
          user.email,
          user.name || 'Student',
          exam.title,
          correct,
          questions.length,
          score,
          grade
        );
        console.log('✅ Result email sent!');
      } catch (emailError) {
        console.error('⚠️ Email send failed:', emailError);
      }
    }
    
    // Save answers in sessionStorage so ResultsPage can show review
    const reviewData = {
      examTitle: exam.title,
      subject: exam.subject,
      score,
      correct,
      wrong,
      skipped,
      passed,
      totalQuestions: questions.length,
      questions: questions.map((q, idx) => ({
        id: q.id,
        text: q.text,
        options: q.options,
        correctAnswer: q.correctAnswer,
        selectedAnswer: answersRef.current[idx] !== undefined ? answersRef.current[idx] : null,
        isCorrect: answersRef.current[idx] === q.correctAnswer
      }))
    };
    sessionStorage.setItem('lastExamReview', JSON.stringify(reviewData));

    setResults({ score, correct, wrong, skipped, passed });
    setPhase('results');
    
  }, [questions, exam, user]);

  // Timer display
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Get grade
  const getGrade = (score: number) => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B+';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C';
    if (score >= 40) return 'D';
    return 'F';
  };

  // Current question
  const question = questions[currentQuestion];

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      aiProctoringService.stopDetection();
      aiProctoringService.cleanup();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  // Attach stream to exam video when phase changes to 'exam'
  useEffect(() => {
    if (phase === 'exam' && videoRef.current && streamRef.current) {
      console.log('📺 Attaching stream to exam video...');
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().then(() => {
        console.log('✅ Exam video playing!');
        // Also set for AI proctoring
        aiProctoringService.setVideoElement(videoRef.current!);
      }).catch(err => {
        console.error('❌ Exam video error:', err);
      });
    }
  }, [phase]);

  // Set up detection callback to receive real-time updates from AI service
  useEffect(() => {
    if (phase !== 'exam') return;
    
    // Set up detection result callback
    const handleDetectionResult = (result: {
      faceDetected: boolean;
      personCount: number;
      phoneDetected: boolean;
    }) => {
      console.log('📊 Detection Update:', result);
      setFaceDetected(result.faceDetected);
      setFaceCount(result.personCount);
      setPhoneDetected(result.phoneDetected);
    };
    
    // Store callback in AI service
    aiProctoringService.setDetectionCallback(handleDetectionResult);
    
    return () => {
      aiProctoringService.setDetectionCallback(null);
    };
  }, [phase]);

  // RENDER: Instructions
  if (phase === 'instructions') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-2xl w-full text-white">
          <h1 className="text-3xl font-bold text-center mb-6">📝 {exam.title}</h1>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-500/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{questions.length}</div>
              <div className="text-sm opacity-75">Questions</div>
            </div>
            <div className="bg-green-500/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{exam.duration}</div>
              <div className="text-sm opacity-75">Minutes</div>
            </div>
            <div className="bg-yellow-500/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{exam.totalMarks || questions.length}</div>
              <div className="text-sm opacity-75">Marks</div>
            </div>
            <div className="bg-purple-500/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">40%</div>
              <div className="text-sm opacity-75">Passing</div>
            </div>
          </div>

          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-lg mb-3">🔒 AI Anti-Cheating Active:</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span> 📷 Camera monitoring
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span> 👤 Face detection (COCO-SSD)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span> 👥 Multiple face detection
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span> 📱 Phone/device detection
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span> 🖥️ Tab switch detection
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span> 📺 Fullscreen monitoring
              </li>
            </ul>
            <p className="text-yellow-300 mt-3 text-sm">
              ⚠️ 5 violations will automatically terminate your exam!
            </p>
          </div>

          <label className="flex items-center gap-3 mb-6 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="w-5 h-5 rounded"
            />
            <span>I understand and agree to the exam rules</span>
          </label>

          <button
            onClick={startExam}
            disabled={!agreedToTerms}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
              agreedToTerms
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            🚀 Start Exam
          </button>
        </div>
      </div>
    );
  }

  // RENDER: Loading
  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-lg w-full text-white text-center">
          <div className="text-6xl mb-6">🤖</div>
          <h2 className="text-2xl font-bold mb-4">AI Proctoring System</h2>
          <p className="text-gray-300 mb-6">{loadingStatus}</p>
          
          <div className="w-full bg-gray-700 rounded-full h-4 mb-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-300 rounded-full"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          <div className="text-2xl font-bold mb-6">{loadingProgress}%</div>
          
          {/* Loading checklist */}
          <div className="text-left bg-white/5 rounded-lg p-4 mb-4">
            <div className="space-y-2 text-sm">
              <div className={`flex items-center gap-2 ${loadingProgress >= 30 ? 'text-green-400' : 'text-gray-400'}`}>
                {loadingProgress >= 30 ? '✓' : '○'} Camera Access
              </div>
              <div className={`flex items-center gap-2 ${loadingProgress >= 70 ? 'text-green-400' : 'text-gray-400'}`}>
                {loadingProgress >= 70 ? '✓' : '○'} AI Detection Model (COCO-SSD)
              </div>
              <div className={`flex items-center gap-2 ${loadingProgress >= 85 ? 'text-green-400' : 'text-gray-400'}`}>
                {loadingProgress >= 85 ? '✓' : '○'} AI Proctoring Initialize
              </div>
              <div className={`flex items-center gap-2 ${loadingProgress >= 95 ? 'text-green-400' : 'text-gray-400'}`}>
                {loadingProgress >= 95 ? '✓' : '○'} Fullscreen Mode
              </div>
            </div>
          </div>
          
          {/* Camera Preview */}
          <div className="relative w-48 h-36 mx-auto rounded-xl overflow-hidden bg-black mb-4">
            <video
              ref={loadingVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            {loadingProgress >= 30 && (
              <div className="absolute bottom-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                LIVE
              </div>
            )}
          </div>
          
          <p className="text-sm text-gray-400">
            ⚠️ AI model must fully load before exam starts
          </p>
        </div>
      </div>
    );
  }

  // RENDER: Results
  if (phase === 'results') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-2xl w-full text-white">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">{results.passed ? '🎉' : '😔'}</div>
            <h2 className="text-3xl font-bold">
              {results.passed ? 'Congratulations!' : 'Better luck next time!'}
            </h2>
            {highViolationCount >= 5 && (
              <p className="text-red-400 mt-2">⚠️ Exam was terminated due to violations</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className={`rounded-xl p-6 text-center ${results.passed ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              <div className="text-5xl font-bold">{results.score}%</div>
              <div className="text-lg">Score</div>
            </div>
            <div className="bg-purple-500/20 rounded-xl p-6 text-center">
              <div className="text-5xl font-bold">{getGrade(results.score)}</div>
              <div className="text-lg">Grade</div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{questions.length}</div>
              <div className="text-xs opacity-75">Total</div>
            </div>
            <div className="bg-green-500/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-400">{results.correct}</div>
              <div className="text-xs opacity-75">Correct</div>
            </div>
            <div className="bg-red-500/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-400">{results.wrong}</div>
              <div className="text-xs opacity-75">Wrong</div>
            </div>
            <div className="bg-gray-500/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-gray-400">{results.skipped}</div>
              <div className="text-xs opacity-75">Skipped</div>
            </div>
          </div>

          {violations.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
              <h3 className="font-bold mb-2">⚠️ Violations ({violations.length})</h3>
              <div className="max-h-32 overflow-y-auto space-y-1 text-sm">
                {violations.map((v, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{v.message}</span>
                    <span className="text-gray-400">
                      {v.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                // Show inline question review
                const reviewEl = document.getElementById('exam-review-section');
                if (reviewEl) {
                  reviewEl.scrollIntoView({ behavior: 'smooth' });
                  reviewEl.classList.remove('hidden');
                }
              }}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl font-bold hover:from-green-600 hover:to-teal-700 transition-all"
            >
              📋 Review Questions & Answers
            </button>
            <button
              onClick={onComplete}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-bold hover:from-blue-600 hover:to-purple-700 transition-all"
            >
              ← Back to Dashboard
            </button>
          </div>

          {/* ✅ NEW: Question Review Section */}
          <div id="exam-review-section" className="hidden mt-4">
            <h3 className="font-bold text-lg mb-4">📋 Question Review</h3>
            {questions.map((q, idx) => {
              const userAns = answers[idx];
              const isCorrect = userAns === q.correctAnswer;
              const isSkipped = userAns === undefined || userAns === null;
              return (
                <div key={idx} className={`mb-4 p-4 rounded-xl border-2 ${
                  isSkipped ? 'border-gray-500/50 bg-gray-500/10' :
                  isCorrect ? 'border-green-500/50 bg-green-500/10' :
                  'border-red-500/50 bg-red-500/10'
                }`}>
                  <div className="flex items-start gap-3 mb-3">
                    <span className={`text-xl flex-shrink-0 ${isSkipped ? '⬜' : isCorrect ? '✅' : '❌'}`}>
                      {isSkipped ? '⬜' : isCorrect ? '✅' : '❌'}
                    </span>
                    <p className="font-medium">Q{idx + 1}. {q.text}</p>
                  </div>
                  <div className="space-y-2 ml-8">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className={`px-3 py-2 rounded-lg text-sm ${
                        oi === q.correctAnswer ? 'bg-green-500/30 text-green-300 font-bold' :
                        oi === userAns && !isCorrect ? 'bg-red-500/30 text-red-300 line-through' :
                        'bg-white/5 text-gray-300'
                      }`}>
                        {String.fromCharCode(65 + oi)}. {opt}
                        {oi === q.correctAnswer && ' ✓ Correct'}
                        {oi === userAns && !isCorrect && ' ✗ Your Answer'}
                      </div>
                    ))}
                    {isSkipped && <p className="text-gray-400 text-sm italic">— Not attempted</p>}
                  </div>
                </div>
              );
            })}
            <button
              onClick={() => {
                // Download as text
                const reviewData = JSON.parse(sessionStorage.getItem('lastExamReview') || '{}');
                let text = `EXAM REVIEW: ${reviewData.examTitle || exam.title}\n`;
                text += `Score: ${results.score}% | Correct: ${results.correct} | Wrong: ${results.wrong} | Skipped: ${results.skipped}\n\n`;
                questions.forEach((q, idx) => {
                  const userAns = answers[idx];
                  const isCorrect = userAns === q.correctAnswer;
                  const status = userAns === undefined ? 'SKIPPED' : isCorrect ? 'CORRECT' : 'WRONG';
                  text += `Q${idx + 1}. [${status}] ${q.text}\n`;
                  q.options.forEach((opt, oi) => {
                    const marker = oi === q.correctAnswer ? '✓' : oi === userAns ? '✗' : ' ';
                    text += `  ${marker} ${String.fromCharCode(65 + oi)}. ${opt}\n`;
                  });
                  text += '\n';
                });
                const blob = new Blob([text], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${exam.title}_Review.txt`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="w-full py-3 mt-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl font-bold hover:from-yellow-600 hover:to-orange-600 transition-all"
            >
              ⬇️ Download Review
            </button>
          </div>
        </div>
      </div>
    );
  }

  // RENDER: Exam
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Violation Alert */}
      {showViolationAlert && currentViolation && (
        <div className="fixed inset-0 bg-red-900/90 z-50 flex items-center justify-center animate-pulse">
          <div className="bg-red-800 rounded-2xl p-8 text-center max-w-md mx-4">
            <div className="text-6xl mb-4">🚨</div>
            <h2 className="text-3xl font-bold mb-2">VIOLATION!</h2>
            <p className="text-xl mb-4">{currentViolation.message}</p>
            <div className="text-4xl font-bold text-yellow-300">
              {highViolationCount}/5
            </div>
            <p className="text-sm mt-2 text-red-300">
              {5 - highViolationCount} more violations will terminate your exam
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-800/80 backdrop-blur border-b border-slate-700 p-3 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg">{exam.title}</h1>
            <p className="text-sm text-gray-400">{exam.subject}</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Timer */}
            <div className={`px-4 py-2 rounded-lg font-mono text-xl ${
              timeLeft < 300 ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-blue-500/20 text-blue-400'
            }`}>
              ⏱️ {formatTime(timeLeft)}
            </div>
            
            {/* Violations */}
            <div className={`px-4 py-2 rounded-lg font-bold ${
              highViolationCount > 0 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
            }`}>
              ⚠️ {highViolationCount}/5
            </div>
            
            {/* Submit */}
            <button
              onClick={() => submitExam(false)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-bold transition-colors"
            >
              Submit ✓
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 flex gap-4">
        {/* Question Area */}
        <div className="flex-1">
          {question ? (
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
              {/* Question Header */}
              <div className="flex justify-between items-center mb-4">
                <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm">
                  Question {currentQuestion + 1} of {questions.length}
                </span>
                <button
                  onClick={() => {
                    setMarkedForReview(prev => {
                      const newSet = new Set(prev);
                      if (newSet.has(currentQuestion)) {
                        newSet.delete(currentQuestion);
                      } else {
                        newSet.add(currentQuestion);
                      }
                      return newSet;
                    });
                  }}
                  className={`px-3 py-1 rounded-full text-sm ${
                    markedForReview.has(currentQuestion)
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}
                >
                  {markedForReview.has(currentQuestion) ? '📌 Marked' : '📌 Mark'}
                </button>
              </div>

              {/* Question Text */}
              <h2 className="text-xl mb-6">{question.text}</h2>

              {/* Options */}
              <div className="space-y-3">
                {question.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      console.log(`✏️ Selected option ${idx} for Q${currentQuestion + 1}`);
                      setAnswers(prev => {
                        const newAnswers = { ...prev, [currentQuestion]: idx };
                        answersRef.current = newAnswers;
                        return newAnswers;
                      });
                    }}
                    className={`w-full p-4 rounded-xl text-left transition-all border-2 ${
                      answers[currentQuestion] === idx
                        ? 'bg-blue-500/30 border-blue-500 text-white'
                        : 'bg-slate-700/50 border-slate-600 hover:border-slate-500 text-gray-200'
                    }`}
                  >
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full mr-3 ${
                      answers[currentQuestion] === idx ? 'bg-blue-500' : 'bg-slate-600'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    {option}
                  </button>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestion === 0}
                  className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ← Previous
                </button>
                <button
                  onClick={() => setCurrentQuestion(prev => Math.min(questions.length - 1, prev + 1))}
                  disabled={currentQuestion === questions.length - 1}
                  className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700 text-center">
              <p className="text-gray-400">No questions available</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-72 space-y-4">
          {/* Camera Preview */}
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold">📷 AI Proctoring</span>
              <span className={`text-xs px-2 py-1 rounded ${
                aiModelLoaded ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                {aiModelLoaded ? '✓ Active' : '⏳ Loading'}
              </span>
            </div>
            
            <div className="relative rounded-lg overflow-hidden bg-black aspect-video mb-3">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              <div className="absolute bottom-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                LIVE
              </div>
            </div>
            
            {/* Detection Status */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span>👤 Face</span>
                <span className={faceDetected ? 'text-green-400' : 'text-red-400'}>
                  {faceDetected ? '✓ Detected' : '✗ Missing'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>👥 People</span>
                <span className={faceCount <= 1 ? 'text-green-400' : 'text-red-400'}>
                  {faceCount <= 1 ? '✓ Only You' : `✗ ${faceCount} Detected`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>📱 Phone</span>
                <span className={!phoneDetected ? 'text-green-400' : 'text-red-400'}>
                  {!phoneDetected ? '✓ Clear' : '✗ Detected'}
                </span>
              </div>
            </div>
          </div>

          {/* Question Navigator */}
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-slate-700">
            <h3 className="font-bold mb-3">Questions</h3>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentQuestion(idx)}
                  className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                    currentQuestion === idx
                      ? 'bg-blue-500 text-white ring-2 ring-blue-300'
                      : answers[idx] !== undefined
                        ? 'bg-green-500/30 text-green-400'
                        : markedForReview.has(idx)
                          ? 'bg-yellow-500/30 text-yellow-400'
                          : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            
            <div className="flex gap-4 mt-4 text-xs">
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-green-500/30"></span>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-yellow-500/30"></span>
                <span>Marked</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-slate-700">
            <h3 className="font-bold mb-3">Progress</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Answered</span>
                <span className="text-green-400">{Object.keys(answers).length}</span>
              </div>
              <div className="flex justify-between">
                <span>Marked</span>
                <span className="text-yellow-400">{markedForReview.size}</span>
              </div>
              <div className="flex justify-between">
                <span>Remaining</span>
                <span className="text-gray-400">{questions.length - Object.keys(answers).length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamInterface;
