// ============================================
// ADMIN DASHBOARD
// Overview for administrators
// ============================================

import { useExam } from '../../context/ExamContext';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  Users,
  BookOpen,
  ClipboardList,
  TrendingUp,
  Award,
  PlusCircle,
  BarChart3,
  CheckCircle,
  Clock
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface AdminDashboardProps {
  onPageChange: (page: string) => void;
}

export function AdminDashboard({ onPageChange }: AdminDashboardProps) {
  const { exams, results } = useExam();

  const totalExams = exams.length;
  const activeExams = exams.filter(e => e.isEnabled).length;
  const totalAttempts = results.length;
  const avgScore = results.length > 0 
    ? Math.round(results.reduce((acc, r) => acc + r.percentage, 0) / results.length) 
    : 0;

  // Mock data for charts
  const monthlyData = [
    { month: 'Jan', attempts: 45, avgScore: 72 },
    { month: 'Feb', attempts: 52, avgScore: 68 },
    { month: 'Mar', attempts: 61, avgScore: 75 },
    { month: 'Apr', attempts: 48, avgScore: 70 },
    { month: 'May', attempts: 55, avgScore: 78 },
    { month: 'Jun', attempts: 40, avgScore: 74 }
  ];

  // Category data for potential future use
  const _categoryData = exams.reduce((acc, exam) => {
    const existing = acc.find(a => a.category === exam.category);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ category: exam.category, count: 1 });
    }
    return acc;
  }, [] as { category: string; count: number }[]);
  void _categoryData;

  const stats = [
    {
      label: 'Total Exams',
      value: totalExams,
      change: '+3 this month',
      icon: BookOpen,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Active Exams',
      value: activeExams,
      change: `${totalExams - activeExams} disabled`,
      icon: CheckCircle,
      color: 'bg-green-500',
      bgColor: 'bg-green-50'
    },
    {
      label: 'Total Attempts',
      value: totalAttempts,
      change: '+12 this week',
      icon: ClipboardList,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50'
    },
    {
      label: 'Avg. Score',
      value: `${avgScore}%`,
      change: '+5% from last month',
      icon: TrendingUp,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage exams and view analytics</p>
        </div>
        <Button onClick={() => onPageChange('create-exam')}>
          <PlusCircle className="w-4 h-4 mr-2" />
          Create New Exam
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-xs text-gray-400 mt-2">{stat.change}</p>
                </div>
                <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-6 h-6" style={{ color: stat.color.replace('bg-', '').includes('blue') ? '#3b82f6' : stat.color.includes('green') ? '#22c55e' : stat.color.includes('purple') ? '#a855f7' : '#f97316' }} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attempts Over Time */}
        <Card>
          <CardHeader 
            title="Exam Attempts" 
            subtitle="Monthly exam attempts trend"
          />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="attempts" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Average Score Trend */}
        <Card>
          <CardHeader 
            title="Average Score Trend" 
            subtitle="Monthly average performance"
          />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="avgScore" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  dot={{ fill: '#22c55e' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Results */}
        <Card>
          <CardHeader 
            title="Recent Results" 
            subtitle="Latest exam submissions"
            action={
              <Button variant="ghost" size="sm" onClick={() => onPageChange('reports')}>
                View All
              </Button>
            }
          />
          <div className="space-y-3">
            {results.slice(0, 5).map((result) => (
              <div key={result.attemptId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    result.percentage >= 60 ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <Award className={`w-5 h-5 ${
                      result.percentage >= 60 ? 'text-green-600' : 'text-red-600'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{result.studentName}</p>
                    <p className="text-xs text-gray-500">{result.examTitle}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${
                    result.percentage >= 60 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {result.percentage}%
                  </p>
                  <p className="text-xs text-gray-500">{result.grade}</p>
                </div>
              </div>
            ))}
            {results.length === 0 && (
              <p className="text-center text-gray-500 py-4">No results yet</p>
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader title="Quick Actions" subtitle="Common administrative tasks" />
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => onPageChange('create-exam')}
              className="p-4 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors text-left"
            >
              <PlusCircle className="w-8 h-8 text-indigo-600 mb-2" />
              <p className="font-medium text-gray-900">Create Exam</p>
              <p className="text-sm text-gray-500">Add new exam</p>
            </button>
            <button
              onClick={() => onPageChange('ai-questions')}
              className="p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors text-left"
            >
              <BarChart3 className="w-8 h-8 text-purple-600 mb-2" />
              <p className="font-medium text-gray-900">AI Questions</p>
              <p className="text-sm text-gray-500">Extract from files</p>
            </button>
            <button
              onClick={() => onPageChange('manage-exams')}
              className="p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors text-left"
            >
              <BookOpen className="w-8 h-8 text-blue-600 mb-2" />
              <p className="font-medium text-gray-900">Manage Exams</p>
              <p className="text-sm text-gray-500">Edit & configure</p>
            </button>
            <button
              onClick={() => onPageChange('students')}
              className="p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors text-left"
            >
              <Users className="w-8 h-8 text-green-600 mb-2" />
              <p className="font-medium text-gray-900">Students</p>
              <p className="text-sm text-gray-500">View all students</p>
            </button>
          </div>
        </Card>
      </div>

      {/* Exams by Category */}
      <Card>
        <CardHeader title="Exams by Category" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {['school', 'college', 'competitive'].map((category) => {
            const count = exams.filter(e => e.category === category).length;
            const active = exams.filter(e => e.category === category && e.isEnabled).length;
            return (
              <div key={category} className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium capitalize text-gray-900">{category}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    category === 'school' ? 'bg-green-100 text-green-700' :
                    category === 'college' ? 'bg-blue-100 text-blue-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {count} exams
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    {active} active
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    {count - active} disabled
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
