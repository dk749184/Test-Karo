// ============================================
// AI QUESTION GENERATOR
// Generates unique questions for each topic
// ============================================

import { Question, QuestionDifficulty } from '../types';

// Helper to get random number
const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper to shuffle array
const shuffle = <T>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Question templates by subject and topic
const questionTemplates: Record<string, Record<string, Array<() => { text: string; options: string[]; correct: number }>>> = {
  'Mathematics': {
    'Algebra': [
      () => {
        const a = random(2, 15);
        const b = random(1, 20);
        const x = random(2, 10);
        const result = a * x + b;
        const opts = shuffle([x, x + 2, x - 1, x + 3]);
        return {
          text: `Solve for x: ${a}x + ${b} = ${result}`,
          options: opts.map(String),
          correct: opts.indexOf(x)
        };
      },
      () => {
        const a = random(1, 10);
        const b = random(1, 10);
        const sum = a + b;
        const product = a * b;
        const opts = shuffle([`${a}, ${b}`, `${a+1}, ${b-1}`, `${a-1}, ${b+1}`, `${a+2}, ${b-2}`]);
        return {
          text: `Find two numbers whose sum is ${sum} and product is ${product}`,
          options: opts,
          correct: opts.indexOf(`${a}, ${b}`)
        };
      },
      () => {
        const a = random(2, 8);
        const b = random(1, 10);
        const c = random(1, 10);
        const result = a * (b + c);
        return {
          text: `Simplify: ${a}(${b} + ${c}) = ?`,
          options: shuffle([`${result}`, `${a*b + c}`, `${a + b*c}`, `${result + a}`]).map(String),
          correct: 0
        };
      },
      () => {
        const base = random(2, 5);
        const exp = random(2, 4);
        const result = Math.pow(base, exp);
        const opts = shuffle([result, result + base, result - 1, result * 2]);
        return {
          text: `Calculate: ${base}^${exp} = ?`,
          options: opts.map(String),
          correct: opts.indexOf(result)
        };
      },
      () => {
        const a = random(2, 10);
        const b = random(2, 10);
        return {
          text: `If x + y = ${a + b} and x - y = ${a - b}, find x`,
          options: shuffle([a, b, a + 1, b - 1]).map(String),
          correct: 0
        };
      }
    ],
    'Trigonometry': [
      () => {
        const angles = [0, 30, 45, 60, 90];
        const angle = angles[random(0, angles.length - 1)];
        const sinValues: Record<number, string> = { 0: '0', 30: '1/2', 45: '1/√2', 60: '√3/2', 90: '1' };
        const opts = shuffle(['0', '1/2', '1/√2', '√3/2', '1']).slice(0, 4);
        if (!opts.includes(sinValues[angle])) opts[0] = sinValues[angle];
        return {
          text: `What is the value of sin(${angle}°)?`,
          options: shuffle(opts),
          correct: opts.indexOf(sinValues[angle])
        };
      },
      () => {
        return {
          text: `Which identity is correct?`,
          options: shuffle(['sin²θ + cos²θ = 1', 'sin²θ - cos²θ = 1', 'sinθ + cosθ = 1', 'sinθ × cosθ = 1']),
          correct: 0
        };
      },
      () => {
        const angle = [30, 45, 60][random(0, 2)];
        const tanValues: Record<number, string> = { 30: '1/√3', 45: '1', 60: '√3' };
        return {
          text: `Find tan(${angle}°)`,
          options: shuffle(['1/√3', '1', '√3', '2']),
          correct: ['1/√3', '1', '√3', '2'].indexOf(tanValues[angle])
        };
      }
    ],
    'Calculus': [
      () => {
        const n = random(2, 6);
        return {
          text: `Find the derivative of x^${n}`,
          options: shuffle([`${n}x^${n-1}`, `${n}x^${n}`, `x^${n-1}`, `${n+1}x^${n-1}`]),
          correct: 0
        };
      },
      () => {
        const a = random(2, 8);
        return {
          text: `∫${a}dx = ?`,
          options: shuffle([`${a}x + C`, `${a}x`, `${a}`, `x + C`]),
          correct: 0
        };
      },
      () => {
        const n = random(2, 5);
        return {
          text: `∫x^${n}dx = ?`,
          options: shuffle([`x^${n+1}/${n+1} + C`, `${n}x^${n-1} + C`, `x^${n+1} + C`, `x^${n}/${n} + C`]),
          correct: 0
        };
      }
    ],
    'Geometry': [
      () => {
        const r = random(3, 12);
        const area = Math.round(3.14159 * r * r * 100) / 100;
        return {
          text: `Find the area of a circle with radius ${r} cm (π = 3.14)`,
          options: shuffle([`${area} cm²`, `${2*3.14*r} cm²`, `${r*r} cm²`, `${area + 10} cm²`]),
          correct: 0
        };
      },
      () => {
        const l = random(5, 15);
        const b = random(3, 10);
        const area = l * b;
        const opts = shuffle([area, l + b, 2*(l+b), area + l]);
        return {
          text: `Area of rectangle with length ${l}cm and breadth ${b}cm is?`,
          options: opts.map(v => `${v} cm²`),
          correct: opts.indexOf(area)
        };
      },
      () => {
        const a = random(3, 10);
        const b = random(4, 12);
        const c = Math.sqrt(a*a + b*b);
        return {
          text: `In a right triangle, if two sides are ${a}cm and ${b}cm, find hypotenuse`,
          options: shuffle([`${c.toFixed(1)}cm`, `${a+b}cm`, `${(a*b)/2}cm`, `${Math.abs(b-a)}cm`]),
          correct: 0
        };
      }
    ],
    'Statistics': [
      () => {
        const nums = Array.from({ length: 5 }, () => random(10, 50));
        const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
        return {
          text: `Find the mean of: ${nums.join(', ')}`,
          options: shuffle([mean, mean + 2, mean - 3, mean + 5].map(v => v.toFixed(1))),
          correct: 0
        };
      },
      () => {
        const nums = [random(10, 20), random(20, 30), random(30, 40), random(40, 50), random(50, 60)].sort((a, b) => a - b);
        const median = nums[2];
        return {
          text: `Find the median of: ${shuffle([...nums]).join(', ')}`,
          options: shuffle([median, nums[1], nums[3], (nums[0] + nums[4]) / 2].map(String)),
          correct: 0
        };
      }
    ],
    'Probability': [
      () => {
        return {
          text: `A coin is tossed. What is the probability of getting heads?`,
          options: shuffle(['1/2', '1', '0', '1/4']),
          correct: 0
        };
      },
      () => {
        const n = random(1, 6);
        return {
          text: `A die is rolled. What is the probability of getting ${n}?`,
          options: shuffle(['1/6', '1/3', '1/2', '1']),
          correct: 0
        };
      }
    ],
    'Number Theory': [
      () => {
        const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31];
        const idx = random(0, primes.length - 1);
        return {
          text: `Which is a prime number?`,
          options: shuffle([primes[idx], primes[idx] + 1, primes[idx] * 2, primes[idx] + 3].map(String)),
          correct: 0
        };
      },
      () => {
        const a = random(12, 36);
        const b = random(8, 24);
        const gcd = (x: number, y: number): number => y === 0 ? x : gcd(y, x % y);
        const result = gcd(a, b);
        return {
          text: `Find GCD of ${a} and ${b}`,
          options: shuffle([result, result + 1, result * 2, a - b].map(String)),
          correct: 0
        };
      }
    ]
  },
  'Physics': {
    'Mechanics': [
      () => {
        const m = random(2, 20);
        const a = random(2, 10);
        const f = m * a;
        return {
          text: `A body of mass ${m}kg accelerates at ${a}m/s². Find the force.`,
          options: shuffle([`${f}N`, `${f+m}N`, `${m-a}N`, `${f*2}N`]),
          correct: 0
        };
      },
      () => {
        const u = random(0, 20);
        const a = random(2, 10);
        const t = random(2, 8);
        const v = u + a * t;
        return {
          text: `Initial velocity = ${u}m/s, acceleration = ${a}m/s², time = ${t}s. Find final velocity.`,
          options: shuffle([`${v}m/s`, `${v+a}m/s`, `${u*t}m/s`, `${v-u}m/s`]),
          correct: 0
        };
      },
      () => {
        const m = random(5, 20);
        const g = 10;
        const w = m * g;
        return {
          text: `Weight of ${m}kg mass (g=10m/s²) is?`,
          options: shuffle([`${w}N`, `${m}N`, `${w/2}N`, `${w+m}N`]),
          correct: 0
        };
      }
    ],
    'Electricity': [
      () => {
        const v = random(10, 220);
        const i = random(1, 10);
        const r = v / i;
        return {
          text: `If V = ${v}V and I = ${i}A, find resistance R`,
          options: shuffle([`${r}Ω`, `${v*i}Ω`, `${v+i}Ω`, `${r*2}Ω`]),
          correct: 0
        };
      },
      () => {
        const p = random(100, 1000);
        const t = random(1, 5);
        const e = p * t;
        return {
          text: `Power = ${p}W, Time = ${t}hr. Find energy consumed in Wh.`,
          options: shuffle([`${e}Wh`, `${p/t}Wh`, `${p+t}Wh`, `${e/2}Wh`]),
          correct: 0
        };
      }
    ],
    'Optics': [
      () => {
        return {
          text: `Which phenomenon explains the formation of rainbow?`,
          options: shuffle(['Dispersion', 'Reflection', 'Refraction only', 'Diffraction']),
          correct: 0
        };
      },
      () => {
        return {
          text: `The speed of light in vacuum is approximately?`,
          options: shuffle(['3 × 10⁸ m/s', '3 × 10⁶ m/s', '3 × 10¹⁰ m/s', '3 × 10⁵ m/s']),
          correct: 0
        };
      }
    ],
    'Thermodynamics': [
      () => {
        const c = random(0, 100);
        const f = (c * 9/5) + 32;
        return {
          text: `Convert ${c}°C to Fahrenheit`,
          options: shuffle([`${f}°F`, `${c + 32}°F`, `${c * 2}°F`, `${f + 10}°F`]),
          correct: 0
        };
      }
    ],
    'Modern Physics': [
      () => {
        return {
          text: `Who proposed the theory of relativity?`,
          options: shuffle(['Albert Einstein', 'Isaac Newton', 'Niels Bohr', 'Max Planck']),
          correct: 0
        };
      }
    ],
    'Waves': [
      () => {
        const f = random(100, 1000);
        const wavelength = random(1, 10);
        const v = f * wavelength;
        return {
          text: `Frequency = ${f}Hz, Wavelength = ${wavelength}m. Find velocity.`,
          options: shuffle([`${v}m/s`, `${f/wavelength}m/s`, `${f+wavelength}m/s`, `${v/2}m/s`]),
          correct: 0
        };
      }
    ],
    'Magnetism': [
      () => {
        return {
          text: `Which material is not magnetic?`,
          options: shuffle(['Copper', 'Iron', 'Nickel', 'Cobalt']),
          correct: 0
        };
      }
    ]
  },
  'Chemistry': {
    'Organic Chemistry': [
      () => {
        return {
          text: `What is the functional group in alcohols?`,
          options: shuffle(['-OH', '-COOH', '-CHO', '-CO-']),
          correct: 0
        };
      },
      () => {
        return {
          text: `Methane (CH₄) is an example of?`,
          options: shuffle(['Alkane', 'Alkene', 'Alkyne', 'Aromatic']),
          correct: 0
        };
      }
    ],
    'Inorganic Chemistry': [
      () => {
        return {
          text: `What is the atomic number of Carbon?`,
          options: shuffle(['6', '8', '12', '14']),
          correct: 0
        };
      },
      () => {
        return {
          text: `Which gas is most abundant in Earth's atmosphere?`,
          options: shuffle(['Nitrogen', 'Oxygen', 'Carbon dioxide', 'Argon']),
          correct: 0
        };
      }
    ],
    'Physical Chemistry': [
      () => {
        return {
          text: `What is Avogadro's number?`,
          options: shuffle(['6.022 × 10²³', '6.022 × 10²⁴', '3.14 × 10²³', '6.022 × 10²²']),
          correct: 0
        };
      }
    ],
    'Biochemistry': [
      () => {
        return {
          text: `DNA stands for?`,
          options: shuffle(['Deoxyribonucleic Acid', 'Diribonucleic Acid', 'Deoxyribose Acid', 'None']),
          correct: 0
        };
      }
    ]
  },
  'Computer Science': {
    'Programming': [
      () => {
        return {
          text: `Which is not a programming language?`,
          options: shuffle(['HTML', 'Python', 'Java', 'C++']),
          correct: 0
        };
      },
      () => {
        return {
          text: `What does OOP stand for?`,
          options: shuffle(['Object Oriented Programming', 'Object Oriented Protocol', 'Oriented Object Programming', 'Object Order Programming']),
          correct: 0
        };
      }
    ],
    'Data Structures': [
      () => {
        return {
          text: `Which data structure uses FIFO?`,
          options: shuffle(['Queue', 'Stack', 'Tree', 'Graph']),
          correct: 0
        };
      },
      () => {
        return {
          text: `Time complexity of binary search is?`,
          options: shuffle(['O(log n)', 'O(n)', 'O(n²)', 'O(1)']),
          correct: 0
        };
      }
    ],
    'Database': [
      () => {
        return {
          text: `SQL stands for?`,
          options: shuffle(['Structured Query Language', 'Simple Query Language', 'Standard Query Language', 'Sequential Query Language']),
          correct: 0
        };
      },
      () => {
        return {
          text: `Which is a NoSQL database?`,
          options: shuffle(['MongoDB', 'MySQL', 'PostgreSQL', 'Oracle']),
          correct: 0
        };
      }
    ],
    'Algorithms': [
      () => {
        return {
          text: `Which sorting algorithm has O(n²) worst case?`,
          options: shuffle(['Bubble Sort', 'Merge Sort', 'Heap Sort', 'Quick Sort (avg)']),
          correct: 0
        };
      }
    ],
    'Networking': [
      () => {
        return {
          text: `HTTP stands for?`,
          options: shuffle(['HyperText Transfer Protocol', 'High Text Transfer Protocol', 'HyperText Transit Protocol', 'None']),
          correct: 0
        };
      }
    ],
    'Operating Systems': [
      () => {
        return {
          text: `Which is not an operating system?`,
          options: shuffle(['Oracle', 'Windows', 'Linux', 'macOS']),
          correct: 0
        };
      }
    ]
  },
  'English': {
    'Grammar': [
      () => {
        return {
          text: `Which is correct?`,
          options: shuffle(['She goes to school', 'She go to school', 'She going to school', 'She gone to school']),
          correct: 0
        };
      },
      () => {
        return {
          text: `"Beautiful" is a/an?`,
          options: shuffle(['Adjective', 'Noun', 'Verb', 'Adverb']),
          correct: 0
        };
      }
    ],
    'Vocabulary': [
      () => {
        return {
          text: `Antonym of "Happy" is?`,
          options: shuffle(['Sad', 'Joyful', 'Excited', 'Cheerful']),
          correct: 0
        };
      },
      () => {
        return {
          text: `Synonym of "Begin" is?`,
          options: shuffle(['Start', 'End', 'Stop', 'Pause']),
          correct: 0
        };
      }
    ],
    'Comprehension': [
      () => {
        return {
          text: `Reading comprehension tests your ability to?`,
          options: shuffle(['Understand text', 'Write essays', 'Speak fluently', 'Memorize words']),
          correct: 0
        };
      }
    ],
    'Writing': [
      () => {
        return {
          text: `A paragraph should have?`,
          options: shuffle(['One main idea', 'Multiple topics', 'No structure', 'Only questions']),
          correct: 0
        };
      }
    ]
  },
  'General Knowledge': {
    'Geography': [
      () => {
        const capitals: Record<string, string> = {
          'India': 'New Delhi',
          'Japan': 'Tokyo',
          'France': 'Paris',
          'Australia': 'Canberra',
          'Brazil': 'Brasília',
          'Canada': 'Ottawa'
        };
        const countries = Object.keys(capitals);
        const country = countries[random(0, countries.length - 1)];
        const allCaps = Object.values(capitals);
        return {
          text: `What is the capital of ${country}?`,
          options: shuffle([capitals[country], ...allCaps.filter(c => c !== capitals[country]).slice(0, 3)]),
          correct: 0
        };
      }
    ],
    'History': [
      () => {
        return {
          text: `In which year did India gain independence?`,
          options: shuffle(['1947', '1950', '1942', '1945']),
          correct: 0
        };
      }
    ],
    'Current Affairs': [
      () => {
        return {
          text: `United Nations headquarters is located in?`,
          options: shuffle(['New York', 'Geneva', 'London', 'Paris']),
          correct: 0
        };
      }
    ],
    'Science': [
      () => {
        return {
          text: `Which planet is known as the Red Planet?`,
          options: shuffle(['Mars', 'Venus', 'Jupiter', 'Saturn']),
          correct: 0
        };
      }
    ],
    'Sports': [
      () => {
        return {
          text: `How many players are in a cricket team?`,
          options: shuffle(['11', '9', '15', '7']),
          correct: 0
        };
      }
    ]
  },
  'Biology': {
    'Cell Biology': [
      () => {
        return {
          text: `Which organelle is called the powerhouse of the cell?`,
          options: shuffle(['Mitochondria', 'Nucleus', 'Ribosome', 'Golgi body']),
          correct: 0
        };
      }
    ],
    'Genetics': [
      () => {
        return {
          text: `DNA is located in which part of the cell?`,
          options: shuffle(['Nucleus', 'Cytoplasm', 'Ribosome', 'Mitochondria']),
          correct: 0
        };
      }
    ],
    'Human Anatomy': [
      () => {
        return {
          text: `How many bones are in adult human body?`,
          options: shuffle(['206', '205', '300', '180']),
          correct: 0
        };
      }
    ],
    'Ecology': [
      () => {
        return {
          text: `Which gas do plants absorb during photosynthesis?`,
          options: shuffle(['Carbon dioxide', 'Oxygen', 'Nitrogen', 'Hydrogen']),
          correct: 0
        };
      }
    ],
    'Evolution': [
      () => {
        return {
          text: `Who proposed the theory of natural selection?`,
          options: shuffle(['Charles Darwin', 'Gregor Mendel', 'Louis Pasteur', 'Isaac Newton']),
          correct: 0
        };
      }
    ]
  }
};

// Generate questions from topic
export const generateQuestionsFromTopic = (
  subject: string,
  topic: string,
  count: number,
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed',
  classLevel: string
): Question[] => {
  const questions: Question[] = [];
  const subjectTemplates = questionTemplates[subject];
  
  if (!subjectTemplates) {
    // Generate generic questions
    for (let i = 0; i < count; i++) {
      const diff = difficulty === 'mixed' ? ['easy', 'medium', 'hard'][random(0, 2)] as QuestionDifficulty : difficulty;
      questions.push({
        id: `q-${Date.now()}-${i}`,
        text: `${topic} question ${i + 1} for ${classLevel}`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 0,
        difficulty: diff,
        subject: topic,
        marks: 2
      });
    }
    return questions;
  }

  const topicTemplates = subjectTemplates[topic] || [];
  
  for (let i = 0; i < count; i++) {
    let questionData;
    
    if (topicTemplates.length > 0) {
      const template = topicTemplates[i % topicTemplates.length];
      const generated = template();
      questionData = {
        text: generated.text,
        options: generated.options,
        correctAnswer: generated.options.indexOf(generated.options[generated.correct]) >= 0 ? generated.correct : 0
      };
    } else {
      // Fallback generic
      questionData = {
        text: `Question about ${topic} (#${random(1, 1000)})`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: random(0, 3)
      };
    }

    const diff = difficulty === 'mixed' ? ['easy', 'medium', 'hard'][random(0, 2)] as QuestionDifficulty : difficulty;
    
    questions.push({
      id: `q-${Date.now()}-${random(1000, 9999)}-${i}`,
      text: questionData.text,
      options: questionData.options,
      correctAnswer: questionData.correctAnswer,
      difficulty: diff,
      subject: topic,
      marks: 2
    });
  }

  return shuffle(questions);
};

// Generate questions from syllabus text
export const generateQuestionsFromSyllabus = (
  syllabusText: string,
  subject: string,
  count: number,
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed',
  classLevel: string
): { questions: Question[]; detectedTopics: string[] } => {
  // Detect topics from syllabus
  const allTopics = Object.values(questionTemplates).flatMap(s => Object.keys(s));
  const detectedTopics: string[] = [];
  
  const lowerText = syllabusText.toLowerCase();
  allTopics.forEach(topic => {
    if (lowerText.includes(topic.toLowerCase())) {
      detectedTopics.push(topic);
    }
  });

  // Also check for common keywords
  const keywords: Record<string, string> = {
    'derivative': 'Calculus',
    'integral': 'Calculus',
    'sin': 'Trigonometry',
    'cos': 'Trigonometry',
    'tan': 'Trigonometry',
    'equation': 'Algebra',
    'polynomial': 'Algebra',
    'area': 'Geometry',
    'perimeter': 'Geometry',
    'force': 'Mechanics',
    'velocity': 'Mechanics',
    'circuit': 'Electricity',
    'dna': 'Genetics',
    'cell': 'Cell Biology'
  };

  Object.entries(keywords).forEach(([keyword, topic]) => {
    if (lowerText.includes(keyword) && !detectedTopics.includes(topic)) {
      detectedTopics.push(topic);
    }
  });

  if (detectedTopics.length === 0) {
    detectedTopics.push('General');
  }

  // Generate questions
  const questionsPerTopic = Math.ceil(count / detectedTopics.length);
  const questions: Question[] = [];

  detectedTopics.forEach(topic => {
    const topicQuestions = generateQuestionsFromTopic(
      subject,
      topic,
      questionsPerTopic,
      difficulty,
      classLevel
    );
    questions.push(...topicQuestions);
  });

  return {
    questions: questions.slice(0, count),
    detectedTopics
  };
};
