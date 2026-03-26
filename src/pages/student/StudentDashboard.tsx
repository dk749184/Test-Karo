// ============================================
// STUDENT DASHBOARD
// Overview of student's exam activities
// ============================================

import { useAuth } from '../../context/AuthContext';
import { useExam } from '../../context/ExamContext';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  BookOpen, 
  Award, 
  Clock, 
  TrendingUp, 
  CheckCircle,
  AlertCircle,
  Calendar
} from 'lucide-react';

interface StudentDashboardProps {
  onPageChange: (page: string) => void;
}

export function StudentDashboard({ onPageChange }: StudentDashboardProps) {
  const { user } = useAuth();
  const { exams, results } = useExam();

  // Filter exams that are currently active based on schedule
  const availableExams = exams.filter(e => {
    if (!e.isEnabled) return false;
    const now = new Date();
    const start = new Date(e.scheduledStart);
    const end = new Date(e.scheduledEnd);
    return now >= start && now <= end;
  });
  const studentResults = results.filter(r => r.studentId === user?.id || r.studentId === 'student-1');
  const averageScore = studentResults.length > 0 
    ? Math.round(studentResults.reduce((acc, r) => acc + r.percentage, 0) / studentResults.length) 
    : 0;
  const totalExamsAttempted = studentResults.length;

  const stats = [
    {
      label: 'Available Exams',
      value: availableExams.length,
      icon: BookOpen,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Exams Completed',
      value: totalExamsAttempted,
      icon: CheckCircle,
      color: 'bg-green-500',
      bgColor: 'bg-green-50'
    },
    {
      label: 'Average Score',
      value: `${averageScore}%`,
      icon: TrendingUp,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50'
    },
    {
      label: 'Best Score',
      value: studentResults.length > 0 
        ? `${Math.max(...studentResults.map(r => r.percentage))}%` 
        : '0%',
      icon: Award,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.name}! 👋</h1>
        <p className="text-indigo-100">
          Ready to test your knowledge? You have {availableExams.length} exams waiting for you.
        </p>
        <Button 
          variant="secondary" 
          className="mt-4 bg-white/20 hover:bg-white/30 border-0"
          onClick={() => onPageChange('exams')}
        >
          Browse Exams
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="flex items-center gap-4">
              <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                <Icon className={`w-6 h-6 text-${stat.color.replace('bg-', '')}`} style={{ color: stat.color.includes('blue') ? '#3b82f6' : stat.color.includes('green') ? '#22c55e' : stat.color.includes('purple') ? '#a855f7' : '#eab308' }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Exams */}
        <Card>
          <CardHeader 
            title="Available Exams" 
            subtitle="Exams you can take now"
            action={
              <Button variant="ghost" size="sm" onClick={() => onPageChange('exams')}>
                View All
              </Button>
            }
          />
          <div className="space-y-3">
            {availableExams.slice(0, 3).map((exam) => (
              <div key={exam.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{exam.title}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{exam.duration} mins</span>
                      <span>•</span>
                      <span>{exam.questions.length} questions</span>
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  exam.category === 'college' ? 'bg-blue-100 text-blue-700' :
                  exam.category === 'school' ? 'bg-green-100 text-green-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  {exam.category}
                </span>
              </div>
            ))}
            {availableExams.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No exams available right now</p>
              </div>
            )}
          </div>
        </Card>

        {/* Recent Results */}
        <Card>
          <CardHeader 
            title="Recent Results" 
            subtitle="Your latest exam performances"
            action={
              <Button variant="ghost" size="sm" onClick={() => onPageChange('results')}>
                View All
              </Button>
            }
          />
          <div className="space-y-3">
            {studentResults.slice(0, 3).map((result) => (
              <div key={result.attemptId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    result.percentage >= 60 ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <Award className={`w-5 h-5 ${
                      result.percentage >= 60 ? 'text-green-600' : 'text-red-600'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{result.examTitle}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(result.submittedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${
                    result.percentage >= 60 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {result.percentage}%
                  </p>
                  <p className="text-xs text-gray-500">Grade: {result.grade}</p>
                </div>
              </div>
            ))}
            {studentResults.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No results yet. Take an exam to see your performance!</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
