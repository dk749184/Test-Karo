// AI Question Generator Engine
// Generates unique questions based on topic, class, and subject

export interface GeneratedQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  class: string;
}

// Question Templates Database
const questionTemplates: Record<string, Record<string, any[]>> = {
  mathematics: {
    algebra: [
      {
        template: (a: number, b: number) => ({
          question: `Solve for x: ${a}x + ${b} = ${a * 5 + b}`,
          answer: 5,
          options: (ans: number) => [ans, ans + 2, ans - 1, ans + 3]
        }),
        difficulty: 'easy'
      },
      {
        template: (a: number, _b: number) => ({
          question: `If x + y = ${a + _b} and x - y = ${a - _b}, find the value of x.`,
          answer: a,
          options: (ans: number) => [ans, _b, a + _b, a - _b]
        }),
        difficulty: 'medium'
      },
      {
        template: (a: number, c: number) => ({
          question: `Find the value of x in the equation: x² - ${a + c}x + ${a * c} = 0 (one root)`,
          answer: a,
          options: (ans: number) => [ans, c, -a, -(a + c)]
        }),
        difficulty: 'medium'
      },
      {
        template: (a: number) => ({
          question: `What is the sum of first ${a} natural numbers?`,
          answer: (a * (a + 1)) / 2,
          options: (ans: number) => [ans, ans + a, ans - a, a * a]
        }),
        difficulty: 'easy'
      },
      {
        template: (a: number, b: number) => ({
          question: `Simplify: (${a}x² + ${b}x) ÷ x`,
          answer: `${a}x + ${b}`,
          options: () => [`${a}x + ${b}`, `${a}x - ${b}`, `${b}x + ${a}`, `${a + b}x`]
        }),
        difficulty: 'easy'
      },
      {
        template: (a: number) => ({
          question: `If f(x) = x² + ${a}x + ${a * 2}, find f(2).`,
          answer: 4 + 2 * a + a * 2,
          options: (ans: number) => [ans, ans + 2, ans - 4, ans + a]
        }),
        difficulty: 'medium'
      },
      {
        template: (a: number) => ({
          question: `The product of two consecutive integers is ${a * (a + 1)}. Find the smaller integer.`,
          answer: a,
          options: (ans: number) => [ans, ans + 1, ans - 1, ans + 2]
        }),
        difficulty: 'medium'
      },
      {
        template: (a: number) => ({
          question: `What is the ${a}th term of AP: 3, 7, 11, 15, ...?`,
          answer: 3 + (a - 1) * 4,
          options: (ans: number) => [ans, ans + 4, ans - 4, ans + 2]
        }),
        difficulty: 'medium'
      }
    ],
    trigonometry: [
      {
        template: (angle: number) => ({
          question: `What is the value of sin²(${angle}°) + cos²(${angle}°)?`,
          answer: 1,
          options: () => [1, 0, 2, -1]
        }),
        difficulty: 'easy'
      },
      {
        template: () => ({
          question: `What is the value of tan(45°)?`,
          answer: 1,
          options: () => [1, 0, '√3', '1/√3']
        }),
        difficulty: 'easy'
      },
      {
        template: () => ({
          question: `What is the value of sin(30°)?`,
          answer: '1/2',
          options: () => ['1/2', '√3/2', '1', '1/√2']
        }),
        difficulty: 'easy'
      },
      {
        template: () => ({
          question: `What is the value of cos(60°)?`,
          answer: '1/2',
          options: () => ['1/2', '√3/2', '1', '0']
        }),
        difficulty: 'easy'
      },
      {
        template: () => ({
          question: `If sin(θ) = 3/5, what is cos(θ)?`,
          answer: '4/5',
          options: () => ['4/5', '3/5', '5/4', '5/3']
        }),
        difficulty: 'medium'
      },
      {
        template: (a: number) => ({
          question: `What is the period of sin(${a}x)?`,
          answer: `2π/${a}`,
          options: () => [`2π/${a}`, `${a}π`, `π/${a}`, `2π`]
        }),
        difficulty: 'hard'
      },
      {
        template: () => ({
          question: `What is sec²(θ) - tan²(θ)?`,
          answer: 1,
          options: () => [1, 0, -1, 2]
        }),
        difficulty: 'medium'
      },
      {
        template: () => ({
          question: `In which quadrant is sin(θ) positive and cos(θ) negative?`,
          answer: 'Second Quadrant',
          options: () => ['Second Quadrant', 'First Quadrant', 'Third Quadrant', 'Fourth Quadrant']
        }),
        difficulty: 'medium'
      }
    ],
    calculus: [
      {
        template: (a: number, n: number) => ({
          question: `Find the derivative of ${a}x^${n}`,
          answer: `${a * n}x^${n - 1}`,
          options: () => [`${a * n}x^${n - 1}`, `${a}x^${n - 1}`, `${a * n}x^${n}`, `${a}x^${n + 1}`]
        }),
        difficulty: 'easy'
      },
      {
        template: (a: number) => ({
          question: `What is the integral of ${a}x dx?`,
          answer: `${a}x²/2 + C`,
          options: () => [`${a}x²/2 + C`, `${a}x + C`, `${a}x² + C`, `${a}/x + C`]
        }),
        difficulty: 'easy'
      },
      {
        template: () => ({
          question: `What is the derivative of sin(x)?`,
          answer: 'cos(x)',
          options: () => ['cos(x)', '-cos(x)', 'sin(x)', '-sin(x)']
        }),
        difficulty: 'easy'
      },
      {
        template: () => ({
          question: `What is the derivative of e^x?`,
          answer: 'e^x',
          options: () => ['e^x', 'xe^(x-1)', 'e^(x-1)', 'x·e^x']
        }),
        difficulty: 'easy'
      },
      {
        template: () => ({
          question: `What is the derivative of ln(x)?`,
          answer: '1/x',
          options: () => ['1/x', 'x', 'ln(x)', '1/ln(x)']
        }),
        difficulty: 'medium'
      },
      {
        template: (a: number, b: number) => ({
          question: `Find dy/dx if y = ${a}x³ + ${b}x²`,
          answer: `${3 * a}x² + ${2 * b}x`,
          options: () => [`${3 * a}x² + ${2 * b}x`, `${a}x² + ${b}x`, `${3 * a}x³ + ${2 * b}x²`, `${a}x⁴ + ${b}x³`]
        }),
        difficulty: 'medium'
      },
      {
        template: () => ({
          question: `What is ∫cos(x) dx?`,
          answer: 'sin(x) + C',
          options: () => ['sin(x) + C', '-sin(x) + C', 'cos(x) + C', '-cos(x) + C']
        }),
        difficulty: 'easy'
      },
      {
        template: (a: number) => ({
          question: `Evaluate: lim(x→${a}) (x² - ${a * a})/(x - ${a})`,
          answer: 2 * a,
          options: (ans: number) => [ans, a, a * a, 0]
        }),
        difficulty: 'hard'
      }
    ],
    geometry: [
      {
        template: (r: number) => ({
          question: `What is the area of a circle with radius ${r} cm?`,
          answer: `${r * r}π cm²`,
          options: () => [`${r * r}π cm²`, `${2 * r}π cm²`, `${r}π cm²`, `${r * r * 2}π cm²`]
        }),
        difficulty: 'easy'
      },
      {
        template: (l: number, b: number) => ({
          question: `Find the perimeter of a rectangle with length ${l} cm and breadth ${b} cm.`,
          answer: 2 * (l + b),
          options: (ans: number) => [ans, l * b, l + b, 2 * l * b]
        }),
        difficulty: 'easy'
      },
      {
        template: (a: number) => ({
          question: `What is the area of an equilateral triangle with side ${a} cm?`,
          answer: `(√3/4) × ${a * a} cm²`,
          options: () => [`(√3/4) × ${a * a} cm²`, `${a * a} cm²`, `${a * a}/2 cm²`, `√3 × ${a * a} cm²`]
        }),
        difficulty: 'medium'
      },
      {
        template: (r: number) => ({
          question: `What is the volume of a sphere with radius ${r} cm?`,
          answer: `(4/3)π × ${r}³ cm³`,
          options: () => [`(4/3)π × ${r}³ cm³`, `4π × ${r}² cm³`, `π × ${r}³ cm³`, `(2/3)π × ${r}³ cm³`]
        }),
        difficulty: 'medium'
      },
      {
        template: (a: number, b: number, c: number) => ({
          question: `In a triangle with sides ${a}, ${b}, and ${c}, which type of triangle is it?`,
          answer: a === b && b === c ? 'Equilateral' : (a === b || b === c || a === c ? 'Isosceles' : 'Scalene'),
          options: () => ['Equilateral', 'Isosceles', 'Scalene', 'Right-angled']
        }),
        difficulty: 'easy'
      },
      {
        template: (l: number, b: number, h: number) => ({
          question: `What is the volume of a cuboid with dimensions ${l}×${b}×${h} cm?`,
          answer: l * b * h,
          options: (ans: number) => [ans, l + b + h, 2 * (l * b + b * h + h * l), l * b]
        }),
        difficulty: 'easy'
      }
    ],
    statistics: [
      {
        template: (...nums: number[]) => {
          const sum = nums.reduce((a, b) => a + b, 0);
          const mean = sum / nums.length;
          return {
            question: `Find the mean of: ${nums.join(', ')}`,
            answer: mean,
            options: (ans: number) => [ans, nums[0], nums[nums.length - 1], sum]
          };
        },
        difficulty: 'easy'
      },
      {
        template: (...nums: number[]) => {
          const sorted = [...nums].sort((a, b) => a - b);
          const mid = Math.floor(sorted.length / 2);
          const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
          return {
            question: `Find the median of: ${nums.join(', ')}`,
            answer: median,
            options: (ans: number) => [ans, nums[0], nums[nums.length - 1], (nums[0] + nums[nums.length - 1]) / 2]
          };
        },
        difficulty: 'medium'
      },
      {
        template: (n: number) => ({
          question: `What is the probability of getting a ${n} when rolling a fair die?`,
          answer: '1/6',
          options: () => ['1/6', '1/3', '1/2', '1/4']
        }),
        difficulty: 'easy'
      },
      {
        template: () => ({
          question: `What is the probability of getting heads in a fair coin toss?`,
          answer: '1/2',
          options: () => ['1/2', '1/4', '1/3', '1']
        }),
        difficulty: 'easy'
      }
    ]
  },
  physics: {
    mechanics: [
      {
        template: (v: number, t: number) => ({
          question: `A car travels ${v * t} km in ${t} hours. What is its average speed?`,
          answer: v,
          options: (ans: number) => [ans, ans + 10, ans - 5, ans * 2]
        }),
        difficulty: 'easy'
      },
      {
        template: (m: number, a: number) => ({
          question: `What force is required to accelerate a ${m} kg object at ${a} m/s²?`,
          answer: m * a,
          options: (ans: number) => [ans, m + a, m - a, ans / 2]
        }),
        difficulty: 'easy'
      },
      {
        template: (m: number, h: number) => ({
          question: `Calculate the potential energy of a ${m} kg object at height ${h} m. (g=10 m/s²)`,
          answer: m * 10 * h,
          options: (ans: number) => [ans, m * h, m + h, ans / 10]
        }),
        difficulty: 'medium'
      },
      {
        template: (u: number, a: number, t: number) => ({
          question: `An object starts with velocity ${u} m/s and accelerates at ${a} m/s² for ${t} seconds. Find final velocity.`,
          answer: u + a * t,
          options: (ans: number) => [ans, u * t, a * t, u + a]
        }),
        difficulty: 'medium'
      },
      {
        template: () => ({
          question: `What is the SI unit of force?`,
          answer: 'Newton',
          options: () => ['Newton', 'Joule', 'Watt', 'Pascal']
        }),
        difficulty: 'easy'
      },
      {
        template: (m: number, v: number) => ({
          question: `Calculate the kinetic energy of a ${m} kg object moving at ${v} m/s.`,
          answer: 0.5 * m * v * v,
          options: (ans: number) => [ans, m * v, m * v * v, 2 * ans]
        }),
        difficulty: 'medium'
      },
      {
        template: () => ({
          question: `Newton's first law is also known as:`,
          answer: 'Law of Inertia',
          options: () => ['Law of Inertia', 'Law of Acceleration', 'Law of Action-Reaction', 'Law of Gravity']
        }),
        difficulty: 'easy'
      }
    ],
    electricity: [
      {
        template: (v: number, i: number) => ({
          question: `Calculate resistance if voltage is ${v}V and current is ${i}A.`,
          answer: v / i,
          options: (ans: number) => [ans, v * i, v + i, v - i]
        }),
        difficulty: 'easy'
      },
      {
        template: (v: number, r: number) => ({
          question: `What current flows through a ${r}Ω resistor connected to ${v}V?`,
          answer: v / r,
          options: (ans: number) => [ans, v * r, v + r, r / v]
        }),
        difficulty: 'easy'
      },
      {
        template: (p: number, t: number) => ({
          question: `How much energy is consumed by a ${p}W device in ${t} hours?`,
          answer: p * t,
          options: (ans: number) => [ans, p / t, p + t, ans / 1000]
        }),
        difficulty: 'medium'
      },
      {
        template: () => ({
          question: `What is the SI unit of electric current?`,
          answer: 'Ampere',
          options: () => ['Ampere', 'Volt', 'Ohm', 'Watt']
        }),
        difficulty: 'easy'
      },
      {
        template: () => ({
          question: `Ohm's law states that V = ?`,
          answer: 'I × R',
          options: () => ['I × R', 'I / R', 'I + R', 'I - R']
        }),
        difficulty: 'easy'
      }
    ],
    optics: [
      {
        template: () => ({
          question: `What is the speed of light in vacuum?`,
          answer: '3 × 10⁸ m/s',
          options: () => ['3 × 10⁸ m/s', '3 × 10⁶ m/s', '3 × 10¹⁰ m/s', '3 × 10⁵ m/s']
        }),
        difficulty: 'easy'
      },
      {
        template: (f: number) => ({
          question: `What is the power of a lens with focal length ${f} cm?`,
          answer: 100 / f,
          options: (ans: number) => [ans, f, 1 / f, f * 100]
        }),
        difficulty: 'medium'
      },
      {
        template: () => ({
          question: `Which mirror is used in car headlights?`,
          answer: 'Concave mirror',
          options: () => ['Concave mirror', 'Convex mirror', 'Plane mirror', 'Spherical mirror']
        }),
        difficulty: 'easy'
      },
      {
        template: () => ({
          question: `The phenomenon of splitting of white light into seven colors is called:`,
          answer: 'Dispersion',
          options: () => ['Dispersion', 'Reflection', 'Refraction', 'Diffraction']
        }),
        difficulty: 'easy'
      }
    ]
  },
  chemistry: {
    general: [
      {
        template: () => ({
          question: `What is the atomic number of Carbon?`,
          answer: 6,
          options: () => [6, 12, 8, 14]
        }),
        difficulty: 'easy'
      },
      {
        template: () => ({
          question: `What is the chemical formula of water?`,
          answer: 'H₂O',
          options: () => ['H₂O', 'H₂O₂', 'HO', 'H₃O']
        }),
        difficulty: 'easy'
      },
      {
        template: () => ({
          question: `What is the pH of a neutral solution?`,
          answer: 7,
          options: () => [7, 0, 14, 1]
        }),
        difficulty: 'easy'
      },
      {
        template: () => ({
          question: `Which gas is known as laughing gas?`,
          answer: 'Nitrous Oxide (N₂O)',
          options: () => ['Nitrous Oxide (N₂O)', 'Carbon Dioxide', 'Nitrogen', 'Oxygen']
        }),
        difficulty: 'medium'
      },
      {
        template: () => ({
          question: `What is the molecular formula of glucose?`,
          answer: 'C₆H₁₂O₆',
          options: () => ['C₆H₁₂O₆', 'C₁₂H₂₂O₁₁', 'CH₄', 'C₂H₅OH']
        }),
        difficulty: 'medium'
      },
      {
        template: (n: number) => ({
          question: `An element has ${n} protons. What is its atomic number?`,
          answer: n,
          options: (ans: number) => [ans, ans * 2, ans + 1, ans - 1]
        }),
        difficulty: 'easy'
      },
      {
        template: () => ({
          question: `Which is the most abundant gas in Earth's atmosphere?`,
          answer: 'Nitrogen',
          options: () => ['Nitrogen', 'Oxygen', 'Carbon Dioxide', 'Argon']
        }),
        difficulty: 'easy'
      },
      {
        template: () => ({
          question: `What is the chemical symbol for Gold?`,
          answer: 'Au',
          options: () => ['Au', 'Ag', 'Go', 'Gd']
        }),
        difficulty: 'easy'
      }
    ],
    organic: [
      {
        template: () => ({
          question: `What is the first member of alkane series?`,
          answer: 'Methane (CH₄)',
          options: () => ['Methane (CH₄)', 'Ethane (C₂H₆)', 'Propane (C₃H₈)', 'Butane (C₄H₁₀)']
        }),
        difficulty: 'easy'
      },
      {
        template: () => ({
          question: `The functional group -OH is characteristic of:`,
          answer: 'Alcohols',
          options: () => ['Alcohols', 'Aldehydes', 'Ketones', 'Carboxylic Acids']
        }),
        difficulty: 'medium'
      },
      {
        template: (n: number) => ({
          question: `How many carbon atoms are in ${['methane', 'ethane', 'propane', 'butane', 'pentane'][n - 1]}?`,
          answer: n,
          options: (ans: number) => [ans, ans + 1, ans - 1, ans * 2]
        }),
        difficulty: 'easy'
      }
    ]
  },
  biology: {
    general: [
      {
        template: () => ({
          question: `What is the powerhouse of the cell?`,
          answer: 'Mitochondria',
          options: () => ['Mitochondria', 'Nucleus', 'Ribosome', 'Golgi Body']
        }),
        difficulty: 'easy'
      },
      {
        template: () => ({
          question: `Which blood cells help in clotting?`,
          answer: 'Platelets',
          options: () => ['Platelets', 'RBC', 'WBC', 'Plasma']
        }),
        difficulty: 'easy'
      },
      {
        template: () => ({
          question: `What is the largest organ in human body?`,
          answer: 'Skin',
          options: () => ['Skin', 'Liver', 'Brain', 'Heart']
        }),
        difficulty: 'easy'
      },
      {
        template: () => ({
          question: `DNA stands for:`,
          answer: 'Deoxyribonucleic Acid',
          options: () => ['Deoxyribonucleic Acid', 'Dinucleic Acid', 'Dioxyribonucleic Acid', 'Dual Nucleic Acid']
        }),
        difficulty: 'easy'
      },
      {
        template: () => ({
          question: `Which vitamin is produced by sunlight?`,
          answer: 'Vitamin D',
          options: () => ['Vitamin D', 'Vitamin A', 'Vitamin C', 'Vitamin B12']
        }),
        difficulty: 'easy'
      },
      {
        template: () => ({
          question: `How many chromosomes are in a human cell?`,
          answer: 46,
          options: () => [46, 23, 48, 44]
        }),
        difficulty: 'medium'
      },
      {
        template: () => ({
          question: `Photosynthesis occurs in which part of the plant cell?`,
          answer: 'Chloroplast',
          options: () => ['Chloroplast', 'Mitochondria', 'Nucleus', 'Vacuole']
        }),
        difficulty: 'easy'
      },
      {
        template: () => ({
          question: `Which organ filters blood in the human body?`,
          answer: 'Kidney',
          options: () => ['Kidney', 'Liver', 'Heart', 'Lungs']
        }),
        difficulty: 'easy'
      }
    ]
  },
  english: {
    grammar: [
      {
        template: () => ({
          question: `Choose the correct form: She ___ to school every day.`,
          answer: 'goes',
          options: () => ['goes', 'go', 'going', 'gone']
        }),
        difficulty: 'easy'
      },
      {
        template: () => ({
          question: `Which is the past tense of "write"?`,
          answer: 'wrote',
          options: () => ['wrote', 'written', 'writed', 'writing']
        }),
        difficulty: 'easy'
      },
      {
        template: () => ({
          question: `Identify the noun: "The beautiful garden has many flowers."`,
          answer: 'garden, flowers',
          options: () => ['garden, flowers', 'beautiful, many', 'has', 'the']
        }),
        difficulty: 'easy'
      },
      {
        template: () => ({
          question: `Which sentence is in passive voice?`,
          answer: 'The cake was eaten by her.',
          options: () => ['The cake was eaten by her.', 'She ate the cake.', 'She is eating cake.', 'She eats cake.']
        }),
        difficulty: 'medium'
      },
      {
        template: () => ({
          question: `What is the plural of "child"?`,
          answer: 'children',
          options: () => ['children', 'childs', 'childrens', 'child']
        }),
        difficulty: 'easy'
      },
      {
        template: () => ({
          question: `Choose the correct article: ___ apple a day keeps the doctor away.`,
          answer: 'An',
          options: () => ['An', 'A', 'The', 'No article']
        }),
        difficulty: 'easy'
      }
    ],
    vocabulary: [
      {
        template: () => ({
          question: `What is the antonym of "happy"?`,
          answer: 'sad',
          options: () => ['sad', 'joyful', 'cheerful', 'merry']
        }),
        difficulty: 'easy'
      },
      {
        template: () => ({
          question: `What is the synonym of "big"?`,
          answer: 'large',
          options: () => ['large', 'small', 'tiny', 'mini']
        }),
        difficulty: 'easy'
      },
      {
        template: () => ({
          question: `"Benevolent" means:`,
          answer: 'Kind and generous',
          options: () => ['Kind and generous', 'Evil', 'Lazy', 'Angry']
        }),
        difficulty: 'medium'
      }
    ]
  },
  computer_science: {
    programming: [
      {
        template: () => ({
          question: `What does CPU stand for?`,
          answer: 'Central Processing Unit',
          options: () => ['Central Processing Unit', 'Computer Personal Unit', 'Central Program Utility', 'Computer Processing Unit']
        }),
        difficulty: 'easy'
      },
      {
        template: () => ({
          question: `Which data structure follows LIFO principle?`,
          answer: 'Stack',
          options: () => ['Stack', 'Queue', 'Array', 'Linked List']
        }),
        difficulty: 'medium'
      },
      {
        template: () => ({
          question: `What is the time complexity of binary search?`,
          answer: 'O(log n)',
          options: () => ['O(log n)', 'O(n)', 'O(n²)', 'O(1)']
        }),
        difficulty: 'medium'
      },
      {
        template: () => ({
          question: `Which language is used for web page styling?`,
          answer: 'CSS',
          options: () => ['CSS', 'HTML', 'JavaScript', 'Python']
        }),
        difficulty: 'easy'
      },
      {
        template: () => ({
          question: `What does HTML stand for?`,
          answer: 'HyperText Markup Language',
          options: () => ['HyperText Markup Language', 'High Text Machine Language', 'HyperText Machine Learning', 'Home Tool Markup Language']
        }),
        difficulty: 'easy'
      },
      {
        template: (n: number) => ({
          question: `What is ${n} in binary?`,
          answer: n.toString(2),
          options: () => [n.toString(2), (n + 1).toString(2), (n * 2).toString(2), (n - 1).toString(2)]
        }),
        difficulty: 'medium'
      },
      {
        template: () => ({
          question: `Which data structure follows FIFO principle?`,
          answer: 'Queue',
          options: () => ['Queue', 'Stack', 'Tree', 'Graph']
        }),
        difficulty: 'medium'
      },
      {
        template: () => ({
          question: `SQL stands for:`,
          answer: 'Structured Query Language',
          options: () => ['Structured Query Language', 'Simple Query Language', 'Sequential Query Language', 'Standard Query Language']
        }),
        difficulty: 'easy'
      }
    ],
    database: [
      {
        template: () => ({
          question: `Which command is used to retrieve data from a database?`,
          answer: 'SELECT',
          options: () => ['SELECT', 'GET', 'FETCH', 'RETRIEVE']
        }),
        difficulty: 'easy'
      },
      {
        template: () => ({
          question: `What is a primary key?`,
          answer: 'A unique identifier for each record',
          options: () => ['A unique identifier for each record', 'The first column', 'A foreign reference', 'An index']
        }),
        difficulty: 'easy'
      },
      {
        template: () => ({
          question: `Which SQL command is used to add new records?`,
          answer: 'INSERT',
          options: () => ['INSERT', 'ADD', 'CREATE', 'APPEND']
        }),
        difficulty: 'easy'
      }
    ]
  },
  general_knowledge: {
    general: [
      {
        template: () => ({
          question: `What is the capital of India?`,
          answer: 'New Delhi',
          options: () => ['New Delhi', 'Mumbai', 'Kolkata', 'Chennai']
        }),
        difficulty: 'easy'
      },
      {
        template: () => ({
          question: `Who wrote the national anthem of India?`,
          answer: 'Rabindranath Tagore',
          options: () => ['Rabindranath Tagore', 'Bankim Chandra', 'Mahatma Gandhi', 'Jawaharlal Nehru']
        }),
        difficulty: 'easy'
      },
      {
        template: () => ({
          question: `Which planet is known as the Red Planet?`,
          answer: 'Mars',
          options: () => ['Mars', 'Venus', 'Jupiter', 'Saturn']
        }),
        difficulty: 'easy'
      },
      {
        template: () => ({
          question: `How many states are there in India?`,
          answer: '28',
          options: () => ['28', '29', '27', '30']
        }),
        difficulty: 'easy'
      },
      {
        template: () => ({
          question: `Which is the largest continent?`,
          answer: 'Asia',
          options: () => ['Asia', 'Africa', 'Europe', 'North America']
        }),
        difficulty: 'easy'
      },
      {
        template: () => ({
          question: `Who invented the telephone?`,
          answer: 'Alexander Graham Bell',
          options: () => ['Alexander Graham Bell', 'Thomas Edison', 'Nikola Tesla', 'Albert Einstein']
        }),
        difficulty: 'easy'
      }
    ]
  }
};

// Random number generator with range
function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Generate unique ID
function generateId(): string {
  return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Main question generator function
export function generateQuestions(
  subject: string,
  topic: string,
  numQuestions: number,
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed',
  classLevel: string
): GeneratedQuestion[] {
  const subjectKey = subject.toLowerCase().replace(/\s+/g, '_');
  const topicKey = topic.toLowerCase().replace(/\s+/g, '_');
  
  // Get templates for the subject
  const subjectTemplates = questionTemplates[subjectKey];
  if (!subjectTemplates) {
    // If subject not found, use a mix of available subjects
    return generateMixedQuestions(numQuestions, difficulty, classLevel);
  }
  
  // Get templates for the topic or use all topics
  let templates: any[] = [];
  if (subjectTemplates[topicKey]) {
    templates = subjectTemplates[topicKey];
  } else {
    // Use all topics from the subject
    Object.values(subjectTemplates).forEach((topicTemplates: any) => {
      templates = templates.concat(topicTemplates);
    });
  }
  
  // Filter by difficulty if not mixed
  if (difficulty !== 'mixed') {
    const filtered = templates.filter(t => t.difficulty === difficulty);
    if (filtered.length > 0) {
      templates = filtered;
    }
  }
  
  // Generate questions
  const questions: GeneratedQuestion[] = [];
  const usedTemplates = new Set<number>();
  
  for (let i = 0; i < numQuestions; i++) {
    // Select a template (try to avoid repetition)
    let templateIndex: number;
    let attempts = 0;
    do {
      templateIndex = Math.floor(Math.random() * templates.length);
      attempts++;
    } while (usedTemplates.has(templateIndex) && attempts < templates.length * 2);
    
    usedTemplates.add(templateIndex);
    if (usedTemplates.size >= templates.length) {
      usedTemplates.clear();
    }
    
    const template = templates[templateIndex];
    
    // Generate random parameters
    const params: number[] = [];
    for (let j = 0; j < 5; j++) {
      params.push(getRandomInt(2, 20));
    }
    
    // Generate question from template
    const generated = template.template(...params);
    
    // Create options (shuffled, with correct answer tracked)
    let options: string[];
    let correctAnswerIndex: number;
    
    if (typeof generated.options === 'function') {
      options = generated.options(generated.answer).map((o: any) => String(o));
    } else {
      options = generated.options.map((o: any) => String(o));
    }
    
    // Find correct answer in options
    const correctAnswerStr = String(generated.answer);
    correctAnswerIndex = options.findIndex(o => o === correctAnswerStr);
    
    if (correctAnswerIndex === -1) {
      options[0] = correctAnswerStr;
      correctAnswerIndex = 0;
    }
    
    // Shuffle options and track correct answer
    const optionsWithIndex = options.map((opt, idx) => ({ opt, isCorrect: idx === correctAnswerIndex }));
    const shuffledOptions = shuffleArray(optionsWithIndex);
    
    const finalOptions = shuffledOptions.map(o => o.opt);
    const finalCorrectIndex = shuffledOptions.findIndex(o => o.isCorrect);
    
    questions.push({
      id: generateId(),
      question: generated.question,
      options: finalOptions,
      correctAnswer: finalCorrectIndex,
      subject: subject,
      topic: topic,
      difficulty: template.difficulty,
      class: classLevel
    });
  }
  
  return shuffleArray(questions);
}

// Generate mixed questions from multiple subjects
function generateMixedQuestions(
  numQuestions: number,
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed',
  classLevel: string
): GeneratedQuestion[] {
  const allSubjects = Object.keys(questionTemplates);
  const questions: GeneratedQuestion[] = [];
  
  for (let i = 0; i < numQuestions; i++) {
    const randomSubject = allSubjects[Math.floor(Math.random() * allSubjects.length)];
    const topics = Object.keys(questionTemplates[randomSubject]);
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    
    const generated = generateQuestions(
      randomSubject,
      randomTopic,
      1,
      difficulty,
      classLevel
    );
    
    if (generated.length > 0) {
      questions.push(generated[0]);
    }
  }
  
  return questions;
}

// Parse syllabus text and generate questions based on detected topics
export function generateQuestionsFromSyllabus(
  syllabusText: string,
  numQuestions: number,
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed',
  classLevel: string
): GeneratedQuestion[] {
  // Detect subjects and topics from syllabus
  const detectedTopics: { subject: string; topic: string }[] = [];
  
  const syllabusLower = syllabusText.toLowerCase();
  
  // Check for mathematics topics
  if (syllabusLower.includes('algebra') || syllabusLower.includes('equation') || syllabusLower.includes('polynomial')) {
    detectedTopics.push({ subject: 'mathematics', topic: 'algebra' });
  }
  if (syllabusLower.includes('trigonometry') || syllabusLower.includes('sin') || syllabusLower.includes('cos') || syllabusLower.includes('tan')) {
    detectedTopics.push({ subject: 'mathematics', topic: 'trigonometry' });
  }
  if (syllabusLower.includes('calculus') || syllabusLower.includes('derivative') || syllabusLower.includes('integral') || syllabusLower.includes('differentiation')) {
    detectedTopics.push({ subject: 'mathematics', topic: 'calculus' });
  }
  if (syllabusLower.includes('geometry') || syllabusLower.includes('circle') || syllabusLower.includes('triangle') || syllabusLower.includes('area')) {
    detectedTopics.push({ subject: 'mathematics', topic: 'geometry' });
  }
  if (syllabusLower.includes('statistics') || syllabusLower.includes('probability') || syllabusLower.includes('mean') || syllabusLower.includes('median')) {
    detectedTopics.push({ subject: 'mathematics', topic: 'statistics' });
  }
  
  // Check for physics topics
  if (syllabusLower.includes('mechanics') || syllabusLower.includes('force') || syllabusLower.includes('motion') || syllabusLower.includes('newton')) {
    detectedTopics.push({ subject: 'physics', topic: 'mechanics' });
  }
  if (syllabusLower.includes('electricity') || syllabusLower.includes('current') || syllabusLower.includes('voltage') || syllabusLower.includes('ohm')) {
    detectedTopics.push({ subject: 'physics', topic: 'electricity' });
  }
  if (syllabusLower.includes('optics') || syllabusLower.includes('light') || syllabusLower.includes('lens') || syllabusLower.includes('mirror')) {
    detectedTopics.push({ subject: 'physics', topic: 'optics' });
  }
  
  // Check for chemistry
  if (syllabusLower.includes('chemistry') || syllabusLower.includes('element') || syllabusLower.includes('compound') || syllabusLower.includes('reaction')) {
    detectedTopics.push({ subject: 'chemistry', topic: 'general' });
  }
  if (syllabusLower.includes('organic') || syllabusLower.includes('carbon') || syllabusLower.includes('hydrocarbon')) {
    detectedTopics.push({ subject: 'chemistry', topic: 'organic' });
  }
  
  // Check for biology
  if (syllabusLower.includes('biology') || syllabusLower.includes('cell') || syllabusLower.includes('organism') || syllabusLower.includes('human body')) {
    detectedTopics.push({ subject: 'biology', topic: 'general' });
  }
  
  // Check for computer science
  if (syllabusLower.includes('programming') || syllabusLower.includes('computer') || syllabusLower.includes('algorithm') || syllabusLower.includes('data structure')) {
    detectedTopics.push({ subject: 'computer_science', topic: 'programming' });
  }
  if (syllabusLower.includes('database') || syllabusLower.includes('sql') || syllabusLower.includes('dbms')) {
    detectedTopics.push({ subject: 'computer_science', topic: 'database' });
  }
  
  // Check for english
  if (syllabusLower.includes('english') || syllabusLower.includes('grammar') || syllabusLower.includes('tense') || syllabusLower.includes('vocabulary')) {
    detectedTopics.push({ subject: 'english', topic: 'grammar' });
  }
  
  // Check for GK
  if (syllabusLower.includes('general knowledge') || syllabusLower.includes('gk') || syllabusLower.includes('current affairs')) {
    detectedTopics.push({ subject: 'general_knowledge', topic: 'general' });
  }
  
  // If no topics detected, use mixed
  if (detectedTopics.length === 0) {
    return generateMixedQuestions(numQuestions, difficulty, classLevel);
  }
  
  // Generate questions from detected topics
  const questions: GeneratedQuestion[] = [];
  const questionsPerTopic = Math.ceil(numQuestions / detectedTopics.length);
  
  for (const { subject, topic } of detectedTopics) {
    const topicQuestions = generateQuestions(
      subject,
      topic,
      questionsPerTopic,
      difficulty,
      classLevel
    );
    questions.push(...topicQuestions);
  }
  
  // Shuffle and return required number
  return shuffleArray(questions).slice(0, numQuestions);
}

// Available subjects and topics for UI
export const availableSubjects = [
  {
    name: 'Mathematics',
    topics: ['Algebra', 'Trigonometry', 'Calculus', 'Geometry', 'Statistics']
  },
  {
    name: 'Physics',
    topics: ['Mechanics', 'Electricity', 'Optics']
  },
  {
    name: 'Chemistry',
    topics: ['General', 'Organic']
  },
  {
    name: 'Biology',
    topics: ['General']
  },
  {
    name: 'Computer Science',
    topics: ['Programming', 'Database']
  },
  {
    name: 'English',
    topics: ['Grammar', 'Vocabulary']
  },
  {
    name: 'General Knowledge',
    topics: ['General']
  }
];

export const classLevels = [
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11', 'Class 12', 'College', 'Competitive Exam'
];
