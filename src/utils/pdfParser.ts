/**
 * ✅ IMPROVED Smart PDF Parser
 * Specially optimized for:
 * - Rajasthan Board / CBSE / State Board exam papers
 * - Hindi + English bilingual papers
 * - (A) (B) (C) (D) option format
 * - Inline options on same line or separate lines
 * - Removes headers, instructions, page numbers cleanly
 */

interface ParsedQuestion {
  text: string;
  options: string[];
  correctAnswer: number | null;
  topic?: string;
  difficulty?: string;
}

interface ParseResult {
  questions: ParsedQuestion[];
  totalExtracted: number;
  removedContent: string[];
  warnings: string[];
  rawText: string;
}

// ============================================================
// WASTE CONTENT — lines to skip completely
// ============================================================
const WASTE_PATTERNS: RegExp[] = [
  /^\s*\d+\s*$/,                              // lone page numbers
  /page\s*\d+\s*(of\s*\d+)?/i,               // "Page 3 of 48"
  /XSP-\d+/i,                                // "XSP-5510"
  /\(L\/\d+\)\s*\d+\s*[A-Z]/,               // "(L/3)110 A"
  /^\s*[-–—_=]{3,}\s*$/,                     // separator lines
  /^\s*[.…]{3,}\s*$/,
  // Exam headers
  /secondary\s+sent.?up\s+examination/i,
  /माध्यमिक\s+उत्प्रेषण\s+परीक्षा/,
  /question\s+booklet\s+serial/i,
  /प्रश्न\s+पुस्तिका\s+क्रमांक/,
  /set\s+code/i,
  /subject\s+code/i,
  /विषय\s+कोड/,
  /total\s+(questions|marks|printed)/i,
  /कुल\s+(प्रश्न|मुद्रित|पृष्ठ)/,
  /compulsory/i,
  /अनिवार्य/,
  /time\s*:\s*\d/i,
  /समय\s*:\s*\d/,
  /full\s+marks/i,
  /पूर्णांक/,
  /^\s*MATHEMATICS\s*$/i,
  /^\s*गणित\s*$/,
  /^\s*PHYSICS\s*$/i,
  /^\s*CHEMISTRY\s*$/i,
  /^\s*SCIENCE\s*$/i,
  /^\s*ENGLISH\s*$/i,
  /^\s*HINDI\s*$/i,
  // Section headers
  /^\s*(खण्ड|SECTION)\s*[-–]\s*[अAaBb]\s*$/i,
  /वस्तुनिष्ठ\s+प्रश्न/,
  /objective\s+type\s+questions/i,
  /लघु\s+उत्तरीय/,
  /short\s+answer\s+type/i,
  /दीर्घ\s+उत्तरीय/,
  /long\s+answer\s+type/i,
  // Instructions
  /instructions?\s+(for|to)\s+the/i,
  /परीक्षार्थियों\s+के\s+लिये/,
  /candidates?\s+must/i,
  /answer\s+any\s+\d+\s+questions?/i,
  /किन्हीं\s+\d+\s+प्रश्नों\s+का/,
  /each\s+question\s+carries/i,
  /प्रत्येक\s+प्रश्न\s+के\s+लिए/,
  /omr\s+(answer\s+)?sheet/i,
  /OMR\s+उत्तर/,
  /darken\s+the\s+circle/i,
  /do\s+not\s+use\s+whitener/i,
  /×\s*\d+\s*=\s*\d+/,     // "50 × 1 = 50"
  /^\s*\d+\s*×\s*\d+\s*=\s*\d+\s*$/,
  // Very short lines (noise)
  /^\s*.{1,2}\s*$/,
];

function isWaste(line: string): boolean {
  const t = line.trim();
  if (!t || t.length < 3) return true;
  for (const p of WASTE_PATTERNS) {
    if (p.test(t)) return true;
  }
  // Only symbols/numbers
  if (/^[^a-zA-Z\u0900-\u097F\d]+$/.test(t)) return true;
  return false;
}

// ============================================================
// QUESTION DETECTION
// Handles: "1.", "1)", "(1)", "Q.1", "Q1.", "प्रश्न 1."
// ============================================================
const Q_REGEX = /^\s*(?:Q\.?\s*)?(\d{1,3})\s*[.)\-–:]\s*(.+)/i;
const Q_BRACKET = /^\s*\((\d{1,3})\)\s*(.+)/;
const Q_HINDI = /^\s*प्रश्न\s*(\d+)\s*[.)\-–:]?\s*(.+)/;

function tryParseQuestion(line: string): { num: number; text: string } | null {
  let m = line.match(Q_REGEX) || line.match(Q_BRACKET) || line.match(Q_HINDI);
  if (m) {
    const num = parseInt(m[1]);
    if (num >= 1 && num <= 200) {
      return { num, text: m[2].trim() };
    }
  }
  return null;
}

// ============================================================
// OPTION DETECTION
// Handles: "(A)", "A.", "A)", "(A) text", "(A)   text"
// Also handles when Hindi paper repeats same Q in English with (A)(B)(C)(D)
// ============================================================
const OPT_PAREN = /^\s*\(([A-Da-d])\)\s*(.+)/;       // (A) text
const OPT_DOT   = /^\s*([A-Da-d])\s*[.]\s*(.+)/;      // A. text
const OPT_PAREN2= /^\s*([A-Da-d])\s*\)\s*(.+)/;       // A) text

function tryParseOption(line: string): { idx: number; text: string } | null {
  const m = line.match(OPT_PAREN) || line.match(OPT_DOT) || line.match(OPT_PAREN2);
  if (m) {
    const idx = m[1].toUpperCase().charCodeAt(0) - 65;
    if (idx >= 0 && idx < 4 && m[2].trim().length > 0) {
      return { idx, text: m[2].trim() };
    }
  }
  return null;
}

// Try to find all 4 options on a single line
// e.g. "(A) 1   (B) 2   (C) 0   (D) 3"
function tryInlineFourOptions(line: string): string[] | null {
  // Pattern: (A) ... (B) ... (C) ... (D) ...
  const p = /\(A\)\s*(.+?)\s*\(B\)\s*(.+?)\s*\(C\)\s*(.+?)\s*\(D\)\s*(.+)/i;
  const m = line.match(p);
  if (m) return [m[1].trim(), m[2].trim(), m[3].trim(), m[4].trim()];
  // Pattern: A. ... B. ... C. ... D. ...
  const p2 = /\bA[.)]\s*(.+?)\s*\bB[.)]\s*(.+?)\s*\bC[.)]\s*(.+?)\s*\bD[.)]\s*(.+)/i;
  const m2 = line.match(p2);
  if (m2) return [m2[1].trim(), m2[2].trim(), m2[3].trim(), m2[4].trim()];
  return null;
}

// Detect correct answer markers
const ANS_REGEX = /(?:answer|ans|correct|उत्तर)\s*[:=]?\s*\(?([A-Da-d])\)?/i;

function tryExtractAnswer(line: string): number | null {
  const m = line.match(ANS_REGEX);
  if (m) return m[1].toUpperCase().charCodeAt(0) - 65;
  return null;
}

// ============================================================
// DETECT if a line is a DUPLICATE (Hindi papers print Q twice)
// We keep the first occurrence.
// ============================================================
function isDuplicateLine(line: string, seen: Set<string>): boolean {
  const key = line.trim().toLowerCase().replace(/\s+/g, ' ');
  if (seen.has(key)) return true;
  seen.add(key);
  return false;
}

// ============================================================
// MAIN PARSER
// ============================================================
export function smartParsePDF(text: string): ParseResult {
  const rawLines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const questions: ParsedQuestion[] = [];
  const removedContent: string[] = [];
  const warnings: string[] = [];

  let currentQ: ParsedQuestion | null = null;
  let currentOpts: string[] = ['', '', '', ''];
  let optCount = 0;
  let qTextBuffer = '';
  let lastQNum = 0;
  const seenLines = new Set<string>();

  const saveCurrentQ = () => {
    if (!currentQ) return;
    currentQ.text = qTextBuffer.trim();
    // Fill options
    currentQ.options = currentOpts.map((o, i) =>
      o.trim().length > 0 ? o.trim() : `Option ${String.fromCharCode(65 + i)}`
    );
    const realOpts = currentOpts.filter(o => o.trim().length > 0).length;
    if (realOpts >= 2 && currentQ.text.length > 3) {
      questions.push({ ...currentQ });
    } else {
      if (currentQ.text.length > 3) {
        warnings.push(`Skipped Q${lastQNum}: only ${realOpts} options`);
      }
    }
  };

  console.log('🤖 PDF Parser — lines:', rawLines.length);

  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i];
    const line = rawLine.trim();

    if (!line) continue;

    // Skip exact duplicate lines (Hindi+English bilingual papers repeat questions)
    if (isDuplicateLine(line, seenLines)) {
      removedContent.push('[DUP] ' + line);
      continue;
    }

    if (isWaste(line)) {
      removedContent.push(line);
      continue;
    }

    // ---- Try answer marker ----
    const ansIdx = tryExtractAnswer(line);

    // ---- Try 4 inline options ----
    const inline4 = tryInlineFourOptions(line);
    if (inline4 && currentQ) {
      currentOpts = inline4;
      optCount = 4;
      if (ansIdx !== null) currentQ.correctAnswer = ansIdx;
      continue;
    }

    // ---- Try question start ----
    const qMatch = tryParseQuestion(line);
    if (qMatch) {
      // Only accept if number is sequential (prevents false positives like "1600", "320")
      if (qMatch.num > lastQNum + 50) {
        // Too big a jump — probably not a question number
        // Treat as option continuation or ignore
        removedContent.push('[SKIP_NUM] ' + line);
        continue;
      }

      saveCurrentQ();

      lastQNum = qMatch.num;
      currentQ = { text: '', options: [], correctAnswer: null };
      currentOpts = ['', '', '', ''];
      optCount = 0;
      qTextBuffer = qMatch.text;

      if (ansIdx !== null) currentQ.correctAnswer = ansIdx;

      // Check if all 4 options also on this line
      const i4 = tryInlineFourOptions(line);
      if (i4) { currentOpts = i4; optCount = 4; }
      continue;
    }

    // ---- Try option ----
    const optMatch = tryParseOption(line);
    if (optMatch && currentQ) {
      currentOpts[optMatch.idx] = optMatch.text;
      optCount = Math.max(optCount, optMatch.idx + 1);
      // Check answer marker inside option text
      const oAns = tryExtractAnswer(line);
      if (oAns !== null) currentQ.correctAnswer = oAns;
      continue;
    }

    // ---- Standalone answer line ----
    if (ansIdx !== null && currentQ) {
      currentQ.correctAnswer = ansIdx;
      continue;
    }

    // ---- Continuation of question text (before any option) ----
    if (currentQ && optCount === 0 && line.length > 2) {
      qTextBuffer += ' ' + line;
      continue;
    }

    // ---- Continuation of last option text ----
    if (currentQ && optCount > 0 && optCount < 4) {
      const lastFilledIdx = [3, 2, 1, 0].find(i => currentOpts[i].length > 0);
      if (lastFilledIdx !== undefined && !tryParseQuestion(line) && !tryParseOption(line)) {
        currentOpts[lastFilledIdx] += ' ' + line;
        continue;
      }
    }

    removedContent.push(line);
  }

  // Save last question
  saveCurrentQ();

  console.log(`✅ Extracted ${questions.length} MCQ questions`);
  console.log(`🗑️ Removed ${removedContent.length} lines`);
  if (warnings.length > 0) console.log('⚠️ Warnings:', warnings);

  return {
    questions,
    totalExtracted: questions.length,
    removedContent,
    warnings,
    rawText: text,
  };
}

export function parseQuestionsFromText(text: string): ParsedQuestion[] {
  return smartParsePDF(text).questions;
}

export default smartParsePDF;
