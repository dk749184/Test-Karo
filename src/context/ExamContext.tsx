// ============================================
// EXAM CONTEXT
// Manages exam data, attempts, and results
// Stores data in Supabase Cloud Database
// Falls back to localStorage if Supabase fails
// ============================================

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Exam, ExamAttempt, ExamResult, Question, Violation } from '../types';
import { mockExams, mockResults, getGrade } from '../data/mockData';
import { supabase, isSupabaseConfigured, checkConnection } from '../lib/supabase';

interface ExamContextType {
  exams: Exam[];
  currentExam: Exam | null;
  currentAttempt: ExamAttempt | null;
  results: ExamResult[];
  questionBank: Question[];
  isLoading: boolean;
  
  // Exam management
  setCurrentExam: (exam: Exam | null) => void;
  addExam: (exam: Exam) => Promise<void>;
  updateExam: (examId: string, updates: Partial<Exam>) => Promise<void>;
  deleteExam: (examId: string) => Promise<void>;
  toggleExamStatus: (examId: string) => Promise<void>;
  refreshExams: () => Promise<void>;
  
  // Attempt management
  startExam: (examId: string, studentId: string) => void;
  updateAnswer: (questionId: string, answer: number) => void;
  addViolation: (type: Violation['type']) => void;
  submitExam: (isAutoSubmit?: boolean) => Promise<ExamResult | null>;
  
  // Results
  getStudentResults: (studentId: string) => ExamResult[];
  getExamResults: (examId: string) => ExamResult[];
  getAllResults: () => ExamResult[];
  
  // Question Bank
  addToQuestionBank: (questions: Question[]) => Promise<void>;
  removeFromQuestionBank: (questionId: string) => Promise<void>;
  updateQuestionInBank: (questionId: string, updates: Partial<Question>) => Promise<void>;
  clearQuestionBank: () => Promise<void>;
  refreshQuestionBank: () => Promise<void>;
}

const ExamContext = createContext<ExamContextType | undefined>(undefined);

// Load from localStorage (fallback)
const loadQuestionBankLocal = (): Question[] => {
  const saved = localStorage.getItem('questionBank');
  return saved ? JSON.parse(saved) : [];
};

const loadExamsLocal = (): Exam[] => {
  const saved = localStorage.getItem('exams');
  return saved ? JSON.parse(saved) : mockExams;
};

const loadResultsLocal = (): ExamResult[] => {
  const saved = localStorage.getItem('examResults');
  return saved ? JSON.parse(saved) : mockResults;
};

export function ExamProvider({ children }: { children: ReactNode }) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [currentExam, setCurrentExam] = useState<Exam | null>(null);
  const [currentAttempt, setCurrentAttempt] = useState<ExamAttempt | null>(null);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [questionBank, setQuestionBank] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      console.log('🔄 Loading exam data...');
      console.log('📦 Supabase configured:', isSupabaseConfigured());
      
      if (isSupabaseConfigured()) {
        // Check Supabase connection first
        const connected = await checkConnection();
        console.log('📡 Supabase connection:', connected ? '✅ Connected' : '❌ Failed');
        
        if (connected) {
          // Load from Supabase
          await refreshExams();
          await refreshQuestionBank();
          await refreshResults();
        } else {
          // Supabase failed, use localStorage
          console.log('⚠️ Supabase connection failed, using localStorage...');
          setExams(loadExamsLocal());
          setQuestionBank(loadQuestionBankLocal());
          setResults(loadResultsLocal());
        }
      } else {
        // Load from localStorage
        console.log('📦 Loading from localStorage...');
        setExams(loadExamsLocal());
        setQuestionBank(loadQuestionBankLocal());
        setResults(loadResultsLocal());
      }
      
      setIsLoading(false);
      console.log('✅ Data loading complete');
    };
    
    loadData();
  }, []);

  // Refresh exams from Supabase
  const refreshExams = async () => {
    console.log('🔄 Refreshing exams from Supabase...');
    
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase not configured, using localStorage');
      setExams(loadExamsLocal());
      return;
    }

    try {
      const { data: examsData, error } = await supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('📊 Supabase exams response:', { data: examsData, error });

      if (error) {
        console.error('❌ Error loading exams:', error);
        console.log('📦 Falling back to localStorage...');
        const localExams = loadExamsLocal();
        console.log('📦 Local exams:', localExams.length);
        setExams(localExams);
        return;
      }

      if (!examsData || examsData.length === 0) {
        console.log('⚠️ No exams in Supabase, using localStorage/mock data');
        const localExams = loadExamsLocal();
        console.log('📦 Local/Mock exams:', localExams.length);
        setExams(localExams);
        return;
      }

      // Load questions for each exam
      const examsWithQuestions: Exam[] = await Promise.all(
        examsData.map(async (exam) => {
          const { data: questions } = await supabase
            .from('questions')
            .select('*')
            .eq('exam_id', exam.id);

          return {
            id: exam.id,
            title: exam.title,
            subject: exam.subject,
            description: exam.description || '',
            duration: exam.duration,
            totalMarks: exam.total_marks,
            passingMarks: exam.passing_marks,
            classLevel: exam.class_level,
            category: exam.category,
            isEnabled: exam.is_active,
            isPublic: exam.is_public,
            scheduledStart: exam.start_time,
            scheduledEnd: exam.end_time,
            isActive: exam.is_active,
            class: exam.class_level,
            totalQuestions: 0,
            difficulty: 'medium' as const,
            instructions: [],
            createdBy: '',
            questions: (questions || []).map(q => ({
              id: q.id,
              text: q.question_text,
              options: [q.option_a, q.option_b, q.option_c, q.option_d],
              correctAnswer: ['A', 'B', 'C', 'D'].indexOf(q.correct_answer),
              marks: q.marks,
              subject: q.subject || exam.subject,
              topic: q.topic || '',
              difficulty: q.difficulty,
              classLevel: exam.class_level
            }))
          };
        })
      );

      console.log('✅ Loaded', examsWithQuestions.length, 'exams from Supabase');
      setExams(examsWithQuestions);
    } catch (error) {
      console.error('❌ Error refreshing exams:', error);
      console.log('📦 Falling back to localStorage...');
      setExams(loadExamsLocal());
    }
  };

  // Refresh results from Supabase
  const refreshResults = async () => {
    if (!isSupabaseConfigured()) {
      setResults(loadResultsLocal());
      return;
    }

    try {
      const { data, error } = await supabase
        .from('exam_attempts')
        .select(`
          *,
          exams (title),
          users (name)
        `)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading results:', error);
        setResults(loadResultsLocal());
        return;
      }

      const loadedResults: ExamResult[] = data.map(r => ({
        attemptId: r.id,
        examId: r.exam_id,
        examTitle: r.exams?.title || 'Unknown Exam',
        studentId: r.user_id,
        studentName: r.users?.name || 'Unknown Student',
        score: r.score || 0,
        totalMarks: 100,
        percentage: ((r.score || 0) / 100) * 100,
        grade: getGrade(((r.score || 0) / 100) * 100),
        timeTaken: 0,
        correctAnswers: r.correct_answers || 0,
        wrongAnswers: r.wrong_answers || 0,
        unattempted: r.unanswered || 0,
        submittedAt: r.end_time || r.created_at,
        subjectWiseAnalysis: []
      }));

      setResults(loadedResults);
    } catch (error) {
      console.error('Error refreshing results:', error);
      setResults(loadResultsLocal());
    }
  };

  // Refresh question bank from Supabase
  const refreshQuestionBank = async () => {
    if (!isSupabaseConfigured()) {
      setQuestionBank(loadQuestionBankLocal());
      return;
    }

    try {
      const { data, error } = await supabase
        .from('question_bank')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading question bank:', error);
        setQuestionBank(loadQuestionBankLocal());
        return;
      }

      const questions: Question[] = data.map(q => ({
        id: q.id,
        text: q.question_text,
        options: [q.option_a, q.option_b, q.option_c, q.option_d],
        correctAnswer: ['A', 'B', 'C', 'D'].indexOf(q.correct_answer),
        marks: 10,
        subject: q.subject,
        topic: q.topic,
        difficulty: q.difficulty,
        classLevel: q.class_level
      }));

      setQuestionBank(questions);
    } catch (error) {
      console.error('Error refreshing question bank:', error);
      setQuestionBank(loadQuestionBankLocal());
    }
  };

  // Add new exam
  const addExam = async (exam: Exam) => {
    if (isSupabaseConfigured()) {
      try {
        // Insert exam
        const { data: newExam, error: examError } = await supabase
          .from('exams')
          .insert({
            title: exam.title,
            subject: exam.subject,
            description: exam.description,
            duration: exam.duration,
            total_marks: exam.totalMarks,
            passing_marks: exam.passingMarks,
            class_level: exam.classLevel,
            category: exam.category,
            is_active: exam.isEnabled,
            is_public: exam.isPublic,
            start_time: exam.scheduledStart,
            end_time: exam.scheduledEnd
          })
          .select()
          .single();

        if (examError) {
          console.error('Error creating exam:', examError);
          // Fallback to local
          setExams(prev => [...prev, exam]);
          localStorage.setItem('exams', JSON.stringify([...exams, exam]));
          return;
        }

        // Insert questions
        if (exam.questions.length > 0) {
          const questionsToInsert = exam.questions.map(q => ({
            exam_id: newExam.id,
            question_text: q.text,
            option_a: q.options[0],
            option_b: q.options[1],
            option_c: q.options[2],
            option_d: q.options[3],
            correct_answer: ['A', 'B', 'C', 'D'][q.correctAnswer],
            marks: q.marks,
            subject: q.subject,
            topic: q.topic || '',
            difficulty: q.difficulty
          }));

          await supabase.from('questions').insert(questionsToInsert);
        }

        await refreshExams();
      } catch (error) {
        console.error('Error adding exam:', error);
        setExams(prev => [...prev, exam]);
        localStorage.setItem('exams', JSON.stringify([...exams, exam]));
      }
    } else {
      setExams(prev => {
        const newExams = [...prev, exam];
        localStorage.setItem('exams', JSON.stringify(newExams));
        return newExams;
      });
    }
  };

  // Update existing exam
  const updateExam = async (examId: string, updates: Partial<Exam>) => {
    if (isSupabaseConfigured()) {
      try {
        const updateData: Record<string, unknown> = {};
        if (updates.title) updateData.title = updates.title;
        if (updates.subject) updateData.subject = updates.subject;
        if (updates.description) updateData.description = updates.description;
        if (updates.duration) updateData.duration = updates.duration;
        if (updates.totalMarks) updateData.total_marks = updates.totalMarks;
        if (updates.passingMarks) updateData.passing_marks = updates.passingMarks;
        if (updates.classLevel) updateData.class_level = updates.classLevel;
        if (updates.category) updateData.category = updates.category;
        if (updates.isEnabled !== undefined) updateData.is_active = updates.isEnabled;
        if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic;
        if (updates.scheduledStart) updateData.start_time = updates.scheduledStart;
        if (updates.scheduledEnd) updateData.end_time = updates.scheduledEnd;

        await supabase
          .from('exams')
          .update(updateData)
          .eq('id', examId);

        await refreshExams();
      } catch (error) {
        console.error('Error updating exam:', error);
      }
    }

    setExams(prev => {
      const newExams = prev.map(e => e.id === examId ? { ...e, ...updates } : e);
      localStorage.setItem('exams', JSON.stringify(newExams));
      return newExams;
    });
  };

  // Delete exam
  const deleteExam = async (examId: string) => {
    if (isSupabaseConfigured()) {
      try {
        // Delete questions first
        await supabase.from('questions').delete().eq('exam_id', examId);
        // Delete exam
        await supabase.from('exams').delete().eq('id', examId);
        await refreshExams();
      } catch (error) {
        console.error('Error deleting exam:', error);
      }
    }

    setExams(prev => {
      const newExams = prev.filter(e => e.id !== examId);
      localStorage.setItem('exams', JSON.stringify(newExams));
      return newExams;
    });
  };

  // Toggle exam enabled/disabled
  const toggleExamStatus = async (examId: string) => {
    const exam = exams.find(e => e.id === examId);
    if (!exam) return;

    await updateExam(examId, { isEnabled: !exam.isEnabled });
  };

  // Start a new exam attempt
  const startExam = (examId: string, studentId: string) => {
    const exam = exams.find(e => e.id === examId);
    if (!exam) return;

    // Shuffle questions for randomization (anti-cheating)
    const shuffledQuestions = [...exam.questions].sort(() => Math.random() - 0.5);
    const shuffledExam = { ...exam, questions: shuffledQuestions };
    
    setCurrentExam(shuffledExam);

    const attempt: ExamAttempt = {
      id: `attempt-${Date.now()}`,
      examId,
      studentId,
      answers: {},
      startTime: new Date().toISOString(),
      status: 'in-progress',
      violations: []
    };

    setCurrentAttempt(attempt);
    localStorage.setItem('examAttempt', JSON.stringify(attempt));
  };

  // Update answer for a question
  const updateAnswer = (questionId: string, answer: number) => {
    if (!currentAttempt) return;

    const updatedAttempt = {
      ...currentAttempt,
      answers: { ...currentAttempt.answers, [questionId]: answer }
    };

    setCurrentAttempt(updatedAttempt);
    localStorage.setItem('examAttempt', JSON.stringify(updatedAttempt));
  };

  // Add violation record
  const addViolation = (type: Violation['type']) => {
    if (!currentAttempt) return;

    const existingViolation = currentAttempt.violations.find(v => v.type === type);
    
    let updatedViolations: Violation[];
    if (existingViolation) {
      updatedViolations = currentAttempt.violations.map(v =>
        v.type === type ? { ...v, count: v.count + 1, timestamp: new Date().toISOString() } : v
      );
    } else {
      updatedViolations = [
        ...currentAttempt.violations,
        { type, timestamp: new Date().toISOString(), count: 1 }
      ];
    }

    const updatedAttempt = { ...currentAttempt, violations: updatedViolations };
    setCurrentAttempt(updatedAttempt);
    localStorage.setItem('examAttempt', JSON.stringify(updatedAttempt));

    // Check for auto-submit threshold
    const totalViolations = updatedViolations.reduce((sum, v) => sum + v.count, 0);
    if (totalViolations >= 5) {
      return true; // Signal to auto-submit
    }
    return false;
  };

  // Submit exam and calculate results
  const submitExam = async (isAutoSubmit = false): Promise<ExamResult | null> => {
    if (!currentExam || !currentAttempt) return null;

    const endTime = new Date();
    const startTime = new Date(currentAttempt.startTime);
    const timeTaken = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    // Calculate score
    let correctAnswers = 0;
    let wrongAnswers = 0;
    let score = 0;

    const subjectScores: Record<string, { correct: number; wrong: number; total: number }> = {};

    currentExam.questions.forEach((question: Question) => {
      const subject = question.subject || 'General';
      if (!subjectScores[subject]) {
        subjectScores[subject] = { correct: 0, wrong: 0, total: 0 };
      }
      subjectScores[subject].total++;

      const userAnswer = currentAttempt.answers[question.id];
      if (userAnswer !== undefined) {
        if (userAnswer === question.correctAnswer) {
          correctAnswers++;
          score += question.marks || 10;
          subjectScores[subject].correct++;
        } else {
          wrongAnswers++;
          subjectScores[subject].wrong++;
        }
      }
    });

    const unattempted = currentExam.questions.length - correctAnswers - wrongAnswers;
    const totalMarks = currentExam.questions.length * 10; // Each question = 10 marks
    const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;

    const result: ExamResult = {
      attemptId: currentAttempt.id,
      examId: currentExam.id,
      examTitle: currentExam.title,
      studentId: currentAttempt.studentId,
      studentName: 'Current User',
      score,
      totalMarks,
      percentage: Math.round(percentage * 100) / 100,
      grade: getGrade(percentage),
      timeTaken,
      correctAnswers,
      wrongAnswers,
      unattempted,
      submittedAt: endTime.toISOString(),
      subjectWiseAnalysis: Object.entries(subjectScores).map(([subject, data]) => ({
        subject,
        correct: data.correct,
        wrong: data.wrong,
        total: data.total,
        percentage: Math.round((data.correct / data.total) * 100)
      }))
    };

    // Save to Supabase
    if (isSupabaseConfigured()) {
      try {
        console.log('Saving exam attempt to Supabase...');
        console.log('Exam ID:', currentExam.id);
        console.log('Student ID:', currentAttempt.studentId);
        
        // Create attempt record
        const { data: attemptData, error: attemptError } = await supabase
          .from('exam_attempts')
          .insert({
            exam_id: currentExam.id,
            user_id: currentAttempt.studentId,
            start_time: currentAttempt.startTime,
            end_time: endTime.toISOString(),
            score: Math.round(percentage), // Store as percentage
            total_questions: currentExam.questions.length,
            correct_answers: correctAnswers,
            wrong_answers: wrongAnswers,
            unanswered: unattempted,
            violation_count: currentAttempt.violations.reduce((sum, v) => sum + v.count, 0),
            is_terminated: isAutoSubmit,
            status: 'completed'
          })
          .select()
          .single();

        if (attemptError) {
          console.error('Error creating attempt:', attemptError);
        } else {
          console.log('Attempt created successfully:', attemptData);
        }

        // Save violations
        if (attemptData && currentAttempt.violations.length > 0) {
          const violationsToInsert = currentAttempt.violations.map(v => ({
            attempt_id: attemptData.id,
            violation_type: v.type,
            violation_message: `${v.type} detected ${v.count} times`
          }));

          const { error: violationError } = await supabase.from('violation_logs').insert(violationsToInsert);
          if (violationError) {
            console.error('Error saving violations:', violationError);
          }
        }

        // Save answers - Only save if question IDs are UUIDs (from Supabase)
        if (attemptData) {
          const answersToInsert: Array<{
            attempt_id: string;
            question_id: string;
            selected_answer: string;
            is_correct: boolean;
          }> = [];
          
          for (const [questionId, answer] of Object.entries(currentAttempt.answers)) {
            // Check if questionId is a valid UUID (from Supabase)
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(questionId);
            
            if (isUUID) {
              const question = currentExam.questions.find(q => q.id === questionId);
              answersToInsert.push({
                attempt_id: attemptData.id,
                question_id: questionId,
                selected_answer: ['A', 'B', 'C', 'D'][answer as number],
                is_correct: question ? answer === question.correctAnswer : false
              });
            }
          }

          if (answersToInsert.length > 0) {
            const { error: answersError } = await supabase.from('student_answers').insert(answersToInsert);
            if (answersError) {
              console.error('Error saving answers:', answersError);
            } else {
              console.log('Answers saved successfully');
            }
          }
        }
        
        // Update result with attempt ID from Supabase
        if (attemptData) {
          result.attemptId = attemptData.id;
        }
      } catch (error) {
        console.error('Error saving exam attempt:', error);
      }
    }

    // Update local state
    setResults(prev => {
      const newResults = [...prev, result];
      localStorage.setItem('examResults', JSON.stringify(newResults));
      return newResults;
    });

    setCurrentAttempt(null);
    setCurrentExam(null);
    localStorage.removeItem('examAttempt');

    return result;
  };

  // Get results for a specific student
  const getStudentResults = (studentId: string): ExamResult[] => {
    return results.filter(r => r.studentId === studentId);
  };

  // Get results for a specific exam
  const getExamResults = (examId: string): ExamResult[] => {
    return results.filter(r => r.examId === examId);
  };

  // Get all results (for admin)
  const getAllResults = (): ExamResult[] => {
    return results;
  };

  // Question Bank functions
  const addToQuestionBank = async (questions: Question[]) => {
    if (isSupabaseConfigured()) {
      try {
        const questionsToInsert = questions.map(q => ({
          question_text: q.text,
          option_a: q.options[0],
          option_b: q.options[1],
          option_c: q.options[2],
          option_d: q.options[3],
          correct_answer: ['A', 'B', 'C', 'D'][q.correctAnswer],
          subject: q.subject,
          topic: q.topic || '',
          class_level: q.classLevel || 'Class 12',
          difficulty: q.difficulty || 'medium'
        }));

        await supabase.from('question_bank').insert(questionsToInsert);
        await refreshQuestionBank();
      } catch (error) {
        console.error('Error adding to question bank:', error);
      }
    }

    setQuestionBank(prev => {
      const newBank = [...prev, ...questions];
      localStorage.setItem('questionBank', JSON.stringify(newBank));
      return newBank;
    });
  };

  const removeFromQuestionBank = async (questionId: string) => {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('question_bank').delete().eq('id', questionId);
        await refreshQuestionBank();
      } catch (error) {
        console.error('Error removing from question bank:', error);
      }
    }

    setQuestionBank(prev => {
      const newBank = prev.filter(q => q.id !== questionId);
      localStorage.setItem('questionBank', JSON.stringify(newBank));
      return newBank;
    });
  };

  const updateQuestionInBank = async (questionId: string, updates: Partial<Question>) => {
    if (isSupabaseConfigured()) {
      try {
        const updateData: Record<string, unknown> = {};
        if (updates.text) updateData.question_text = updates.text;
        if (updates.options) {
          updateData.option_a = updates.options[0];
          updateData.option_b = updates.options[1];
          updateData.option_c = updates.options[2];
          updateData.option_d = updates.options[3];
        }
        if (updates.correctAnswer !== undefined) {
          updateData.correct_answer = ['A', 'B', 'C', 'D'][updates.correctAnswer];
        }
        if (updates.subject) updateData.subject = updates.subject;
        if (updates.topic) updateData.topic = updates.topic;
        if (updates.difficulty) updateData.difficulty = updates.difficulty;

        await supabase.from('question_bank').update(updateData).eq('id', questionId);
        await refreshQuestionBank();
      } catch (error) {
        console.error('Error updating question in bank:', error);
      }
    }

    setQuestionBank(prev => {
      const newBank = prev.map(q => q.id === questionId ? { ...q, ...updates } : q);
      localStorage.setItem('questionBank', JSON.stringify(newBank));
      return newBank;
    });
  };

  const clearQuestionBank = async () => {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('question_bank').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await refreshQuestionBank();
      } catch (error) {
        console.error('Error clearing question bank:', error);
      }
    }

    setQuestionBank([]);
    localStorage.removeItem('questionBank');
  };

  return (
    <ExamContext.Provider value={{
      exams,
      currentExam,
      currentAttempt,
      results,
      questionBank,
      isLoading,
      setCurrentExam,
      addExam,
      updateExam,
      deleteExam,
      toggleExamStatus,
      refreshExams,
      startExam,
      updateAnswer,
      addViolation,
      submitExam,
      getStudentResults,
      getExamResults,
      getAllResults,
      addToQuestionBank,
      removeFromQuestionBank,
      updateQuestionInBank,
      clearQuestionBank,
      refreshQuestionBank
    }}>
      {children}
    </ExamContext.Provider>
  );
}

export function useExam() {
  const context = useContext(ExamContext);
  if (context === undefined) {
    throw new Error('useExam must be used within an ExamProvider');
  }
  return context;
}
