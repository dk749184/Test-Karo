import { useState } from 'react';
import { useExam } from '../../context/ExamContext';
import { Exam, Question } from '../../types';

const ManageExams = () => {
  const { exams, updateExam, deleteExam, toggleExamStatus } = useExam();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingExam, setEditingExam] = useState<string | null>(null);
  const [editSchedule, setEditSchedule] = useState({ start: '', end: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  // Question editing states
  const [editingQuestions, setEditingQuestions] = useState<string | null>(null);
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  // Get exam status based on schedule
  const getExamStatus = (exam: Exam) => {
    const now = new Date();
    const start = exam.scheduledStart ? new Date(exam.scheduledStart) : null;
    const end = exam.scheduledEnd ? new Date(exam.scheduledEnd) : null;

    if (!exam.isEnabled) return 'disabled';
    if (!start || !end) return 'no-schedule';
    if (now < start) return 'upcoming';
    if (now >= start && now <= end) return 'active';
    return 'completed';
  };

  // Filter exams
  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          exam.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || exam.category === filterCategory;
    const status = getExamStatus(exam);
    const matchesStatus = filterStatus === 'all' || status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Handle schedule update
  const handleUpdateSchedule = (examId: string) => {
    if (!editSchedule.start || !editSchedule.end) {
      alert('Please select both start and end times');
      return;
    }

    const startTime = new Date(editSchedule.start);
    const endTime = new Date(editSchedule.end);

    if (endTime <= startTime) {
      alert('End time must be after start time');
      return;
    }

    updateExam(examId, {
      scheduledStart: editSchedule.start,
      scheduledEnd: editSchedule.end
    });

    setEditingExam(null);
    setEditSchedule({ start: '', end: '' });
    alert('✅ Schedule updated successfully!');
  };

  // Handle toggle status
  const handleToggleStatus = (examId: string, currentStatus: boolean) => {
    toggleExamStatus(examId);
    alert(currentStatus ? '❌ Exam disabled' : '✅ Exam enabled');
  };

  // Handle delete
  const handleDelete = (examId: string) => {
    deleteExam(examId);
    setShowDeleteConfirm(null);
    alert('🗑️ Exam deleted successfully');
  };

  // Open questions editor
  const openQuestionsEditor = (exam: Exam) => {
    setEditingQuestions(exam.id);
    setExamQuestions([...exam.questions]);
  };

  // Save questions
  const saveQuestions = (examId: string) => {
    updateExam(examId, { questions: examQuestions });
    setEditingQuestions(null);
    setExamQuestions([]);
    setEditingQuestionId(null);
    alert('✅ Questions updated successfully!');
  };

  // Update single question
  const updateQuestion = (questionId: string, updates: Partial<Question>) => {
    setExamQuestions(prev => prev.map(q => 
      q.id === questionId ? { ...q, ...updates } : q
    ));
  };

  // Delete question
  const deleteQuestion = (questionId: string) => {
    if (examQuestions.length <= 1) {
      alert('Exam must have at least 1 question');
      return;
    }
    setExamQuestions(prev => prev.filter(q => q.id !== questionId));
  };

  // Add new question
  const addNewQuestion = () => {
    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      text: 'New Question',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 0,
      subject: 'General',
      topic: 'General',
      difficulty: 'medium'
    };
    setExamQuestions(prev => [...prev, newQuestion]);
    setEditingQuestionId(newQuestion.id);
  };

  // Get status badge
  const getStatusBadge = (exam: Exam) => {
    const status = getExamStatus(exam);
    const badges: Record<string, { bg: string; text: string; icon: string; label: string }> = {
      'disabled': { bg: 'bg-gray-100', text: 'text-gray-600', icon: '⛔', label: 'Disabled' },
      'upcoming': { bg: 'bg-blue-100', text: 'text-blue-600', icon: '📅', label: 'Upcoming' },
      'active': { bg: 'bg-green-100', text: 'text-green-600', icon: '✅', label: 'Active Now' },
      'completed': { bg: 'bg-purple-100', text: 'text-purple-600', icon: '✔️', label: 'Completed' },
      'no-schedule': { bg: 'bg-yellow-100', text: 'text-yellow-600', icon: '⚠️', label: 'No Schedule' }
    };
    return badges[status] || badges['disabled'];
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate time remaining
  const getTimeRemaining = (exam: Exam) => {
    const now = new Date();
    const start = exam.scheduledStart ? new Date(exam.scheduledStart) : null;
    const end = exam.scheduledEnd ? new Date(exam.scheduledEnd) : null;

    if (!start || !end) return null;

    if (now < start) {
      const diff = start.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      if (days > 0) return `Starts in ${days}d ${hours}h`;
      return `Starts in ${hours}h`;
    }

    if (now >= start && now <= end) {
      const diff = end.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m remaining`;
    }

    return 'Ended';
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Exams</h1>
        <p className="text-gray-600">View, edit questions, enable/disable and manage exam schedules</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-blue-500">
          <div className="text-2xl font-bold text-blue-600">{exams.length}</div>
          <div className="text-sm text-gray-600">Total Exams</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-green-500">
          <div className="text-2xl font-bold text-green-600">
            {exams.filter(e => getExamStatus(e) === 'active').length}
          </div>
          <div className="text-sm text-gray-600">Active Now</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-yellow-500">
          <div className="text-2xl font-bold text-yellow-600">
            {exams.filter(e => getExamStatus(e) === 'upcoming').length}
          </div>
          <div className="text-sm text-gray-600">Upcoming</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-purple-500">
          <div className="text-2xl font-bold text-purple-600">
            {exams.filter(e => getExamStatus(e) === 'completed').length}
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-gray-500">
          <div className="text-2xl font-bold text-gray-600">
            {exams.filter(e => !e.isEnabled).length}
          </div>
          <div className="text-sm text-gray-600">Disabled</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="🔍 Search exams by title or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Categories</option>
              <option value="school">School</option>
              <option value="college">College</option>
              <option value="competitive">Competitive</option>
            </select>
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="active">Active Now</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Questions Editor Modal */}
      {editingQuestions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">✏️ Edit Exam Questions</h3>
                  <p className="text-blue-100 text-sm">
                    {exams.find(e => e.id === editingQuestions)?.title}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingQuestions(null);
                    setExamQuestions([]);
                    setEditingQuestionId(null);
                  }}
                  className="text-white hover:bg-white/20 p-2 rounded-lg"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <span className="font-medium text-gray-700">
                  📋 Total Questions: {examQuestions.length}
                </span>
                <button
                  onClick={addNewQuestion}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  ➕ Add Question
                </button>
              </div>

              <div className="space-y-4">
                {examQuestions.map((question, index) => (
                  <div 
                    key={question.id} 
                    className={`p-4 border-2 rounded-lg ${
                      editingQuestionId === question.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    {editingQuestionId === question.id ? (
                      // Edit mode
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Question {index + 1}
                          </label>
                          <textarea
                            value={question.text}
                            onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg"
                            rows={2}
                            style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          {question.options.map((option, optIndex) => (
                            <div key={optIndex} className="flex gap-2">
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => {
                                  const newOptions = [...question.options];
                                  newOptions[optIndex] = e.target.value;
                                  updateQuestion(question.id, { options: newOptions });
                                }}
                                className="flex-1 px-3 py-2 border rounded-lg"
                                placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                                style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
                              />
                              <button
                                onClick={() => updateQuestion(question.id, { correctAnswer: optIndex })}
                                className={`px-3 py-2 rounded-lg font-medium ${
                                  question.correctAnswer === optIndex
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-200 hover:bg-gray-300'
                                }`}
                              >
                                ✓
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingQuestionId(null)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            ✓ Done
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View mode
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-gray-900">
                            Q{index + 1}. {question.text}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingQuestionId(question.id)}
                              className="text-blue-600 hover:text-blue-700 p-1"
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => deleteQuestion(question.id)}
                              className="text-red-600 hover:text-red-700 p-1"
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {question.options.map((option, optIndex) => (
                            <div
                              key={optIndex}
                              className={`p-2 rounded ${
                                question.correctAnswer === optIndex
                                  ? 'bg-green-100 text-green-800 font-medium'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {String.fromCharCode(65 + optIndex)}. {option}
                              {question.correctAnswer === optIndex && ' ✓'}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-between">
              <button
                onClick={() => {
                  setEditingQuestions(null);
                  setExamQuestions([]);
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => saveQuestions(editingQuestions)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                ✅ Save All Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exams List */}
      <div className="space-y-4">
        {filteredExams.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-700">No exams found</h3>
            <p className="text-gray-500 mt-2">Create your first exam from the Create Exam page</p>
          </div>
        ) : (
          filteredExams.map(exam => {
            const statusBadge = getStatusBadge(exam);
            const isEditing = editingExam === exam.id;
            const timeRemaining = getTimeRemaining(exam);

            return (
              <div key={exam.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Main exam info */}
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    {/* Left side - Exam details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-gray-900">{exam.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                          {statusBadge.icon} {statusBadge.label}
                        </span>
                        {exam.isPublic && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600">
                            🌐 Public
                          </span>
                        )}
                        {timeRemaining && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-600">
                            ⏱️ {timeRemaining}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                        <span>📚 {exam.subject}</span>
                        <span>🎓 {exam.classLevel || exam.class}</span>
                        <span>📝 {exam.questions?.length || 0} Questions</span>
                        <span>⏱️ {exam.duration} min</span>
                        <span>📊 {exam.totalMarks || exam.questions?.length * 10} marks</span>
                      </div>

                      {/* Schedule info */}
                      <div className="bg-gray-50 rounded-lg p-3 mt-3">
                        <div className="text-sm font-medium text-gray-700 mb-2">📅 Schedule</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-green-600">🟢 Start:</span>
                            <span className="font-medium">{formatDate(exam.scheduledStart)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-red-600">🔴 End:</span>
                            <span className="font-medium">{formatDate(exam.scheduledEnd)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right side - Actions */}
                    <div className="flex flex-col gap-2 min-w-[200px]">
                      {/* Edit Questions - NEW! */}
                      <button
                        onClick={() => openQuestionsEditor(exam)}
                        className="w-full py-2 px-4 rounded-lg font-medium bg-purple-100 text-purple-600 hover:bg-purple-200"
                      >
                        ✏️ Edit Questions
                      </button>

                      {/* Enable/Disable Toggle */}
                      <button
                        onClick={() => handleToggleStatus(exam.id, exam.isEnabled)}
                        className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${
                          exam.isEnabled
                            ? 'bg-red-100 text-red-600 hover:bg-red-200'
                            : 'bg-green-100 text-green-600 hover:bg-green-200'
                        }`}
                      >
                        {exam.isEnabled ? '⛔ Disable Exam' : '✅ Enable Exam'}
                      </button>

                      {/* Edit Schedule */}
                      <button
                        onClick={() => {
                          if (isEditing) {
                            setEditingExam(null);
                          } else {
                            setEditingExam(exam.id);
                            setEditSchedule({
                              start: exam.scheduledStart || '',
                              end: exam.scheduledEnd || ''
                            });
                          }
                        }}
                        className="w-full py-2 px-4 rounded-lg font-medium bg-blue-100 text-blue-600 hover:bg-blue-200"
                      >
                        {isEditing ? '❌ Cancel' : '⏰ Edit Schedule'}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => setShowDeleteConfirm(exam.id)}
                        className="w-full py-2 px-4 rounded-lg font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
                      >
                        🗑️ Delete Exam
                      </button>
                    </div>
                  </div>
                </div>

                {/* Edit Schedule Panel */}
                {isEditing && (
                  <div className="bg-blue-50 border-t border-blue-200 p-6">
                    <h4 className="font-semibold text-blue-800 mb-4">⏰ Edit Exam Schedule</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Date & Time
                        </label>
                        <input
                          type="datetime-local"
                          value={editSchedule.start}
                          onChange={(e) => setEditSchedule({ ...editSchedule, start: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Date & Time
                        </label>
                        <input
                          type="datetime-local"
                          value={editSchedule.end}
                          onChange={(e) => setEditSchedule({ ...editSchedule, end: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => handleUpdateSchedule(exam.id)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                      >
                        ✅ Save Schedule
                      </button>
                      <button
                        onClick={() => setEditingExam(null)}
                        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Delete Confirmation */}
                {showDeleteConfirm === exam.id && (
                  <div className="bg-red-50 border-t border-red-200 p-6">
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">⚠️</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-red-800">Delete this exam?</h4>
                        <p className="text-sm text-red-600">This action cannot be undone. All questions and data will be permanently deleted.</p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleDelete(exam.id)}
                          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                        >
                          🗑️ Yes, Delete
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(null)}
                          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ManageExams;
