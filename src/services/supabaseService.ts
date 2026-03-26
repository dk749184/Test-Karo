// Supabase Database Service
// All database operations go through this file

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { 
  DbUser, DbExam, DbQuestion, DbQuestionBank, 
  DbExamAttempt, DbEmailLog 
} from '../lib/supabase';

// ============================================
// AUTH SERVICES
// ============================================

export const authService = {
  // Login user
  async login(email: string, password: string): Promise<{ success: boolean; user?: DbUser; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured. Please add your credentials.' };
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) {
      return { success: false, error: 'Invalid email or password' };
    }

    // Simple password check (in production, use proper hashing)
    if (data.password_hash !== password) {
      return { success: false, error: 'Invalid email or password' };
    }

    return { success: true, user: data };
  },

  // Register new user
  async register(userData: Partial<DbUser>): Promise<{ success: boolean; user?: DbUser; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured. Please add your credentials.' };
    }

    // Check if email already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', userData.email)
      .single();

    if (existing) {
      return { success: false, error: 'Email already registered' };
    }

    const { data, error } = await supabase
      .from('users')
      .insert([{
        ...userData,
        password_hash: userData.password_hash,
        role: 'student',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, user: data };
  },

  // Update user profile
  async updateProfile(userId: string, updates: Partial<DbUser>): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  },

  // Get all students (for admin)
  async getAllStudents(): Promise<{ success: boolean; students?: DbUser[]; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'student')
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, students: data };
  },

  // Delete student
  async deleteStudent(studentId: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', studentId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }
};

// ============================================
// EXAM SERVICES
// ============================================

export const examService = {
  // Get all exams
  async getAllExams(): Promise<{ success: boolean; exams?: DbExam[]; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, exams: data };
  },

  // Get public exams (for landing page)
  async getPublicExams(): Promise<{ success: boolean; exams?: DbExam[]; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, exams: data };
  },

  // Get exam by ID with questions
  async getExamById(examId: string): Promise<{ success: boolean; exam?: DbExam; questions?: DbQuestion[]; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('*')
      .eq('id', examId)
      .single();

    if (examError) {
      return { success: false, error: examError.message };
    }

    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('exam_id', examId);

    if (questionsError) {
      return { success: false, error: questionsError.message };
    }

    return { success: true, exam, questions };
  },

  // Create new exam
  async createExam(examData: Partial<DbExam>, questions: Partial<DbQuestion>[]): Promise<{ success: boolean; exam?: DbExam; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    // Insert exam
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .insert([{
        ...examData,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (examError) {
      return { success: false, error: examError.message };
    }

    // Insert questions
    if (questions.length > 0) {
      const questionsWithExamId = questions.map(q => ({
        ...q,
        exam_id: exam.id,
        created_at: new Date().toISOString()
      }));

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsWithExamId);

      if (questionsError) {
        console.error('Error inserting questions:', questionsError);
      }
    }

    return { success: true, exam };
  },

  // Update exam
  async updateExam(examId: string, updates: Partial<DbExam>): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    const { error } = await supabase
      .from('exams')
      .update(updates)
      .eq('id', examId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  },

  // Delete exam
  async deleteExam(examId: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    // Delete questions first
    await supabase.from('questions').delete().eq('exam_id', examId);

    // Delete exam
    const { error } = await supabase
      .from('exams')
      .delete()
      .eq('id', examId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  },

  // Toggle exam status
  async toggleExamStatus(examId: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
    return this.updateExam(examId, { is_active: isActive });
  },

  // Toggle exam public/private
  async toggleExamPublic(examId: string, isPublic: boolean): Promise<{ success: boolean; error?: string }> {
    return this.updateExam(examId, { is_public: isPublic });
  }
};

// ============================================
// QUESTION BANK SERVICES
// ============================================

export const questionBankService = {
  // Get all questions from bank
  async getAllQuestions(): Promise<{ success: boolean; questions?: DbQuestionBank[]; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    const { data, error } = await supabase
      .from('question_bank')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, questions: data };
  },

  // Add questions to bank
  async addQuestions(questions: Partial<DbQuestionBank>[]): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    const questionsWithTimestamp = questions.map(q => ({
      ...q,
      created_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('question_bank')
      .insert(questionsWithTimestamp);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  },

  // Delete question from bank
  async deleteQuestion(questionId: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    const { error } = await supabase
      .from('question_bank')
      .delete()
      .eq('id', questionId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  },

  // Update question in bank
  async updateQuestion(questionId: string, updates: Partial<DbQuestionBank>): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    const { error } = await supabase
      .from('question_bank')
      .update(updates)
      .eq('id', questionId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }
};

// ============================================
// EXAM ATTEMPT SERVICES
// ============================================

export const attemptService = {
  // Start exam attempt
  async startAttempt(examId: string, userId: string, totalQuestions: number): Promise<{ success: boolean; attempt?: DbExamAttempt; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    const { data, error } = await supabase
      .from('exam_attempts')
      .insert([{
        exam_id: examId,
        user_id: userId,
        start_time: new Date().toISOString(),
        total_questions: totalQuestions,
        correct_answers: 0,
        wrong_answers: 0,
        unanswered: totalQuestions,
        violation_count: 0,
        is_terminated: false,
        status: 'in_progress',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, attempt: data };
  },

  // Submit exam
  async submitAttempt(
    attemptId: string, 
    answers: { questionId: string; selectedAnswer: string; isCorrect: boolean }[],
    score: number,
    violationCount: number,
    isTerminated: boolean
  ): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    // Calculate stats
    const correctAnswers = answers.filter(a => a.isCorrect).length;
    const wrongAnswers = answers.filter(a => !a.isCorrect && a.selectedAnswer).length;
    const unanswered = answers.filter(a => !a.selectedAnswer).length;

    // Update attempt
    const { error: attemptError } = await supabase
      .from('exam_attempts')
      .update({
        end_time: new Date().toISOString(),
        score,
        correct_answers: correctAnswers,
        wrong_answers: wrongAnswers,
        unanswered,
        violation_count: violationCount,
        is_terminated: isTerminated,
        status: isTerminated ? 'terminated' : 'completed'
      })
      .eq('id', attemptId);

    if (attemptError) {
      return { success: false, error: attemptError.message };
    }

    // Insert student answers
    const studentAnswers = answers.map(a => ({
      attempt_id: attemptId,
      question_id: a.questionId,
      selected_answer: a.selectedAnswer || '',
      is_correct: a.isCorrect,
      created_at: new Date().toISOString()
    }));

    const { error: answersError } = await supabase
      .from('student_answers')
      .insert(studentAnswers);

    if (answersError) {
      console.error('Error saving answers:', answersError);
    }

    return { success: true };
  },

  // Get user's attempts
  async getUserAttempts(userId: string): Promise<{ success: boolean; attempts?: DbExamAttempt[]; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    const { data, error } = await supabase
      .from('exam_attempts')
      .select('*, exams(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, attempts: data };
  },

  // Log violation
  async logViolation(attemptId: string, violationType: string, message: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    const { error } = await supabase
      .from('violation_logs')
      .insert([{
        attempt_id: attemptId,
        violation_type: violationType,
        violation_message: message,
        created_at: new Date().toISOString()
      }]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }
};

// ============================================
// EMAIL LOG SERVICES
// ============================================

export const emailService = {
  // Log email
  async logEmail(emailData: Partial<DbEmailLog>): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    const { error } = await supabase
      .from('email_logs')
      .insert([{
        ...emailData,
        created_at: new Date().toISOString()
      }]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  },

  // Get all email logs
  async getAllLogs(): Promise<{ success: boolean; logs?: DbEmailLog[]; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    const { data, error } = await supabase
      .from('email_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, logs: data };
  }
};

// ============================================
// DASHBOARD STATS
// ============================================

export const dashboardService = {
  // Get admin dashboard stats
  async getAdminStats(): Promise<{ 
    success: boolean; 
    stats?: { 
      totalStudents: number; 
      totalExams: number; 
      totalAttempts: number;
      totalQuestions: number;
    }; 
    error?: string 
  }> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    const [students, exams, attempts, questions] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact' }).eq('role', 'student'),
      supabase.from('exams').select('id', { count: 'exact' }),
      supabase.from('exam_attempts').select('id', { count: 'exact' }),
      supabase.from('question_bank').select('id', { count: 'exact' })
    ]);

    return {
      success: true,
      stats: {
        totalStudents: students.count || 0,
        totalExams: exams.count || 0,
        totalAttempts: attempts.count || 0,
        totalQuestions: questions.count || 0
      }
    };
  }
};
