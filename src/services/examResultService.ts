// Exam Result Service - Saves exam results to Supabase database
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface ExamResultData {
  examId: string;
  examTitle: string;
  subject: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRollNumber?: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  skippedAnswers: number;
  score: number; // percentage
  passed: boolean;
  violationCount: number;
  isTerminated: boolean;
  violations: ViolationData[];
  answers: AnswerData[];
}

export interface ViolationData {
  type: string;
  message: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: string;
}

export interface AnswerData {
  questionId: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: number; // 0-3 for A-D
  selectedAnswer: number | null; // null if skipped
  isCorrect: boolean;
}

// Save complete exam result to Supabase
export const saveExamResultToDatabase = async (result: ExamResultData): Promise<{
  success: boolean;
  attemptId?: string;
  error?: string;
}> => {
  console.log('💾💾💾 SAVING EXAM RESULT TO DATABASE 💾💾💾');
  console.log('Exam:', result.examTitle);
  console.log('Student:', result.userName, result.userEmail);
  console.log('Score:', result.score + '%');
  console.log('Questions:', result.totalQuestions);
  console.log('Correct:', result.correctAnswers);
  console.log('Wrong:', result.wrongAnswers);
  console.log('Skipped:', result.skippedAnswers);
  console.log('Violations:', result.violationCount);

  // Check if Supabase is configured
  if (!isSupabaseConfigured()) {
    console.log('⚠️ Supabase not configured, saving to localStorage only');
    saveToLocalStorage(result);
    return { success: true, attemptId: 'local_' + Date.now() };
  }

  try {
    // 1. Create exam attempt record
    console.log('📝 Creating exam attempt record...');
    
    const { data: attemptData, error: attemptError } = await supabase
      .from('exam_attempts')
      .insert({
        exam_id: result.examId,
        user_id: result.userId,
        start_time: result.startTime.toISOString(),
        end_time: result.endTime.toISOString(),
        score: result.score,
        total_questions: result.totalQuestions,
        correct_answers: result.correctAnswers,
        wrong_answers: result.wrongAnswers,
        unanswered: result.skippedAnswers,
        violation_count: result.violationCount,
        is_terminated: result.isTerminated,
        status: result.isTerminated ? 'terminated' : 'completed'
      })
      .select()
      .single();

    if (attemptError) {
      console.error('❌ Error creating attempt:', attemptError);
      // Fallback to localStorage
      saveToLocalStorage(result);
      return { success: false, error: attemptError.message };
    }

    const attemptId = attemptData.id;
    console.log('✅ Attempt created with ID:', attemptId);

    // 2. Save student answers with full question details
    console.log('📝 Saving student answers with question details...');
    
    const answersToInsert = result.answers.map(answer => ({
      attempt_id: attemptId,
      question_id: answer.questionId,
      question_text: answer.questionText,
      option_a: answer.optionA,
      option_b: answer.optionB,
      option_c: answer.optionC,
      option_d: answer.optionD,
      correct_answer: getAnswerLetter(answer.correctAnswer),
      selected_answer: answer.selectedAnswer !== null ? getAnswerLetter(answer.selectedAnswer) : null,
      is_correct: answer.isCorrect
    }));

    // Insert all answers with question details
    const { error: answersError } = await supabase
      .from('student_answers')
      .insert(answersToInsert);

    if (answersError) {
      console.error('⚠️ Error saving answers to DB:', answersError);
      // Continue anyway, attempt is already saved
    } else {
      console.log('✅ Answers saved:', result.answers.length);
    }

    // 3. Save violations
    if (result.violations.length > 0) {
      console.log('📝 Saving violations...');
      
      const violationsToInsert = result.violations.map(v => ({
        attempt_id: attemptId,
        violation_type: v.type,
        violation_message: v.message,
        severity: v.severity,
        created_at: v.timestamp
      }));

      const { error: violationsError } = await supabase
        .from('violation_logs')
        .insert(violationsToInsert);

      if (violationsError) {
        console.error('⚠️ Error saving violations:', violationsError);
      } else {
        console.log('✅ Violations saved:', result.violations.length);
      }
    }

    // 4. Also save to localStorage for offline access
    saveToLocalStorage(result, attemptId);

    console.log('✅✅✅ EXAM RESULT SAVED SUCCESSFULLY! ✅✅✅');
    return { success: true, attemptId };

  } catch (error) {
    console.error('❌ Error saving exam result:', error);
    saveToLocalStorage(result);
    return { success: false, error: String(error) };
  }
};

// Get answer letter from index
const getAnswerLetter = (index: number): string => {
  const letters = ['A', 'B', 'C', 'D'];
  return letters[index] || 'A';
};

// Save to localStorage as backup
const saveToLocalStorage = (result: ExamResultData, attemptId?: string) => {
  console.log('💾 Saving to localStorage...');
  
  const savedResults = JSON.parse(localStorage.getItem('student_exam_results') || '[]');
  
  const localResult = {
    id: attemptId || 'local_' + Date.now(),
    examId: result.examId,
    examTitle: result.examTitle,
    subject: result.subject,
    userId: result.userId,
    userName: result.userName,
    userEmail: result.userEmail,
    userRollNumber: result.userRollNumber,
    score: result.score,
    totalQuestions: result.totalQuestions,
    correctAnswers: result.correctAnswers,
    wrongAnswers: result.wrongAnswers,
    skippedAnswers: result.skippedAnswers,
    passed: result.passed,
    violationCount: result.violationCount,
    isTerminated: result.isTerminated,
    violations: result.violations,
    answers: result.answers,
    submittedAt: result.endTime.toISOString(),
    timeTaken: Math.round((result.endTime.getTime() - result.startTime.getTime()) / 1000)
  };
  
  savedResults.push(localResult);
  localStorage.setItem('student_exam_results', JSON.stringify(savedResults));
  
  console.log('✅ Saved to localStorage');
};

// Fetch all exam results for a user from database
export const fetchUserExamResults = async (userId: string): Promise<ExamResultData[]> => {
  console.log('📥 Fetching exam results for user:', userId);
  
  const results: ExamResultData[] = [];
  
  // Try to fetch from Supabase
  if (isSupabaseConfigured()) {
    try {
      const { data: attempts, error } = await supabase
        .from('exam_attempts')
        .select(`
          *,
          exams (title, subject),
          users (name, email, roll_number)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && attempts) {
        console.log('✅ Fetched', attempts.length, 'results from Supabase');
        // Process and return
      }
    } catch (error) {
      console.error('Error fetching from Supabase:', error);
    }
  }
  
  // Also get from localStorage
  const localResults = JSON.parse(localStorage.getItem('student_exam_results') || '[]');
  const userLocalResults = localResults.filter((r: { userId: string }) => r.userId === userId);
  console.log('📥 Found', userLocalResults.length, 'results in localStorage');
  
  return results;
};

// Fetch all exam results for admin
export const fetchAllExamResults = async (): Promise<{
  attempts: ExamAttemptWithDetails[];
  success: boolean;
  error?: string;
}> => {
  console.log('📥 Fetching all exam results for admin...');
  
  const attempts: ExamAttemptWithDetails[] = [];
  
  // Try Supabase first
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('exam_attempts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        console.log('✅ Fetched', data.length, 'attempts from Supabase');
        
        // Get related data
        for (const attempt of data) {
          const examResult = await getAttemptDetails(attempt);
          if (examResult) {
            attempts.push(examResult);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching from Supabase:', error);
    }
  }
  
  // Also get from localStorage
  const localResults = JSON.parse(localStorage.getItem('student_exam_results') || '[]');
  console.log('📥 Found', localResults.length, 'results in localStorage');
  
  // Convert localStorage results to ExamAttemptWithDetails format
  for (const result of localResults) {
    const existing = attempts.find(a => a.id === result.id);
    if (!existing) {
      attempts.push({
        id: result.id,
        examId: result.examId,
        examTitle: result.examTitle,
        subject: result.subject,
        userId: result.userId,
        userName: result.userName,
        userEmail: result.userEmail,
        userRollNumber: result.userRollNumber || '',
        score: result.score,
        totalQuestions: result.totalQuestions,
        correctAnswers: result.correctAnswers,
        wrongAnswers: result.wrongAnswers,
        skippedAnswers: result.skippedAnswers || 0,
        passed: result.passed,
        violationCount: result.violationCount || 0,
        isTerminated: result.isTerminated || false,
        status: result.isTerminated ? 'terminated' : (result.passed ? 'passed' : 'failed'),
        violations: result.violations || [],
        answers: result.answers || [],
        submittedAt: result.submittedAt,
        timeTaken: result.timeTaken || 0
      });
    }
  }
  
  // Sort by date
  attempts.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  
  return { attempts, success: true };
};

export interface ExamAttemptWithDetails {
  id: string;
  examId: string;
  examTitle: string;
  subject: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRollNumber: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  skippedAnswers: number;
  passed: boolean;
  violationCount: number;
  isTerminated: boolean;
  status: string;
  violations: ViolationData[];
  answers: AnswerData[];
  submittedAt: string;
  timeTaken: number;
}

// Get attempt details including answers and violations
const getAttemptDetails = async (attempt: Record<string, unknown>): Promise<ExamAttemptWithDetails | null> => {
  try {
    // Get exam details
    const { data: exam } = await supabase
      .from('exams')
      .select('title, subject')
      .eq('id', attempt.exam_id)
      .single();

    // Get user details
    const { data: user } = await supabase
      .from('users')
      .select('name, email, roll_number')
      .eq('id', attempt.user_id)
      .single();

    // Get answers
    const { data: answers } = await supabase
      .from('student_answers')
      .select('*')
      .eq('attempt_id', attempt.id);

    // Get violations
    const { data: violations } = await supabase
      .from('violation_logs')
      .select('*')
      .eq('attempt_id', attempt.id);

    return {
      id: attempt.id as string,
      examId: attempt.exam_id as string,
      examTitle: exam?.title || 'Unknown Exam',
      subject: exam?.subject || 'Unknown',
      userId: attempt.user_id as string,
      userName: user?.name || 'Unknown',
      userEmail: user?.email || '',
      userRollNumber: user?.roll_number || '',
      score: (attempt.score as number) || 0,
      totalQuestions: (attempt.total_questions as number) || 0,
      correctAnswers: (attempt.correct_answers as number) || 0,
      wrongAnswers: (attempt.wrong_answers as number) || 0,
      skippedAnswers: (attempt.unanswered as number) || 0,
      passed: ((attempt.score as number) || 0) >= 40,
      violationCount: (attempt.violation_count as number) || 0,
      isTerminated: (attempt.is_terminated as boolean) || false,
      status: attempt.status as string,
      violations: (violations || []).map(v => ({
        type: v.violation_type,
        message: v.violation_message,
        severity: (v.severity || 'HIGH') as 'HIGH' | 'MEDIUM' | 'LOW',
        timestamp: v.created_at
      })),
      answers: (answers || []).map(a => ({
        questionId: a.question_id,
        questionText: a.question_text || '',
        optionA: a.option_a || '',
        optionB: a.option_b || '',
        optionC: a.option_c || '',
        optionD: a.option_d || '',
        correctAnswer: getAnswerIndex(a.correct_answer),
        selectedAnswer: a.selected_answer ? getAnswerIndex(a.selected_answer) : null,
        isCorrect: a.is_correct
      })),
      submittedAt: attempt.end_time as string || attempt.created_at as string,
      timeTaken: 0
    };
  } catch (error) {
    console.error('Error getting attempt details:', error);
    return null;
  }
};

// Get answer index from letter
const getAnswerIndex = (letter: string): number => {
  const letters: Record<string, number> = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
  return letters[letter?.toUpperCase()] ?? 0;
};
