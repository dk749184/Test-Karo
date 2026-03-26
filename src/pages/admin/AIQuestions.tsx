import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useExam } from '../../context/ExamContext';
import { 
  generateQuestions, 
  generateQuestionsFromSyllabus,
  availableSubjects, 
  classLevels,
  GeneratedQuestion 
} from '../../lib/questionGenerator';

type GenerationMode = 'topic' | 'syllabus';

export default function AIQuestions() {
  const { addToQuestionBank, questionBank } = useExam();
  const [mode, setMode] = useState<GenerationMode>('topic');
  const [selectedClass, setSelectedClass] = useState('Class 12');
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');
  const [selectedTopic, setSelectedTopic] = useState('All Topics');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'mixed'>('mixed');
  const [numQuestions, setNumQuestions] = useState(10);
  const [syllabusText, setSyllabusText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);

  const currentSubject = availableSubjects.find(s => s.name === selectedSubject);
  const topics = currentSubject ? ['All Topics', ...currentSubject.topics] : ['All Topics'];

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedQuestions([]);

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    let questions: GeneratedQuestion[];

    if (mode === 'topic') {
      questions = generateQuestions(
        selectedSubject,
        selectedTopic === 'All Topics' ? '' : selectedTopic,
        numQuestions,
        difficulty,
        selectedClass
      );
    } else {
      questions = generateQuestionsFromSyllabus(
        syllabusText,
        numQuestions,
        difficulty,
        selectedClass
      );
    }

    setGeneratedQuestions(questions);
    setIsGenerating(false);
  };

  const handleRegenerateQuestion = (index: number) => {
    const question = generatedQuestions[index];
    const newQuestions = generateQuestions(
      question.subject,
      question.topic,
      1,
      question.difficulty,
      question.class
    );
    
    if (newQuestions.length > 0) {
      const updated = [...generatedQuestions];
      updated[index] = newQuestions[0];
      setGeneratedQuestions(updated);
    }
  };

  const handleDeleteQuestion = (index: number) => {
    setGeneratedQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditQuestion = (id: string, field: string, value: string | number) => {
    setGeneratedQuestions(prev => prev.map(q => {
      if (q.id === id) {
        if (field === 'question') {
          return { ...q, question: value as string };
        } else if (field.startsWith('option')) {
          const optIndex = parseInt(field.replace('option', ''));
          const newOptions = [...q.options];
          newOptions[optIndex] = value as string;
          return { ...q, options: newOptions };
        } else if (field === 'correctAnswer') {
          return { ...q, correctAnswer: value as number };
        }
      }
      return q;
    }));
  };

  const handleSaveToExam = () => {
    // Convert GeneratedQuestion to Question format and save to Question Bank
    const questionsToSave = generatedQuestions.map(q => ({
      id: q.id,
      text: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      difficulty: q.difficulty,
      subject: q.subject,
      topic: q.topic,
      classLevel: q.class,
      marks: 10
    }));
    
    addToQuestionBank(questionsToSave);
    alert(`✅ ${generatedQuestions.length} questions saved to Question Bank!\n\n📚 Total questions in bank: ${questionBank.length + generatedQuestions.length}\n\nThese questions are now available when creating exams.`);
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(generatedQuestions, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `questions_${selectedSubject}_${Date.now()}.json`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">🤖 AI Question Generator</h1>
        <p className="text-gray-600 mt-1">
          Generate unique questions automatically - every time different!
        </p>
      </div>

      {/* Mode Selection */}
      <Card>
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setMode('topic')}
            className={`flex-1 py-4 px-6 rounded-xl border-2 transition-all ${
              mode === 'topic'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-3xl mb-2">📚</div>
            <div className="font-semibold">By Topic</div>
            <div className="text-sm text-gray-500">Select class, subject & topic</div>
          </button>
          <button
            onClick={() => setMode('syllabus')}
            className={`flex-1 py-4 px-6 rounded-xl border-2 transition-all ${
              mode === 'syllabus'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-3xl mb-2">📄</div>
            <div className="font-semibold">By Syllabus</div>
            <div className="text-sm text-gray-500">Paste or upload syllabus text</div>
          </button>
        </div>

        {/* Topic Mode */}
        {mode === 'topic' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class / Level
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {classLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setSelectedTopic('All Topics');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {availableSubjects.map(subject => (
                  <option key={subject.name} value={subject.name}>{subject.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Topic
              </label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {topics.map(topic => (
                  <option key={topic} value={topic}>{topic}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="mixed">Mixed (All Levels)</option>
              </select>
            </div>
          </div>
        )}

        {/* Syllabus Mode */}
        {mode === 'syllabus' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class / Level
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {classLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="mixed">Mixed (All Levels)</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paste Syllabus / Topics
              </label>
              <textarea
                value={syllabusText}
                onChange={(e) => setSyllabusText(e.target.value)}
                placeholder="Example:
Class 12 Mathematics Syllabus:
- Algebra: Polynomials, Quadratic Equations
- Trigonometry: Trigonometric Functions, Identities
- Calculus: Derivatives, Integration
- Geometry: Circles, Triangles
- Statistics: Probability, Mean, Median"
                className="w-full h-40 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                AI will detect topics and generate relevant questions automatically
              </p>
            </div>
          </div>
        )}

        {/* Number of Questions & Generate Button */}
        <div className="flex items-end gap-4 mt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Questions
            </label>
            <input
              type="number"
              min="5"
              max="50"
              value={numQuestions}
              onChange={(e) => setNumQuestions(parseInt(e.target.value) || 10)}
              className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || (mode === 'syllabus' && !syllabusText.trim())}
            className="px-8"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              <>
                🚀 Generate Questions
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Generated Questions */}
      {generatedQuestions.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Generated Questions ({generatedQuestions.length})
              </h2>
              <p className="text-sm text-gray-500">
                Click on any question to edit • Questions are unique each time
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportJSON}>
                📥 Export JSON
              </Button>
              <Button onClick={handleSaveToExam}>
                💾 Save to Question Bank
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {generatedQuestions.map((q, index) => (
              <div
                key={q.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">
                      Q{index + 1}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      q.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                      q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {q.difficulty}
                    </span>
                    <span className="text-xs text-gray-500">
                      {q.subject} • {q.topic}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingQuestion(editingQuestion === q.id ? null : q.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleRegenerateQuestion(index)}
                      className="text-green-600 hover:text-green-800 text-sm"
                    >
                      🔄 Regenerate
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>

                {editingQuestion === q.id ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={q.question}
                      onChange={(e) => handleEditQuestion(q.id, 'question', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      {q.options.map((opt, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${q.id}`}
                            checked={q.correctAnswer === optIndex}
                            onChange={() => handleEditQuestion(q.id, 'correctAnswer', optIndex)}
                            className="text-green-600"
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleEditQuestion(q.id, `option${optIndex}`, e.target.value)}
                            className={`flex-1 px-3 py-1.5 border rounded-lg text-sm ${
                              q.correctAnswer === optIndex ? 'border-green-500 bg-green-50' : 'border-gray-300'
                            }`}
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">
                      💡 Select the radio button to mark the correct answer
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-800 font-medium mb-3">{q.question}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {q.options.map((opt, optIndex) => (
                        <div
                          key={optIndex}
                          className={`px-3 py-2 rounded-lg text-sm ${
                            q.correctAnswer === optIndex
                              ? 'bg-green-100 text-green-800 border border-green-300'
                              : 'bg-gray-50 text-gray-700 border border-gray-200'
                          }`}
                        >
                          <span className="font-medium mr-2">
                            {String.fromCharCode(65 + optIndex)}.
                          </span>
                          {opt}
                          {q.correctAnswer === optIndex && (
                            <span className="ml-2">✓</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Generate More Button */}
          <div className="mt-6 text-center">
            <Button variant="outline" onClick={handleGenerate}>
              🔄 Generate {numQuestions} More Questions
            </Button>
          </div>
        </Card>
      )}

      {/* Tips Section */}
      <Card>
        <h3 className="font-semibold text-gray-900 mb-4">💡 Tips for Best Results</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex gap-3">
            <div className="text-2xl">🎯</div>
            <div>
              <p className="font-medium text-gray-800">Specific Topics</p>
              <p className="text-sm text-gray-600">
                Select a specific topic like "Algebra" or "Trigonometry" for focused questions
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-2xl">🔄</div>
            <div>
              <p className="font-medium text-gray-800">Unique Every Time</p>
              <p className="text-sm text-gray-600">
                Each generation creates different questions with randomized numbers
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-2xl">📝</div>
            <div>
              <p className="font-medium text-gray-800">Syllabus Mode</p>
              <p className="text-sm text-gray-600">
                Paste your syllabus and AI will detect topics automatically
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-2xl">✏️</div>
            <div>
              <p className="font-medium text-gray-800">Edit & Customize</p>
              <p className="text-sm text-gray-600">
                Click edit to modify any question, option, or correct answer
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
