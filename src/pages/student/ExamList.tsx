// ============================================
// EXAM LIST PAGE
// Shows all available exams for students
// With schedule time check
// ============================================

import { useState } from 'react';
import { useExam } from '../../context/ExamContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Exam } from '../../types';
import { 
  BookOpen, 
  Clock, 
  GraduationCap,
  Building2,
  Trophy,
  Filter,
  Search,
  ChevronRight,
  FileQuestion,
  Calendar,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface ExamListProps {
  onStartExam: (exam: Exam) => void;
}

// Helper to check exam status based on schedule
const getExamStatus = (exam: Exam): { status: 'upcoming' | 'active' | 'expired'; message: string } => {
  const now = new Date();
  const start = new Date(exam.scheduledStart);
  const end = new Date(exam.scheduledEnd);

  if (!exam.isEnabled) {
    return { status: 'expired', message: 'Exam is disabled' };
  }

  if (now < start) {
    const diff = start.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return { status: 'upcoming', message: `Starts in ${days}d ${hours}h` };
    } else if (hours > 0) {
      return { status: 'upcoming', message: `Starts in ${hours}h ${mins}m` };
    } else {
      return { status: 'upcoming', message: `Starts in ${mins} minutes` };
    }
  }

  if (now > end) {
    return { status: 'expired', message: 'Exam ended' };
  }

  const remaining = end.getTime() - now.getTime();
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  
  return { 
    status: 'active', 
    message: hours > 0 ? `${hours}h ${mins}m remaining` : `${mins}m remaining` 
  };
};

export function ExamList({ onStartExam }: ExamListProps) {
  const { exams } = useExam();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAll, setShowAll] = useState(false);

  // Filter enabled exams
  const enabledExams = exams.filter(e => e.isEnabled);

  const filteredExams = enabledExams.filter(exam => {
    const matchesSearch = exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         exam.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || exam.category === selectedCategory;
    
    if (!showAll) {
      const status = getExamStatus(exam);
      return matchesSearch && matchesCategory && (status.status === 'active' || status.status === 'upcoming');
    }
    
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'school': return GraduationCap;
      case 'college': return Building2;
      case 'competitive': return Trophy;
      default: return BookOpen;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'school': return 'bg-green-100 text-green-700';
      case 'college': return 'bg-blue-100 text-blue-700';
      case 'competitive': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: 'upcoming' | 'active' | 'expired') => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 border-green-200';
      case 'upcoming': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'expired': return 'bg-red-100 text-red-700 border-red-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold">📚 Available Exams</h1>
        <p className="text-indigo-100 mt-1">Choose an exam to test your knowledge</p>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search exams by title or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Categories</option>
              <option value="school">School</option>
              <option value="college">College</option>
              <option value="competitive">Competitive</option>
            </select>
          </div>

          {/* Show All Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showAll}
              onChange={(e) => setShowAll(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded"
            />
            <span className="text-sm text-gray-600">Show expired</span>
          </label>
        </div>
      </Card>

      {/* Category Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {['school', 'college', 'competitive'].map((category) => {
          const count = enabledExams.filter(e => e.category === category).length;
          const Icon = getCategoryIcon(category);
          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(category === selectedCategory ? 'all' : category)}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedCategory === category 
                  ? 'border-indigo-500 bg-indigo-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getCategoryColor(category)}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold capitalize text-gray-900">{category}</p>
                  <p className="text-sm text-gray-500">{count} exams</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Exam Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredExams.map((exam) => {
          const CategoryIcon = getCategoryIcon(exam.category);
          const examStatus = getExamStatus(exam);
          const canStart = examStatus.status === 'active' && exam.questions.length > 0;
          
          return (
            <Card key={exam.id} className={`flex flex-col hover:shadow-md transition-shadow ${
              examStatus.status === 'expired' ? 'opacity-60' : ''
            }`}>
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(exam.category)}`}>
                  <div className="flex items-center gap-1">
                    <CategoryIcon className="w-3 h-3" />
                    <span className="capitalize">{exam.category}</span>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(examStatus.status)}`}>
                  <div className="flex items-center gap-1">
                    {examStatus.status === 'active' ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : examStatus.status === 'upcoming' ? (
                      <Clock className="w-3 h-3" />
                    ) : (
                      <AlertCircle className="w-3 h-3" />
                    )}
                    <span>{examStatus.message}</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{exam.title}</h3>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">{exam.description}</p>

              {/* Schedule Info */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4 text-xs">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-500">Start:</span>
                  <span className="text-gray-700">{new Date(exam.scheduledStart).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">End:</span>
                  <span className="text-gray-700">{new Date(exam.scheduledEnd).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
              </div>

              {/* Meta Info */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>{exam.duration} mins</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileQuestion className="w-4 h-4 text-gray-400" />
                  <span>{exam.questions.length} questions</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Trophy className="w-4 h-4 text-gray-400" />
                  <span>{exam.totalMarks} marks</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>{exam.subject}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-auto pt-4 border-t border-gray-100">
                {examStatus.status === 'upcoming' && (
                  <div className="text-center py-2 bg-yellow-50 text-yellow-700 rounded-lg text-sm font-medium">
                    ⏳ {examStatus.message}
                  </div>
                )}
                {examStatus.status === 'expired' && (
                  <div className="text-center py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium">
                    ❌ Exam Ended
                  </div>
                )}
                {examStatus.status === 'active' && (
                  <Button 
                    className="w-full group"
                    onClick={() => onStartExam(exam)}
                    disabled={!canStart}
                  >
                    {exam.questions.length === 0 ? 'No Questions' : 'Start Exam'}
                    <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredExams.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Exams Found</h3>
          <p className="text-gray-500">
            {searchQuery 
              ? 'Try adjusting your search or filters'
              : 'No exams are currently available'}
          </p>
        </div>
      )}
    </div>
  );
}
