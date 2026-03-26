// ============================================
// TYPE DEFINITIONS FOR EXAM SYSTEM
// MCA Final Year Project - AI-Based Examination
// ============================================

// User Types
export type UserRole = 'student' | 'admin' | 'institute';

export interface User {
  instituteName?: string;
  instituteCode?: string;
  assignedDepartments?: string[];
  id: string;
  name: string;
  email: string;
  role: UserRole;
  rollNumber?: string;
  department?: string;
  profileImage?: string;
  phone?: string;
  semester?: string;
  registeredAt?: string;
}

// Exam Types
export type ExamCategory = 'school' | 'college' | 'competitive';
export type QuestionDifficulty = 'easy' | 'medium' | 'hard' | 'mixed';
export type ExamStatus = 'upcoming' | 'active' | 'completed';

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  difficulty?: QuestionDifficulty;
  subject?: string;
  marks?: number;
  topic?: string;
  explanation?: string;
  classLevel?: string;
  image?: string; // Base64 encoded image for question
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  category: ExamCategory;
  class: string; // Class level (Class 10, Class 12, etc.)
  classLevel?: string; // Alias for class
  subject: string;
  duration: number; // in minutes
  totalMarks: number;
  totalQuestions: number; // Total number of questions
  passingMarks: number;
  difficulty: QuestionDifficulty; // Overall difficulty
  questions: Question[];
  scheduledStart: string; // ISO date string
  scheduledEnd: string; // ISO date string
  isEnabled: boolean;
  isActive: boolean; // Whether exam is currently active
  isPublic: boolean; // Whether exam can be taken without login
  instructions: string[];
  createdBy: string;
}

// Exam Attempt Types
export interface ExamAttempt {
  id: string;
  examId: string;
  studentId: string;
  answers: Record<string, number>; // questionId -> selectedOption
  startTime: string;
  endTime?: string;
  score?: number;
  percentage?: number;
  status: 'in-progress' | 'submitted' | 'auto-submitted';
  violations: Violation[];
}

export interface Violation {
  type: 'tab-switch' | 'window-blur' | 'copy-paste' | 'right-click';
  timestamp: string;
  count: number;
}

// Result Types
export interface ExamResult {
  attemptId: string;
  examId: string;
  examTitle: string;
  studentId: string;
  studentName: string;
  score: number;
  totalMarks: number;
  percentage: number;
  grade: string;
  timeTaken: number; // in seconds
  correctAnswers: number;
  wrongAnswers: number;
  unattempted: number;
  subjectWiseAnalysis: SubjectAnalysis[];
  submittedAt: string;
  autoSubmitted?: boolean;
  violationCount?: number;
}

export interface SubjectAnalysis {
  subject: string;
  correct: number;
  wrong: number;
  total: number;
  percentage: number;
}

// AI Question Generation Types
export interface ExtractedQuestion {
  text: string;
  options: string[];
  detectedAnswer?: number;
  confidence: number;
  subject?: string;
  difficulty?: QuestionDifficulty;
}

export interface AIExtractionResult {
  questions: ExtractedQuestion[];
  totalExtracted: number;
  successRate: number;
  processingTime: number;
}
