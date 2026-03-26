// ============================================
// MAIN APP COMPONENT
// ExamSmart - AI-Based Online Examination System
// MCA Final Year Project
// ============================================

import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ExamProvider } from './context/ExamContext';
import { checkConnection, isSupabaseConfigured } from './lib/supabase';
import { LoginPage } from './pages/LoginPage';
import { LandingPage } from './pages/LandingPage';
import { Sidebar } from './components/layout/Sidebar';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { ExamList } from './pages/student/ExamList';
import ExamInterface from './pages/student/ExamInterface';
import { GuestExamInterface } from './pages/student/GuestExamInterface';
import { ResultsPage } from './pages/student/ResultsPage';
import MyResults from './pages/student/MyResults';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import CreateExam from './pages/admin/CreateExam';
import ManageExams from './pages/admin/ManageExams';
import AIQuestions from './pages/admin/AIQuestions';
import { ManageStudents } from './pages/admin/ManageStudents';
import { ManageInstitutes } from './pages/admin/ManageInstitutes';
import { InstituteDashboard } from './pages/institute/InstituteDashboard';
import { EmailLogs } from './pages/admin/EmailLogs';
import { AdminResults } from './pages/admin/AdminResults';
import AdminReports from './pages/admin/AdminReports';
import { SettingsPage } from './pages/SettingsPage';
import { Exam, ExamResult } from './types';
import { cn } from './utils/cn';
// Unused imports kept for potential future use
/* eslint-disable @typescript-eslint/no-unused-vars */
import { FileText, Award, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardHeader } from './components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
/* eslint-enable @typescript-eslint/no-unused-vars */

// Main Dashboard Layout
function DashboardLayout() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [isInExam, setIsInExam] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isInstitute = user?.role === 'institute';

  // Handle exam start
  const handleStartExam = (exam: Exam) => {
    setSelectedExam(exam);
    setIsInExam(true);
  };

  // If in exam mode, show exam interface
  if (isInExam && selectedExam) {
    return (
      <ExamInterface
        exam={selectedExam}
        onComplete={() => {
          setIsInExam(false);
          setSelectedExam(null);
          setCurrentPage('results');
        }}
      />
    );
  }

  // Render page content based on current page
  const renderContent = () => {
    if (isInstitute) {
      switch (currentPage) {
        case 'dashboard':
        case 'institute-students':
          return <InstituteDashboard />;
        case 'institute-results':
          return <InstituteDashboard />;
        case 'settings':
          return <SettingsPage />;
        default:
          return <InstituteDashboard />;
      }
    } else if (isAdmin) {
      switch (currentPage) {
        case 'dashboard':
          return <AdminDashboard onPageChange={setCurrentPage} />;
        case 'create-exam':
          return <CreateExam onSuccess={() => setCurrentPage('manage-exams')} />;
        case 'manage-exams':
          return <ManageExams />;
        case 'ai-questions':
          return <AIQuestions />;
        case 'students':
          return <ManageStudents />;
        case 'institutes':
          return <ManageInstitutes />;
        case 'email-logs':
          return <EmailLogs />;
        case 'results':
          return <AdminResults />;
        case 'reports':
          return <AdminReports />;
        case 'settings':
          return <SettingsPage />;
        default:
          return <AdminDashboard onPageChange={setCurrentPage} />;
      }
    } else {
      switch (currentPage) {
        case 'dashboard':
          return <StudentDashboard onPageChange={setCurrentPage} />;
        case 'exams':
          return <ExamList onStartExam={handleStartExam} />;
        case 'results':
          return <ResultsPage selectedResult={examResult} />;
        case 'my-results':
          return <MyResults />;
        case 'settings':
          return <SettingsPage />;
        default:
          return <StudentDashboard onPageChange={setCurrentPage} />;
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar
        currentPage={currentPage}
        onPageChange={(page) => {
          setCurrentPage(page);
          setExamResult(null);
        }}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      {/* Main Content */}
      <main className={cn(
        'transition-all duration-300 min-h-screen',
        isCollapsed ? 'ml-20' : 'ml-64'
      )}>
        {/* Top Bar */}
        <header className="bg-white border-b sticky top-0 z-10">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 capitalize">
                {currentPage.replace('-', ' ')}
              </h2>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

// Reports Page removed - using AdminReports component instead
// @ts-ignore - Keeping for reference
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _ReportsPageOld({ results }: { results: ExamResult[] }) {
  const examStats = results.reduce((acc, result) => {
    if (!acc[result.examTitle]) {
      acc[result.examTitle] = { attempts: 0, totalScore: 0 };
    }
    acc[result.examTitle].attempts++;
    acc[result.examTitle].totalScore += result.percentage;
    return acc;
  }, {} as Record<string, { attempts: number; totalScore: number }>);

  const chartData = Object.entries(examStats).map(([title, data]) => ({
    name: title.length > 20 ? title.substring(0, 20) + '...' : title,
    avgScore: Math.round(data.totalScore / data.attempts),
    attempts: data.attempts
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-500 mt-1">View detailed examination reports</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{results.length}</p>
            <p className="text-sm text-gray-500">Total Submissions</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <Award className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {results.filter(r => r.percentage >= 60).length}
            </p>
            <p className="text-sm text-gray-500">Passed</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {results.filter(r => r.percentage < 60).length}
            </p>
            <p className="text-sm text-gray-500">Failed</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <Calendar className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {results.length > 0 ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length) : 0}%
            </p>
            <p className="text-sm text-gray-500">Avg Score</p>
          </div>
        </Card>
      </div>

      {chartData.length > 0 && (
        <Card>
          <CardHeader title="Exam Performance Overview" subtitle="Average scores by exam" />
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="avgScore" fill="#6366f1" radius={[4, 4, 0, 0]} name="Avg Score %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <Card padding="none">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-900">Recent Submissions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Student</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Exam</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Score</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Grade</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {results.map((result) => (
                <tr key={result.attemptId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{result.studentName}</td>
                  <td className="px-6 py-4 text-gray-600">{result.examTitle}</td>
                  <td className="px-6 py-4">
                    <span className={`font-bold ${
                      result.percentage >= 60 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {result.percentage}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      result.grade === 'A+' || result.grade === 'A' ? 'bg-green-100 text-green-700' :
                      result.grade === 'B+' || result.grade === 'B' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {result.grade}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">
                    {new Date(result.submittedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {results.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No submissions yet
          </div>
        )}
      </Card>
    </div>
  );
}

// Main App with Providers
function AppContent() {
  const { isAuthenticated } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [guestExam, setGuestExam] = useState<Exam | null>(null);
  const [guestInfo, setGuestInfo] = useState<{ name: string; email: string } | null>(null);
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  // Check Supabase connection on mount
  useEffect(() => {
    const checkDb = async () => {
      console.log('');
      console.log('🚀🚀🚀 APP STARTING 🚀🚀🚀');
      console.log('');
      
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, using localStorage');
        setDbStatus('disconnected');
        return;
      }
      
      const connected = await checkConnection();
      setDbStatus(connected ? 'connected' : 'disconnected');
      
      console.log('');
      console.log('═══════════════════════════════════════');
      console.log('📊 DATABASE STATUS:', connected ? '✅ CONNECTED' : '❌ DISCONNECTED');
      if (!connected) {
        console.log('⚠️ Using localStorage as fallback');
      }
      console.log('═══════════════════════════════════════');
      console.log('');
    };
    
    checkDb();
  }, []);

  // Show database status indicator (only in development)
  console.log('Current DB Status:', dbStatus);

  // If user is authenticated, show dashboard
  if (isAuthenticated) {
    return <DashboardLayout />;
  }

  // If guest is taking an exam
  if (guestExam && guestInfo) {
    return (
      <GuestExamInterface
        exam={guestExam}
        guestInfo={guestInfo}
        onComplete={() => {
          setGuestExam(null);
          setGuestInfo(null);
        }}
        onExit={() => {
          setGuestExam(null);
          setGuestInfo(null);
        }}
      />
    );
  }

  // If showing login page
  if (showLogin) {
    return (
      <LoginPage 
        onBackToHome={() => {
          setShowLogin(false);
        }}
      />
    );
  }

  // Default: Show landing page
  return (
    <LandingPage
      onLoginClick={() => {
        setShowLogin(true);
      }}
      onStartGuestExam={(exam: Exam, info: { name: string; email: string }) => {
        setGuestExam(exam);
        setGuestInfo(info);
      }}
    />
  );
}

export function App() {
  return (
    <AuthProvider>
      <ExamProvider>
        <AppContent />
      </ExamProvider>
    </AuthProvider>
  );
}
