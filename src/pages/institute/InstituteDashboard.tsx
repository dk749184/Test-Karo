// ============================================
// INSTITUTE DASHBOARD
// Institute can view their students & results
// Students are linked via Institute Code
// ============================================

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  Building2, Users, BarChart3, Trophy, Search,
  Eye, X, CheckCircle, XCircle, Hash, Mail,
  Phone, BookOpen, TrendingUp, AlertCircle,
  Download, RefreshCw, GraduationCap, Calendar,
  ChevronDown, ChevronUp, Award
} from 'lucide-react';

// ── Types ──────────────────────────────────
interface StudentData {
  id: string;
  name: string;
  email: string;
  rollNumber?: string;
  phone?: string;
  department?: string;
  semester?: string;
  registeredAt?: string;
  instituteCode?: string;
}

interface ExamResult {
  id: string;
  examId: string;
  examTitle: string;
  subject: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  skippedAnswers: number;
  percentage: number;
  passed: boolean;
  violations: number;
  timeTaken: string;
  submittedAt: string;
  userId?: string;
  useremail?: string;
}

interface StudentWithResults extends StudentData {
  results: ExamResult[];
  totalExams: number;
  avgScore: number;
  passed: number;
  failed: number;
}

// ── Stat Card ──────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  color,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl border p-5 flex items-center gap-4 shadow-sm">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Grade Badge ────────────────────────────
function GradeBadge({ pct }: { pct: number }) {
  const g =
    pct >= 90 ? { label: 'A+', cls: 'bg-green-100 text-green-700' } :
    pct >= 80 ? { label: 'A',  cls: 'bg-green-100 text-green-600' } :
    pct >= 70 ? { label: 'B+', cls: 'bg-blue-100 text-blue-700'   } :
    pct >= 60 ? { label: 'B',  cls: 'bg-blue-100 text-blue-600'   } :
    pct >= 50 ? { label: 'C',  cls: 'bg-yellow-100 text-yellow-700'} :
                { label: 'F',  cls: 'bg-red-100 text-red-600'     };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${g.cls}`}>
      {g.label}
    </span>
  );
}

// ── Main Component ─────────────────────────
export function InstituteDashboard() {
  const { user, getAllStudents } = useAuth();

  const [students, setStudents] = useState<StudentWithResults[]>([]);
  const [filtered, setFiltered] = useState<StudentWithResults[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'students' | 'results'>('students');
  const [selectedStudent, setSelectedStudent] = useState<StudentWithResults | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const instituteCode = user?.instituteCode || '';
  const instituteName = user?.instituteName || user?.name || 'Institute';

  // ── Load data ──────────────────────────
  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      let myStudents: any[] = [];

      // Try Supabase first
      if (isSupabaseConfigured()) {
        const { data: supaStudents } = await supabase
          .from('users')
          .select('*')
          .eq('role', 'student')
          .eq('student_institute_code', instituteCode.toUpperCase());
        if (supaStudents && supaStudents.length > 0) {
          myStudents = supaStudents.map((u: any) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            rollNumber: u.roll_number,
            phone: u.phone,
            department: u.department,
            semester: u.semester,
            instituteCode: u.student_institute_code,
            registeredAt: u.created_at,
          }));
        }
      }

      // Fallback: localStorage
      if (myStudents.length === 0) {
        const allStudents = await getAllStudents();
        myStudents = allStudents.filter(
          s => s.instituteCode && s.instituteCode.trim().toUpperCase() === instituteCode.trim().toUpperCase()
        );
      }

      // Load all local results
      const allResults: ExamResult[] = JSON.parse(
        localStorage.getItem('student_exam_results') || '[]'
      );
      
      // Also try Supabase results
      let supaResults: ExamResult[] = [];
      if (isSupabaseConfigured() && myStudents.length > 0) {
        const studentIds = myStudents.map((s: any) => s.id);
        const { data: attempts } = await supabase
          .from('exam_attempts')
          .select('*, exams(title, subject)')
          .in('user_id', studentIds)
          .order('created_at', { ascending: false });
        if (attempts) {
          supaResults = attempts.map((a: any) => ({
            id: a.id,
            examId: a.exam_id,
            examTitle: a.exams?.title || 'Unknown Exam',
            subject: a.exams?.subject || '',
            score: a.score || 0,
            totalQuestions: a.total_questions,
            correctAnswers: a.correct_answers,
            wrongAnswers: a.wrong_answers,
            skippedAnswers: a.unanswered,
            percentage: a.total_questions > 0 ? Math.round((a.correct_answers / a.total_questions) * 100) : 0,
            passed: a.score >= 60,
            violations: a.violation_count,
            timeTaken: '',
            submittedAt: a.end_time || a.created_at,
            userId: a.user_id,
          }));
        }
      }

      // Merge results into each student (combine local + supabase)
      const combinedResults = [...allResults, ...supaResults];
      const enriched: StudentWithResults[] = myStudents.map((s: any) => {
        const results = combinedResults.filter((r: any) => {
          // Handle both casing variants of email field
          const rEmail = (r.userEmail || r.useremail || '').toLowerCase();
          const sEmail = (s.email || '').toLowerCase();
          return rEmail === sEmail || r.userId === s.id;
        });
        const total = results.length;
        const passed = results.filter((r: any) => r.passed || (r.score || r.percentage || 0) >= 60).length;
        const avgScore = total > 0
          ? Math.round(results.reduce((sum: number, r: any) => sum + (r.percentage || r.score || 0), 0) / total)
          : 0;
        return {
          ...s,
          results,
          totalExams: total,
          avgScore,
          passed,
          failed: total - passed,
        };
      });

      setStudents(enriched);
      setFiltered(enriched);
    } catch (err) {
      console.error('InstituteDashboard load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Filtering ──────────────────────────
  useEffect(() => {
    let list = [...students];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        s =>
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.rollNumber?.toLowerCase().includes(q)
      );
    }
    if (deptFilter) {
      list = list.filter(s => s.department === deptFilter);
    }
    setFiltered(list);
  }, [searchTerm, deptFilter, students]);

  const departments = [...new Set(students.map(s => s.department).filter(Boolean))];

  // ── Stats ──────────────────────────────
  const totalStudents = students.length;
  const totalAttempts = students.reduce((s, st) => s + st.totalExams, 0);
  const avgOverall =
    totalStudents > 0
      ? Math.round(students.reduce((s, st) => s + st.avgScore, 0) / totalStudents)
      : 0;
  const totalPassed = students.reduce((s, st) => s + st.passed, 0);

  // All results flat for Results tab
  const allResultsFlat = students.flatMap(s =>
    s.results.map((r: any) => ({
      ...r,
      studentName: s.name,
      studentRoll: s.rollNumber,
      studentDept: s.department,
      // Normalize percentage field
      percentage: r.percentage || r.score || 0,
      passed: r.passed ?? (r.percentage || r.score || 0) >= 60,
    }))
  ).sort((a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  // CSV Export
  const exportCSV = () => {
    const rows = [
      ['Student Name', 'Roll No', 'Department', 'Exam', 'Score%', 'Status', 'Date'],
      ...allResultsFlat.map(r => [
        r.studentName, r.studentRoll || '', r.studentDept || '',
        r.examTitle, `${r.percentage}%`,
        r.passed || r.percentage >= 60 ? 'Pass' : 'Fail',
        new Date(r.submittedAt).toLocaleDateString()
      ])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${instituteName.replace(/\s+/g, '_')}_results.csv`;
    a.click();
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  // ── Render ─────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{instituteName}</h1>
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                <Hash className="w-3 h-3" /> Institute Code:
                <span className="font-mono font-semibold text-indigo-600">{instituteCode}</span>
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={exportCSV}
            disabled={allResultsFlat.length === 0}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg text-sm font-medium text-white transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Institute Code Info Banner */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-indigo-700">
          <span className="font-semibold">Students linked via Institute Code: </span>
          <span className="font-mono font-bold">{instituteCode}</span>
          <span className="text-indigo-600"> — Students who registered with this code appear in your dashboard automatically.</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}       label="Total Students" value={totalStudents} color="bg-blue-100 text-blue-600" />
        <StatCard icon={BookOpen}    label="Total Attempts"  value={totalAttempts} color="bg-purple-100 text-purple-600" />
        <StatCard icon={TrendingUp}  label="Average Score"  value={`${avgOverall}%`} color="bg-orange-100 text-orange-600" />
        <StatCard icon={Trophy}      label="Total Passed"   value={totalPassed} color="bg-green-100 text-green-600" sub={totalAttempts > 0 ? `${Math.round(totalPassed * 100 / totalAttempts)}% pass rate` : undefined} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {(['students', 'results'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-all capitalize ${
              activeTab === tab
                ? 'bg-white text-indigo-600 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'students' ? (
              <span className="flex items-center gap-2"><Users className="w-4 h-4" />Students ({totalStudents})</span>
            ) : (
              <span className="flex items-center gap-2"><BarChart3 className="w-4 h-4" />All Results ({allResultsFlat.length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, roll no..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        {departments.length > 0 && (
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
          >
            <option value="">All Departments</option>
            {departments.map(d => <option key={d} value={d!}>{d}</option>)}
          </select>
        )}
      </div>

      {/* ── STUDENTS TAB ── */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">
                {totalStudents === 0
                  ? 'No students registered with your institute code yet.'
                  : 'No students match your search.'}
              </p>
              {totalStudents === 0 && (
                <p className="text-sm text-gray-400 mt-1">
                  Share your institute code <span className="font-mono font-bold text-indigo-500">{instituteCode}</span> with students during registration.
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">#</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Student</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Department</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Semester</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Exams</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Avg Score</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((s, i) => (
                    <>
                      <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4 text-sm text-gray-500">{i + 1}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm">
                              {s.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{s.name}</p>
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Hash className="w-3 h-3" />{s.rollNumber || '—'}
                              </p>
                              <p className="text-xs text-gray-400 flex items-center gap-1">
                                <Mail className="w-3 h-3" />{s.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-700">{s.department || '—'}</td>
                        <td className="px-5 py-4 text-sm text-gray-700">{s.semester || '—'}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-gray-700 font-medium">{s.totalExams}</span>
                            {s.totalExams > 0 && (
                              <div className="flex gap-2 text-xs">
                                <span className="flex items-center gap-0.5 text-green-600">
                                  <CheckCircle className="w-3 h-3" />{s.passed}
                                </span>
                                <span className="flex items-center gap-0.5 text-red-500">
                                  <XCircle className="w-3 h-3" />{s.failed}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {s.totalExams > 0 ? (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-100 rounded-full h-2 w-16">
                                <div
                                  className={`h-2 rounded-full ${s.avgScore >= 60 ? 'bg-green-500' : 'bg-red-400'}`}
                                  style={{ width: `${s.avgScore}%` }}
                                />
                              </div>
                              <span className={`text-sm font-semibold ${s.avgScore >= 60 ? 'text-green-600' : 'text-red-500'}`}>
                                {s.avgScore}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">No attempts</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {s.totalExams > 0 ? (
                            <button
                              onClick={() => { setSelectedStudent(s); toggleRow(s.id); }}
                              className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                            >
                              <Eye className="w-4 h-4" /> View Results
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">No results</span>
                          )}
                        </td>
                      </tr>

                      {/* Expandable results row */}
                      {expandedRows.has(s.id) && selectedStudent?.id === s.id && (
                        <tr key={`${s.id}-results`} className="bg-indigo-50">
                          <td colSpan={7} className="px-5 py-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-indigo-800 flex items-center gap-2">
                                <BarChart3 className="w-4 h-4" /> Results for {s.name}
                              </h4>
                              <button onClick={() => { setExpandedRows(new Set()); setSelectedStudent(null); }}>
                                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                              </button>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full bg-white rounded-lg border text-sm">
                                <thead className="bg-gray-50 border-b">
                                  <tr>
                                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600">Exam</th>
                                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600">Score</th>
                                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600">Grade</th>
                                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600">Status</th>
                                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600">Date</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y">
                                  {s.results.map(r => (
                                    <tr key={r.id} className="hover:bg-gray-50">
                                      <td className="px-4 py-2 font-medium text-gray-800">{r.examTitle}</td>
                                      <td className="px-4 py-2">
                                        <span className={`font-bold ${r.percentage >= 60 ? 'text-green-600' : 'text-red-500'}`}>
                                          {r.percentage}%
                                        </span>
                                        <span className="text-gray-400 text-xs ml-1">({r.correctAnswers}/{r.totalQuestions})</span>
                                      </td>
                                      <td className="px-4 py-2"><GradeBadge pct={r.percentage} /></td>
                                      <td className="px-4 py-2">
                                        {r.passed || r.percentage >= 60 ? (
                                          <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                                            <CheckCircle className="w-3 h-3" />Pass
                                          </span>
                                        ) : (
                                          <span className="flex items-center gap-1 text-red-500 text-xs font-medium">
                                            <XCircle className="w-3 h-3" />Fail
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-4 py-2 text-gray-500 text-xs">
                                        {new Date(r.submittedAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── RESULTS TAB ── */}
      {activeTab === 'results' && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          {allResultsFlat.length === 0 ? (
            <div className="text-center py-16">
              <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No exam results found for your students yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Student</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Exam</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Score</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Grade</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Department</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {allResultsFlat
                    .filter(r => {
                      if (!searchTerm && !deptFilter) return true;
                      const q = searchTerm.toLowerCase();
                      const nameMatch = !q || r.studentName?.toLowerCase().includes(q) || r.examTitle?.toLowerCase().includes(q);
                      const deptMatch = !deptFilter || r.studentDept === deptFilter;
                      return nameMatch && deptMatch;
                    })
                    .map((r, i) => (
                      <tr key={`${r.id}-${i}`} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-medium text-gray-900 text-sm">{r.studentName}</p>
                          <p className="text-xs text-gray-500">{r.studentRoll || '—'}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm text-gray-800 font-medium">{r.examTitle}</p>
                          <p className="text-xs text-gray-400">{r.subject || ''}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-sm font-bold ${r.percentage >= 60 ? 'text-green-600' : 'text-red-500'}`}>
                            {r.percentage}%
                          </span>
                          <p className="text-xs text-gray-400">{r.correctAnswers}/{r.totalQuestions} correct</p>
                        </td>
                        <td className="px-5 py-4"><GradeBadge pct={r.percentage} /></td>
                        <td className="px-5 py-4">
                          {r.passed || r.percentage >= 60 ? (
                            <span className="flex items-center gap-1 text-green-600 text-xs font-semibold">
                              <CheckCircle className="w-3.5 h-3.5" />Pass
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-500 text-xs font-semibold">
                              <XCircle className="w-3.5 h-3.5" />Fail
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600">{r.studentDept || '—'}</td>
                        <td className="px-5 py-4 text-xs text-gray-500">
                          {new Date(r.submittedAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
