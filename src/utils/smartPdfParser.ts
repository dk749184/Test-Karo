// Smart PDF Parser - Extracts exact questions from any PDF format
// No new questions generated - only extracts what's in the PDF

interface ParsedQuestion {
  text: string;
  options: string[];
  correctAnswer: number; // -1 means not set, admin will set later
}

// Main function to parse PDF text and extract questions
export const smartParsePDFQuestions = (pdfText: string, _subject?: string): ParsedQuestion[] => {
  console.log('🤖🤖🤖 SMART PDF PARSER 🤖🤖🤖');
  console.log('📄 Input text length:', pdfText.length);
  console.log('📄 First 500 chars:', pdfText.substring(0, 500));
  
  const questions: ParsedQuestion[] = [];
  
  // Clean the text
  let text = pdfText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .trim();
  
  // Strategy 1: Find questions with numbered pattern
  console.log('📊 Strategy 1: Looking for numbered questions...');
  
  // Split text into potential question blocks
  const blocks = text.split(/(?=\n\s*(?:Q\.?\s*)?(?:\d+)[\.\)\:\-]\s)/i);
  
  console.log('📊 Found', blocks.length, 'potential blocks');
  
  for (const block of blocks) {
    if (block.trim().length < 10) continue;
    
    const parsed = parseQuestionBlock(block);
    if (parsed) {
      questions.push(parsed);
    }
  }
  
  // Strategy 2: If few questions found, try line-by-line parsing
  if (questions.length < 2) {
    console.log('📊 Strategy 2: Line-by-line parsing...');
    const lineQuestions = parseLineByLine(text);
    if (lineQuestions.length > questions.length) {
      questions.length = 0;
      questions.push(...lineQuestions);
    }
  }
  
  // Fill missing options with placeholders
  questions.forEach((q, idx) => {
    while (q.options.length < 4) {
      q.options.push(`Option ${String.fromCharCode(65 + q.options.length)}`);
    }
    // Clean empty options
    q.options = q.options.map((opt, i) => opt || `Option ${String.fromCharCode(65 + i)}`);
    console.log(`✅ Q${idx + 1}: ${q.text.substring(0, 50)}... | Options: ${q.options.length} | Answer: ${q.correctAnswer === -1 ? 'Not set' : String.fromCharCode(65 + q.correctAnswer)}`);
  });
  
  console.log('✅✅✅ Total extracted:', questions.length, 'questions');
  return questions;
};

// Parse a single question block
function parseQuestionBlock(block: string): ParsedQuestion | null {
  // Remove leading question number
  let cleaned = block.replace(/^\s*(?:Q\.?\s*)?(\d+)[\.\)\:\-]\s*/i, '').trim();
  
  if (cleaned.length < 5) return null;
  
  let questionText = '';
  const options: string[] = ['', '', '', ''];
  let correctAnswer = -1;
  
  // Try to extract inline options: "question text A) opt1 B) opt2 C) opt3 D) opt4"
  const inlinePattern = /^(.+?)\s*[Aa][\)\.\:]\s*(.+?)\s*[Bb][\)\.\:]\s*(.+?)\s*[Cc][\)\.\:]\s*(.+?)\s*[Dd][\)\.\:]\s*(.+)/s;
  const inlineMatch = cleaned.match(inlinePattern);
  
  if (inlineMatch) {
    questionText = inlineMatch[1].trim();
    options[0] = cleanOption(inlineMatch[2]);
    options[1] = cleanOption(inlineMatch[3]);
    options[2] = cleanOption(inlineMatch[4]);
    options[3] = cleanOption(inlineMatch[5].split(/\n/)[0]);
    
    // Check for answer in remaining text
    const answerMatch = cleaned.match(/(?:Answer|Ans|Correct|उत्तर)[:\s]+([A-Da-d])/i);
    if (answerMatch) {
      correctAnswer = answerMatch[1].toUpperCase().charCodeAt(0) - 65;
    }
    
    // Check if any option is marked as correct
    for (let i = 0; i < 4; i++) {
      if (inlineMatch[i + 2]?.match(/\*\*|✓|✔|√|\(correct\)|\(सही\)/i)) {
        correctAnswer = i;
        options[i] = options[i].replace(/\*\*|✓|✔|√|\(correct\)|\(सही\)/gi, '').trim();
      }
    }
  } else {
    // Try to find options on separate lines
    const lines = cleaned.split('\n');
    const questionLines: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      // Check if this is an option
      const optMatch = trimmed.match(/^[\(\[]?\s*([A-Da-d])[\)\.\:\-\]]\s*(.+)/i);
      if (optMatch) {
        const idx = optMatch[1].toUpperCase().charCodeAt(0) - 65;
        let optText = optMatch[2].trim();
        
        // Check if marked correct
        if (optText.match(/\*\*|✓|✔|√|\(correct\)|\(सही\)/i)) {
          correctAnswer = idx;
          optText = optText.replace(/\*\*|✓|✔|√|\(correct\)|\(सही\)/gi, '').trim();
        }
        
        options[idx] = cleanOption(optText);
        continue;
      }
      
      // Check for answer line
      const ansMatch = trimmed.match(/(?:Answer|Ans|Correct|उत्तर|Ans\.|Answer:)[:\s]*([A-Da-d])/i);
      if (ansMatch) {
        correctAnswer = ansMatch[1].toUpperCase().charCodeAt(0) - 65;
        continue;
      }
      
      // Otherwise it's part of question text (if we haven't found options yet)
      if (!options.some(o => o)) {
        questionLines.push(trimmed);
      }
    }
    
    questionText = questionLines.join(' ').trim();
  }
  
  // Validate
  const hasValidOptions = options.filter(o => o && o.length > 0).length >= 2;
  
  if (questionText.length > 5 && hasValidOptions) {
    return {
      text: questionText,
      options: options,
      correctAnswer: correctAnswer
    };
  }
  
  return null;
}

// Parse text line by line
function parseLineByLine(text: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = [];
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  
  let currentQuestion: ParsedQuestion | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if this starts a new question
    const questionMatch = line.match(/^(?:Q\.?\s*)?(\d+)[\.\)\:\-]\s*(.+)/i);
    if (questionMatch) {
      // Save previous question if valid
      if (currentQuestion && currentQuestion.text && currentQuestion.options.filter(o => o).length >= 2) {
        questions.push(currentQuestion);
      }
      
      currentQuestion = {
        text: questionMatch[2].trim(),
        options: ['', '', '', ''],
        correctAnswer: -1
      };
      continue;
    }
    
    // Check if this is an option
    const optMatch = line.match(/^[\(\[]?\s*([A-Da-d])[\)\.\:\-\]]\s*(.+)/i);
    if (optMatch && currentQuestion) {
      const idx = optMatch[1].toUpperCase().charCodeAt(0) - 65;
      let optText = optMatch[2].trim();
      
      // Check if marked correct
      if (optText.match(/\*\*|✓|✔|√|\(correct\)/i)) {
        currentQuestion.correctAnswer = idx;
        optText = optText.replace(/\*\*|✓|✔|√|\(correct\)/gi, '').trim();
      }
      
      currentQuestion.options[idx] = cleanOption(optText);
      continue;
    }
    
    // Check for answer line
    const ansMatch = line.match(/(?:Answer|Ans|Correct|उत्तर)[:\s]+([A-Da-d])/i);
    if (ansMatch && currentQuestion) {
      currentQuestion.correctAnswer = ansMatch[1].toUpperCase().charCodeAt(0) - 65;
      continue;
    }
    
    // If we have a current question but no options yet, append to question text
    if (currentQuestion && !currentQuestion.options.some(o => o)) {
      currentQuestion.text += ' ' + line;
    }
  }
  
  // Don't forget the last question
  if (currentQuestion && currentQuestion.text && currentQuestion.options.filter(o => o).length >= 2) {
    questions.push(currentQuestion);
  }
  
  return questions;
}

// Clean option text
function cleanOption(text: string): string {
  return text
    .replace(/\*\*/g, '')
    .replace(/✓|✔|√/g, '')
    .replace(/\(correct\)/gi, '')
    .replace(/\(सही\)/gi, '')
    .replace(/[A-Da-d][\)\.\:]\s*$/g, '') // Remove trailing option markers
    .trim();
}

// Format parsed questions for display (utility function)
export const formatParsedQuestions = (questions: ParsedQuestion[]): string => {
  return questions.map((q, idx) => {
    const answer = q.correctAnswer === -1 ? 'Not Set' : String.fromCharCode(65 + q.correctAnswer);
    return `Q${idx + 1}. ${q.text}\n` +
      `A) ${q.options[0]}\n` +
      `B) ${q.options[1]}\n` +
      `C) ${q.options[2]}\n` +
      `D) ${q.options[3]}\n` +
      `Answer: ${answer}`;
  }).join('\n\n');
};
