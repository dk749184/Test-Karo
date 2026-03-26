/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useRef } from 'react';
import { useExam } from '../../context/ExamContext';
import { Question } from '../../types';
import { generateQuestionsByTopic, getTopicsForSubject, detectTopicsFromSyllabus } from '../../utils/questionGenerator';
import { extractTextFromPDF, detectTopicsFromText } from '../../utils/pdfExtractor';
import { smartParsePDF, parseQuestionsFromText } from '../../utils/pdfParser';
import Tesseract from 'tesseract.js';
/* eslint-enable @typescript-eslint/no-unused-vars */

interface CreateExamProps {
  onSuccess?: () => void;
}

const CreateExam = ({ onSuccess }: CreateExamProps) => {
  const { addExam, questionBank } = useExam();
  
  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 1: Exam Details
  const [examDetails, setExamDetails] = useState({
    title: '',
    description: '',
    category: 'school' as 'school' | 'college' | 'competitive',
    class: '10',
    subject: 'Mathematics',
    duration: 60,
    passingScore: 40,
    maxAttempts: 1,
    scheduledStart: '',
    scheduledEnd: '',
    isPublic: false,
    instructions: 'Read all questions carefully.\nAll questions are compulsory.\nEach question carries equal marks.\nNo negative marking.'
  });

  // Step 2: Question Generation
  const [questionSource, setQuestionSource] = useState<'bank' | 'ai' | 'manual' | 'pdf'>('bank');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'mixed'>('mixed');
  const [questionCount, setQuestionCount] = useState(10);
  const [syllabusText, setSyllabusText] = useState('');
  const [generationMethod, setGenerationMethod] = useState<'topic' | 'syllabus' | 'pdf'>('topic');
  
  // PDF Upload states
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfText, setPdfText] = useState('');
  const [pdfQuestions, setPdfQuestions] = useState<Question[]>([]);
  const [isPdfProcessing, setIsPdfProcessing] = useState(false);
  const [pdfDetectedTopics, setPdfDetectedTopics] = useState<string[]>([]);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  
  // Question Bank states
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const [bankSubjectFilter, setBankSubjectFilter] = useState('all');
  const [bankClassFilter, setBankClassFilter] = useState('all');
  const [bankDifficultyFilter, setBankDifficultyFilter] = useState('all');
  const [selectedBankQuestions, setSelectedBankQuestions] = useState<string[]>([]);
  
  // Step 3: Questions
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);

  // Manual question form
  const [manualQuestion, setManualQuestion] = useState({
    text: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    image: '' // Base64 image
  });

  // Formula toolbar visibility
  const [showFormulaBar, setShowFormulaBar] = useState(false);
  const [activeField, setActiveField] = useState<'question' | 'option0' | 'option1' | 'option2' | 'option3' | null>(null);

  // Math and Chemistry symbols
  const formulaSymbols = {
    superscript: ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹', 'ⁿ', '⁺', '⁻', 'ˣ', 'ʸ'],
    subscript: ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉', 'ₙ', 'ₓ', 'ₐ', 'ₑ', 'ₒ'],
    math: ['√', '∛', '∜', '±', '×', '÷', '≠', '≤', '≥', '≈', '∞', '∑', '∫', '∂', '∆', '∇', 'π', '°', '′', '″', '∠', '⊥', '∥', '∴', '∵'],
    greek: ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'λ', 'μ', 'ν', 'ξ', 'ρ', 'σ', 'τ', 'φ', 'ω', 'Ω', 'Δ', 'Σ', 'Π'],
    chemistry: ['→', '⇌', '⇋', '↑', '↓', '⊕', '⊖', '⊙', '•', '⁺', '⁻', '²⁺', '³⁺', '²⁻', '³⁻'],
    fractions: ['½', '⅓', '¼', '⅕', '⅙', '⅛', '⅔', '¾', '⅖', '⅗', '⅘', '⅚', '⅝', '⅞'],
  };

  // Common formulas quick insert
  const commonFormulas = [
    // Math
    { label: 'x²', value: 'x²' },
    { label: 'x³', value: 'x³' },
    { label: 'a² + b²', value: 'a² + b²' },
    { label: '(a+b)²', value: '(a+b)²' },
    { label: 'a² - b²', value: 'a² - b²' },
    { label: '√x', value: '√x' },
    { label: '∛x', value: '∛x' },
    { label: 'πr²', value: 'πr²' },
    { label: '2πr', value: '2πr' },
    { label: 'sin²θ + cos²θ', value: 'sin²θ + cos²θ' },
    // Chemistry
    { label: 'H₂O', value: 'H₂O' },
    { label: 'H₂SO₄', value: 'H₂SO₄' },
    { label: 'CO₂', value: 'CO₂' },
    { label: 'O₂', value: 'O₂' },
    { label: 'N₂', value: 'N₂' },
    { label: 'CH₄', value: 'CH₄' },
    { label: 'NaOH', value: 'NaOH' },
    { label: 'HCl', value: 'HCl' },
    { label: 'NaCl', value: 'NaCl' },
    { label: 'CaCO₃', value: 'CaCO₃' },
    { label: 'NH₃', value: 'NH₃' },
    { label: 'H₂O₂', value: 'H₂O₂' },
    { label: 'Fe₂O₃', value: 'Fe₂O₃' },
    { label: 'C₆H₁₂O₆', value: 'C₆H₁₂O₆' },
  ];

  // Insert symbol into active field
  const insertSymbol = (symbol: string) => {
    if (activeField === 'question') {
      setManualQuestion(prev => ({ ...prev, text: prev.text + symbol }));
    } else if (activeField?.startsWith('option')) {
      const index = parseInt(activeField.replace('option', ''));
      setManualQuestion(prev => {
        const newOptions = [...prev.options];
        newOptions[index] = newOptions[index] + symbol;
        return { ...prev, options: newOptions };
      });
    }
  };
  
  // Image upload ref
  const imageInputRef = useRef<HTMLInputElement>(null);
  const editImageInputRef = useRef<HTMLInputElement>(null);
  const ocrImageInputRef = useRef<HTMLInputElement>(null);
  
  // OCR states
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrExtractedText, setOcrExtractedText] = useState('');
  const [ocrQuestions, setOcrQuestions] = useState<Question[]>([]);

  const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English', 'General Knowledge'];
  const classes = ['6', '7', '8', '9', '10', '11', '12', 'UG', 'PG'];

  // Get topics based on selected subject
  const availableTopics = getTopicsForSubject(examDetails.subject);

  // Filter Question Bank
  const filteredBankQuestions = questionBank.filter(q => {
    const matchesSearch = bankSearchQuery === '' || 
      q.text.toLowerCase().includes(bankSearchQuery.toLowerCase()) ||
      q.topic?.toLowerCase().includes(bankSearchQuery.toLowerCase());
    const matchesSubject = bankSubjectFilter === 'all' || q.subject === bankSubjectFilter;
    const matchesClass = bankClassFilter === 'all' || q.classLevel === bankClassFilter;
    const matchesDifficulty = bankDifficultyFilter === 'all' || q.difficulty === bankDifficultyFilter;
    
    return matchesSearch && matchesSubject && matchesClass && matchesDifficulty;
  });

  // Get unique values for filters
  const uniqueSubjects = [...new Set(questionBank.map(q => q.subject))];
  const uniqueClasses = [...new Set(questionBank.map(q => q.classLevel).filter(Boolean))];

  // Toggle question selection from bank
  const toggleBankQuestion = (questionId: string) => {
    setSelectedBankQuestions(prev => 
      prev.includes(questionId) 
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  // Select all filtered questions
  const selectAllFiltered = () => {
    const allIds = filteredBankQuestions.map(q => q.id);
    setSelectedBankQuestions(allIds);
  };

  // Deselect all
  const deselectAll = () => {
    setSelectedBankQuestions([]);
  };

  // Add selected questions from bank to exam
  const addSelectedFromBank = () => {
    const selectedQuestions = questionBank.filter(q => selectedBankQuestions.includes(q.id));
    setQuestions(prev => [...prev, ...selectedQuestions]);
    setSelectedBankQuestions([]);
  };

  // PDF parsing is handled by smartParsePDF from utils/pdfParser

  // Handle PDF file upload
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please upload a PDF file');
      return;
    }
    
    setPdfFile(file);
    setIsPdfProcessing(true);
    setPdfQuestions([]);
    
    try {
      console.log('📄 Processing PDF:', file.name);
      
      // Extract text from PDF
      const extractedText = await extractTextFromPDF(file);
      console.log('📝 Extracted text length:', extractedText.length);
      setPdfText(extractedText);
      
      // Detect topics from extracted text
      const topics = detectTopicsFromText(extractedText);
      console.log('📚 Detected topics:', topics);
      setPdfDetectedTopics(topics);
      
      // Use smart AI parser to extract exact questions from PDF
      const parseResult = smartParsePDF(extractedText);
      console.log('❓ Smart extracted questions:', parseResult.totalExtracted);
      console.log('🗑️ Removed waste content:', parseResult.removedContent.length, 'lines');
      
      if (parseResult.warnings.length > 0) {
        console.log('⚠️ Warnings:', parseResult.warnings);
      }
      
      if (parseResult.questions.length > 0) {
        // Convert to Question type with IDs
        const formattedQuestions: Question[] = parseResult.questions.map((q, idx) => ({
          id: `pdf_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 5)}`,
          text: q.text,
          options: q.options,
          correctAnswer: q.correctAnswer !== null ? q.correctAnswer : -1, // -1 means not set
          subject: examDetails.subject,
          topic: q.topic || 'PDF Extracted',
          difficulty: (q.difficulty as 'easy' | 'medium' | 'hard') || difficulty
        }));
        
        setPdfQuestions(formattedQuestions);
        
        // Count how many need answer set
        const needAnswer = formattedQuestions.filter(q => q.correctAnswer === -1).length;
        if (needAnswer > 0) {
          alert(`✅ Found ${formattedQuestions.length} questions!\n\n⚠️ ${needAnswer} questions need correct answer to be set.\nClick on an option to set it as correct.`);
        } else {
          alert(`✅ Found ${formattedQuestions.length} questions with answers! Review and add them.`);
        }
      } else {
        alert(`⚠️ No questions found automatically.\n\nPlease ensure your PDF has:\n1. Numbered questions (1., Q1., etc.)\n2. Labeled options (A., B., C., D.)\n\nYou can copy from extracted text and add manually.`);
      }
    } catch (error) {
      console.error('PDF processing error:', error);
      alert('Error processing PDF. Please try a different file.');
    } finally {
      setIsPdfProcessing(false);
    }
  };

  // Add PDF extracted questions to exam
  const handleAddPdfQuestions = () => {
    if (pdfQuestions.length > 0) {
      setQuestions(prev => [...prev, ...pdfQuestions]);
      setPdfQuestions([]);
      alert(`✅ Added ${pdfQuestions.length} questions from PDF!`);
    }
  };

  // Generate questions from PDF detected topics
  const handleGenerateFromPdf = () => {
    if (pdfDetectedTopics.length === 0) {
      alert('No topics detected. Please upload a PDF first.');
      return;
    }
    
    setIsGenerating(true);
    let newQuestions: Question[] = [];
    const questionsPerTopic = Math.ceil(questionCount / pdfDetectedTopics.length);
    
    pdfDetectedTopics.forEach(topic => {
      const topicQuestions = generateQuestionsByTopic(
        examDetails.subject,
        topic,
        difficulty,
        questionsPerTopic
      );
      newQuestions.push(...topicQuestions);
    });
    
    newQuestions = newQuestions.slice(0, questionCount);
    setQuestions(prev => [...prev, ...newQuestions]);
    setIsGenerating(false);
    alert(`✅ Generated ${newQuestions.length} questions from PDF topics!`);
  };

  // Generate questions using AI
  const handleGenerateQuestions = async () => {
    setIsGenerating(true);
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    let newQuestions: Question[] = [];

    if (generationMethod === 'topic' && selectedTopic) {
      newQuestions = generateQuestionsByTopic(
        examDetails.subject,
        selectedTopic,
        difficulty,
        questionCount
      );
    } else if (generationMethod === 'syllabus' && syllabusText.trim()) {
      const detectedTopics = detectTopicsFromSyllabus(syllabusText, examDetails.subject);
      console.log('📚 Detected topics from syllabus:', detectedTopics);
      
      const questionsPerTopic = Math.ceil(questionCount / Math.max(detectedTopics.length, 1));
      
      detectedTopics.forEach(topic => {
        const topicQuestions = generateQuestionsByTopic(
          examDetails.subject,
          topic,
          difficulty,
          questionsPerTopic
        );
        newQuestions.push(...topicQuestions);
      });
      
      // Trim to exact count
      newQuestions = newQuestions.slice(0, questionCount);
    } else if (generationMethod === 'pdf') {
      handleGenerateFromPdf();
      return;
    }

    if (newQuestions.length > 0) {
      setQuestions(prev => [...prev, ...newQuestions]);
      console.log(`✅ Added ${newQuestions.length} questions`);
    } else {
      alert('Could not generate questions. Please select a topic or enter syllabus.');
    }
    
    setIsGenerating(false);
  };

  // Handle Image OCR - Extract text from image
  const handleImageOCR = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG, etc.)');
      return;
    }

    setIsOcrProcessing(true);
    setOcrProgress(0);
    setOcrExtractedText('');
    setOcrQuestions([]);

    try {
      console.log('📷 Starting OCR on image:', file.name);

      // Use Tesseract.js for OCR
      const result = await Tesseract.recognize(file, 'hin+eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round(m.progress * 100));
          }
        }
      });

      const extractedText = result.data.text;
      console.log('📝 OCR Extracted text:', extractedText);
      setOcrExtractedText(extractedText);

      // Parse questions from extracted text
      if (extractedText.trim()) {
        const parsedQuestions = parseQuestionsFromText(extractedText);
        console.log('✅ Parsed questions:', parsedQuestions.length);

        if (parsedQuestions.length > 0) {
          // Convert to Question type
          const formattedQuestions: Question[] = parsedQuestions.map((q, idx) => ({
            id: `ocr_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 5)}`,
            text: q.text,
            options: q.options,
            correctAnswer: q.correctAnswer !== null ? q.correctAnswer : -1,
            subject: examDetails.subject,
            topic: 'Image Extracted',
            difficulty: difficulty
          }));

          setOcrQuestions(formattedQuestions);
          alert(`✅ Found ${formattedQuestions.length} questions from image!\n\n${formattedQuestions.filter(q => q.correctAnswer === -1).length > 0 ? '⚠️ Some questions need correct answer to be set.' : '✅ All questions have answers!'}`);
        } else {
          alert('⚠️ No questions detected in image.\n\nYou can view the extracted text and add questions manually.');
        }
      } else {
        alert('⚠️ Could not extract text from image.\n\nPlease try a clearer image or add questions manually.');
      }
    } catch (error) {
      console.error('OCR Error:', error);
      alert('Error processing image. Please try again.');
    } finally {
      setIsOcrProcessing(false);
    }
  };

  // Add OCR questions to exam
  const handleAddOcrQuestions = () => {
    if (ocrQuestions.length > 0) {
      setQuestions(prev => [...prev, ...ocrQuestions]);
      setOcrQuestions([]);
      setOcrExtractedText('');
      alert(`✅ Added ${ocrQuestions.length} questions from image!`);
    }
  };

  // Add manual question
  const handleAddManualQuestion = () => {
    if (!manualQuestion.text.trim() || manualQuestion.options.some(o => !o.trim())) {
      alert('Please fill all fields');
      return;
    }

    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      text: manualQuestion.text,
      options: [...manualQuestion.options],
      correctAnswer: manualQuestion.correctAnswer,
      subject: examDetails.subject,
      difficulty: difficulty,
      topic: selectedTopic || 'General'
    };

    setQuestions(prev => [...prev, newQuestion]);
    setManualQuestion({ text: '', options: ['', '', '', ''], correctAnswer: 0, image: '' });
  };

  // Edit question
  const handleUpdateQuestion = (questionId: string, updates: Partial<Question>) => {
    setQuestions(prev => prev.map(q => 
      q.id === questionId ? { ...q, ...updates } : q
    ));
    setEditingQuestion(null);
  };

  // Delete question
  const handleDeleteQuestion = (questionId: string) => {
    setQuestions(prev => prev.filter(q => q.id !== questionId));
  };

  // Regenerate single question
  const handleRegenerateQuestion = (index: number) => {
    const topic = questions[index].topic || selectedTopic || 'General';
    const newQuestions = generateQuestionsByTopic(
      examDetails.subject,
      topic,
      difficulty,
      1
    );
    if (newQuestions.length > 0) {
      setQuestions(prev => {
        const updated = [...prev];
        updated[index] = newQuestions[0];
        return updated;
      });
    }
  };

  // Create final exam
  const handleCreateExam = () => {
    if (questions.length === 0) {
      alert('Please add at least one question');
      return;
    }

    if (!examDetails.scheduledStart || !examDetails.scheduledEnd) {
      alert('Please set exam schedule (start and end time)');
      return;
    }

    const newExam = {
      id: `exam_${Date.now()}`,
      title: examDetails.title,
      description: examDetails.description,
      category: examDetails.category,
      class: `Class ${examDetails.class}`,
      classLevel: `Class ${examDetails.class}`,
      subject: examDetails.subject,
      duration: examDetails.duration,
      totalMarks: questions.length * 10,
      totalQuestions: questions.length,
      passingMarks: Math.round((examDetails.passingScore / 100) * questions.length * 10),
      difficulty: difficulty,
      instructions: examDetails.instructions.split('\n'),
      isEnabled: true,
      isActive: true,
      isPublic: examDetails.isPublic,
      scheduledStart: examDetails.scheduledStart,
      scheduledEnd: examDetails.scheduledEnd,
      questions: questions,
      createdBy: 'admin'
    };

    addExam(newExam);
    alert('✅ Exam created successfully!');
    
    // Reset form
    setCurrentStep(1);
    setQuestions([]);
    setExamDetails({
      title: '',
      description: '',
      category: 'school',
      class: '10',
      subject: 'Mathematics',
      duration: 60,
      passingScore: 40,
      maxAttempts: 1,
      scheduledStart: '',
      scheduledEnd: '',
      isPublic: false,
      instructions: 'Read all questions carefully.\nAll questions are compulsory.\nEach question carries equal marks.\nNo negative marking.'
    });
    
    if (onSuccess) {
      onSuccess();
    }
  };

  // Validation for each step
  const canProceedToStep2 = examDetails.title && examDetails.subject && examDetails.scheduledStart && examDetails.scheduledEnd;
  const canProceedToStep3 = questions.length > 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Exam</h1>
        <p className="text-gray-600">Follow the steps to create an exam with AI-generated questions or from Question Bank</p>
      </div>

      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[
            { num: 1, title: 'Exam Details', desc: 'Basic information & schedule' },
            { num: 2, title: 'Add Questions', desc: 'From Bank, AI, or Manual' },
            { num: 3, title: 'Review & Create', desc: 'Final review' }
          ].map((step, index) => (
            <div key={step.num} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                  currentStep >= step.num ? 'bg-blue-600' : 'bg-gray-300'
                }`}>
                  {currentStep > step.num ? '✓' : step.num}
                </div>
                <div className="text-center mt-2">
                  <p className={`font-medium ${currentStep >= step.num ? 'text-blue-600' : 'text-gray-400'}`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500">{step.desc}</p>
                </div>
              </div>
              {index < 2 && (
                <div className={`flex-1 h-1 mx-4 ${currentStep > step.num ? 'bg-blue-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Exam Details */}
      {currentStep === 1 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            📝 Exam Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Exam Title *
              </label>
              <input
                type="text"
                value={examDetails.title}
                onChange={(e) => setExamDetails({ ...examDetails, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Class 10 Mathematics Final Exam / कक्षा 10 गणित परीक्षा"
                lang="hi"
                style={{ fontFamily: "'Noto Sans Devanagari', 'Mangal', sans-serif" }}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={examDetails.description}
                onChange={(e) => setExamDetails({ ...examDetails, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                placeholder="Brief description of the exam"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                value={examDetails.category}
                onChange={(e) => setExamDetails({ ...examDetails, category: e.target.value as 'school' | 'college' | 'competitive' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="school">School</option>
                <option value="college">College</option>
                <option value="competitive">Competitive Exam</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class/Level *
              </label>
              <select
                value={examDetails.class}
                onChange={(e) => setExamDetails({ ...examDetails, class: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {classes.map(c => (
                  <option key={c} value={c}>Class {c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject *
              </label>
              <select
                value={examDetails.subject}
                onChange={(e) => setExamDetails({ ...examDetails, subject: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {subjects.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (minutes) *
              </label>
              <input
                type="number"
                value={examDetails.duration}
                onChange={(e) => setExamDetails({ ...examDetails, duration: parseInt(e.target.value) || 60 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="10"
                max="180"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Passing Score (%)
              </label>
              <input
                type="number"
                value={examDetails.passingScore}
                onChange={(e) => setExamDetails({ ...examDetails, passingScore: parseInt(e.target.value) || 40 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                max="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Access Type
              </label>
              <select
                value={examDetails.isPublic ? 'public' : 'private'}
                onChange={(e) => setExamDetails({ ...examDetails, isPublic: e.target.value === 'public' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="private">🔒 Login Required</option>
                <option value="public">🌐 Public (Guest Allowed)</option>
              </select>
            </div>

            {/* Schedule Section */}
            <div className="md:col-span-2 mt-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-600">
                ⏰ Exam Schedule (Required)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={examDetails.scheduledStart}
                    onChange={(e) => setExamDetails({ ...examDetails, scheduledStart: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Exam will be available from this time</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={examDetails.scheduledEnd}
                    onChange={(e) => setExamDetails({ ...examDetails, scheduledEnd: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Exam will close after this time</p>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instructions for Students
              </label>
              <textarea
                value={examDetails.instructions}
                onChange={(e) => setExamDetails({ ...examDetails, instructions: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setCurrentStep(2)}
              disabled={!canProceedToStep2}
              className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 ${
                canProceedToStep2
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Next: Add Questions →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Add Questions */}
      {currentStep === 2 && (
        <div className="space-y-6">
          {/* Question Source Tabs */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">📚 Add Questions</h2>
            
            <div className="flex gap-2 mb-6 flex-wrap">
              <button
                onClick={() => setQuestionSource('bank')}
                className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all ${
                  questionSource === 'bank'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="text-xl">📚</span>
                <div className="text-left">
                  <div>Question Bank</div>
                  <div className="text-xs opacity-75">{questionBank.length} questions saved</div>
                </div>
              </button>
              <button
                onClick={() => setQuestionSource('ai')}
                className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all ${
                  questionSource === 'ai'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="text-xl">🤖</span>
                <div className="text-left">
                  <div>AI Generate</div>
                  <div className="text-xs opacity-75">Auto-generate new</div>
                </div>
              </button>
              <button
                onClick={() => setQuestionSource('manual')}
                className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all ${
                  questionSource === 'manual'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="text-xl">✍️</span>
                <div className="text-left">
                  <div>Manual Entry</div>
                  <div className="text-xs opacity-75">Add one by one</div>
                </div>
              </button>
              <button
                onClick={() => setQuestionSource('pdf')}
                className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all ${
                  questionSource === 'pdf'
                    ? 'bg-orange-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="text-xl">📄</span>
                <div className="text-left">
                  <div>PDF Upload</div>
                  <div className="text-xs opacity-75">Extract from PDF</div>
                </div>
              </button>
            </div>

            {/* Question Bank Section */}
            {questionSource === 'bank' && (
              <div className="space-y-4">
                {questionBank.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <div className="text-6xl mb-4">📭</div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Question Bank is Empty</h3>
                    <p className="text-gray-500 mb-4">
                      Generate questions using AI Questions page first, then save them to Question Bank
                    </p>
                    <button
                      onClick={() => setQuestionSource('ai')}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      🤖 Generate with AI
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Search and Filters */}
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-xl">🔍</span>
                        <h3 className="font-semibold">Search & Filter Questions</h3>
                      </div>
                      
                      {/* Search Bar */}
                      <div className="mb-4">
                        <div className="relative">
                          <input
                            type="text"
                            value={bankSearchQuery}
                            onChange={(e) => setBankSearchQuery(e.target.value)}
                            placeholder="Search questions by text or topic..."
                            className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                          />
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">🔍</span>
                          {bankSearchQuery && (
                            <button
                              onClick={() => setBankSearchQuery('')}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Filters */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            📖 Subject
                          </label>
                          <select
                            value={bankSubjectFilter}
                            onChange={(e) => setBankSubjectFilter(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="all">All Subjects</option>
                            {uniqueSubjects.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            🎓 Class
                          </label>
                          <select
                            value={bankClassFilter}
                            onChange={(e) => setBankClassFilter(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="all">All Classes</option>
                            {uniqueClasses.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            📊 Difficulty
                          </label>
                          <select
                            value={bankDifficultyFilter}
                            onChange={(e) => setBankDifficultyFilter(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="all">All Difficulties</option>
                            <option value="easy">🟢 Easy</option>
                            <option value="medium">🟡 Medium</option>
                            <option value="hard">🔴 Hard</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Selection Actions */}
                    <div className="flex items-center justify-between p-4 bg-white border rounded-lg">
                      <div className="flex items-center gap-4">
                        <span className="font-medium">
                          📋 Found: <span className="text-blue-600">{filteredBankQuestions.length}</span> questions
                        </span>
                        <span className="text-gray-300">|</span>
                        <span className="font-medium">
                          ✅ Selected: <span className="text-green-600">{selectedBankQuestions.length}</span> questions
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={selectAllFiltered}
                          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium"
                        >
                          Select All ({filteredBankQuestions.length})
                        </button>
                        <button
                          onClick={deselectAll}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                        >
                          Deselect All
                        </button>
                        <button
                          onClick={addSelectedFromBank}
                          disabled={selectedBankQuestions.length === 0}
                          className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                            selectedBankQuestions.length > 0
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          ➕ Add Selected to Exam
                        </button>
                      </div>
                    </div>

                    {/* Questions List */}
                    <div className="max-h-96 overflow-y-auto space-y-3 p-2">
                      {filteredBankQuestions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <div className="text-4xl mb-2">🔍</div>
                          <p>No questions found matching your filters</p>
                        </div>
                      ) : (
                        filteredBankQuestions.map((question, index) => (
                          <div
                            key={question.id}
                            onClick={() => toggleBankQuestion(question.id)}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                              selectedBankQuestions.includes(question.id)
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                                selectedBankQuestions.includes(question.id)
                                  ? 'border-green-500 bg-green-500 text-white'
                                  : 'border-gray-300'
                              }`}>
                                {selectedBankQuestions.includes(question.id) && '✓'}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 mb-2">
                                  {index + 1}. {question.text}
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm mb-2">
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
                                <div className="flex gap-2 text-xs">
                                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                    {question.subject}
                                  </span>
                                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                                    {question.topic}
                                  </span>
                                  <span className={`px-2 py-1 rounded ${
                                    question.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                    question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {question.difficulty}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* AI Generation Section */}
            {questionSource === 'ai' && (
              <div className="space-y-4">
                <div className="flex gap-4 mb-4 flex-wrap">
                  <button
                    onClick={() => setGenerationMethod('topic')}
                    className={`px-4 py-2 rounded-lg ${
                      generationMethod === 'topic'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    📚 By Topic
                  </button>
                  <button
                    onClick={() => setGenerationMethod('syllabus')}
                    className={`px-4 py-2 rounded-lg ${
                      generationMethod === 'syllabus'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    📄 By Syllabus
                  </button>
                </div>

                {generationMethod === 'topic' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Topic
                      </label>
                      <select
                        value={selectedTopic}
                        onChange={(e) => setSelectedTopic(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Select Topic</option>
                        {availableTopics.map(topic => (
                          <option key={topic} value={topic}>{topic}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Difficulty
                      </label>
                      <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard' | 'mixed')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                        <option value="mixed">Mixed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Number of Questions
                      </label>
                      <input
                        type="number"
                        value={questionCount}
                        onChange={(e) => setQuestionCount(parseInt(e.target.value) || 10)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        min="1"
                        max="50"
                      />
                    </div>
                  </div>
                )}

                {generationMethod === 'syllabus' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Paste Syllabus Content
                      </label>
                      <textarea
                value={syllabusText}
                onChange={(e) => setSyllabusText(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                rows={5}
                placeholder="Paste your syllabus here... / अपना सिलेबस यहाँ पेस्ट करें...
Chapter 1: Algebra - Linear equations, Quadratic equations
अध्याय 1: बीजगणित - रैखिक समीकरण
Chapter 2: Trigonometry - Sin, Cos, Tan functions"
                lang="hi"
                style={{ fontFamily: "'Noto Sans Devanagari', 'Mangal', sans-serif" }}
              />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Difficulty
                        </label>
                        <select
                          value={difficulty}
                          onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard' | 'mixed')}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                          <option value="mixed">Mixed</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Total Questions
                        </label>
                        <input
                          type="number"
                          value={questionCount}
                          onChange={(e) => setQuestionCount(parseInt(e.target.value) || 10)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          min="1"
                          max="50"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleGenerateQuestions}
                  disabled={
                    isGenerating || 
                    (generationMethod === 'topic' && !selectedTopic) || 
                    (generationMethod === 'syllabus' && !syllabusText.trim())
                  }
                  className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${
                    isGenerating
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <span className="animate-spin">⚙️</span>
                      Generating Questions...
                    </>
                  ) : (
                    <>
                      🚀 Generate {questionCount} Questions
                    </>
                  )}
                </button>
              </div>
            )}

            {/* PDF Upload Section - Separate Tab */}
            {questionSource === 'pdf' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-orange-800 mb-2">📄 Upload Question Paper PDF</h3>
                  <p className="text-sm text-orange-700">
                    Upload your question paper PDF. We will extract the <strong>exact same questions</strong> as they appear in the PDF.
                    No new questions will be generated - only questions from your PDF will be extracted.
                  </p>
                </div>

                {/* PDF Upload Area */}
                <div 
                  className="border-2 border-dashed border-orange-300 rounded-lg p-8 text-center hover:border-orange-500 transition-colors bg-white cursor-pointer"
                  onClick={() => pdfInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={pdfInputRef}
                    onChange={handlePdfUpload}
                    accept=".pdf"
                    className="hidden"
                  />
                  <div className="text-6xl mb-4">📄</div>
                  {pdfFile ? (
                    <>
                      <p className="text-xl font-medium text-green-700">✅ {pdfFile.name}</p>
                      <p className="text-sm text-gray-500 mt-2">File uploaded successfully</p>
                    </>
                  ) : (
                    <>
                      <p className="text-xl font-medium text-gray-700">Click to upload PDF</p>
                      <p className="text-sm text-gray-500 mt-2">or drag and drop your question paper here</p>
                    </>
                  )}
                  {isPdfProcessing && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-orange-600">
                      <span className="animate-spin text-2xl">⚙️</span>
                      <span className="font-medium">Processing PDF... Please wait</span>
                    </div>
                  )}
                </div>

                {/* PDF Format Guide */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-3">📋 PDF Format Guide:</h4>
                  <div className="bg-white p-4 rounded-lg border border-blue-200 text-sm font-mono">
                    <p className="text-gray-700">1. What is 2 + 2?</p>
                    <p className="text-gray-600 ml-4">A) 3</p>
                    <p className="text-gray-600 ml-4">B) 4</p>
                    <p className="text-gray-600 ml-4">C) 5</p>
                    <p className="text-gray-600 ml-4">D) 6</p>
                    <p className="text-green-600 ml-4">Answer: B</p>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    💡 Tip: Questions should be numbered (1., Q1., etc.) and options should be labeled (A, B, C, D)
                  </p>
                </div>

                {/* Extracted Text Preview */}
                {pdfText && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-700 mb-2">📝 Extracted Text from PDF:</h4>
                    <div className="bg-white p-4 rounded border max-h-40 overflow-y-auto text-sm text-gray-600 whitespace-pre-wrap">
                      {pdfText.substring(0, 1000)}
                      {pdfText.length > 1000 && '...'}
                    </div>
                  </div>
                )}

                {/* Detected Topics */}
                {pdfDetectedTopics.length > 0 && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">📚 Detected Topics:</h4>
                    <div className="flex flex-wrap gap-2">
                      {pdfDetectedTopics.map((topic, idx) => (
                        <span key={idx} className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm font-medium">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Extracted Questions with Edit Option */}
                {pdfQuestions.length > 0 && (
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h4 className="font-semibold text-orange-800 text-lg">
                          ✅ Found {pdfQuestions.length} Questions from PDF
                        </h4>
                        <p className="text-sm text-orange-600">
                          {pdfQuestions.filter(q => q.correctAnswer === -1).length > 0 
                            ? `⚠️ ${pdfQuestions.filter(q => q.correctAnswer === -1).length} questions need correct answer - click to set`
                            : '✅ All questions have correct answers set'}
                        </p>
                      </div>
                      <button
                        onClick={handleAddPdfQuestions}
                        disabled={pdfQuestions.some(q => q.correctAnswer === -1)}
                        className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 ${
                          pdfQuestions.some(q => q.correctAnswer === -1)
                            ? 'bg-gray-400 cursor-not-allowed text-white'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        ➕ Add All to Exam
                      </button>
                    </div>
                    
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                      {pdfQuestions.map((q, idx) => (
                        <div 
                          key={idx} 
                          className={`bg-white p-4 rounded-lg border-2 ${
                            q.correctAnswer === -1 
                              ? 'border-red-300 bg-red-50' 
                              : 'border-green-300'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="font-medium text-gray-900 flex-1">
                              <span className="inline-flex items-center justify-center w-7 h-7 bg-blue-600 text-white rounded-full text-sm mr-2">
                                {idx + 1}
                              </span>
                              {q.text}
                            </div>
                            {q.correctAnswer === -1 && (
                              <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                                ⚠️ Set Answer
                              </span>
                            )}
                          </div>
                          
                          {/* Options with click to set correct answer */}
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {q.options.map((opt, optIdx) => (
                              <button 
                                key={optIdx}
                                onClick={() => {
                                  const updatedQuestions = [...pdfQuestions];
                                  updatedQuestions[idx] = { ...q, correctAnswer: optIdx };
                                  setPdfQuestions(updatedQuestions);
                                }}
                                className={`p-3 rounded-lg text-left transition-all border-2 ${
                                  q.correctAnswer === optIdx 
                                    ? 'bg-green-100 text-green-800 font-medium border-green-500' 
                                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                                }`}
                              >
                                <span className="font-bold mr-2">{String.fromCharCode(65 + optIdx)}.</span>
                                {opt}
                                {q.correctAnswer === optIdx && (
                                  <span className="ml-2 text-green-600">✓ Correct</span>
                                )}
                              </button>
                            ))}
                          </div>

                          {/* Delete button */}
                          <div className="mt-3 flex justify-end">
                            <button
                              onClick={() => {
                                const updatedQuestions = pdfQuestions.filter((_, i) => i !== idx);
                                setPdfQuestions(updatedQuestions);
                              }}
                              className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
                            >
                              🗑️ Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Questions Found Message */}
                {pdfFile && !isPdfProcessing && pdfQuestions.length === 0 && pdfText && (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h4 className="font-semibold text-yellow-800 mb-2">⚠️ No Questions Detected</h4>
                    <p className="text-sm text-yellow-700 mb-3">
                      Could not automatically detect questions from your PDF. This might happen if:
                    </p>
                    <ul className="text-sm text-yellow-700 list-disc ml-5 space-y-1">
                      <li>Questions are not numbered properly</li>
                      <li>PDF contains images instead of text</li>
                      <li>Format is different from expected</li>
                    </ul>
                    <p className="text-sm text-yellow-700 mt-3">
                      💡 You can copy questions from the extracted text above and add them manually.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Manual Entry Section */}
            {questionSource === 'manual' && (
              <div className="space-y-6 p-4 bg-gray-50 rounded-lg">
                
                {/* Image to Questions - OCR Section */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border-2 border-dashed border-purple-300">
                  <h3 className="text-lg font-semibold text-purple-800 mb-2 flex items-center gap-2">
                    🤖 AI Image Analysis - Extract Questions from Image
                  </h3>
                  <p className="text-sm text-purple-600 mb-4">
                    Upload an image of question paper. AI will analyze and extract all questions automatically.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <input
                      type="file"
                      ref={ocrImageInputRef}
                      accept="image/*"
                      onChange={handleImageOCR}
                      className="hidden"
                    />
                    <button
                      onClick={() => ocrImageInputRef.current?.click()}
                      disabled={isOcrProcessing}
                      className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 ${
                        isOcrProcessing
                          ? 'bg-gray-300 cursor-not-allowed'
                          : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                      }`}
                    >
                      {isOcrProcessing ? (
                        <>
                          <span className="animate-spin">⚙️</span>
                          Analyzing... {ocrProgress}%
                        </>
                      ) : (
                        <>
                          📷 Upload Image for AI Analysis
                        </>
                      )}
                    </button>
                  </div>

                  {/* OCR Progress */}
                  {isOcrProcessing && (
                    <div className="mt-4">
                      <div className="flex justify-between text-sm text-purple-700 mb-1">
                        <span>Processing image...</span>
                        <span>{ocrProgress}%</span>
                      </div>
                      <div className="w-full bg-purple-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${ocrProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* OCR Extracted Text */}
                  {ocrExtractedText && (
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-700 mb-2">📝 Extracted Text:</h4>
                      <div className="bg-white p-3 rounded border max-h-32 overflow-y-auto text-sm text-gray-600 whitespace-pre-wrap">
                        {ocrExtractedText.substring(0, 500)}
                        {ocrExtractedText.length > 500 && '...'}
                      </div>
                    </div>
                  )}

                  {/* OCR Questions */}
                  {ocrQuestions.length > 0 && (
                    <div className="mt-4 bg-white p-4 rounded-lg border">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold text-green-700">
                          ✅ Found {ocrQuestions.length} Questions from Image
                        </h4>
                        <button
                          onClick={handleAddOcrQuestions}
                          disabled={ocrQuestions.some(q => q.correctAnswer === -1)}
                          className={`px-4 py-2 rounded-lg font-medium ${
                            ocrQuestions.some(q => q.correctAnswer === -1)
                              ? 'bg-gray-400 cursor-not-allowed text-white'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          ➕ Add All to Exam
                        </button>
                      </div>
                      
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {ocrQuestions.map((q, idx) => (
                          <div 
                            key={idx} 
                            className={`p-3 rounded-lg border-2 ${
                              q.correctAnswer === -1 
                                ? 'border-red-300 bg-red-50' 
                                : 'border-green-300 bg-green-50'
                            }`}
                          >
                            <div className="font-medium mb-2">
                              {idx + 1}. {q.text}
                              {q.correctAnswer === -1 && (
                                <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                                  Set Answer
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              {q.options.map((opt, optIdx) => (
                                <button 
                                  key={optIdx}
                                  onClick={() => {
                                    const updated = [...ocrQuestions];
                                    updated[idx] = { ...q, correctAnswer: optIdx };
                                    setOcrQuestions(updated);
                                  }}
                                  className={`p-2 rounded text-left border ${
                                    q.correctAnswer === optIdx 
                                      ? 'bg-green-100 border-green-500 text-green-800' 
                                      : 'bg-white border-gray-200 hover:border-blue-400'
                                  }`}
                                >
                                  {String.fromCharCode(65 + optIdx)}. {opt}
                                  {q.correctAnswer === optIdx && ' ✓'}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">✍️ Or Add Question Manually</h3>
                </div>

                {/* Formula Toolbar */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-blue-800 flex items-center gap-2">
                      🔢 Math & Chemistry Formula Toolbar
                    </h4>
                    <button
                      onClick={() => setShowFormulaBar(!showFormulaBar)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      {showFormulaBar ? '▲ Hide' : '▼ Show All'}
                    </button>
                  </div>
                  {/* Quick Insert */}
                  <div className="mb-3">
                    <p className="text-xs text-gray-600 mb-2">📌 Quick Insert:</p>
                    <div className="flex flex-wrap gap-1">
                      {commonFormulas.map((f, idx) => (
                        <button key={idx} onClick={() => insertSymbol(f.value)} className="px-2 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-blue-100 font-mono">{f.label}</button>
                      ))}
                    </div>
                  </div>
                  {showFormulaBar && (
                    <div className="space-y-2 border-t pt-3">
                      <div>
                        <p className="text-xs font-semibold text-gray-700 mb-1">⬆️ Superscripts:</p>
                        <div className="flex flex-wrap gap-1">{formulaSymbols.superscript.map((s, idx) => (<button key={idx} onClick={() => insertSymbol(s)} className="w-7 h-7 bg-white border rounded hover:bg-green-100 font-mono">{s}</button>))}</div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-700 mb-1">⬇️ Subscripts:</p>
                        <div className="flex flex-wrap gap-1">{formulaSymbols.subscript.map((s, idx) => (<button key={idx} onClick={() => insertSymbol(s)} className="w-7 h-7 bg-white border rounded hover:bg-green-100 font-mono">{s}</button>))}</div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-700 mb-1">➕ Math:</p>
                        <div className="flex flex-wrap gap-1">{formulaSymbols.math.map((s, idx) => (<button key={idx} onClick={() => insertSymbol(s)} className="w-7 h-7 bg-white border rounded hover:bg-blue-100 font-mono">{s}</button>))}</div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-700 mb-1">🔤 Greek:</p>
                        <div className="flex flex-wrap gap-1">{formulaSymbols.greek.map((s, idx) => (<button key={idx} onClick={() => insertSymbol(s)} className="w-7 h-7 bg-white border rounded hover:bg-purple-100 font-mono">{s}</button>))}</div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-700 mb-1">⚗️ Chemistry:</p>
                        <div className="flex flex-wrap gap-1">{formulaSymbols.chemistry.map((s, idx) => (<button key={idx} onClick={() => insertSymbol(s)} className="w-7 h-7 bg-white border rounded hover:bg-yellow-100 font-mono">{s}</button>))}</div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-700 mb-1">➗ Fractions:</p>
                        <div className="flex flex-wrap gap-1">{formulaSymbols.fractions.map((s, idx) => (<button key={idx} onClick={() => insertSymbol(s)} className="w-7 h-7 bg-white border rounded hover:bg-orange-100 font-mono">{s}</button>))}</div>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">💡 Click on Question/Option field first, then click symbol</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Question Text *
                  </label>
                  <textarea
                    value={manualQuestion.text}
                    onChange={(e) => setManualQuestion({ ...manualQuestion, text: e.target.value })}
                    onFocus={() => setActiveField('question')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Enter question here... (e.g., x² + y² = ? या H₂SO₄ का सूत्र)"
                    lang="hi"
                    style={{ fontFamily: "'Noto Sans Devanagari', 'Mangal', sans-serif" }}
                  />
                </div>
                
                {/* Image Upload Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    📷 Question Image (Optional)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      ref={imageInputRef}
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setManualQuestion({ ...manualQuestion, image: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center gap-2"
                    >
                      📷 Upload Image
                    </button>
                    {manualQuestion.image && (
                      <div className="flex items-center gap-2">
                        <img 
                          src={manualQuestion.image} 
                          alt="Question" 
                          className="h-16 w-auto rounded border"
                        />
                        <button
                          onClick={() => setManualQuestion({ ...manualQuestion, image: '' })}
                          className="text-red-500 hover:text-red-700"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Add diagram, figure or image for the question
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {manualQuestion.options.map((option, index) => (
                    <div key={index}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Option {String.fromCharCode(65 + index)}
                        {manualQuestion.correctAnswer === index && (
                          <span className="text-green-600 ml-2">✓ Correct</span>
                        )}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...manualQuestion.options];
                            newOptions[index] = e.target.value;
                            setManualQuestion({ ...manualQuestion, options: newOptions });
                          }}
                          onFocus={() => setActiveField(`option${index}` as 'option0' | 'option1' | 'option2' | 'option3')}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder={`Option ${String.fromCharCode(65 + index)} (e.g., H₂O, x², √2)`}
                          lang="hi"
                          style={{ fontFamily: "'Noto Sans Devanagari', 'Mangal', sans-serif" }}
                        />
                        <button
                          onClick={() => setManualQuestion({ ...manualQuestion, correctAnswer: index })}
                          className={`px-3 py-2 rounded-lg ${
                            manualQuestion.correctAnswer === index
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-200 hover:bg-gray-300'
                          }`}
                        >
                          ✓
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleAddManualQuestion}
                  className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  ➕ Add Question
                </button>
              </div>
            )}
          </div>

          {/* Questions Added to Exam */}
          {questions.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <span className="text-2xl">📋</span>
                  Questions Added to Exam ({questions.length})
                </h3>
                <button
                  onClick={() => setQuestions([])}
                  className="text-red-600 hover:text-red-700 text-sm px-3 py-1 border border-red-300 rounded-lg hover:bg-red-50"
                >
                  🗑️ Clear All
                </button>
              </div>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {questions.map((question, index) => (
                  <div key={question.id} className="p-4 border rounded-lg bg-green-50 border-green-200">
                    {editingQuestion === question.id ? (
                      <div className="space-y-3">
                        <textarea
                          value={question.text}
                          onChange={(e) => handleUpdateQuestion(question.id, { text: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg"
                          rows={2}
                        />
                        
                        {/* Image upload in edit mode */}
                        <div className="flex items-center gap-4">
                          <input
                            type="file"
                            ref={editImageInputRef}
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  handleUpdateQuestion(question.id, { image: reader.result as string });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="hidden"
                          />
                          <button
                            onClick={() => editImageInputRef.current?.click()}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm"
                          >
                            📷 {question.image ? 'Change Image' : 'Add Image'}
                          </button>
                          {question.image && (
                            <div className="flex items-center gap-2">
                              <img src={question.image} alt="" className="h-12 rounded border" />
                              <button
                                onClick={() => handleUpdateQuestion(question.id, { image: '' })}
                                className="text-red-500 text-sm"
                              >
                                ✕ Remove
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          {question.options.map((option, optIndex) => (
                            <div key={optIndex} className="flex gap-2">
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => {
                                  const newOptions = [...question.options];
                                  newOptions[optIndex] = e.target.value;
                                  handleUpdateQuestion(question.id, { options: newOptions });
                                }}
                                className="flex-1 px-3 py-1 border rounded"
                              />
                              <button
                                onClick={() => handleUpdateQuestion(question.id, { correctAnswer: optIndex })}
                                className={`px-2 rounded ${
                                  question.correctAnswer === optIndex
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-200'
                                }`}
                              >
                                ✓
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => setEditingQuestion(null)}
                          className="px-4 py-1 bg-blue-600 text-white rounded"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium">Q{index + 1}. {question.text}</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleRegenerateQuestion(index)}
                              className="text-blue-600 hover:text-blue-700"
                              title="Regenerate"
                            >
                              🔄
                            </button>
                            <button
                              onClick={() => setEditingQuestion(question.id)}
                              className="text-gray-600 hover:text-gray-700"
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(question.id)}
                              className="text-red-600 hover:text-red-700"
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
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-white'
                              }`}
                            >
                              {String.fromCharCode(65 + optIndex)}. {option}
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          Topic: {question.topic} | Difficulty: {question.difficulty}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              ← Back
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              disabled={!canProceedToStep3}
              className={`px-6 py-2 rounded-lg font-medium ${
                canProceedToStep3
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Next: Review & Create →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Create */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6">📋 Review Exam Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Basic Information</h3>
                <div className="space-y-2">
                  <p><span className="text-gray-500">Title:</span> <strong>{examDetails.title}</strong></p>
                  <p><span className="text-gray-500">Subject:</span> {examDetails.subject}</p>
                  <p><span className="text-gray-500">Category:</span> {examDetails.category}</p>
                  <p><span className="text-gray-500">Class:</span> {examDetails.class}</p>
                  <p><span className="text-gray-500">Duration:</span> {examDetails.duration} minutes</p>
                  <p><span className="text-gray-500">Passing Score:</span> {examDetails.passingScore}%</p>
                  <p><span className="text-gray-500">Access:</span> {examDetails.isPublic ? '🌐 Public' : '🔒 Login Required'}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Schedule</h3>
                <div className="space-y-2 p-4 bg-blue-50 rounded-lg">
                  <p className="flex items-center gap-2">
                    <span className="text-green-600">🟢</span>
                    <span className="text-gray-500">Start:</span> 
                    <strong>{new Date(examDetails.scheduledStart).toLocaleString()}</strong>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-red-600">🔴</span>
                    <span className="text-gray-500">End:</span> 
                    <strong>{new Date(examDetails.scheduledEnd).toLocaleString()}</strong>
                  </p>
                </div>
              </div>

              <div className="md:col-span-2">
                <h3 className="font-semibold text-lg border-b pb-2">Questions Summary</h3>
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <div className="text-3xl font-bold text-green-600">{questions.length}</div>
                    <div className="text-sm text-gray-600">Total Questions</div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <div className="text-3xl font-bold text-blue-600">{questions.length * 10}</div>
                    <div className="text-sm text-gray-600">Total Marks</div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg text-center">
                    <div className="text-3xl font-bold text-purple-600">{examDetails.duration}</div>
                    <div className="text-sm text-gray-600">Minutes</div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <h3 className="font-semibold text-lg border-b pb-2 mb-4">Questions Preview</h3>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {questions.map((q, index) => (
                    <div key={q.id} className="p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Q{index + 1}.</span> {q.text}
                      <span className="ml-2 text-xs text-gray-500">({q.topic})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              ← Back
            </button>
            <button
              onClick={handleCreateExam}
              className="px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-blue-700 flex items-center gap-2"
            >
              ✅ Create Exam
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateExam;
