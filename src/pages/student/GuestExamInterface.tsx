// ============================================
// GUEST EXAM INTERFACE
// Exam interface for users who haven't logged in
// Includes anti-cheating features
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { Exam, Question, ExamResult } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { getGrade } from '../../data/mockData';
import {
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  XCircle,
  Flag,
  Shield,
  Eye,
  Monitor,
  Send,
  Award,
  Home,
  RotateCcw
} from 'lucide-react';

interface GuestExamInterfaceProps {
  exam: Exam;
  guestInfo: { name: string; email: string };
  onComplete: (result: ExamResult) => void;
  onExit: () => void;
}

export function GuestExamInterface({ exam, guestInfo, onComplete, onExit }: GuestExamInterfaceProps) {
  // Exam States
  const [hasStarted, setHasStarted] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState(exam.duration * 60);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<ExamResult | null>(null);

  // Anti-cheating States
  const [violations, setViolations] = useState(0);
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const [violationType, setViolationType] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const maxViolations = 3;

  // Shuffle questions for this attempt
  const [shuffledQuestions] = useState<Question[]>(() => {
    return [...exam.questions].sort(() => Math.random() - 0.5);
  });

  const currentQuestion = shuffledQuestions[currentQuestionIndex];

  // Timer Effect
  useEffect(() => {
    if (!hasStarted || hasEnded) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasStarted, hasEnded]);

  // Format time
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle violation
  const handleViolation = useCallback((type: string) => {
    if (hasEnded) return;
    
    setViolations((prev) => {
      const newCount = prev + 1;
      if (newCount >= maxViolations) {
        handleSubmit(true);
      }
      return newCount;
    });
    setViolationType(type);
    setShowViolationWarning(true);

    // Play warning sound
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleF8');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch {}

    setTimeout(() => setShowViolationWarning(false), 3000);
  }, [hasEnded, maxViolations]);

  // Anti-cheating: Tab visibility
  useEffect(() => {
    if (!hasStarted || hasEnded) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation('Tab Switch');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [hasStarted, hasEnded, handleViolation]);

  // Anti-cheating: Window blur
  useEffect(() => {
    if (!hasStarted || hasEnded) return;

    const handleBlur = () => {
      handleViolation('Window Left');
    };

    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [hasStarted, hasEnded, handleViolation]);

  // Anti-cheating: Keyboard shortcuts
  useEffect(() => {
    if (!hasStarted || hasEnded) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block common shortcuts
      if (
        (e.ctrlKey && ['c', 'v', 'x', 'p', 's', 'a', 'u'].includes(e.key.toLowerCase())) ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase())) ||
        e.key === 'PrintScreen'
      ) {
        e.preventDefault();
        handleViolation('Blocked Shortcut');
      }

      // Escape key - fullscreen exit
      if (e.key === 'Escape' && isFullscreen) {
        handleViolation('Fullscreen Exit');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [hasStarted, hasEnded, isFullscreen, handleViolation]);

  // Anti-cheating: Right-click
  useEffect(() => {
    if (!hasStarted || hasEnded) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      handleViolation('Right Click');
    };

    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, [hasStarted, hasEnded, handleViolation]);

  // Anti-cheating: Copy/Paste
  useEffect(() => {
    if (!hasStarted || hasEnded) return;

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      handleViolation('Copy Attempt');
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      handleViolation('Paste Attempt');
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
    };
  }, [hasStarted, hasEnded, handleViolation]);

  // Enter fullscreen
  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } catch {
      console.log('Fullscreen not supported');
    }
  };

  // Start exam
  const handleStartExam = async () => {
    await enterFullscreen();
    setHasStarted(true);
  };

  // Select answer
  const handleSelectAnswer = (optionIndex: number) => {
    if (hasEnded) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionIndex,
    }));
  };

  // Navigation
  const goToQuestion = (index: number) => {
    if (index >= 0 && index < shuffledQuestions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  // Toggle mark for review
  const toggleMarkForReview = () => {
    setMarkedForReview((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestion.id)) {
        newSet.delete(currentQuestion.id);
      } else {
        newSet.add(currentQuestion.id);
      }
      return newSet;
    });
  };

  // Submit exam
  const handleSubmit = (autoSubmit = false) => {
    setHasEnded(true);

    // Exit fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    // Calculate score
    let correctCount = 0;
    let wrongCount = 0;

    shuffledQuestions.forEach((q) => {
      if (answers[q.id] !== undefined) {
        if (answers[q.id] === q.correctAnswer) {
          correctCount++;
        } else {
          wrongCount++;
        }
      }
    });

    const unattempted = shuffledQuestions.length - Object.keys(answers).length;
    const totalMarks = exam.totalMarks;
    const marksPerQuestion = totalMarks / shuffledQuestions.length;
    const score = Math.round(correctCount * marksPerQuestion);
    const percentage = Math.round((score / totalMarks) * 100);

    const examResult: ExamResult = {
      attemptId: `guest-attempt-${Date.now()}`,
      examId: exam.id,
      examTitle: exam.title,
      studentId: `guest-${Date.now()}`,
      studentName: guestInfo.name,
      score,
      totalMarks,
      percentage,
      grade: getGrade(percentage),
      timeTaken: (exam.duration * 60) - timeRemaining,
      correctAnswers: correctCount,
      wrongAnswers: wrongCount,
      unattempted,
      submittedAt: new Date().toISOString(),
      autoSubmitted: autoSubmit,
      violationCount: violations,
      subjectWiseAnalysis: [],
    };

    setResult(examResult);
    setShowResult(true);
  };

  // Get question status for navigation
  const getQuestionStatus = (question: Question) => {
    const isAnswered = answers[question.id] !== undefined;
    const isMarked = markedForReview.has(question.id);
    const isCurrent = question.id === currentQuestion?.id;

    if (isCurrent) return 'current';
    if (isMarked && isAnswered) return 'marked-answered';
    if (isMarked) return 'marked';
    if (isAnswered) return 'answered';
    return 'not-visited';
  };

  // Pre-exam Instructions Screen
  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl p-8">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-10 h-10 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{exam.title}</h1>
            <p className="text-gray-500 mt-1">Guest: {guestInfo.name}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{shuffledQuestions.length}</p>
              <p className="text-sm text-blue-700">Questions</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{exam.duration}</p>
              <p className="text-sm text-green-700">Minutes</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">{exam.totalMarks}</p>
              <p className="text-sm text-purple-700">Total Marks</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">{exam.passingMarks}</p>
              <p className="text-sm text-orange-700">Passing</p>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Anti-Cheating Rules
            </h3>
            <ul className="space-y-2 text-sm text-red-700">
              <li className="flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                Exam runs in fullscreen mode
              </li>
              <li className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Tab switching is monitored
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Copy/Paste/Right-click disabled
              </li>
              <li className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {maxViolations} violations = Auto Submit
              </li>
            </ul>
          </div>

          <label className="flex items-center gap-3 mb-6 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-gray-700">
              I agree to the exam rules and anti-cheating policies
            </span>
          </label>

          <div className="flex gap-4">
            <Button variant="secondary" onClick={onExit} className="flex-1">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            <Button
              onClick={handleStartExam}
              disabled={!agreedToTerms}
              className="flex-1"
            >
              <Monitor className="w-4 h-4 mr-2" />
              Start Exam
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Result Screen
  if (showResult && result) {
    const passed = result.percentage >= (exam.passingMarks / exam.totalMarks) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl p-8 text-center">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
            passed ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {passed ? (
              <Award className="w-12 h-12 text-green-600" />
            ) : (
              <XCircle className="w-12 h-12 text-red-600" />
            )}
          </div>

          <h1 className={`text-3xl font-bold mb-2 ${passed ? 'text-green-600' : 'text-red-600'}`}>
            {passed ? 'Congratulations!' : 'Better Luck Next Time'}
          </h1>
          <p className="text-gray-600 mb-6">
            {passed ? 'You have passed the exam!' : 'You did not meet the passing criteria.'}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-3xl font-bold text-indigo-600">{result.score}</p>
              <p className="text-sm text-gray-500">Score</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-3xl font-bold text-blue-600">{result.percentage}%</p>
              <p className="text-sm text-gray-500">Percentage</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-3xl font-bold text-purple-600">{result.grade}</p>
              <p className="text-sm text-gray-500">Grade</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-3xl font-bold text-green-600">{result.correctAnswers}</p>
              <p className="text-sm text-gray-500">Correct</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <p className="text-xl font-bold text-green-600">{result.correctAnswers}</p>
              <p className="text-sm text-gray-500">Correct</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-red-600">{result.wrongAnswers}</p>
              <p className="text-sm text-gray-500">Wrong</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-gray-600">{result.unattempted}</p>
              <p className="text-sm text-gray-500">Skipped</p>
            </div>
          </div>

          {result.violationCount && result.violationCount > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <p className="text-yellow-800 font-medium">
                ⚠️ {result.violationCount} violation(s) recorded during the exam
              </p>
            </div>
          )}

          {result.autoSubmitted && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-800 font-medium">
                ⚠️ Exam was auto-submitted due to violations or time expiry
              </p>
            </div>
          )}

          <div className="flex gap-4">
            <Button onClick={onExit} className="flex-1">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            <Button variant="secondary" onClick={() => {
              onComplete(result);
            }} className="flex-1">
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Another Exam
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Exam Interface
  return (
    <div className="min-h-screen bg-gray-100 select-none" style={{ userSelect: 'none' }}>
      {/* Violation Warning Modal */}
      {showViolationWarning && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md text-center animate-bounce">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">⚠️ Warning!</h2>
            <p className="text-gray-700 mb-2">
              <strong>{violationType}</strong> detected!
            </p>
            <p className="text-red-600 font-bold text-lg">
              Violations: {violations}/{maxViolations}
            </p>
            {violations >= maxViolations - 1 && (
              <p className="text-red-700 mt-2 font-medium">
                One more violation will terminate your exam!
              </p>
            )}
          </div>
        </div>
      )}

      {/* Dynamic Watermark */}
      <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 100px,
            rgba(0,0,0,0.03) 100px,
            rgba(0,0,0,0.03) 200px
          )`
        }}>
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute text-gray-900 font-bold text-lg whitespace-nowrap transform -rotate-45"
              style={{
                top: `${(i * 150) % 800}px`,
                left: `${(i * 200) % 1200}px`,
              }}
            >
              {guestInfo.name} | {new Date().toLocaleTimeString()}
            </div>
          ))}
        </div>
      </div>

      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-20">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Shield className="w-6 h-6 text-indigo-600" />
              <div>
                <h1 className="font-bold text-gray-900">{exam.title}</h1>
                <p className="text-sm text-gray-500">{guestInfo.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Violations Counter */}
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                violations === 0 ? 'bg-green-100 text-green-700' :
                violations === 1 ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                ⚠️ {violations}/{maxViolations}
              </div>

              {/* Timer */}
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold ${
                timeRemaining < 300 ? 'bg-red-100 text-red-600 animate-pulse' :
                timeRemaining < 600 ? 'bg-yellow-100 text-yellow-600' :
                'bg-green-100 text-green-600'
              }`}>
                <Clock className="w-5 h-5" />
                {formatTime(timeRemaining)}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-60px)]">
        {/* Question Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          <Card className="p-6">
            {/* Question Header */}
            <div className="flex items-center justify-between mb-6">
              <span className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg font-medium">
                Question {currentQuestionIndex + 1} of {shuffledQuestions.length}
              </span>
              <button
                onClick={toggleMarkForReview}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  markedForReview.has(currentQuestion.id)
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Flag className="w-4 h-4" />
                {markedForReview.has(currentQuestion.id) ? 'Marked' : 'Mark for Review'}
              </button>
            </div>

            {/* Question Text */}
            <div className="mb-8">
              <h2 className="text-xl font-medium text-gray-900 leading-relaxed">
                {currentQuestion.text}
              </h2>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectAnswer(index)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    answers[currentQuestion.id] === index
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      answers[currentQuestion.id] === index
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="text-gray-800">{option}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t">
              <Button
                variant="secondary"
                onClick={() => goToQuestion(currentQuestionIndex - 1)}
                disabled={currentQuestionIndex === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    // Clear answer
                    setAnswers((prev) => {
                      const newAnswers = { ...prev };
                      delete newAnswers[currentQuestion.id];
                      return newAnswers;
                    });
                  }}
                >
                  Clear
                </Button>

                {currentQuestionIndex === shuffledQuestions.length - 1 ? (
                  <Button onClick={() => handleSubmit(false)}>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Exam
                  </Button>
                ) : (
                  <Button onClick={() => goToQuestion(currentQuestionIndex + 1)}>
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Question Palette */}
        <div className="w-80 bg-white border-l p-4 overflow-y-auto">
          <h3 className="font-semibold text-gray-900 mb-4">Question Palette</h3>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-green-500"></span>
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-gray-300"></span>
              <span>Not Visited</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-orange-500"></span>
              <span>Marked</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-indigo-600"></span>
              <span>Current</span>
            </div>
          </div>

          {/* Question Numbers */}
          <div className="grid grid-cols-5 gap-2 mb-6">
            {shuffledQuestions.map((q, index) => {
              const status = getQuestionStatus(q);
              return (
                <button
                  key={q.id}
                  onClick={() => goToQuestion(index)}
                  className={`w-10 h-10 rounded-lg font-medium text-sm transition-all ${
                    status === 'current' ? 'bg-indigo-600 text-white ring-2 ring-indigo-300' :
                    status === 'answered' ? 'bg-green-500 text-white' :
                    status === 'marked' ? 'bg-orange-500 text-white' :
                    status === 'marked-answered' ? 'bg-purple-500 text-white' :
                    'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>

          {/* Stats */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Answered</span>
              <span className="font-medium text-green-600">
                {Object.keys(answers).length}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Not Answered</span>
              <span className="font-medium text-gray-600">
                {shuffledQuestions.length - Object.keys(answers).length}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Marked for Review</span>
              <span className="font-medium text-orange-600">
                {markedForReview.size}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            onClick={() => handleSubmit(false)}
            className="w-full mt-6"
            size="lg"
          >
            <Send className="w-4 h-4 mr-2" />
            Submit Exam
          </Button>
        </div>
      </div>
    </div>
  );
}
