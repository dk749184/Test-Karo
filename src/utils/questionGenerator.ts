// ============================================
// AI QUESTION GENERATOR - ENHANCED VERSION
// Generates unique questions for each subject and topic
// ============================================

import { Question, QuestionDifficulty } from '../types';

// Topic mappings for each subject
const subjectTopics: Record<string, string[]> = {
  'Mathematics': ['Algebra', 'Trigonometry', 'Calculus', 'Geometry', 'Statistics', 'Arithmetic', 'Number System', 'Probability'],
  'Physics': ['Mechanics', 'Electricity', 'Optics', 'Thermodynamics', 'Waves', 'Modern Physics', 'Magnetism'],
  'Chemistry': ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Periodic Table', 'Chemical Bonding', 'Acids and Bases'],
  'Biology': ['Cell Biology', 'Genetics', 'Human Anatomy', 'Plant Biology', 'Ecology', 'Evolution'],
  'Computer Science': ['Programming', 'Data Structures', 'Database', 'Networking', 'Operating Systems', 'Web Development'],
  'English': ['Grammar', 'Vocabulary', 'Comprehension', 'Writing Skills'],
  'General Knowledge': ['Indian History', 'World Geography', 'Current Affairs', 'Science & Technology', 'Sports'],
  'Hindi': ['व्याकरण', 'साहित्य', 'पत्र लेखन', 'निबंध'],
  'Social Science': ['History', 'Geography', 'Civics', 'Economics']
};

// Get topics for a subject
export const getTopicsForSubject = (subject: string): string[] => {
  return subjectTopics[subject] || ['General'];
};

// Detect topics from syllabus text - IMPROVED
export const detectTopicsFromSyllabus = (syllabusText: string, subject: string): string[] => {
  const availableTopics = getTopicsForSubject(subject);
  const detectedTopics: string[] = [];
  const lowerText = syllabusText.toLowerCase();

  // Direct topic matching
  availableTopics.forEach(topic => {
    if (lowerText.includes(topic.toLowerCase())) {
      detectedTopics.push(topic);
    }
  });

  // Keyword-based detection
  const keywordMappings: Record<string, string[]> = {
    // Mathematics
    'Algebra': ['equation', 'polynomial', 'linear', 'quadratic', 'variable', 'expression', 'solve', 'factorize'],
    'Trigonometry': ['sin', 'cos', 'tan', 'angle', 'triangle', 'radian', 'degree', 'pythagoras'],
    'Calculus': ['derivative', 'integration', 'limit', 'differentiation', 'integral', 'function'],
    'Geometry': ['circle', 'square', 'rectangle', 'triangle', 'area', 'perimeter', 'volume', 'shape'],
    'Statistics': ['mean', 'median', 'mode', 'probability', 'deviation', 'variance', 'data'],
    'Arithmetic': ['addition', 'subtraction', 'multiplication', 'division', 'fraction', 'decimal', 'percentage'],
    'Number System': ['prime', 'composite', 'even', 'odd', 'rational', 'irrational', 'integer'],
    
    // Physics
    'Mechanics': ['force', 'motion', 'velocity', 'acceleration', 'newton', 'momentum', 'gravity'],
    'Electricity': ['current', 'voltage', 'resistance', 'circuit', 'ohm', 'power', 'electron'],
    'Optics': ['light', 'reflection', 'refraction', 'lens', 'mirror', 'prism'],
    'Thermodynamics': ['heat', 'temperature', 'energy', 'entropy', 'thermal'],
    'Waves': ['wave', 'frequency', 'amplitude', 'sound', 'vibration'],
    
    // Chemistry
    'Organic Chemistry': ['carbon', 'hydrocarbon', 'organic', 'methane', 'ethane', 'benzene'],
    'Inorganic Chemistry': ['metal', 'non-metal', 'compound', 'salt', 'mineral'],
    'Physical Chemistry': ['atom', 'molecule', 'reaction', 'equilibrium', 'rate'],
    'Periodic Table': ['element', 'periodic', 'group', 'period', 'atomic'],
    'Chemical Bonding': ['bond', 'ionic', 'covalent', 'valence', 'electron'],
    'Acids and Bases': ['acid', 'base', 'ph', 'neutral', 'indicator'],
    
    // Biology
    'Cell Biology': ['cell', 'nucleus', 'mitochondria', 'organelle', 'membrane'],
    'Genetics': ['dna', 'gene', 'chromosome', 'heredity', 'mutation', 'genetic'],
    'Human Anatomy': ['body', 'organ', 'system', 'blood', 'heart', 'brain', 'muscle'],
    'Plant Biology': ['plant', 'photosynthesis', 'leaf', 'root', 'stem', 'flower'],
    'Ecology': ['ecosystem', 'environment', 'habitat', 'food chain', 'biodiversity'],
    
    // Computer Science
    'Programming': ['loop', 'function', 'variable', 'array', 'algorithm', 'code', 'program'],
    'Data Structures': ['stack', 'queue', 'tree', 'graph', 'linked list', 'array'],
    'Database': ['sql', 'table', 'query', 'database', 'mysql', 'normalization', 'key'],
    'Networking': ['network', 'ip', 'tcp', 'protocol', 'router', 'internet'],
    'Operating Systems': ['os', 'process', 'thread', 'memory', 'kernel', 'scheduling'],
    
    // English
    'Grammar': ['tense', 'noun', 'verb', 'adjective', 'pronoun', 'sentence', 'grammar'],
    'Vocabulary': ['word', 'synonym', 'antonym', 'meaning', 'vocabulary'],
    
    // General Knowledge
    'Indian History': ['india', 'mughal', 'british', 'independence', 'emperor', 'dynasty'],
    'World Geography': ['continent', 'ocean', 'country', 'capital', 'river', 'mountain'],
    'Current Affairs': ['current', 'news', 'recent', 'election', 'government'],
    'Science & Technology': ['technology', 'invention', 'scientist', 'discovery', 'research'],
    'Sports': ['cricket', 'football', 'olympics', 'sports', 'player', 'tournament']
  };

  Object.entries(keywordMappings).forEach(([topic, keywords]) => {
    if (!detectedTopics.includes(topic)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          if (availableTopics.includes(topic)) {
            detectedTopics.push(topic);
          }
          break;
        }
      }
    }
  });

  console.log('📚 Detected topics from syllabus:', detectedTopics);
  return detectedTopics.length > 0 ? detectedTopics : [availableTopics[0]];
};

// Random helpers
const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const pickRandom = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

// Question templates by subject and topic
interface GeneratedQ {
  text: string;
  options: string[];
  correctAnswer: number;
}

// ==================== MATHEMATICS ====================
const mathAlgebraQuestions = (): GeneratedQ => {
  const templates = [
    () => {
      const a = randomInt(2, 15);
      const b = randomInt(1, 20);
      const x = randomInt(1, 10);
      const result = a * x + b;
      const correct = String(x);
      const opts = shuffleArray([correct, String(x + 1), String(x - 1), String(x + 2)]);
      return { text: `Solve for x: ${a}x + ${b} = ${result}`, options: opts, correctAnswer: opts.indexOf(correct) };
    },
    () => {
      const a = randomInt(2, 10);
      const b = randomInt(2, 10);
      const sum = a + b;
      const product = a * b;
      const correct = `${a}, ${b}`;
      const opts = shuffleArray([correct, `${a+1}, ${b-1}`, `${a-1}, ${b+1}`, `${a+2}, ${b-2}`]);
      return { text: `Find two numbers whose sum is ${sum} and product is ${product}.`, options: opts, correctAnswer: opts.indexOf(correct) };
    },
    () => {
      const n = randomInt(2, 8);
      const result = n * (n + 1) / 2;
      const correct = String(result);
      const opts = shuffleArray([correct, String(result + n), String(result - 1), String(result + 1)]);
      return { text: `Find the sum of first ${n} natural numbers.`, options: opts, correctAnswer: opts.indexOf(correct) };
    },
    () => {
      const base = randomInt(2, 5);
      const exp = randomInt(2, 4);
      const result = Math.pow(base, exp);
      const correct = String(result);
      const opts = shuffleArray([correct, String(result * base), String(result / base), String(result + base)]);
      return { text: `What is the value of ${base}^${exp}?`, options: opts, correctAnswer: opts.indexOf(correct) };
    },
    () => {
      const a = randomInt(1, 5);
      const b = randomInt(-10, 10);
      const c = randomInt(-20, 20);
      const discriminant = b * b - 4 * a * c;
      const correct = discriminant > 0 ? '2 real roots' : discriminant === 0 ? '1 real root' : 'No real roots';
      const opts = shuffleArray(['2 real roots', '1 real root', 'No real roots', '2 complex roots']);
      return { text: `How many real roots does ${a}x² + ${b}x + ${c} = 0 have?`, options: opts, correctAnswer: opts.indexOf(correct) };
    },
    () => {
      const a = randomInt(2, 10);
      const b = randomInt(2, 10);
      const correct = String(a * a + 2 * a * b + b * b);
      const opts = shuffleArray([correct, String((a + b) * (a + b) + 1), String(a * a + b * b), String(2 * a * b)]);
      return { text: `Expand (${a} + ${b})². What is the result?`, options: opts, correctAnswer: opts.indexOf(correct) };
    }
  ];
  return pickRandom(templates)();
};

const mathTrigQuestions = (): GeneratedQ => {
  const templates = [
    () => {
      const angles = [0, 30, 45, 60, 90];
      const angle = pickRandom(angles);
      const sinValues: Record<number, string> = { 0: '0', 30: '1/2', 45: '1/√2', 60: '√3/2', 90: '1' };
      const correct = sinValues[angle];
      const opts = shuffleArray(['0', '1/2', '1/√2', '√3/2']);
      if (!opts.includes(correct)) opts[0] = correct;
      return { text: `What is the value of sin(${angle}°)?`, options: shuffleArray(opts), correctAnswer: shuffleArray(opts).indexOf(correct) };
    },
    () => {
      const angle = pickRandom([30, 45, 60]);
      const tanValues: Record<number, string> = { 30: '1/√3', 45: '1', 60: '√3' };
      const correct = tanValues[angle];
      const opts = shuffleArray(['1/√3', '1', '√3', '2']);
      return { text: `What is the value of tan(${angle}°)?`, options: opts, correctAnswer: opts.indexOf(correct) };
    },
    () => {
      const formulas = [
        { q: 'sin²θ + cos²θ', a: '1' },
        { q: '1 + tan²θ', a: 'sec²θ' },
        { q: '1 + cot²θ', a: 'cosec²θ' },
        { q: 'sin(90° - θ)', a: 'cos θ' }
      ];
      const selected = pickRandom(formulas);
      const opts = shuffleArray(['1', 'sec²θ', 'cosec²θ', 'cos θ']);
      return { text: `What is the value of ${selected.q}?`, options: opts, correctAnswer: opts.indexOf(selected.a) };
    },
    () => {
      const correct = 'sin A cos B + cos A sin B';
      const opts = shuffleArray(['2 sin A cos B', 'sin A cos B + cos A sin B', 'cos A cos B - sin A sin B', 'sin²A - cos²A']);
      return { text: `The formula for sin(A + B) is:`, options: opts, correctAnswer: opts.indexOf(correct) };
    }
  ];
  return pickRandom(templates)();
};

const mathGeometryQuestions = (): GeneratedQ => {
  const templates = [
    () => {
      const r = randomInt(2, 10);
      const area = Math.round(Math.PI * r * r * 100) / 100;
      const correct = String(area);
      const opts = shuffleArray([correct, String(Math.round(2 * Math.PI * r * 100) / 100), String(r * r), String(2 * r * r)]);
      return { text: `Find the area of a circle with radius ${r} cm. (Use π ≈ 3.14)`, options: opts, correctAnswer: opts.indexOf(correct) };
    },
    () => {
      const l = randomInt(5, 15);
      const w = randomInt(3, 10);
      const area = l * w;
      const correct = String(area);
      const opts = shuffleArray([correct, String(l + w), String(2 * (l + w)), String(l * l)]);
      return { text: `Find the area of a rectangle with length ${l} cm and width ${w} cm.`, options: opts, correctAnswer: opts.indexOf(correct) };
    },
    () => {
      const a = randomInt(3, 10);
      const b = randomInt(3, 10);
      const c = Math.round(Math.sqrt(a * a + b * b) * 100) / 100;
      const correct = String(c);
      const opts = shuffleArray([correct, String(a + b), String(Math.abs(a - b)), String((a + b) / 2)]);
      return { text: `In a right triangle, if the two legs are ${a} cm and ${b} cm, find the hypotenuse.`, options: opts, correctAnswer: opts.indexOf(correct) };
    },
    () => {
      const s = randomInt(3, 12);
      const volume = s * s * s;
      const correct = String(volume);
      const opts = shuffleArray([correct, String(s * s), String(6 * s * s), String(4 * s)]);
      return { text: `Find the volume of a cube with side ${s} cm.`, options: opts, correctAnswer: opts.indexOf(correct) };
    },
    () => {
      const s = randomInt(3, 10);
      const perimeter = 4 * s;
      const correct = String(perimeter);
      const opts = shuffleArray([correct, String(s * s), String(2 * s), String(s + 4)]);
      return { text: `Find the perimeter of a square with side ${s} cm.`, options: opts, correctAnswer: opts.indexOf(correct) };
    }
  ];
  return pickRandom(templates)();
};

const mathCalculusQuestions = (): GeneratedQ => {
  const templates = [
    () => {
      const n = randomInt(2, 6);
      const correct = `${n}x^${n-1}`;
      const opts = shuffleArray([correct, `x^${n+1}`, `${n+1}x^${n}`, `x^${n-1}`]);
      return { text: `Find the derivative of x^${n}`, options: opts, correctAnswer: opts.indexOf(correct) };
    },
    () => {
      const funcs = [
        { q: 'sin x', a: 'cos x' },
        { q: 'cos x', a: '-sin x' },
        { q: 'e^x', a: 'e^x' },
        { q: 'ln x', a: '1/x' }
      ];
      const selected = pickRandom(funcs);
      const opts = shuffleArray(['cos x', '-sin x', 'e^x', '1/x']);
      return { text: `Find the derivative of ${selected.q}`, options: opts, correctAnswer: opts.indexOf(selected.a) };
    },
    () => {
      const n = randomInt(2, 5);
      const correct = `x^${n+1}/${n+1} + C`;
      const opts = shuffleArray([correct, `x^${n-1}/${n-1} + C`, `${n}x^${n-1} + C`, `x^${n+1} + C`]);
      return { text: `Find the integral of x^${n} dx`, options: opts, correctAnswer: opts.indexOf(correct) };
    },
    () => {
      const a = randomInt(1, 5);
      const b = randomInt(1, 10);
      const correct = `${a}`;
      const opts = shuffleArray([correct, `${a}x + ${b}`, `${b}`, '0']);
      return { text: `Find the derivative of ${a}x + ${b}`, options: opts, correctAnswer: opts.indexOf(correct) };
    }
  ];
  return pickRandom(templates)();
};

// ==================== PHYSICS ====================
const physicsMechanicsQuestions = (): GeneratedQ => {
  const templates = [
    () => {
      const m = randomInt(2, 20);
      const a = randomInt(2, 10);
      const f = m * a;
      const correct = `${f} N`;
      const opts = shuffleArray([correct, `${m + a} N`, `${m - a} N`, `${m * a + 10} N`]);
      return { text: `A body of mass ${m} kg is accelerating at ${a} m/s². Find the force applied. (F = ma)`, options: opts, correctAnswer: opts.indexOf(correct) };
    },
    () => {
      const u = randomInt(0, 20);
      const a = randomInt(2, 10);
      const t = randomInt(2, 10);
      const v = u + a * t;
      const correct = `${v} m/s`;
      const opts = shuffleArray([correct, `${u - a * t} m/s`, `${u * t} m/s`, `${a * t} m/s`]);
      return { text: `A body starts with velocity ${u} m/s and accelerates at ${a} m/s² for ${t} seconds. Find final velocity.`, options: opts, correctAnswer: opts.indexOf(correct) };
    },
    () => {
      const m = randomInt(2, 10);
      const h = randomInt(5, 20);
      const pe = m * 10 * h;
      const correct = `${pe} J`;
      const opts = shuffleArray([correct, `${m * h} J`, `${10 * h} J`, `${m + 10 + h} J`]);
      return { text: `Calculate potential energy of ${m} kg object at ${h} m height. (g = 10 m/s²)`, options: opts, correctAnswer: opts.indexOf(correct) };
    },
    () => {
      const laws = [
        { q: 'Every object continues in rest or motion unless external force acts', a: "Newton's First Law" },
        { q: 'F = ma', a: "Newton's Second Law" },
        { q: 'Every action has equal and opposite reaction', a: "Newton's Third Law" }
      ];
      const selected = pickRandom(laws);
      const opts = shuffleArray(["Newton's First Law", "Newton's Second Law", "Newton's Third Law", "Law of Conservation"]);
      return { text: `Which law states: "${selected.q}"?`, options: opts, correctAnswer: opts.indexOf(selected.a) };
    }
  ];
  return pickRandom(templates)();
};

const physicsElectricityQuestions = (): GeneratedQ => {
  const templates = [
    () => {
      const v = randomInt(10, 100);
      const i = randomInt(2, 10);
      const r = v / i;
      const correct = `${r} Ω`;
      const opts = shuffleArray([correct, `${v + i} Ω`, `${v - i} Ω`, `${v * i} Ω`]);
      return { text: `If voltage is ${v}V and current is ${i}A, find resistance. (V = IR)`, options: opts, correctAnswer: opts.indexOf(correct) };
    },
    () => {
      const p = randomInt(100, 1000);
      const t = randomInt(1, 10);
      const e = p * t;
      const correct = `${e} Wh`;
      const opts = shuffleArray([correct, `${p + t} Wh`, `${p - t} Wh`, `${p / t} Wh`]);
      return { text: `A ${p}W device runs for ${t} hours. Calculate energy consumed.`, options: opts, correctAnswer: opts.indexOf(correct) };
    },
    () => {
      const units = [
        { q: 'Electric current', a: 'Ampere' },
        { q: 'Electric potential', a: 'Volt' },
        { q: 'Resistance', a: 'Ohm' },
        { q: 'Power', a: 'Watt' }
      ];
      const selected = pickRandom(units);
      const opts = shuffleArray(['Ampere', 'Volt', 'Ohm', 'Watt']);
      return { text: `What is the SI unit of ${selected.q}?`, options: opts, correctAnswer: opts.indexOf(selected.a) };
    }
  ];
  return pickRandom(templates)();
};

// ==================== CHEMISTRY ====================
const chemistryQuestions = (): GeneratedQ => {
  const templates = [
    () => {
      const elements = [
        { symbol: 'H', name: 'Hydrogen' },
        { symbol: 'O', name: 'Oxygen' },
        { symbol: 'N', name: 'Nitrogen' },
        { symbol: 'C', name: 'Carbon' },
        { symbol: 'Fe', name: 'Iron' },
        { symbol: 'Au', name: 'Gold' },
        { symbol: 'Ag', name: 'Silver' },
        { symbol: 'Cu', name: 'Copper' }
      ];
      const selected = pickRandom(elements);
      const opts = shuffleArray([selected.name, ...elements.filter(e => e.symbol !== selected.symbol).slice(0, 3).map(e => e.name)]);
      return { text: `What element has the symbol "${selected.symbol}"?`, options: opts, correctAnswer: opts.indexOf(selected.name) };
    },
    () => {
      const formulas = [
        { formula: 'H2O', name: 'Water' },
        { formula: 'CO2', name: 'Carbon Dioxide' },
        { formula: 'NaCl', name: 'Sodium Chloride' },
        { formula: 'H2SO4', name: 'Sulfuric Acid' }
      ];
      const selected = pickRandom(formulas);
      const opts = shuffleArray([selected.name, 'Hydrochloric Acid', 'Methane', 'Ammonia']);
      return { text: `What is the common name of ${selected.formula}?`, options: opts, correctAnswer: opts.indexOf(selected.name) };
    },
    () => {
      const facts = [
        { q: 'Which gas is essential for combustion?', a: 'Oxygen' },
        { q: 'Which gas do plants use for photosynthesis?', a: 'Carbon Dioxide' },
        { q: 'What is the pH of pure water?', a: '7' },
        { q: 'Which metal is liquid at room temperature?', a: 'Mercury' }
      ];
      const selected = pickRandom(facts);
      const allOpts = ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Hydrogen', '7', '0', '14', '1', 'Mercury', 'Iron', 'Gold', 'Silver'];
      const opts = shuffleArray([selected.a, ...allOpts.filter(o => o !== selected.a).slice(0, 3)]);
      return { text: selected.q, options: opts, correctAnswer: opts.indexOf(selected.a) };
    }
  ];
  return pickRandom(templates)();
};

// ==================== BIOLOGY ====================
const biologyQuestions = (): GeneratedQ => {
  const templates = [
    () => {
      const facts = [
        { q: 'What is the powerhouse of the cell?', a: 'Mitochondria' },
        { q: 'Which part of the cell contains genetic material?', a: 'Nucleus' },
        { q: 'What is the basic unit of life?', a: 'Cell' },
        { q: 'Which blood cells fight infection?', a: 'White Blood Cells' },
        { q: 'What carries oxygen in blood?', a: 'Hemoglobin' },
        { q: 'Which organ pumps blood?', a: 'Heart' },
        { q: 'What is the largest organ of human body?', a: 'Skin' }
      ];
      const selected = pickRandom(facts);
      const allOpts = ['Mitochondria', 'Nucleus', 'Cell', 'Ribosome', 'White Blood Cells', 'Red Blood Cells', 'Platelets', 'Hemoglobin', 'Heart', 'Liver', 'Brain', 'Skin', 'Kidney'];
      const opts = shuffleArray([selected.a, ...allOpts.filter(o => o !== selected.a).slice(0, 3)]);
      return { text: selected.q, options: opts, correctAnswer: opts.indexOf(selected.a) };
    },
    () => {
      const processes = [
        { q: 'Process by which plants make food using sunlight', a: 'Photosynthesis' },
        { q: 'Process of cell division', a: 'Mitosis' },
        { q: 'Breaking down of food for energy', a: 'Digestion' },
        { q: 'Exchange of gases in lungs', a: 'Respiration' }
      ];
      const selected = pickRandom(processes);
      const opts = shuffleArray(['Photosynthesis', 'Mitosis', 'Digestion', 'Respiration']);
      return { text: selected.q, options: opts, correctAnswer: opts.indexOf(selected.a) };
    }
  ];
  return pickRandom(templates)();
};

// ==================== COMPUTER SCIENCE ====================
const csQuestions = (): GeneratedQ => {
  const templates = [
    () => {
      const concepts = [
        { q: 'Which data structure uses LIFO principle?', a: 'Stack' },
        { q: 'Which data structure uses FIFO principle?', a: 'Queue' },
        { q: 'Which loop executes at least once?', a: 'do-while' },
        { q: 'Which keyword defines a function in Python?', a: 'def' }
      ];
      const selected = pickRandom(concepts);
      const allOpts = ['Stack', 'Queue', 'Array', 'Tree', 'do-while', 'for', 'while', 'def', 'function', 'func', 'define'];
      const opts = shuffleArray([selected.a, ...allOpts.filter(o => o !== selected.a).slice(0, 3)]);
      return { text: selected.q, options: opts, correctAnswer: opts.indexOf(selected.a) };
    },
    () => {
      const complexities = [
        { q: 'Binary Search', a: 'O(log n)' },
        { q: 'Linear Search', a: 'O(n)' },
        { q: 'Bubble Sort', a: 'O(n²)' },
        { q: 'Array access by index', a: 'O(1)' }
      ];
      const selected = pickRandom(complexities);
      const opts = shuffleArray(['O(1)', 'O(n)', 'O(log n)', 'O(n²)']);
      return { text: `Time complexity of ${selected.q}?`, options: opts, correctAnswer: opts.indexOf(selected.a) };
    },
    () => {
      const sql = [
        { q: 'SQL command to retrieve data', a: 'SELECT' },
        { q: 'SQL command to add records', a: 'INSERT' },
        { q: 'SQL command to modify records', a: 'UPDATE' },
        { q: 'SQL command to delete records', a: 'DELETE' }
      ];
      const selected = pickRandom(sql);
      const opts = shuffleArray(['SELECT', 'INSERT', 'UPDATE', 'DELETE']);
      return { text: selected.q, options: opts, correctAnswer: opts.indexOf(selected.a) };
    }
  ];
  return pickRandom(templates)();
};

// ==================== ENGLISH ====================
const englishQuestions = (): GeneratedQ => {
  const templates = [
    () => {
      const grammar = [
        { q: 'She ___ to school every day.', a: 'goes' },
        { q: 'They ___ playing football now.', a: 'are' },
        { q: 'He ___ already finished his work.', a: 'has' },
        { q: 'The book ___ on the table.', a: 'is' }
      ];
      const selected = pickRandom(grammar);
      const opts = shuffleArray(['goes', 'go', 'are', 'is', 'has', 'have', 'was', 'were'].slice(0, 4));
      if (!opts.includes(selected.a)) opts[0] = selected.a;
      return { text: `Fill in the blank: ${selected.q}`, options: shuffleArray(opts), correctAnswer: shuffleArray(opts).indexOf(selected.a) };
    },
    () => {
      const vocab = [
        { word: 'happy', antonym: 'sad' },
        { word: 'big', antonym: 'small' },
        { word: 'fast', antonym: 'slow' },
        { word: 'hot', antonym: 'cold' }
      ];
      const selected = pickRandom(vocab);
      const opts = shuffleArray(['sad', 'small', 'slow', 'cold']);
      return { text: `What is the antonym of "${selected.word}"?`, options: opts, correctAnswer: opts.indexOf(selected.antonym) };
    },
    () => {
      const plural = [
        { singular: 'child', plural: 'children' },
        { singular: 'man', plural: 'men' },
        { singular: 'woman', plural: 'women' },
        { singular: 'tooth', plural: 'teeth' }
      ];
      const selected = pickRandom(plural);
      const opts = shuffleArray([selected.plural, `${selected.singular}s`, `${selected.singular}es`, `${selected.singular}ies`]);
      return { text: `What is the plural of "${selected.singular}"?`, options: opts, correctAnswer: opts.indexOf(selected.plural) };
    }
  ];
  return pickRandom(templates)();
};

// ==================== GENERAL KNOWLEDGE ====================
const gkQuestions = (): GeneratedQ => {
  const facts = [
    { q: 'Who is known as the Father of the Indian Constitution?', a: 'Dr. B.R. Ambedkar' },
    { q: 'What is the capital of Australia?', a: 'Canberra' },
    { q: 'Which planet is known as the Red Planet?', a: 'Mars' },
    { q: 'Who wrote the national anthem of India?', a: 'Rabindranath Tagore' },
    { q: 'What is the largest ocean in the world?', a: 'Pacific Ocean' },
    { q: 'Which is the smallest country in the world?', a: 'Vatican City' },
    { q: 'What is the currency of Japan?', a: 'Yen' },
    { q: 'Which is the longest river in the world?', a: 'Nile' },
    { q: 'Who invented the light bulb?', a: 'Thomas Edison' },
    { q: 'What is the capital of France?', a: 'Paris' },
    { q: 'Which country won FIFA World Cup 2022?', a: 'Argentina' },
    { q: 'Who was the first Prime Minister of India?', a: 'Jawaharlal Nehru' }
  ];
  const selected = pickRandom(facts);
  const allOptions = [...new Set(facts.map(f => f.a))];
  const opts = shuffleArray([selected.a, ...allOptions.filter(o => o !== selected.a).slice(0, 3)]);
  return { text: selected.q, options: opts, correctAnswer: opts.indexOf(selected.a) };
};

// Subject to generator mapping
const subjectGenerators: Record<string, Record<string, () => GeneratedQ>> = {
  'Mathematics': {
    'Algebra': mathAlgebraQuestions,
    'Trigonometry': mathTrigQuestions,
    'Calculus': mathCalculusQuestions,
    'Geometry': mathGeometryQuestions,
    'Statistics': mathAlgebraQuestions,
    'Arithmetic': mathAlgebraQuestions,
    'Number System': mathAlgebraQuestions,
    'Probability': mathAlgebraQuestions
  },
  'Physics': {
    'Mechanics': physicsMechanicsQuestions,
    'Electricity': physicsElectricityQuestions,
    'Optics': physicsElectricityQuestions,
    'Thermodynamics': physicsMechanicsQuestions,
    'Waves': physicsMechanicsQuestions,
    'Modern Physics': physicsMechanicsQuestions,
    'Magnetism': physicsElectricityQuestions
  },
  'Chemistry': {
    'Organic Chemistry': chemistryQuestions,
    'Inorganic Chemistry': chemistryQuestions,
    'Physical Chemistry': chemistryQuestions,
    'Periodic Table': chemistryQuestions,
    'Chemical Bonding': chemistryQuestions,
    'Acids and Bases': chemistryQuestions
  },
  'Biology': {
    'Cell Biology': biologyQuestions,
    'Genetics': biologyQuestions,
    'Human Anatomy': biologyQuestions,
    'Plant Biology': biologyQuestions,
    'Ecology': biologyQuestions,
    'Evolution': biologyQuestions
  },
  'Computer Science': {
    'Programming': csQuestions,
    'Data Structures': csQuestions,
    'Database': csQuestions,
    'Networking': csQuestions,
    'Operating Systems': csQuestions,
    'Web Development': csQuestions
  },
  'English': {
    'Grammar': englishQuestions,
    'Vocabulary': englishQuestions,
    'Comprehension': englishQuestions,
    'Writing Skills': englishQuestions
  },
  'General Knowledge': {
    'Indian History': gkQuestions,
    'World Geography': gkQuestions,
    'Current Affairs': gkQuestions,
    'Science & Technology': gkQuestions,
    'Sports': gkQuestions
  }
};

// Main function to generate questions
export const generateQuestionsByTopic = (
  subject: string,
  topic: string,
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed',
  count: number
): Question[] => {
  console.log(`🤖 Generating ${count} ${difficulty} questions for ${subject} - ${topic}`);
  
  const questions: Question[] = [];
  const usedTexts = new Set<string>();
  
  // Get the appropriate generator
  const subjectGen = subjectGenerators[subject];
  let generator: (() => GeneratedQ) | undefined;
  
  if (subjectGen) {
    generator = subjectGen[topic] || Object.values(subjectGen)[0];
  }
  
  // Fallback to GK if no specific generator found
  if (!generator) {
    console.log(`⚠️ No specific generator for ${subject}/${topic}, using General Knowledge`);
    generator = gkQuestions;
  }
  
  // Generate requested number of questions
  for (let i = 0; i < count; i++) {
    let attempts = 0;
    let question: Question | null = null;
    
    while (attempts < 20 && !question) {
      const generated = generator();
      
      // Check for uniqueness
      if (!usedTexts.has(generated.text)) {
        usedTexts.add(generated.text);
        question = {
          id: `q_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
          text: generated.text,
          options: generated.options,
          correctAnswer: generated.correctAnswer,
          subject,
          topic,
          difficulty: difficulty === 'mixed' ? pickRandom(['easy', 'medium', 'hard'] as QuestionDifficulty[]) : difficulty,
          marks: 10
        };
      }
      attempts++;
    }
    
    if (question) {
      questions.push(question);
    }
  }
  
  console.log(`✅ Generated ${questions.length} questions`);
  return questions;
};

export default {
  generateQuestionsByTopic,
  getTopicsForSubject,
  detectTopicsFromSyllabus
};
