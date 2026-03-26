// ============================================
// RESULTS PAGE
// Student exam results with detailed analysis
// ============================================

import { useAuth } from '../../context/AuthContext';
import { useExam } from '../../context/ExamContext';
import { Card, CardHeader } from '../../components/ui/Card';
import { ExamResult } from '../../types';
import {
  Award,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  MinusCircle,
  Calendar,
  BarChart3,
  Trophy,
  Target
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface ResultsPageProps {
  selectedResult?: ExamResult | null;
}

export function ResultsPage({ selectedResult }: ResultsPageProps) {
  const { user } = useAuth();
  const { results } = useExam();

  const studentResults = results.filter(r => r.studentId === user?.id || r.studentId === 'student-1');

  if (selectedResult) {
    return <DetailedResult result={selectedResult} />;
  }

  if (studentResults.length === 0) {
    return (
      <div className="text-center py-16">
        <Trophy className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Results Yet</h2>
        <p className="text-gray-500">Complete an exam to see your results here</p>
      </div>
    );
  }

  // Calculate overall stats
  const avgPercentage = Math.round(studentResults.reduce((acc, r) => acc + r.percentage, 0) / studentResults.length);
  const bestScore = Math.max(...studentResults.map(r => r.percentage));
  const totalExams = studentResults.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Results</h1>
        <p className="text-gray-500 mt-1">View your exam performance and analytics</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{avgPercentage}%</p>
            <p className="text-sm text-gray-500">Average Score</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <Trophy className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{bestScore}%</p>
            <p className="text-sm text-gray-500">Best Score</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <Target className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalExams}</p>
            <p className="text-sm text-gray-500">Exams Completed</p>
          </div>
        </Card>
      </div>

      {/* Results List */}
      <Card padding="none">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-900">All Results</h3>
        </div>
        <div className="divide-y">
          {studentResults.map((result) => (
            <div key={result.attemptId} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    result.percentage >= 60 ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <Award className={`w-6 h-6 ${
                      result.percentage >= 60 ? 'text-green-600' : 'text-red-600'
                    }`} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{result.examTitle}</h4>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(result.submittedAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-bold ${
                      result.percentage >= 60 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {result.percentage}%
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      result.grade === 'A+' || result.grade === 'A' ? 'bg-green-100 text-green-700' :
                      result.grade === 'B+' || result.grade === 'B' ? 'bg-blue-100 text-blue-700' :
                      result.grade === 'C' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      Grade: {result.grade}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {result.score} / {result.totalMarks} marks
                  </p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600">{result.correctAnswers} Correct</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-gray-600">{result.wrongAnswers} Wrong</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MinusCircle className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{result.unattempted} Skipped</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// Detailed Result Component
function DetailedResult({ result }: { result: ExamResult }) {
  const pieData = [
    { name: 'Correct', value: result.correctAnswers, color: '#22c55e' },
    { name: 'Wrong', value: result.wrongAnswers, color: '#ef4444' },
    { name: 'Unattempted', value: result.unattempted, color: '#9ca3af' }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Exam Result</h1>
        <p className="text-gray-500 mt-1">{result.examTitle}</p>
      </div>

      {/* Score Card */}
      <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-indigo-100 mb-1">Your Score</p>
            <p className="text-5xl font-bold">{result.percentage}%</p>
            <p className="text-indigo-200 mt-2">{result.score} out of {result.totalMarks} marks</p>
          </div>
          <div className="text-center">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-4xl font-bold">{result.grade}</span>
            </div>
            <p className="mt-2 text-indigo-200">Grade</p>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{result.correctAnswers}</p>
            <p className="text-sm text-gray-500">Correct Answers</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{result.wrongAnswers}</p>
            <p className="text-sm text-gray-500">Wrong Answers</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s
            </p>
            <p className="text-sm text-gray-500">Time Taken</p>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <Card>
          <CardHeader title="Answer Distribution" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Subject-wise Bar Chart */}
        <Card>
          <CardHeader title="Subject-wise Analysis" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={result.subjectWiseAnalysis}>
                <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="percentage" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Subject Details */}
      <Card>
        <CardHeader title="Subject-wise Breakdown" />
        <div className="space-y-3">
          {result.subjectWiseAnalysis.map((subject, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                <TrendingUp className={`w-5 h-5 ${
                  subject.percentage >= 60 ? 'text-green-500' : 'text-red-500'
                }`} />
                <div>
                  <p className="font-medium text-gray-900">{subject.subject}</p>
                  <p className="text-sm text-gray-500">
                    {subject.correct} correct out of {subject.total}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-xl font-bold ${
                  subject.percentage >= 60 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {subject.percentage}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
