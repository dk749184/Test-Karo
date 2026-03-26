// ============================================
// PDF TEXT EXTRACTOR
// Extracts text from uploaded PDF files
// ============================================

import * as pdfjsLib from 'pdfjs-dist';

// Set worker path
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export interface ExtractedQuestion {
  text: string;
  options: string[];
  correctAnswer: number;
  topic?: string;
}

// Extract text from PDF file
export const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => {
          if ('str' in item) {
            return (item as { str: string }).str;
          }
          return '';
        })
        .join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText;
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    throw new Error('Failed to extract text from PDF');
  }
};

// Parse extracted text to find questions
export const parseQuestionsFromText = (text: string): ExtractedQuestion[] => {
  const questions: ExtractedQuestion[] = [];
  
  // Common question patterns
  const patterns = [
    // Q1. or Q.1 or Question 1
    /(?:Q\.?\s*\d+|Question\s*\d+)[\.\:\)]\s*(.+?)(?=(?:Q\.?\s*\d+|Question\s*\d+|$))/gis,
    // 1. or 1) patterns
    /(?:^|\n)\s*(\d+)[\.\)]\s*(.+?)(?=(?:\n\s*\d+[\.\)]|$))/gis,
  ];
  
  // Try to find questions
  let matches: RegExpMatchArray[] = [];
  
  for (const pattern of patterns) {
    const found = [...text.matchAll(pattern)];
    if (found.length > matches.length) {
      matches = found;
    }
  }
  
  // If no structured questions found, split by newlines and look for question marks
  if (matches.length === 0) {
    const lines = text.split('\n').filter(line => line.trim());
    let currentQuestion: ExtractedQuestion | null = null;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Check if it's a question (ends with ? or starts with number)
      if (trimmed.includes('?') || /^\d+[\.\)]/.test(trimmed)) {
        if (currentQuestion && currentQuestion.options.length >= 2) {
          questions.push(currentQuestion);
        }
        currentQuestion = {
          text: trimmed.replace(/^\d+[\.\)]\s*/, ''),
          options: [],
          correctAnswer: 0
        };
      }
      // Check if it's an option
      else if (/^[A-Da-d][\.\)\:]/.test(trimmed) && currentQuestion) {
        const optionText = trimmed.replace(/^[A-Da-d][\.\)\:]\s*/, '');
        currentQuestion.options.push(optionText);
        
        // Check if marked as correct
        if (trimmed.includes('✓') || trimmed.includes('*') || trimmed.toLowerCase().includes('(correct)')) {
          currentQuestion.correctAnswer = currentQuestion.options.length - 1;
        }
      }
    }
    
    // Add last question
    if (currentQuestion && currentQuestion.options.length >= 2) {
      questions.push(currentQuestion);
    }
  }
  
  // Process matched questions
  for (const match of matches) {
    const questionText = match[1] || match[2] || '';
    const cleanText = questionText.trim();
    
    if (cleanText.length > 10) {
      // Try to extract options from the question text
      const optionPattern = /[A-Da-d][\.\)\:]\s*([^\n]+)/g;
      const optionMatches = [...cleanText.matchAll(optionPattern)];
      
      if (optionMatches.length >= 2) {
        const mainQuestion = cleanText.split(/[A-Da-d][\.\)\:]/)[0].trim();
        const options = optionMatches.map(m => m[1].trim());
        
        questions.push({
          text: mainQuestion,
          options: options.slice(0, 4),
          correctAnswer: 0
        });
      }
    }
  }
  
  return questions;
};

// Detect topics from text
export const detectTopicsFromText = (text: string): string[] => {
  const topics: string[] = [];
  const lowerText = text.toLowerCase();
  
  const topicKeywords: Record<string, string[]> = {
    'Algebra': ['equation', 'polynomial', 'linear', 'quadratic', 'variable', 'expression', 'algebra'],
    'Trigonometry': ['sin', 'cos', 'tan', 'angle', 'triangle', 'trigonometry', 'radian'],
    'Calculus': ['derivative', 'integration', 'limit', 'differentiation', 'calculus'],
    'Geometry': ['circle', 'square', 'rectangle', 'area', 'perimeter', 'geometry', 'volume'],
    'Statistics': ['mean', 'median', 'mode', 'probability', 'statistics'],
    'Mechanics': ['force', 'motion', 'velocity', 'acceleration', 'newton', 'mechanics'],
    'Electricity': ['current', 'voltage', 'resistance', 'circuit', 'electricity'],
    'Programming': ['loop', 'function', 'variable', 'array', 'programming', 'code'],
    'Database': ['sql', 'table', 'query', 'database', 'mysql'],
    'Chemistry': ['element', 'compound', 'reaction', 'acid', 'base', 'chemistry'],
    'Biology': ['cell', 'dna', 'gene', 'organism', 'biology', 'anatomy'],
    'Physics': ['physics', 'energy', 'wave', 'light', 'optics'],
    'English': ['grammar', 'vocabulary', 'tense', 'noun', 'verb', 'english'],
    'History': ['history', 'war', 'empire', 'king', 'independence'],
    'Geography': ['geography', 'continent', 'ocean', 'climate', 'river']
  };
  
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        if (!topics.includes(topic)) {
          topics.push(topic);
        }
        break;
      }
    }
  }
  
  return topics.length > 0 ? topics : ['General'];
};

export default {
  extractTextFromPDF,
  parseQuestionsFromText,
  detectTopicsFromText
};
