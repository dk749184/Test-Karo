// ============================================
// ADMIN RESULTS PAGE
// View all student exam results with question-wise analysis
// ============================================

import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  Trophy, Search, Download, Eye, RefreshCw,
  CheckCircle, XCircle, AlertTriangle, Clock,
  Users, TrendingUp, X, Mail, FileText
} from 'lucide-react';

interface ExamAttempt {
  id: string;
  exam_id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  unanswered: number;
  violation_count: number;
  is_terminated: boolean;
  status: string;
  created_at: string;
  // Joined data
  student_name?: string;
  student_email?: string;
  student_roll?: string;
  student_phone?: string;
  student_department?: string;
  exam_title?: string;
  exam_subject?: string;
  exam_duration?: number;
}

interface StudentAnswer {
  id: string;
  selected_answer: string;
  is_correct: boolean;
  questions: {
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_answer: string;
  } | null;
}

export function AdminResults() {
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [examFilter, setExamFilter] = useState('all');
  const [selectedAttempt, setSelectedAttempt] = useState<ExamAttempt | null>(null);
  const [exams, setExams] = useState<{ id: string; title: string }[]>([]);
  const [questionDetails, setQuestionDetails] = useState<StudentAnswer[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Load results
  const loadResults = async () => {
    setIsLoading(true);
    
    try {
      let allAttempts: ExamAttempt[] = [];
      
      if (isSupabaseConfigured()) {
        console.log('Loading results from Supabase...');
        
        // Load exam attempts with student and exam info
        const { data: attemptsData, error: attemptsError } = await supabase
          .from('exam_attempts')
          .select(`
            *,
            users:user_id (name, email, roll_number, phone, department),
            exams:exam_id (title, subject, duration)
          `)
          .order('created_at', { ascending: false });

        console.log('Attempts data:', attemptsData);
        console.log('Attempts error:', attemptsError);

        if (!attemptsError && attemptsData) {
          const formattedAttempts: ExamAttempt[] = attemptsData.map((a: Record<string, unknown>) => ({
            id: a.id as string,
            exam_id: a.exam_id as string,
            user_id: a.user_id as string,
            start_time: a.start_time as string,
            end_time: a.end_time as string,
            score: a.score as number || 0,
            total_questions: a.total_questions as number || 0,
            correct_answers: a.correct_answers as number || 0,
            wrong_answers: a.wrong_answers as number || 0,
            unanswered: a.unanswered as number || 0,
            violation_count: a.violation_count as number || 0,
            is_terminated: a.is_terminated as boolean || false,
            status: a.status as string || 'completed',
            created_at: a.created_at as string,
            student_name: (a.users as { name?: string })?.name || 'Unknown',
            student_email: (a.users as { email?: string })?.email || '',
            student_roll: (a.users as { roll_number?: string })?.roll_number || '',
            student_phone: (a.users as { phone?: string })?.phone || '',
            student_department: (a.users as { department?: string })?.department || '',
            exam_title: (a.exams as { title?: string })?.title || 'Unknown Exam',
            exam_subject: (a.exams as { subject?: string })?.subject || '',
            exam_duration: (a.exams as { duration?: number })?.duration || 60
          }));
          allAttempts = [...allAttempts, ...formattedAttempts];
        }

        // Load exams for filter
        const { data: examsData } = await supabase
          .from('exams')
          .select('id, title');
        
        if (examsData) {
          setExams(examsData);
        }
      }
      
      // ALSO load from localStorage (for exams not in Supabase)
      const savedResults = localStorage.getItem('examResults');
      if (savedResults) {
        const localResults = JSON.parse(savedResults);
        console.log('Local results:', localResults);
        
        const localAttempts: ExamAttempt[] = localResults.map((r: Record<string, unknown>) => ({
          id: r.id as string || `local-${Date.now()}`,
          exam_id: r.exam_id as string || r.examId as string,
          user_id: r.user_id as string || r.studentId as string,
          start_time: r.start_time as string || r.submittedAt as string,
          end_time: r.end_time as string || r.submittedAt as string,
          score: r.score as number || r.percentage as number || 0,
          total_questions: r.total_questions as number || r.totalMarks as number || 0,
          correct_answers: r.correct_answers as number || r.correctAnswers as number || 0,
          wrong_answers: r.wrong_answers as number || r.wrongAnswers as number || 0,
          unanswered: r.unanswered as number || 0,
          violation_count: r.violation_count as number || r.violationCount as number || 0,
          is_terminated: r.is_terminated as boolean || false,
          status: r.status as string || 'completed',
          created_at: r.created_at as string || r.submittedAt as string || new Date().toISOString(),
          student_name: r.student_name as string || r.studentName as string || 'Unknown',
          student_email: r.student_email as string || r.email as string || '',
          student_roll: r.student_roll as string || r.rollNumber as string || '',
          student_phone: r.student_phone as string || '',
          student_department: r.student_department as string || '',
          exam_title: r.exam_title as string || r.examTitle as string || 'Unknown Exam',
          exam_subject: r.exam_subject as string || r.subject as string || '',
          exam_duration: r.exam_duration as number || 60
        }));
        
        // Add local results that aren't already in Supabase results
        const existingIds = new Set(allAttempts.map(a => a.id));
        localAttempts.forEach(la => {
          if (!existingIds.has(la.id)) {
            allAttempts.push(la);
          }
        });
      }
      
      // Sort by created_at descending
      allAttempts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setAttempts(allAttempts);
      console.log('Total attempts loaded:', allAttempts.length);
      
    } catch (error) {
      console.error('Error loading results:', error);
      
      // Fallback to localStorage only
      const savedResults = localStorage.getItem('examResults');
      if (savedResults) {
        const localResults = JSON.parse(savedResults);
        const localAttempts: ExamAttempt[] = localResults.map((r: Record<string, unknown>) => ({
          id: r.id as string || `local-${Date.now()}`,
          exam_id: r.exam_id as string || r.examId as string,
          user_id: r.user_id as string || r.studentId as string,
          start_time: r.start_time as string || r.submittedAt as string,
          end_time: r.end_time as string || r.submittedAt as string,
          score: r.score as number || r.percentage as number || 0,
          total_questions: r.total_questions as number || r.totalMarks as number || 0,
          correct_answers: r.correct_answers as number || r.correctAnswers as number || 0,
          wrong_answers: r.wrong_answers as number || r.wrongAnswers as number || 0,
          unanswered: r.unanswered as number || 0,
          violation_count: r.violation_count as number || r.violationCount as number || 0,
          is_terminated: r.is_terminated as boolean || false,
          status: r.status as string || 'completed',
          created_at: r.created_at as string || r.submittedAt as string || new Date().toISOString(),
          student_name: r.student_name as string || r.studentName as string || 'Unknown',
          student_email: r.student_email as string || '',
          student_roll: r.student_roll as string || '',
          student_phone: r.student_phone as string || '',
          student_department: r.student_department as string || '',
          exam_title: r.exam_title as string || r.examTitle as string || 'Unknown Exam',
          exam_subject: r.exam_subject as string || '',
          exam_duration: r.exam_duration as number || 60
        }));
        setAttempts(localAttempts);
      }
    }
    
    setIsLoading(false);
  };

  // Load question-wise details for an attempt
  const loadQuestionDetails = async (attemptId: string) => {
    setLoadingDetails(true);
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('student_answers')
          .select(`
            *,
            questions:question_id (
              question_text,
              option_a,
              option_b,
              option_c,
              option_d,
              correct_answer
            )
          `)
          .eq('attempt_id', attemptId);

        if (error) {
          console.error('Error loading question details:', error);
        } else {
          setQuestionDetails(data || []);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
    setLoadingDetails(false);
  };

  // View attempt details
  const viewAttemptDetails = (attempt: ExamAttempt) => {
    setSelectedAttempt(attempt);
    loadQuestionDetails(attempt.id);
  };

  // Download result as text file
  const downloadResult = (attempt: ExamAttempt) => {
    const percentage = getPercentage(attempt);
    const { grade } = getGrade(percentage);
    
    let content = `
╔══════════════════════════════════════════════════════════════╗
║                   TESTKARO - EXAM RESULT                     ║
║                  परीक्षा का नया तरीका                          ║
╚══════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════
                      STUDENT DETAILS
═══════════════════════════════════════════════════════════════
Name        : ${attempt.student_name}
Email       : ${attempt.student_email}
Roll Number : ${attempt.student_roll || 'N/A'}
Phone       : ${attempt.student_phone || 'N/A'}
Department  : ${attempt.student_department || 'N/A'}

═══════════════════════════════════════════════════════════════
                       EXAM DETAILS
═══════════════════════════════════════════════════════════════
Exam Title  : ${attempt.exam_title}
Subject     : ${attempt.exam_subject}
Duration    : ${attempt.exam_duration || 60} minutes
Date        : ${formatDate(attempt.created_at)}
Time Taken  : ${getTimeTaken(attempt.start_time, attempt.end_time)}

═══════════════════════════════════════════════════════════════
                        SCORE CARD
═══════════════════════════════════════════════════════════════

              SCORE: ${percentage}%      GRADE: ${grade}

Total Questions    : ${attempt.total_questions}
Correct Answers    : ${attempt.correct_answers} ✓
Wrong Answers      : ${attempt.wrong_answers} ✗
Unanswered         : ${attempt.unanswered} -
Violations         : ${attempt.violation_count}

Status             : ${attempt.is_terminated ? 'TERMINATED' : (percentage >= 40 ? 'PASSED' : 'FAILED')}

═══════════════════════════════════════════════════════════════
                   QUESTION-WISE ANALYSIS
═══════════════════════════════════════════════════════════════
`;

    if (questionDetails.length > 0) {
      questionDetails.forEach((answer, index) => {
        const q = answer.questions;
        if (q) {
          content += `
───────────────────────────────────────────────────────────────
Q${index + 1}. ${q.question_text}
───────────────────────────────────────────────────────────────
   A) ${q.option_a}
   B) ${q.option_b}
   C) ${q.option_c}
   D) ${q.option_d}

   Your Answer    : ${answer.selected_answer || 'Not Answered'}
   Correct Answer : ${q.correct_answer}
   Result         : ${answer.is_correct ? '✓ CORRECT' : answer.selected_answer ? '✗ WRONG' : '- SKIPPED'}
`;
        }
      });
    }

    content += `
═══════════════════════════════════════════════════════════════
Generated by TestKaro - AI Online Examination System
Date: ${new Date().toLocaleString('en-IN')}
© 2024 TestKaro. All rights reserved.
═══════════════════════════════════════════════════════════════
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Result_${attempt.student_name?.replace(/\s+/g, '_')}_${attempt.exam_title?.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Email result to student
  const emailResult = (attempt: ExamAttempt) => {
    const percentage = getPercentage(attempt);
    const { grade } = getGrade(percentage);
    
    const subject = `📊 Your Exam Result - ${attempt.exam_title} | TestKaro`;
    const body = `
Dear ${attempt.student_name},

Your exam result for "${attempt.exam_title}" is now available.

═══════════════════════════════════════
          📋 RESULT SUMMARY
═══════════════════════════════════════

📝 Exam: ${attempt.exam_title}
📚 Subject: ${attempt.exam_subject}
📅 Date: ${formatDate(attempt.created_at)}

═══════════════════════════════════════
          🎯 YOUR SCORE
═══════════════════════════════════════

Score: ${percentage}%
Grade: ${grade}
Status: ${attempt.is_terminated ? 'Terminated' : (percentage >= 40 ? 'PASSED ✅' : 'FAILED ❌')}

✓ Correct: ${attempt.correct_answers}
✗ Wrong: ${attempt.wrong_answers}
○ Skipped: ${attempt.unanswered}

═══════════════════════════════════════

${percentage >= 40 
  ? '🎉 Congratulations on passing the exam!' 
  : '📚 Keep practicing and try again!'}

For detailed question-wise analysis, please login to your TestKaro account.

Best Regards,
TestKaro Team
परीक्षा का नया तरीका
    `.trim();

    window.location.href = `mailto:${attempt.student_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  useEffect(() => {
    loadResults();
  }, []);

  // Filter attempts
  const filteredAttempts = attempts.filter(attempt => {
    const matchesSearch = 
      (attempt.student_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (attempt.student_email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (attempt.exam_title?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'passed' && attempt.score >= 40) ||
      (statusFilter === 'failed' && attempt.score < 40 && !attempt.is_terminated) ||
      (statusFilter === 'terminated' && attempt.is_terminated);

    const matchesExam = examFilter === 'all' || attempt.exam_id === examFilter;

    return matchesSearch && matchesStatus && matchesExam;
  });

  // Stats
  const totalAttempts = attempts.length;
  const passedCount = attempts.filter(a => a.score >= 40 && !a.is_terminated).length;
  const failedCount = attempts.filter(a => a.score < 40 && !a.is_terminated).length;
  const terminatedCount = attempts.filter(a => a.is_terminated).length;
  const averageScore = totalAttempts > 0 
    ? Math.round(attempts.reduce((sum, a) => sum + (a.score || 0), 0) / totalAttempts) 
    : 0;

  // Calculate percentage
  const getPercentage = (attempt: ExamAttempt) => {
    if (!attempt.total_questions) return 0;
    return Math.round((attempt.correct_answers / attempt.total_questions) * 100);
  };

  // Get grade
  const getGrade = (percentage: number) => {
    if (percentage >= 90) return { grade: 'A+', color: 'text-green-600 bg-green-100' };
    if (percentage >= 80) return { grade: 'A', color: 'text-green-600 bg-green-100' };
    if (percentage >= 70) return { grade: 'B+', color: 'text-blue-600 bg-blue-100' };
    if (percentage >= 60) return { grade: 'B', color: 'text-blue-600 bg-blue-100' };
    if (percentage >= 50) return { grade: 'C', color: 'text-yellow-600 bg-yellow-100' };
    if (percentage >= 40) return { grade: 'D', color: 'text-orange-600 bg-orange-100' };
    return { grade: 'F', color: 'text-red-600 bg-red-100' };
  };

  // Format date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate time taken
  const getTimeTaken = (start: string, end: string) => {
    if (!start || !end) return 'N/A';
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Student Name', 'Email', 'Roll No', 'Exam', 'Subject', 'Score %', 'Grade', 'Correct', 'Wrong', 'Violations', 'Status', 'Date'];
    const rows = filteredAttempts.map(a => {
      const percentage = getPercentage(a);
      const { grade } = getGrade(percentage);
      return [
        a.student_name,
        a.student_email,
        a.student_roll,
        a.exam_title,
        a.exam_subject,
        `${percentage}%`,
        grade,
        a.correct_answers,
        a.wrong_answers,
        a.violation_count,
        a.is_terminated ? 'Terminated' : (percentage >= 40 ? 'Passed' : 'Failed'),
        formatDate(a.created_at)
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'exam_results.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="w-7 h-7 text-indigo-600" />
            Student Results
          </h1>
          <p className="text-gray-600 mt-1">View all exam results and performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadResults}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm">Total Attempts</p>
              <p className="text-3xl font-bold">{totalAttempts}</p>
            </div>
            <Users className="w-10 h-10 opacity-50" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-r from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Passed</p>
              <p className="text-3xl font-bold">{passedCount}</p>
            </div>
            <CheckCircle className="w-10 h-10 opacity-50" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-r from-red-500 to-red-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Failed</p>
              <p className="text-3xl font-bold">{failedCount}</p>
            </div>
            <XCircle className="w-10 h-10 opacity-50" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Terminated</p>
              <p className="text-3xl font-bold">{terminatedCount}</p>
            </div>
            <AlertTriangle className="w-10 h-10 opacity-50" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Avg Score</p>
              <p className="text-3xl font-bold">{averageScore}%</p>
            </div>
            <TrendingUp className="w-10 h-10 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by student name, email, or exam..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="passed">✅ Passed</option>
              <option value="failed">❌ Failed</option>
              <option value="terminated">⚠️ Terminated</option>
            </select>
            <select
              value={examFilter}
              onChange={(e) => setExamFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Exams</option>
              {exams.map(exam => (
                <option key={exam.id} value={exam.id}>{exam.title}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Loading State */}
      {isLoading ? (
        <Card className="p-12 text-center">
          <RefreshCw className="w-12 h-12 text-indigo-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading results...</p>
        </Card>
      ) : filteredAttempts.length === 0 ? (
        <Card className="p-12 text-center">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Results Found</h3>
          <p className="text-gray-500">
            {searchTerm || statusFilter !== 'all' || examFilter !== 'all'
              ? 'Try different filters or search terms'
              : 'Results will appear here after students complete exams'}
          </p>
        </Card>
      ) : (
        /* Results Table */
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exam</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAttempts.map((attempt) => {
                  const percentage = getPercentage(attempt);
                  const { grade, color } = getGrade(percentage);
                  
                  return (
                    <tr key={attempt.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{attempt.student_name}</p>
                          <p className="text-sm text-gray-500">{attempt.student_email}</p>
                          {attempt.student_roll && (
                            <p className="text-xs text-indigo-600">#{attempt.student_roll}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{attempt.exam_title}</p>
                          <p className="text-sm text-gray-500">{attempt.exam_subject}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${percentage >= 40 ? 'bg-green-500' : 'bg-red-500'}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className={`font-bold ${percentage >= 40 ? 'text-green-600' : 'text-red-600'}`}>
                            {percentage}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${color}`}>
                          {grade}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm">
                          <p className="text-green-600">✓ {attempt.correct_answers} correct</p>
                          <p className="text-red-600">✗ {attempt.wrong_answers} wrong</p>
                          {attempt.unanswered > 0 && (
                            <p className="text-gray-500">○ {attempt.unanswered} skipped</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {attempt.is_terminated ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            <AlertTriangle className="w-3 h-3" />
                            Terminated
                          </span>
                        ) : percentage >= 40 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <CheckCircle className="w-3 h-3" />
                            Passed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            <XCircle className="w-3 h-3" />
                            Failed
                          </span>
                        )}
                        {attempt.violation_count > 0 && (
                          <p className="text-xs text-orange-600 mt-1">
                            ⚠️ {attempt.violation_count} violations
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-500">
                          <p>{formatDate(attempt.created_at)}</p>
                          <p className="flex items-center gap-1 text-xs">
                            <Clock className="w-3 h-3" />
                            {getTimeTaken(attempt.start_time, attempt.end_time)}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-1">
                          <button
                            onClick={() => viewAttemptDetails(attempt)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => emailResult(attempt)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Email Result"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Result Details Modal */}
      {selectedAttempt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
                  {selectedAttempt.student_name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedAttempt.student_name}</h3>
                  <p className="text-indigo-200 text-sm">{selectedAttempt.student_email}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setSelectedAttempt(null);
                  setQuestionDetails([]);
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Student & Exam Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Student Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-500">Roll No:</span> <span className="font-medium">{selectedAttempt.student_roll || 'N/A'}</span></p>
                    <p><span className="text-gray-500">Phone:</span> <span className="font-medium">{selectedAttempt.student_phone || 'N/A'}</span></p>
                    <p><span className="text-gray-500">Department:</span> <span className="font-medium">{selectedAttempt.student_department || 'N/A'}</span></p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Exam Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-500">Exam:</span> <span className="font-medium">{selectedAttempt.exam_title}</span></p>
                    <p><span className="text-gray-500">Subject:</span> <span className="font-medium">{selectedAttempt.exam_subject}</span></p>
                    <p><span className="text-gray-500">Date:</span> <span className="font-medium">{formatDate(selectedAttempt.created_at)}</span></p>
                    <p><span className="text-gray-500">Time Taken:</span> <span className="font-medium">{getTimeTaken(selectedAttempt.start_time, selectedAttempt.end_time)}</span></p>
                  </div>
                </div>
              </div>

              {/* Score Card */}
              <div className={`rounded-xl p-6 mb-6 text-center ${
                getPercentage(selectedAttempt) >= 40 ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200' : 'bg-gradient-to-r from-red-50 to-orange-50 border border-red-200'
              }`}>
                <p className="text-gray-600 mb-2">Final Score</p>
                <p className={`text-6xl font-bold ${
                  getPercentage(selectedAttempt) >= 40 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {getPercentage(selectedAttempt)}%
                </p>
                <p className="text-gray-600 mt-3">
                  Grade: <span className={`text-2xl font-bold px-3 py-1 rounded ${getGrade(getPercentage(selectedAttempt)).color}`}>
                    {getGrade(getPercentage(selectedAttempt)).grade}
                  </span>
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-3xl font-bold text-blue-600">{selectedAttempt.total_questions}</p>
                  <p className="text-xs text-blue-600 font-medium">Total</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-3xl font-bold text-green-600">{selectedAttempt.correct_answers}</p>
                  <p className="text-xs text-green-600 font-medium">✓ Correct</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-3xl font-bold text-red-600">{selectedAttempt.wrong_answers}</p>
                  <p className="text-xs text-red-600 font-medium">✗ Wrong</p>
                </div>
                <div className="text-center p-4 bg-gray-100 rounded-lg border border-gray-200">
                  <p className="text-3xl font-bold text-gray-600">{selectedAttempt.unanswered}</p>
                  <p className="text-xs text-gray-600 font-medium">○ Skipped</p>
                </div>
              </div>

              {/* Violations Warning */}
              {selectedAttempt.violation_count > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-orange-700">
                      {selectedAttempt.violation_count} Violation(s) Detected
                    </p>
                    <p className="text-orange-600 text-sm">
                      {selectedAttempt.is_terminated 
                        ? 'Exam was terminated due to excessive violations' 
                        : 'Student attempted suspicious activities during exam'}
                    </p>
                  </div>
                </div>
              )}

              {/* Question-wise Analysis */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-gray-800 flex items-center gap-2">
                    📝 Question-wise Analysis
                  </h4>
                  <div className="flex gap-2 text-xs">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded">✓ Correct</span>
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded">✗ Wrong</span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">○ Skipped</span>
                  </div>
                </div>

                {loadingDetails ? (
                  <div className="text-center py-8">
                    <RefreshCw className="w-8 h-8 text-indigo-600 mx-auto mb-2 animate-spin" />
                    <p className="text-gray-500">Loading question details...</p>
                  </div>
                ) : questionDetails.length > 0 ? (
                  <div className="space-y-3">
                    {questionDetails.map((answer, index) => {
                      const q = answer.questions;
                      if (!q) return null;
                      
                      return (
                        <div 
                          key={answer.id}
                          className={`p-4 rounded-lg border-2 ${
                            answer.is_correct 
                              ? 'bg-green-50 border-green-300' 
                              : answer.selected_answer 
                                ? 'bg-red-50 border-red-300'
                                : 'bg-gray-50 border-gray-300'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                              answer.is_correct ? 'bg-green-500' : answer.selected_answer ? 'bg-red-500' : 'bg-gray-400'
                            }`}>
                              {answer.is_correct ? '✓' : answer.selected_answer ? '✗' : '○'}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-800 mb-3">
                                <span className="text-indigo-600 font-bold">Q{index + 1}.</span> {q.question_text}
                              </p>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                {['A', 'B', 'C', 'D'].map(opt => {
                                  const optionKey = `option_${opt.toLowerCase()}` as 'option_a' | 'option_b' | 'option_c' | 'option_d';
                                  const optionText = q[optionKey];
                                  const isCorrect = q.correct_answer === opt;
                                  const isSelected = answer.selected_answer === opt;
                                  
                                  return (
                                    <div 
                                      key={opt}
                                      className={`p-2 rounded-lg flex items-center gap-2 ${
                                        isCorrect 
                                          ? 'bg-green-100 border border-green-400' 
                                          : isSelected && !isCorrect
                                            ? 'bg-red-100 border border-red-400'
                                            : 'bg-white border border-gray-200'
                                      }`}
                                    >
                                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                        isCorrect 
                                          ? 'bg-green-500 text-white' 
                                          : isSelected
                                            ? 'bg-red-500 text-white'
                                            : 'bg-gray-200 text-gray-600'
                                      }`}>
                                        {opt}
                                      </span>
                                      <span className="flex-1">{optionText}</span>
                                      {isCorrect && <span className="text-green-600 text-xs font-semibold">✓ Correct</span>}
                                      {isSelected && !isCorrect && <span className="text-red-600 text-xs font-semibold">Your Answer</span>}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No question details available</p>
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <div className="text-center mb-6">
                {selectedAttempt.is_terminated ? (
                  <span className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-lg font-bold bg-red-100 text-red-700 border border-red-200">
                    <AlertTriangle className="w-6 h-6" />
                    TERMINATED
                  </span>
                ) : getPercentage(selectedAttempt) >= 40 ? (
                  <span className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-lg font-bold bg-green-100 text-green-700 border border-green-200">
                    <CheckCircle className="w-6 h-6" />
                    PASSED
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-lg font-bold bg-red-100 text-red-700 border border-red-200">
                    <XCircle className="w-6 h-6" />
                    FAILED
                  </span>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t bg-gray-50 flex flex-wrap gap-3 justify-end">
              <Button 
                variant="outline"
                onClick={() => downloadResult(selectedAttempt)}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Result
              </Button>
              <Button 
                variant="outline"
                onClick={() => emailResult(selectedAttempt)}
                className="flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Email to Student
              </Button>
              <Button 
                onClick={() => {
                  setSelectedAttempt(null);
                  setQuestionDetails([]);
                }}
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
