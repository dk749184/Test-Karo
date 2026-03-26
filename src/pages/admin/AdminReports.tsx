import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

interface ReportStats {
  totalStudents: number;
  totalExams: number;
  totalAttempts: number;
  passedAttempts: number;
  failedAttempts: number;
  terminatedAttempts: number;
  averageScore: number;
  totalViolations: number;
}

interface TopPerformer {
  name: string;
  email: string;
  avgScore: number;
  totalExams: number;
  passRate: number;
}

interface SubjectStats {
  subject: string;
  attempts: number;
  avgScore: number;
  passRate: number;
}

interface DailyStats {
  date: string;
  attempts: number;
  passed: number;
  failed: number;
}

interface ViolationStats {
  type: string;
  count: number;
}

export default function AdminReports() {
  const [stats, setStats] = useState<ReportStats>({
    totalStudents: 0,
    totalExams: 0,
    totalAttempts: 0,
    passedAttempts: 0,
    failedAttempts: 0,
    terminatedAttempts: 0,
    averageScore: 0,
    totalViolations: 0
  });
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [subjectStats, setSubjectStats] = useState<SubjectStats[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [violationStats, setViolationStats] = useState<ViolationStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'exams' | 'violations'>('overview');
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('month');

  const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899'];

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      // Load from Supabase
      const [usersRes, examsRes, attemptsRes, violationsRes] = await Promise.all([
        supabase.from('users').select('*').eq('role', 'student'),
        supabase.from('exams').select('*'),
        supabase.from('exam_attempts').select(`
          *,
          users (name, email),
          exams (title, subject)
        `),
        supabase.from('violation_logs').select('*')
      ]);

      const students = usersRes.data || [];
      const exams = examsRes.data || [];
      const attempts = attemptsRes.data || [];
      const violations = violationsRes.data || [];

      // Calculate overall stats
      const passedAttempts = attempts.filter(a => a.status === 'completed' && (a.score || 0) >= 40).length;
      const failedAttempts = attempts.filter(a => a.status === 'completed' && (a.score || 0) < 40).length;
      const terminatedAttempts = attempts.filter(a => a.status === 'terminated' || a.is_terminated).length;
      const totalScore = attempts.reduce((sum, a) => sum + (a.score || 0), 0);
      const avgScore = attempts.length > 0 ? totalScore / attempts.length : 0;
      const totalViolations = attempts.reduce((sum, a) => sum + (a.violation_count || 0), 0);

      setStats({
        totalStudents: students.length,
        totalExams: exams.length,
        totalAttempts: attempts.length,
        passedAttempts,
        failedAttempts,
        terminatedAttempts,
        averageScore: Math.round(avgScore * 10) / 10,
        totalViolations
      });

      // Calculate top performers
      const studentScores: { [key: string]: { name: string; email: string; scores: number[]; passed: number } } = {};
      attempts.forEach(attempt => {
        const email = attempt.users?.email || 'unknown';
        const name = attempt.users?.name || 'Unknown';
        if (!studentScores[email]) {
          studentScores[email] = { name, email, scores: [], passed: 0 };
        }
        studentScores[email].scores.push(attempt.score || 0);
        if ((attempt.score || 0) >= 40) {
          studentScores[email].passed++;
        }
      });

      const performers: TopPerformer[] = Object.values(studentScores)
        .map(s => ({
          name: s.name,
          email: s.email,
          avgScore: Math.round((s.scores.reduce((a, b) => a + b, 0) / s.scores.length) * 10) / 10,
          totalExams: s.scores.length,
          passRate: Math.round((s.passed / s.scores.length) * 100)
        }))
        .sort((a, b) => b.avgScore - a.avgScore)
        .slice(0, 10);

      setTopPerformers(performers);

      // Calculate subject-wise stats
      const subjectData: { [key: string]: { attempts: number; totalScore: number; passed: number } } = {};
      attempts.forEach(attempt => {
        const subject = attempt.exams?.subject || 'Unknown';
        if (!subjectData[subject]) {
          subjectData[subject] = { attempts: 0, totalScore: 0, passed: 0 };
        }
        subjectData[subject].attempts++;
        subjectData[subject].totalScore += attempt.score || 0;
        if ((attempt.score || 0) >= 40) {
          subjectData[subject].passed++;
        }
      });

      const subjectStatsArray: SubjectStats[] = Object.entries(subjectData).map(([subject, data]) => ({
        subject,
        attempts: data.attempts,
        avgScore: Math.round((data.totalScore / data.attempts) * 10) / 10,
        passRate: Math.round((data.passed / data.attempts) * 100)
      }));

      setSubjectStats(subjectStatsArray);

      // Calculate daily stats (last 7/30/365 days based on dateRange)
      const days = dateRange === 'week' ? 7 : dateRange === 'month' ? 30 : 365;
      const dailyData: { [key: string]: { attempts: number; passed: number; failed: number } } = {};
      
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dailyData[dateStr] = { attempts: 0, passed: 0, failed: 0 };
      }

      attempts.forEach(attempt => {
        const dateStr = new Date(attempt.created_at).toISOString().split('T')[0];
        if (dailyData[dateStr]) {
          dailyData[dateStr].attempts++;
          if ((attempt.score || 0) >= 40) {
            dailyData[dateStr].passed++;
          } else {
            dailyData[dateStr].failed++;
          }
        }
      });

      const dailyStatsArray: DailyStats[] = Object.entries(dailyData)
        .map(([date, data]) => ({
          date: new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
          ...data
        }))
        .reverse();

      setDailyStats(dailyStatsArray);

      // Calculate violation stats
      const violationData: { [key: string]: number } = {
        'Tab Switch': 0,
        'Fullscreen Exit': 0,
        'Copy/Paste': 0,
        'Right Click': 0,
        'DevTools': 0,
        'Other': 0
      };

      violations.forEach(v => {
        const type = v.violation_type || 'Other';
        if (type.toLowerCase().includes('tab')) violationData['Tab Switch']++;
        else if (type.toLowerCase().includes('fullscreen')) violationData['Fullscreen Exit']++;
        else if (type.toLowerCase().includes('copy') || type.toLowerCase().includes('paste')) violationData['Copy/Paste']++;
        else if (type.toLowerCase().includes('right')) violationData['Right Click']++;
        else if (type.toLowerCase().includes('dev')) violationData['DevTools']++;
        else violationData['Other']++;
      });

      setViolationStats(
        Object.entries(violationData)
          .filter(([_, count]) => count > 0)
          .map(([type, count]) => ({ type, count }))
      );

    } catch (error) {
      console.error('Error loading report data:', error);
      // Load from localStorage as fallback
      loadFromLocalStorage();
    } finally {
      setLoading(false);
    }
  };

  const loadFromLocalStorage = () => {
    try {
      const users = JSON.parse(localStorage.getItem('examUsers') || '[]');
      const exams = JSON.parse(localStorage.getItem('exams') || '[]');
      const results = JSON.parse(localStorage.getItem('examResults') || '[]');

      const students = users.filter((u: any) => u.role === 'student');
      const passedAttempts = results.filter((r: any) => r.percentage >= 40).length;
      const failedAttempts = results.filter((r: any) => r.percentage < 40).length;
      const totalScore = results.reduce((sum: number, r: any) => sum + (r.percentage || 0), 0);

      setStats({
        totalStudents: students.length,
        totalExams: exams.length,
        totalAttempts: results.length,
        passedAttempts,
        failedAttempts,
        terminatedAttempts: results.filter((r: any) => r.terminated).length,
        averageScore: results.length > 0 ? Math.round((totalScore / results.length) * 10) / 10 : 0,
        totalViolations: results.reduce((sum: number, r: any) => sum + (r.violations || 0), 0)
      });
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  };

  const exportToPDF = () => {
    // Create printable content
    const content = `
      TESTKARO - EXAMINATION REPORTS
      ==============================
      Generated: ${new Date().toLocaleString()}
      
      OVERALL STATISTICS
      ------------------
      Total Students: ${stats.totalStudents}
      Total Exams: ${stats.totalExams}
      Total Attempts: ${stats.totalAttempts}
      Passed: ${stats.passedAttempts}
      Failed: ${stats.failedAttempts}
      Terminated: ${stats.terminatedAttempts}
      Average Score: ${stats.averageScore}%
      Pass Rate: ${stats.totalAttempts > 0 ? Math.round((stats.passedAttempts / stats.totalAttempts) * 100) : 0}%
      Total Violations: ${stats.totalViolations}
      
      TOP PERFORMERS
      --------------
      ${topPerformers.map((p, i) => `${i + 1}. ${p.name} - ${p.avgScore}% (${p.totalExams} exams)`).join('\n')}
      
      SUBJECT-WISE ANALYSIS
      ---------------------
      ${subjectStats.map(s => `${s.subject}: ${s.avgScore}% avg, ${s.passRate}% pass rate`).join('\n')}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TestKaro_Report_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToExcel = () => {
    let csv = 'TestKaro Examination Report\n\n';
    
    csv += 'Overall Statistics\n';
    csv += 'Metric,Value\n';
    csv += `Total Students,${stats.totalStudents}\n`;
    csv += `Total Exams,${stats.totalExams}\n`;
    csv += `Total Attempts,${stats.totalAttempts}\n`;
    csv += `Passed,${stats.passedAttempts}\n`;
    csv += `Failed,${stats.failedAttempts}\n`;
    csv += `Terminated,${stats.terminatedAttempts}\n`;
    csv += `Average Score,${stats.averageScore}%\n`;
    csv += `Total Violations,${stats.totalViolations}\n\n`;

    csv += 'Top Performers\n';
    csv += 'Rank,Name,Email,Average Score,Total Exams,Pass Rate\n';
    topPerformers.forEach((p, i) => {
      csv += `${i + 1},${p.name},${p.email},${p.avgScore}%,${p.totalExams},${p.passRate}%\n`;
    });
    csv += '\n';

    csv += 'Subject-wise Analysis\n';
    csv += 'Subject,Attempts,Average Score,Pass Rate\n';
    subjectStats.forEach(s => {
      csv += `${s.subject},${s.attempts},${s.avgScore}%,${s.passRate}%\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TestKaro_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const passRate = stats.totalAttempts > 0 ? Math.round((stats.passedAttempts / stats.totalAttempts) * 100) : 0;

  const pieData = [
    { name: 'Passed', value: stats.passedAttempts, color: '#10B981' },
    { name: 'Failed', value: stats.failedAttempts, color: '#EF4444' },
    { name: 'Terminated', value: stats.terminatedAttempts, color: '#F59E0B' }
  ].filter(d => d.value > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading report data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📊 Reports & Analytics</h1>
          <p className="text-gray-600">Comprehensive examination statistics and insights</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToPDF}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
          >
            📄 Export PDF
          </button>
          <button
            onClick={exportToExcel}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            📊 Export Excel
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        {[
          { id: 'overview', label: '📈 Overview', icon: '📈' },
          { id: 'students', label: '👥 Students', icon: '👥' },
          { id: 'exams', label: '📝 Exams', icon: '📝' },
          { id: 'violations', label: '⚠️ Violations', icon: '⚠️' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl text-white">
              <div className="text-3xl font-bold">{stats.totalStudents}</div>
              <div className="text-blue-100">Total Students</div>
              <div className="mt-2 text-sm text-blue-200">👥 Registered</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl text-white">
              <div className="text-3xl font-bold">{stats.totalExams}</div>
              <div className="text-purple-100">Total Exams</div>
              <div className="mt-2 text-sm text-purple-200">📝 Created</div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl text-white">
              <div className="text-3xl font-bold">{stats.totalAttempts}</div>
              <div className="text-green-100">Total Attempts</div>
              <div className="mt-2 text-sm text-green-200">✅ Completed</div>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl text-white">
              <div className="text-3xl font-bold">{stats.averageScore}%</div>
              <div className="text-orange-100">Average Score</div>
              <div className="mt-2 text-sm text-orange-200">📊 Overall</div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pass/Fail Pie Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">📊 Result Distribution</h3>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No data available
                </div>
              )}
            </div>

            {/* Subject-wise Bar Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">📚 Subject Performance</h3>
              {subjectStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={subjectStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="subject" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avgScore" name="Avg Score %" fill="#3B82F6" />
                    <Bar dataKey="passRate" name="Pass Rate %" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No data available
                </div>
              )}
            </div>
          </div>

          {/* Daily Trends */}
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">📅 Daily Trends</h3>
              <div className="flex gap-2">
                {(['week', 'month', 'year'] as const).map(range => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      dateRange === range
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {range === 'week' ? '7 Days' : range === 'month' ? '30 Days' : '1 Year'}
                  </button>
                ))}
              </div>
            </div>
            {dailyStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="attempts" name="Total Attempts" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="passed" name="Passed" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="failed" name="Failed" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
              <div className="text-2xl font-bold text-green-600">{stats.passedAttempts}</div>
              <div className="text-green-700">Passed</div>
              <div className="text-sm text-green-600 mt-1">{passRate}% pass rate</div>
            </div>
            <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
              <div className="text-2xl font-bold text-red-600">{stats.failedAttempts}</div>
              <div className="text-red-700">Failed</div>
              <div className="text-sm text-red-600 mt-1">{100 - passRate}% fail rate</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl">
              <div className="text-2xl font-bold text-yellow-600">{stats.terminatedAttempts}</div>
              <div className="text-yellow-700">Terminated</div>
              <div className="text-sm text-yellow-600 mt-1">Due to violations</div>
            </div>
            <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl">
              <div className="text-2xl font-bold text-purple-600">{stats.totalViolations}</div>
              <div className="text-purple-700">Violations</div>
              <div className="text-sm text-purple-600 mt-1">Anti-cheat triggered</div>
            </div>
          </div>
        </div>
      )}

      {/* Students Tab */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-semibold">🏆 Top Performers</h3>
            </div>
            {topPerformers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Rank</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Student</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Avg Score</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Exams</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Pass Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {topPerformers.map((performer, index) => (
                      <tr key={performer.email} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${
                            index === 0 ? 'bg-yellow-100 text-yellow-700' :
                            index === 1 ? 'bg-gray-100 text-gray-700' :
                            index === 2 ? 'bg-orange-100 text-orange-700' :
                            'bg-blue-50 text-blue-700'
                          }`}>
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium">{performer.name}</td>
                        <td className="px-4 py-3 text-gray-600">{performer.email}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                            performer.avgScore >= 80 ? 'bg-green-100 text-green-700' :
                            performer.avgScore >= 60 ? 'bg-blue-100 text-blue-700' :
                            performer.avgScore >= 40 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {performer.avgScore}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">{performer.totalExams}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${performer.passRate}%` }}
                              />
                            </div>
                            <span className="text-sm">{performer.passRate}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                No student data available yet
              </div>
            )}
          </div>

          {/* Student Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl">
              <div className="text-4xl font-bold text-blue-600">{stats.totalStudents}</div>
              <div className="text-blue-700 font-medium">Total Students</div>
              <div className="text-sm text-blue-600 mt-2">Registered on platform</div>
            </div>
            <div className="bg-green-50 border border-green-200 p-6 rounded-xl">
              <div className="text-4xl font-bold text-green-600">{topPerformers.filter(p => p.avgScore >= 80).length}</div>
              <div className="text-green-700 font-medium">High Performers</div>
              <div className="text-sm text-green-600 mt-2">Average score ≥ 80%</div>
            </div>
            <div className="bg-red-50 border border-red-200 p-6 rounded-xl">
              <div className="text-4xl font-bold text-red-600">{topPerformers.filter(p => p.avgScore < 40).length}</div>
              <div className="text-red-700 font-medium">Need Improvement</div>
              <div className="text-sm text-red-600 mt-2">Average score &lt; 40%</div>
            </div>
          </div>
        </div>
      )}

      {/* Exams Tab */}
      {activeTab === 'exams' && (
        <div className="space-y-6">
          {/* Subject Stats Table */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-semibold">📚 Subject-wise Analysis</h3>
            </div>
            {subjectStats.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Subject</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Attempts</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Avg Score</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Pass Rate</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {subjectStats.map((subject) => (
                      <tr key={subject.subject} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{subject.subject}</td>
                        <td className="px-4 py-3 text-center">{subject.attempts}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                            subject.avgScore >= 70 ? 'bg-green-100 text-green-700' :
                            subject.avgScore >= 50 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {subject.avgScore}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-24 h-3 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  subject.passRate >= 70 ? 'bg-green-500' :
                                  subject.passRate >= 50 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${subject.passRate}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{subject.passRate}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {subject.passRate >= 70 ? (
                            <span className="text-green-600">✅ Good</span>
                          ) : subject.passRate >= 50 ? (
                            <span className="text-yellow-600">⚠️ Average</span>
                          ) : (
                            <span className="text-red-600">❌ Poor</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                No exam data available yet
              </div>
            )}
          </div>

          {/* Subject Performance Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">📊 Subject Comparison</h3>
            {subjectStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={subjectStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="subject" type="category" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avgScore" name="Average Score" fill="#3B82F6" />
                  <Bar dataKey="passRate" name="Pass Rate" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </div>
        </div>
      )}

      {/* Violations Tab */}
      {activeTab === 'violations' && (
        <div className="space-y-6">
          {/* Violation Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-red-50 border border-red-200 p-6 rounded-xl">
              <div className="text-3xl font-bold text-red-600">{stats.totalViolations}</div>
              <div className="text-red-700">Total Violations</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-xl">
              <div className="text-3xl font-bold text-yellow-600">{stats.terminatedAttempts}</div>
              <div className="text-yellow-700">Terminated Exams</div>
            </div>
            <div className="bg-orange-50 border border-orange-200 p-6 rounded-xl">
              <div className="text-3xl font-bold text-orange-600">
                {stats.totalAttempts > 0 ? Math.round((stats.terminatedAttempts / stats.totalAttempts) * 100) : 0}%
              </div>
              <div className="text-orange-700">Termination Rate</div>
            </div>
            <div className="bg-purple-50 border border-purple-200 p-6 rounded-xl">
              <div className="text-3xl font-bold text-purple-600">
                {stats.totalAttempts > 0 ? (stats.totalViolations / stats.totalAttempts).toFixed(1) : 0}
              </div>
              <div className="text-purple-700">Avg per Attempt</div>
            </div>
          </div>

          {/* Violation Types Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">⚠️ Violation Types</h3>
              {violationStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={violationStats}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="count"
                      nameKey="type"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {violationStats.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No violations recorded 🎉
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">🛡️ Anti-Cheat Summary</h3>
              <div className="space-y-4">
                {[
                  { type: 'Tab Switch', desc: 'Student switched browser tab', icon: '🔄' },
                  { type: 'Fullscreen Exit', desc: 'Exited fullscreen mode', icon: '📺' },
                  { type: 'Copy/Paste', desc: 'Attempted to copy or paste', icon: '📋' },
                  { type: 'Right Click', desc: 'Used right-click context menu', icon: '🖱️' },
                  { type: 'DevTools', desc: 'Opened developer tools', icon: '🔧' }
                ].map(item => {
                  const stat = violationStats.find(v => v.type === item.type);
                  return (
                    <div key={item.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{item.icon}</span>
                        <div>
                          <div className="font-medium">{item.type}</div>
                          <div className="text-sm text-gray-500">{item.desc}</div>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full font-bold ${
                        stat && stat.count > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {stat?.count || 0}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Warning Message */}
          {stats.totalViolations > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <div className="font-medium text-yellow-800">Violation Alert</div>
                <div className="text-yellow-700 text-sm">
                  {stats.totalViolations} violations detected across {stats.totalAttempts} exam attempts.
                  {stats.terminatedAttempts > 0 && ` ${stats.terminatedAttempts} exams were terminated due to excessive violations.`}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
