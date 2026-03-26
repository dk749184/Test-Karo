import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useExam } from '../../context/ExamContext';
import { useAuth } from '../../context/AuthContext';
import { proctoringService, Violation, ProctoringStatus } from '../../services/simpleProctoringService';
import { supabase } from '../../lib/supabase';
import { Exam } from '../../types';

interface ProcessedQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  subject?: string;
  topic?: string;
  difficulty?: string;
  marks?: number;
}

interface ProctoredExamInterfaceProps {
  exam: Exam;
  onComplete: () => void;
  onExit: () => void;
}

interface QuestionTimer {
  questionId: string;
  timeLeft: number;
  startTime: number;
}

export const ProctoredExamInterface: React.FC<ProctoredExamInterfaceProps> = ({
  exam,
  onComplete,
  onExit
}) => {
  const { user } = useAuth();
  const { submitExam } = useExam();
  
  // States
  const [stage, setStage] = useState<'instructions' | 'setup' | 'exam' | 'submitting' | 'completed'>('instructions');
  const [questions, setQuestions] = useState<ProcessedQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: number }>({});
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(exam.duration * 60);
  const [questionTimer, setQuestionTimer] = useState<QuestionTimer | null>(null);
  const [proctoringStatus, setProctoringStatus] = useState<ProctoringStatus | null>(null);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [showViolationAlert, setShowViolationAlert] = useState(false);
  const [lastViolation, setLastViolation] = useState<Violation | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [showQuestionNav, setShowQuestionNav] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Exam settings
  const [examSettings] = useState({
    oneQuestionAtATime: true,
    disableBacktracking: false,
    randomizeQuestions: true,
    shuffleOptions: true,
    timePerQuestion: 0,
    maxViolations: 5,
  });
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Shuffle array helper
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };
  
  // Initialize questions
  useEffect(() => {
    if (exam.questions && exam.questions.length > 0) {
      let processedQuestions: ProcessedQuestion[] = exam.questions.map(q => ({
        id: q.id,
        text: q.text,
        options: [...q.options],
        correctAnswer: q.correctAnswer,
        subject: q.subject,
        topic: q.topic,
        difficulty: q.difficulty,
        marks: q.marks,
      }));
      
      // Randomize question order
      if (examSettings.randomizeQuestions) {
        processedQuestions = shuffleArray(processedQuestions);
      }
      
      // Shuffle options for each question
      if (examSettings.shuffleOptions) {
        processedQuestions = processedQuestions.map(q => {
          const indexedOptions = q.options.map((opt, idx) => ({ opt, idx }));
          const shuffledOptions = shuffleArray(indexedOptions);
          
          // Find new position of correct answer
          const newCorrectIndex = shuffledOptions.findIndex(o => o.idx === q.correctAnswer);
          
          return {
            ...q,
            options: shuffledOptions.map(o => o.opt),
            correctAnswer: newCorrectIndex,
          };
        });
      }
      
      setQuestions(processedQuestions);
    }
  }, [exam.questions, examSettings.randomizeQuestions, examSettings.shuffleOptions]);
  
  // Setup proctoring
  const setupProctoring = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    try {
      const success = await proctoringService.initialize(
        videoRef.current,
        canvasRef.current,
        { maxViolations: examSettings.maxViolations }
      );
      
      if (success) {
        setCameraReady(true);
        
        proctoringService.onViolation((violation) => {
          setViolations(prev => [...prev, violation]);
          setLastViolation(violation);
          setShowViolationAlert(true);
          setTimeout(() => setShowViolationAlert(false), 5000);
        });
        
        proctoringService.onStatusChange((status) => {
          setProctoringStatus(status);
        });
        
        proctoringService.onAutoSubmit(() => {
          handleAutoSubmit();
        });
      }
    } catch (error) {
      console.error('Proctoring setup failed:', error);
    }
  };
  
  // Start exam
  const startExam = async () => {
    await proctoringService.requestFullscreen();
    proctoringService.startMonitoring();
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    if (examSettings.timePerQuestion > 0) {
      startQuestionTimer();
    }
    
    setStage('exam');
  };
  
  // Start question timer
  const startQuestionTimer = () => {
    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current);
    }
    
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;
    
    setQuestionTimer({
      questionId: currentQuestion.id,
      timeLeft: examSettings.timePerQuestion,
      startTime: Date.now(),
    });
    
    questionTimerRef.current = setInterval(() => {
      setQuestionTimer(prev => {
        if (!prev || prev.timeLeft <= 1) {
          handleNextQuestion(true);
          return null;
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);
  };
  
  // Handle answer selection
  const handleAnswerSelect = (answerIndex: number) => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;
    
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answerIndex,
    }));
  };
  
  // Handle next question
  const handleNextQuestion = (forced = false) => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      
      if (examSettings.timePerQuestion > 0) {
        startQuestionTimer();
      }
    } else if (forced) {
      handleAutoSubmit();
    }
  };
  
  // Handle previous question
  const handlePrevQuestion = () => {
    if (examSettings.disableBacktracking) {
      proctoringService.addViolation('backtrack_attempt', 'Attempted to go back to previous question', 'low');
      return;
    }
    
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };
  
  // Toggle mark for review
  const toggleMarkForReview = () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;
    
    setMarkedForReview(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestion.id)) {
        newSet.delete(currentQuestion.id);
      } else {
        newSet.add(currentQuestion.id);
      }
      return newSet;
    });
  };
  
  // Calculate results
  const calculateResults = useCallback(() => {
    let correct = 0;
    let wrong = 0;
    let unanswered = 0;
    
    questions.forEach(q => {
      const answer = answers[q.id];
      if (answer === undefined || answer === null) {
        unanswered++;
      } else if (answer === q.correctAnswer) {
        correct++;
      } else {
        wrong++;
      }
    });
    
    const score = questions.length > 0 ? (correct / questions.length) * 100 : 0;
    
    return { correct, wrong, unanswered, score };
  }, [questions, answers]);
  
  // Handle manual submit
  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    const answered = Object.keys(answers).length;
    const total = questions.length;
    
    const confirmed = window.confirm(
      `Are you sure you want to submit?\n\nAnswered: ${answered}/${total}\nUnanswered: ${total - answered}`
    );
    
    if (confirmed) {
      await submitExamResults(false);
    }
  };
  
  // Handle auto submit
  const handleAutoSubmit = async () => {
    if (isSubmitting) return;
    await submitExamResults(true);
  };
  
  // Submit exam results
  const submitExamResults = async (isAuto: boolean) => {
    setIsSubmitting(true);
    setStage('submitting');
    
    if (timerRef.current) clearInterval(timerRef.current);
    if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    
    proctoringService.stop();
    
    const results = calculateResults();
    
    try {
      const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
      
      if (user?.id && exam.id && isUUID(exam.id) && isUUID(user.id)) {
        const { data: attemptData, error: attemptError } = await supabase
          .from('exam_attempts')
          .insert({
            exam_id: exam.id,
            user_id: user.id,
            start_time: new Date(Date.now() - (exam.duration * 60 - timeLeft) * 1000).toISOString(),
            end_time: new Date().toISOString(),
            score: results.score,
            total_questions: questions.length,
            correct_answers: results.correct,
            wrong_answers: results.wrong,
            unanswered: results.unanswered,
            violation_count: violations.length,
            is_terminated: isAuto && proctoringService.shouldAutoSubmit(),
            status: isAuto && proctoringService.shouldAutoSubmit() ? 'terminated' : 'completed',
          })
          .select()
          .single();
        
        if (!attemptError && attemptData) {
          if (violations.length > 0) {
            const violationLogs = violations.map(v => ({
              attempt_id: attemptData.id,
              violation_type: v.type,
              violation_message: v.message,
            }));
            
            await supabase.from('violation_logs').insert(violationLogs);
          }
          
          const answersToSave = questions.map(q => ({
            attempt_id: attemptData.id,
            question_id: q.id,
            selected_answer: answers[q.id] !== undefined ? ['A', 'B', 'C', 'D'][answers[q.id]] : null,
            is_correct: answers[q.id] === q.correctAnswer,
          })).filter(a => isUUID(a.question_id));
          
          if (answersToSave.length > 0) {
            await supabase.from('student_answers').insert(answersToSave);
          }
        }
      }
      
      await submitExam(isAuto);
      
    } catch (error) {
      console.error('Error saving results:', error);
    }
    
    setStage('completed');
  };
  
  // Format time
  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (questionTimerRef.current) clearInterval(questionTimerRef.current);
      proctoringService.stop();
    };
  }, []);
  
  // Current question
  const currentQuestion = questions[currentQuestionIndex];
  
  // Render instructions stage
  if (stage === 'instructions') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">📋 Exam Instructions</h1>
            <p className="text-gray-600">{exam.title}</p>
          </div>
          
          <div className="space-y-6">
            <div className="bg-blue-50 rounded-xl p-6">
              <h2 className="font-semibold text-blue-800 mb-4">📝 Exam Details</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{questions.length || exam.questions?.length || 0}</p>
                  <p className="text-sm text-gray-600">Questions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{exam.duration}</p>
                  <p className="text-sm text-gray-600">Minutes</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{exam.totalMarks}</p>
                  <p className="text-sm text-gray-600">Total Marks</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{exam.passingMarks}%</p>
                  <p className="text-sm text-gray-600">Passing</p>
                </div>
              </div>
            </div>
            
            <div className="bg-red-50 rounded-xl p-6">
              <h2 className="font-semibold text-red-800 mb-4">🛡️ AI Proctoring Active</h2>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📷</span>
                  <span>Camera monitoring throughout exam</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎤</span>
                  <span>Background noise detection</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">👁️</span>
                  <span>Face & eye tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">📱</span>
                  <span>Phone/device detection</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🖥️</span>
                  <span>Tab switch detection</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">⌨️</span>
                  <span>Keyboard shortcut blocking</span>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 rounded-xl p-6">
              <h2 className="font-semibold text-yellow-800 mb-4">⚠️ Prohibited Actions</h2>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2">❌ Switching tabs or windows</li>
                <li className="flex items-center gap-2">❌ Right-clicking or copy-paste</li>
                <li className="flex items-center gap-2">❌ Using keyboard shortcuts (Alt+Tab, Ctrl+C, F12)</li>
                <li className="flex items-center gap-2">❌ Multiple people in camera view</li>
                <li className="flex items-center gap-2">❌ Looking away from screen repeatedly</li>
                <li className="flex items-center gap-2">❌ Using mobile phone or other devices</li>
                <li className="flex items-center gap-2">❌ Exiting fullscreen mode</li>
              </ul>
            </div>
            
            <div className="bg-orange-100 border-l-4 border-orange-500 p-4">
              <p className="text-orange-800 font-medium">
                ⚠️ After {examSettings.maxViolations} violations, your exam will be automatically terminated!
              </p>
            </div>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="w-5 h-5 rounded text-blue-600"
              />
              <span className="text-gray-700">
                I have read and agree to follow all exam rules. I understand that any violation may result in exam termination.
              </span>
            </label>
          </div>
          
          <div className="flex gap-4 mt-8">
            <button
              onClick={onExit}
              className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium"
            >
              ← Back
            </button>
            <button
              onClick={() => setStage('setup')}
              disabled={!agreedToTerms}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
            >
              Continue to Setup →
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Render setup stage
  if (stage === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">📷 Camera & Microphone Setup</h1>
          
          <div className="relative bg-black rounded-xl overflow-hidden aspect-video mb-6">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {!cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-80">
                <div className="text-center text-white">
                  <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p>Click below to enable camera...</p>
                </div>
              </div>
            )}
            
            {cameraReady && (
              <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                Camera Ready
              </div>
            )}
          </div>
          
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-700">📷 Camera</span>
              <span className={`px-3 py-1 rounded-full text-sm ${cameraReady ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {cameraReady ? '✓ Working' : '✗ Not Ready'}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-700">🎤 Microphone</span>
              <span className={`px-3 py-1 rounded-full text-sm ${cameraReady ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {cameraReady ? '✓ Working' : '✗ Not Ready'}
              </span>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm">
              💡 Make sure your face is clearly visible in the camera and you are in a well-lit room.
              The exam will run in fullscreen mode.
            </p>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={() => setStage('instructions')}
              className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium"
            >
              ← Back
            </button>
            {!cameraReady ? (
              <button
                onClick={setupProctoring}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
              >
                📷 Enable Camera & Mic
              </button>
            ) : (
              <button
                onClick={startExam}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg"
              >
                🚀 Start Exam
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // Render exam stage
  if (stage === 'exam' && currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-100 relative select-none" onContextMenu={(e) => e.preventDefault()}>
        {/* Watermark */}
        <div className="fixed inset-0 pointer-events-none z-10 flex items-center justify-center opacity-10">
          <div className="text-4xl font-bold text-gray-500 transform rotate-[-30deg] text-center">
            <p>{user?.name || 'Student'}</p>
            <p className="text-2xl">{user?.rollNumber || ''}</p>
            <p className="text-lg">{new Date().toLocaleString()}</p>
          </div>
        </div>
        
        {/* Header */}
        <div className="bg-white shadow-md sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-bold text-gray-800">{exam.title}</h1>
                <p className="text-sm text-gray-500">{exam.subject}</p>
              </div>
              
              <div className={`px-6 py-2 rounded-full font-mono text-xl font-bold ${
                timeLeft <= 300 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-blue-100 text-blue-600'
              }`}>
                ⏱️ {formatTime(timeLeft)}
              </div>
              
              <div className="flex items-center gap-4">
                <div className={`px-4 py-2 rounded-full text-sm ${
                  violations.length >= examSettings.maxViolations - 2 
                    ? 'bg-red-100 text-red-600' 
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  ⚠️ {violations.length}/{examSettings.maxViolations} Violations
                </div>
                
                <div className="relative w-20 h-16 bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto p-4 flex gap-4">
          {/* Question Navigation Sidebar */}
          {(!examSettings.oneQuestionAtATime || showQuestionNav) && (
            <div className="w-64 bg-white rounded-xl shadow-lg p-4 h-fit sticky top-20">
              <h3 className="font-semibold text-gray-700 mb-4">Questions</h3>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, index) => (
                  <button
                    key={q.id}
                    onClick={() => !examSettings.disableBacktracking && setCurrentQuestionIndex(index)}
                    disabled={examSettings.disableBacktracking && index < currentQuestionIndex}
                    className={`w-10 h-10 rounded-lg font-medium text-sm transition-all ${
                      index === currentQuestionIndex
                        ? 'bg-blue-600 text-white'
                        : answers[q.id] !== undefined
                        ? 'bg-green-100 text-green-700 border-2 border-green-500'
                        : markedForReview.has(q.id)
                        ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-500'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    } ${examSettings.disableBacktracking && index < currentQuestionIndex ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-green-100 border-2 border-green-500 rounded"></span>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-yellow-100 border-2 border-yellow-500 rounded"></span>
                  <span>Marked for Review</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-gray-100 rounded"></span>
                  <span>Not Answered</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Main Question Area */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              {questionTimer && (
                <div className={`mb-4 p-3 rounded-lg text-center ${
                  questionTimer.timeLeft <= 10 ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-blue-700'
                }`}>
                  ⏱️ Time for this question: {questionTimer.timeLeft}s
                </div>
              )}
              
              <div className="flex items-center justify-between mb-6">
                <span className="text-sm text-gray-500">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <button
                  onClick={toggleMarkForReview}
                  className={`px-4 py-2 rounded-lg text-sm transition-all ${
                    markedForReview.has(currentQuestion.id)
                      ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-500'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {markedForReview.has(currentQuestion.id) ? '★ Marked' : '☆ Mark for Review'}
                </button>
              </div>
              
              <div className="mb-8">
                <h2 className="text-xl font-medium text-gray-800 leading-relaxed">
                  {currentQuestion.text}
                </h2>
              </div>
              
              <div className="space-y-4">
                {currentQuestion.options.map((option: string, index: number) => {
                  const isSelected = answers[currentQuestion.id] === index;
                  const optionKey = ['A', 'B', 'C', 'D'][index];
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      className={`w-full p-4 rounded-xl text-left transition-all flex items-center gap-4 ${
                        isSelected
                          ? 'bg-blue-50 border-2 border-blue-500 text-blue-700'
                          : 'bg-gray-50 border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      <span className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                        isSelected ? 'bg-blue-500 text-white' : 'bg-white border-2 border-gray-300'
                      }`}>
                        {optionKey}
                      </span>
                      <span className="flex-1">{option}</span>
                      {isSelected && <span className="text-blue-500">✓</span>}
                    </button>
                  );
                })}
              </div>
              
              <div className="flex items-center justify-between mt-8 pt-6 border-t">
                <button
                  onClick={handlePrevQuestion}
                  disabled={currentQuestionIndex === 0 || examSettings.disableBacktracking}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
                >
                  ← Previous
                </button>
                
                <button
                  onClick={() => setShowQuestionNav(!showQuestionNav)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200"
                >
                  {showQuestionNav ? 'Hide' : 'Show'} Questions
                </button>
                
                {currentQuestionIndex < questions.length - 1 ? (
                  <button
                    onClick={() => handleNextQuestion()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg"
                  >
                    Submit Exam ✓
                  </button>
                )}
              </div>
            </div>
            
            {proctoringStatus && (
              <div className="mt-4 bg-white rounded-xl shadow-lg p-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <span className={proctoringStatus.cameraActive ? 'text-green-600' : 'text-red-600'}>
                      📷 {proctoringStatus.cameraActive ? 'Active' : 'Off'}
                    </span>
                    <span className={proctoringStatus.tabFocused ? 'text-green-600' : 'text-red-600'}>
                      🖥️ {proctoringStatus.tabFocused ? 'Focused' : 'Not Focused'}
                    </span>
                    <span className={proctoringStatus.isFullscreen ? 'text-green-600' : 'text-red-600'}>
                      📺 {proctoringStatus.isFullscreen ? 'Fullscreen' : 'Not Fullscreen'}
                    </span>
                  </div>
                  <span className="text-gray-500">
                    Warnings: {proctoringStatus.warningCount} | Violations: {proctoringStatus.violationCount}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {showViolationAlert && lastViolation && (
          <div className="fixed top-4 right-4 max-w-sm bg-red-600 text-white rounded-xl shadow-2xl p-4 z-50 animate-bounce">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚠️</span>
              <div>
                <p className="font-bold">Violation Detected!</p>
                <p className="text-sm opacity-90">{lastViolation.message}</p>
                <p className="text-xs opacity-75 mt-1">
                  {violations.length}/{examSettings.maxViolations} violations
                </p>
              </div>
            </div>
          </div>
        )}
        
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }
  
  // Render submitting stage
  if (stage === 'submitting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="animate-spin w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Submitting Your Exam...</h2>
          <p className="text-gray-600">Please wait while we save your answers.</p>
        </div>
      </div>
    );
  }
  
  // Render completed stage
  if (stage === 'completed') {
    const results = calculateResults();
    const passed = results.score >= exam.passingMarks;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
          <div className="text-center mb-8">
            <div className={`w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center ${
              passed ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <span className="text-5xl">{passed ? '🎉' : '😔'}</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">
              {passed ? 'Congratulations!' : 'Keep Trying!'}
            </h1>
            <p className="text-gray-600 mt-2">Your exam has been submitted successfully.</p>
          </div>
          
          <div className={`text-center p-6 rounded-xl mb-6 ${
            passed ? 'bg-green-50' : 'bg-red-50'
          }`}>
            <p className="text-5xl font-bold mb-2" style={{ color: passed ? '#10B981' : '#EF4444' }}>
              {results.score.toFixed(1)}%
            </p>
            <p className={`text-lg ${passed ? 'text-green-600' : 'text-red-600'}`}>
              {passed ? '✓ PASSED' : '✗ FAILED'}
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <p className="text-2xl font-bold text-green-600">{results.correct}</p>
              <p className="text-sm text-gray-600">Correct</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-xl">
              <p className="text-2xl font-bold text-red-600">{results.wrong}</p>
              <p className="text-sm text-gray-600">Wrong</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-gray-600">{results.unanswered}</p>
              <p className="text-sm text-gray-600">Skipped</p>
            </div>
          </div>
          
          {violations.length > 0 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
              <p className="text-yellow-800 font-medium">
                ⚠️ {violations.length} violations were recorded during your exam.
              </p>
            </div>
          )}
          
          <button
            onClick={onComplete}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg"
          >
            View Detailed Results →
          </button>
        </div>
      </div>
    );
  }
  
  return null;
};
