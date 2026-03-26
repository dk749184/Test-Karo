// ============================================
// MY RESULTS PAGE - Student
// FIXED:
// 1. Question-wise Analysis now works
// 2. localStorage email field case mismatch fixed
// 3. Supabase student_answers table se answers fetch hote hain
// ============================================

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

// ── Types ──────────────────────────────────
interface AnswerDetail {
  questionId: string;
  questionText: string;
  options: string[];
  selectedAnswer: number | null;
  correctAnswer: number;
  isCorrect: boolean;
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
  answers: AnswerDetail[];
}

const letterToIndex = (letter: string | null | undefined): number | null => {
  if (!letter) return null;
  const map: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
  return map[letter.toUpperCase()] ?? null;
};

const formatSeconds = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
};

export default function MyResults() {
  const { user } = useAuth();
  const [results, setResults] = useState<ExamResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<ExamResult | null>(null);
  const [loadingAnswers, setLoadingAnswers] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'passed' | 'failed'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { loadResults(); }, [user]);

  const loadResults = async () => {
    setLoading(true);
    try {
      // ── localStorage ──
      const raw = JSON.parse(localStorage.getItem('student_exam_results') || '[]');
      const localResults: ExamResult[] = raw
        .filter((r: any) => {
          // FIX: handle both casing variants
          const email = r.userEmail || r.useremail || '';
          return email === user?.email || r.userId === user?.id;
        })
        .map((r: any) => ({
          id: r.id,
          examId: r.examId,
          examTitle: r.examTitle || 'Unknown Exam',
          subject: r.subject || '',
          score: r.score || 0,
          totalQuestions: r.totalQuestions || 0,
          correctAnswers: r.correctAnswers || 0,
          wrongAnswers: r.wrongAnswers || 0,
          skippedAnswers: r.skippedAnswers || 0,
          percentage: r.score || 0,
          passed: r.passed ?? (r.score || 0) >= 40,
          violations: r.violationCount || r.violations || 0,
          timeTaken: r.timeTaken
            ? (typeof r.timeTaken === 'number' ? formatSeconds(r.timeTaken) : String(r.timeTaken))
            : 'N/A',
          submittedAt: r.submittedAt || new Date().toISOString(),
          // Map localStorage answer format to AnswerDetail
          answers: (r.answers || []).map((a: any) => ({
            questionId: a.questionId || '',
            questionText: a.questionText || '',
            options: [a.optionA || '', a.optionB || '', a.optionC || '', a.optionD || ''],
            selectedAnswer: typeof a.selectedAnswer === 'number' ? a.selectedAnswer : null,
            correctAnswer: typeof a.correctAnswer === 'number' ? a.correctAnswer : 0,
            isCorrect: !!a.isCorrect,
          })),
        }));

      // ── Supabase ──
      let supaResults: ExamResult[] = [];
      if (isSupabaseConfigured() && user?.id) {
        const { data: attempts } = await supabase
          .from('exam_attempts')
          .select('*, exams(title, subject)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (attempts && attempts.length > 0) {
          supaResults = attempts.map((r: any) => ({
            id: r.id,
            examId: r.exam_id,
            examTitle: r.exams?.title || 'Unknown Exam',
            subject: r.exams?.subject || '',
            score: r.score || 0,
            totalQuestions: r.total_questions || 0,
            correctAnswers: r.correct_answers || 0,
            wrongAnswers: r.wrong_answers || 0,
            skippedAnswers: r.unanswered || 0,
            percentage: r.score || 0,
            passed: (r.score || 0) >= 40,
            violations: r.violation_count || 0,
            timeTaken: 'N/A',
            submittedAt: r.end_time || r.created_at,
            answers: [], // loaded on demand
          }));
        }
      }

      // ── Merge & deduplicate ──
      const merged = [...localResults];
      for (const sr of supaResults) {
        if (!merged.find(r => r.id === sr.id)) merged.push(sr);
      }
      merged.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      setResults(merged);
    } catch (err) {
      console.error('Error loading results:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch answers from Supabase student_answers table when needed
  const loadAnswersForResult = async (result: ExamResult): Promise<ExamResult> => {
    if (result.answers && result.answers.length > 0) return result;
    if (!isSupabaseConfigured()) return result;

    setLoadingAnswers(true);
    try {
      const { data: rows } = await supabase
        .from('student_answers')
        .select('*')
        .eq('attempt_id', result.id)
        .order('created_at', { ascending: true });

      if (rows && rows.length > 0) {
        const answers: AnswerDetail[] = rows.map((a: any) => ({
          questionId: a.question_id || '',
          questionText: a.question_text || '',
          options: [a.option_a || '', a.option_b || '', a.option_c || '', a.option_d || ''],
          selectedAnswer: letterToIndex(a.selected_answer),
          correctAnswer: letterToIndex(a.correct_answer) ?? 0,
          isCorrect: !!a.is_correct,
        }));
        return { ...result, answers };
      }
    } catch (err) {
      console.error('Error fetching answers:', err);
    } finally {
      setLoadingAnswers(false);
    }
    return result;
  };

  const handleViewDetails = async (result: ExamResult) => {
    const enriched = await loadAnswersForResult(result);
    setSelectedResult(enriched);
  };

  const getGrade = (pct: number) => {
    if (pct >= 90) return { grade: 'A+', color: 'text-green-600', bg: 'bg-green-100' };
    if (pct >= 80) return { grade: 'A',  color: 'text-green-600', bg: 'bg-green-100' };
    if (pct >= 70) return { grade: 'B+', color: 'text-blue-600',  bg: 'bg-blue-100'  };
    if (pct >= 60) return { grade: 'B',  color: 'text-blue-600',  bg: 'bg-blue-100'  };
    if (pct >= 50) return { grade: 'C+', color: 'text-yellow-600',bg: 'bg-yellow-100'};
    if (pct >= 40) return { grade: 'C',  color: 'text-yellow-600',bg: 'bg-yellow-100'};
    return              { grade: 'F',  color: 'text-red-600',   bg: 'bg-red-100'   };
  };

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return d; }
  };

  const filteredResults = results.filter(r => {
    const matchFilter = filter === 'all' || (filter === 'passed' && r.passed) || (filter === 'failed' && !r.passed);
    const q = searchTerm.toLowerCase();
    const matchSearch = !q || r.examTitle.toLowerCase().includes(q) || r.subject.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const downloadResult = (result: ExamResult) => {
    const g = getGrade(result.percentage);
    const lbls = ['A', 'B', 'C', 'D'];
    const answersHTML = result.answers?.length > 0
      ? result.answers.map((ans, idx) => {
          const sc = ans.isCorrect ? '#16a34a' : ans.selectedAnswer === null ? '#6b7280' : '#dc2626';
          const st = ans.isCorrect ? '✓ CORRECT' : ans.selectedAnswer === null ? '○ SKIPPED' : '✗ WRONG';
          const opts = ans.options.map((opt, oi) => {
            let bg = '#f9fafb', bd = '#e5e7eb', fw = 'normal';
            if (oi === ans.correctAnswer) { bg = '#dcfce7'; bd = '#16a34a'; fw = 'bold'; }
            if (oi === ans.selectedAnswer && oi !== ans.correctAnswer) { bg = '#fee2e2'; bd = '#dc2626'; }
            const mark = oi === ans.correctAnswer && oi === ans.selectedAnswer ? ' ← Your Answer ✓'
              : oi === ans.correctAnswer ? ' ✓ Correct Answer'
              : oi === ans.selectedAnswer ? ' ✗ Your Answer' : '';
            return `<div style="padding:5px 10px;margin:3px 0;border-radius:5px;border:1.5px solid ${bd};background:${bg};font-weight:${fw}">${lbls[oi]}. ${opt}${mark}</div>`;
          }).join('');
          return `<div style="margin-bottom:14px;padding:12px;border-radius:8px;border:2px solid ${sc}40;background:${ans.isCorrect?'#f0fdf4':ans.selectedAnswer===null?'#f9fafb':'#fff1f2'}">
<div style="display:flex;gap:10px;margin-bottom:8px;align-items:flex-start">
<span style="background:${sc};color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:bold;white-space:nowrap">${st}</span>
<span><b>Q${idx+1}.</b> ${ans.questionText}</span></div>${opts}</div>`;
        }).join('')
      : '<p style="color:#6b7280">No detailed answer data available.</p>';

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Result</title>
<style>body{font-family:Arial,sans-serif;margin:0;padding:20px;color:#1f2937}
.hdr{background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;padding:20px;border-radius:12px;text-align:center;margin-bottom:20px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px}
.card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px}
.card label{font-size:11px;color:#64748b;text-transform:uppercase;display:block}
.card .val{font-size:22px;font-weight:bold;margin-top:4px}
.sec{font-size:16px;font-weight:bold;border-bottom:2px solid #4f46e5;padding-bottom:6px;margin:20px 0 12px;color:#4f46e5}
.footer{text-align:center;color:#94a3b8;font-size:11px;margin-top:30px;border-top:1px solid #e2e8f0;padding-top:10px}
</style></head><body>
<div class="hdr"><h1 style="margin:0;font-size:24px">📋 EXAM RESULT</h1>
<p style="margin:6px 0 0;opacity:.9">${result.examTitle} — ${result.subject}</p></div>
<div class="sec">📊 Summary</div>
<div class="grid">
<div class="card" style="background:${result.passed?'#f0fdf4':'#fff1f2'};border-color:${result.passed?'#16a34a':'#dc2626'}">
<label>Score</label><div class="val" style="color:${result.passed?'#16a34a':'#dc2626'}">${result.percentage.toFixed(1)}% ${result.passed?'✅ PASSED':'❌ FAILED'}</div></div>
<div class="card"><label>Grade</label><div class="val">${g.grade}</div></div>
<div class="card" style="background:#f0fdf4"><label>✓ Correct</label><div class="val" style="color:#16a34a">${result.correctAnswers}/${result.totalQuestions}</div></div>
<div class="card" style="background:#fff1f2"><label>✗ Wrong</label><div class="val" style="color:#dc2626">${result.wrongAnswers}</div></div>
<div class="card"><label>○ Skipped</label><div class="val" style="color:#6b7280">${result.skippedAnswers}</div></div>
<div class="card"><label>Time</label><div class="val" style="font-size:16px">${result.timeTaken}</div></div>
</div>
<div class="sec">📝 Question-wise Review</div>${answersHTML}
<div class="footer">TestKaro | ${new Date().toLocaleString()}</div></body></html>`;

    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 600); }
  };

  // ── Loading ────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto" />
          <p className="mt-4 text-gray-600">Loading your results...</p>
        </div>
      </div>
    );
  }

  // ── Detail View ────────────────────────
  if (selectedResult) {
    const g = getGrade(selectedResult.percentage);
    const lbls = ['A', 'B', 'C', 'D'];

    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">

          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
            <div className={`p-6 text-white ${selectedResult.passed ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-pink-600'}`}>
              <button onClick={() => setSelectedResult(null)} className="flex items-center gap-2 text-white/80 hover:text-white mb-4 text-sm">
                ← Back to All Results
              </button>
              <h1 className="text-2xl font-bold">{selectedResult.examTitle}</h1>
              <p className="opacity-80 text-sm">{selectedResult.subject}</p>
            </div>
            <div className="p-6 flex flex-wrap items-center justify-center gap-6">
              <div className="text-center">
                <div className={`text-6xl font-bold ${g.color}`}>{selectedResult.percentage.toFixed(0)}%</div>
                <div className={`inline-block px-4 py-1 rounded-full ${g.bg} ${g.color} font-semibold mt-2`}>Grade: {g.grade}</div>
              </div>
              <div className={`px-6 py-3 rounded-xl text-xl font-bold ${selectedResult.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {selectedResult.passed ? '✅ PASSED' : '❌ FAILED'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { l: 'Total Questions', v: selectedResult.totalQuestions, c: 'text-gray-800' },
              { l: 'Correct ✓',       v: selectedResult.correctAnswers, c: 'text-green-600' },
              { l: 'Wrong ✗',          v: selectedResult.wrongAnswers,   c: 'text-red-600' },
              { l: 'Skipped ○',        v: selectedResult.skippedAnswers, c: 'text-gray-400' },
            ].map(s => (
              <div key={s.l} className="bg-white p-4 rounded-xl shadow text-center">
                <div className={`text-3xl font-bold ${s.c}`}>{s.v}</div>
                <div className="text-gray-500 text-sm mt-1">{s.l}</div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">📝 Exam Details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Submitted On:</span><span className="ml-2 font-medium">{formatDate(selectedResult.submittedAt)}</span></div>
              <div><span className="text-gray-500">Time Taken:</span><span className="ml-2 font-medium">{selectedResult.timeTaken}</span></div>
              <div><span className="text-gray-500">Violations:</span><span className={`ml-2 font-medium ${selectedResult.violations > 0 ? 'text-red-600' : 'text-green-600'}`}>{selectedResult.violations}</span></div>
              <div><span className="text-gray-500">Status:</span><span className={`ml-2 font-medium ${selectedResult.passed ? 'text-green-600' : 'text-red-600'}`}>{selectedResult.passed ? 'Passed' : 'Failed'}</span></div>
            </div>
          </div>

          {/* ── Question-wise Analysis — FULLY FIXED ── */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">📝 Question-wise Analysis</h2>
              <button onClick={() => downloadResult(selectedResult)} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm">
                📥 Download Result
              </button>
            </div>

            {loadingAnswers ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent mx-auto" />
                <p className="mt-3 text-gray-500 text-sm">Loading question details from database...</p>
              </div>
            ) : selectedResult.answers && selectedResult.answers.length > 0 ? (
              <div className="space-y-4">
                {selectedResult.answers.map((ans, idx) => (
                  <div key={idx} className={`p-4 rounded-xl border-2 ${
                    ans.isCorrect ? 'border-green-200 bg-green-50'
                    : ans.selectedAnswer === null ? 'border-gray-200 bg-gray-50'
                    : 'border-red-200 bg-red-50'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${
                        ans.isCorrect ? 'bg-green-500' : ans.selectedAnswer === null ? 'bg-gray-400' : 'bg-red-500'
                      }`}>
                        {ans.isCorrect ? '✓' : ans.selectedAnswer === null ? '○' : '✗'}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 mb-3">Q{idx + 1}. {ans.questionText}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {ans.options.filter(o => o.trim() !== '').map((opt, oi) => {
                            const isCorr = oi === ans.correctAnswer;
                            const isSel  = oi === ans.selectedAnswer;
                            const isWrong = isSel && !isCorr;
                            return (
                              <div key={oi} className={`p-3 rounded-lg border-2 flex items-center gap-2 ${
                                isCorr ? 'border-green-500 bg-green-100'
                                : isWrong ? 'border-red-500 bg-red-100'
                                : 'border-gray-200 bg-white'
                              }`}>
                                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                  isCorr ? 'bg-green-500 text-white' : isWrong ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'
                                }`}>{lbls[oi]}</span>
                                <span className={`flex-1 text-sm ${isCorr ? 'font-semibold text-green-700' : isWrong ? 'text-red-700' : 'text-gray-700'}`}>{opt}</span>
                                {isCorr && isSel  && <span className="text-green-600 text-xs font-bold whitespace-nowrap">✓ Your Answer</span>}
                                {isCorr && !isSel && <span className="text-green-600 text-xs font-bold whitespace-nowrap">✓ Correct</span>}
                                {isWrong          && <span className="text-red-600 text-xs font-bold whitespace-nowrap">✗ Your Answer</span>}
                              </div>
                            );
                          })}
                        </div>
                        {ans.selectedAnswer === null && (
                          <p className="mt-2 text-gray-500 italic text-sm">
                            ○ Not answered — Correct answer: {lbls[ans.correctAnswer]}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500">
                <div className="text-4xl mb-3">📭</div>
                <p className="font-medium">Question details not available for this result.</p>
                <p className="text-sm mt-1 text-gray-400">This may be an older exam result where question data was not saved.</p>
              </div>
            )}
          </div>

          <div className="text-center pb-8">
            <button onClick={() => setSelectedResult(null)} className="px-8 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-900">
              ← Back to All Results
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── List View ──────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 mb-6 text-white">
          <h1 className="text-2xl font-bold">📊 My Exam Results</h1>
          <p className="opacity-80 text-sm mt-1">View all your past exam results with detailed analysis</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { l: 'Total Exams', v: results.length,                         c: 'text-blue-600'   },
            { l: 'Passed',      v: results.filter(r => r.passed).length,   c: 'text-green-600'  },
            { l: 'Failed',      v: results.filter(r => !r.passed).length,  c: 'text-red-600'    },
            { l: 'Avg Score',
              v: results.length > 0 ? (results.reduce((s,r) => s+r.percentage,0)/results.length).toFixed(0)+'%' : '0%',
              c: 'text-purple-600' },
          ].map(s => (
            <div key={s.l} className="bg-white p-4 rounded-xl shadow text-center">
              <div className={`text-3xl font-bold ${s.c}`}>{s.v}</div>
              <div className="text-gray-500 text-sm mt-1">{s.l}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <input type="text" placeholder="🔍 Search exams..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[200px] px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <div className="flex gap-2">
              {(['all','passed','failed'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                    filter === f
                      ? f==='all' ? 'bg-blue-500 text-white' : f==='passed' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}>
                  {f==='all' ? 'All' : f==='passed' ? '✅ Passed' : '❌ Failed'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredResults.length > 0 ? (
          <div className="space-y-4">
            {filteredResults.map(result => {
              const g = getGrade(result.percentage);
              return (
                <div key={result.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="flex flex-col md:flex-row">
                    <div className={`p-6 flex items-center justify-center text-white md:w-32 ${result.passed ? 'bg-green-500' : 'bg-red-500'}`}>
                      <div className="text-center">
                        <div className="text-3xl font-bold">{result.percentage.toFixed(0)}%</div>
                        <div className={`text-xs px-2 py-0.5 rounded mt-1 ${g.bg} ${g.color}`}>{g.grade}</div>
                      </div>
                    </div>
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div>
                          <h3 className="text-lg font-bold text-gray-800">{result.examTitle}</h3>
                          <p className="text-gray-500 text-sm">{result.subject}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${result.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {result.passed ? '✅ Passed' : '❌ Failed'}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
                        <span>📅 {formatDate(result.submittedAt)}</span>
                        <span>⏱️ {result.timeTaken}</span>
                        <span>✓ {result.correctAnswers}/{result.totalQuestions}</span>
                        {result.violations > 0 && <span className="text-red-500">⚠️ {result.violations} violations</span>}
                      </div>
                      <div className="mt-3">
                        <div className="flex gap-0.5 h-2 rounded overflow-hidden bg-gray-100">
                          <div className="bg-green-500" style={{width:`${(result.correctAnswers/(result.totalQuestions||1))*100}%`}} />
                          <div className="bg-red-400"   style={{width:`${(result.wrongAnswers/(result.totalQuestions||1))*100}%`}} />
                          <div className="bg-gray-300"  style={{width:`${(result.skippedAnswers/(result.totalQuestions||1))*100}%`}} />
                        </div>
                        <div className="flex justify-between text-xs mt-1 text-gray-500">
                          <span className="text-green-600">✓ {result.correctAnswers} correct</span>
                          <span className="text-red-500">✗ {result.wrongAnswers} wrong</span>
                          <span className="text-gray-400">○ {result.skippedAnswers} skipped</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 flex items-center border-l">
                      <button onClick={() => handleViewDetails(result)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 whitespace-nowrap text-sm font-medium">
                        👁️ View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Results Found</h3>
            <p className="text-gray-500">
              {results.length === 0 ? "You haven't taken any exams yet." : 'No results match your search.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
