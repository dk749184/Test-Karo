// ============================================
// MOCK DATA FOR DEMONSTRATION
// Contains sample exams, questions, and results
// ============================================

import { Exam, ExamResult, User } from '../types';

// Sample Users
export const mockUsers: User[] = [
  {
    id: 'student-1',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@student.edu',
    role: 'student',
    rollNumber: 'MCA2024001',
    department: 'Computer Applications'
  },
  {
    id: 'admin-1',
    name: 'Dr. Priya Patel',
    email: 'priya.patel@admin.edu',
    role: 'admin',
    department: 'Computer Science'
  }
];

// Get current date for scheduling
const now = new Date();
const tomorrow = new Date(now);
tomorrow.setDate(tomorrow.getDate() + 1);
const nextWeek = new Date(now);
nextWeek.setDate(nextWeek.getDate() + 7);
const lastMonth = new Date(now);
lastMonth.setMonth(lastMonth.getMonth() - 1);

// Sample Exams with Questions
export const mockExams: Exam[] = [
  {
    id: 'exam-1',
    title: 'Data Structures & Algorithms',
    description: 'Comprehensive test covering arrays, linked lists, trees, and sorting algorithms',
    category: 'college',
    class: 'MCA 1st Year',
    classLevel: 'MCA 1st Year',
    subject: 'Computer Science',
    duration: 60,
    totalMarks: 100,
    totalQuestions: 10,
    passingMarks: 40,
    difficulty: 'medium',
    scheduledStart: lastMonth.toISOString(),
    scheduledEnd: nextWeek.toISOString(),
    isEnabled: true,
    isActive: true,
    isPublic: true, // Free exam - no login required
    createdBy: 'admin-1',
    instructions: [
      'Read each question carefully before answering',
      'Each question carries equal marks',
      'No negative marking for wrong answers',
      'Do not switch tabs or windows during the exam',
      'The exam will auto-submit if you exceed the time limit'
    ],
    questions: [
      {
        id: 'q1',
        text: 'What is the time complexity of binary search algorithm?',
        options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
        correctAnswer: 1,
        difficulty: 'easy',
        subject: 'Algorithms',
        marks: 10,
        explanation: 'Binary search divides the array in half at each step, resulting in O(log n) complexity.'
      },
      {
        id: 'q2',
        text: 'Which data structure uses LIFO (Last In First Out) principle?',
        options: ['Queue', 'Stack', 'Array', 'Linked List'],
        correctAnswer: 1,
        difficulty: 'easy',
        subject: 'Data Structures',
        marks: 10,
        explanation: 'Stack follows LIFO principle where the last element added is the first to be removed.'
      },
      {
        id: 'q3',
        text: 'What is the worst-case time complexity of Quick Sort?',
        options: ['O(n log n)', 'O(n)', 'O(n²)', 'O(log n)'],
        correctAnswer: 2,
        difficulty: 'medium',
        subject: 'Algorithms',
        marks: 10,
        explanation: 'Quick Sort has O(n²) worst case when the pivot selection is poor (already sorted array).'
      },
      {
        id: 'q4',
        text: 'Which traversal of a Binary Search Tree gives elements in sorted order?',
        options: ['Preorder', 'Postorder', 'Inorder', 'Level Order'],
        correctAnswer: 2,
        difficulty: 'medium',
        subject: 'Trees',
        marks: 10,
        explanation: 'Inorder traversal of BST visits left subtree, root, then right subtree, giving sorted order.'
      },
      {
        id: 'q5',
        text: 'What is the space complexity of Merge Sort?',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
        correctAnswer: 2,
        difficulty: 'medium',
        subject: 'Algorithms',
        marks: 10,
        explanation: 'Merge Sort requires additional O(n) space for the temporary arrays during merging.'
      },
      {
        id: 'q6',
        text: 'Which data structure is used for implementing recursion?',
        options: ['Queue', 'Stack', 'Array', 'Heap'],
        correctAnswer: 1,
        difficulty: 'easy',
        subject: 'Data Structures',
        marks: 10,
        explanation: 'The call stack is used to store function calls during recursion.'
      },
      {
        id: 'q7',
        text: 'What is the height of a complete binary tree with n nodes?',
        options: ['n', 'log₂(n)', 'n/2', '2n'],
        correctAnswer: 1,
        difficulty: 'hard',
        subject: 'Trees',
        marks: 10,
        explanation: 'A complete binary tree has height ⌊log₂(n)⌋ where n is the number of nodes.'
      },
      {
        id: 'q8',
        text: 'Which algorithm is used to find the shortest path in a weighted graph?',
        options: ['DFS', 'BFS', 'Dijkstra\'s Algorithm', 'Prim\'s Algorithm'],
        correctAnswer: 2,
        difficulty: 'hard',
        subject: 'Graphs',
        marks: 10,
        explanation: 'Dijkstra\'s algorithm finds the shortest path from source to all vertices in a weighted graph.'
      },
      {
        id: 'q9',
        text: 'What is the maximum number of nodes at level L in a binary tree?',
        options: ['L', '2L', '2^L', 'L²'],
        correctAnswer: 2,
        difficulty: 'medium',
        subject: 'Trees',
        marks: 10,
        explanation: 'At level L (starting from 0), a binary tree can have at most 2^L nodes.'
      },
      {
        id: 'q10',
        text: 'Which sorting algorithm has the best average-case time complexity?',
        options: ['Bubble Sort', 'Selection Sort', 'Merge Sort', 'Insertion Sort'],
        correctAnswer: 2,
        difficulty: 'easy',
        subject: 'Algorithms',
        marks: 10,
        explanation: 'Merge Sort has O(n log n) average-case complexity, better than O(n²) of others.'
      }
    ]
  },
  {
    id: 'exam-2',
    title: 'Database Management Systems',
    description: 'Test your knowledge of SQL, normalization, and database design concepts',
    category: 'college',
    class: 'MCA 1st Year',
    classLevel: 'MCA 1st Year',
    subject: 'Database',
    duration: 45,
    totalMarks: 50,
    totalQuestions: 5,
    passingMarks: 20,
    difficulty: 'medium',
    scheduledStart: lastMonth.toISOString(),
    scheduledEnd: nextWeek.toISOString(),
    isEnabled: true,
    isActive: true,
    isPublic: false, // Login required
    createdBy: 'admin-1',
    instructions: [
      'All questions are compulsory',
      'Each question carries 10 marks',
      'Time management is crucial'
    ],
    questions: [
      {
        id: 'db-q1',
        text: 'Which normal form eliminates transitive dependencies?',
        options: ['1NF', '2NF', '3NF', 'BCNF'],
        correctAnswer: 2,
        difficulty: 'medium',
        subject: 'Normalization',
        marks: 10
      },
      {
        id: 'db-q2',
        text: 'What SQL keyword is used to remove duplicate rows?',
        options: ['UNIQUE', 'DISTINCT', 'DIFFERENT', 'REMOVE'],
        correctAnswer: 1,
        difficulty: 'easy',
        subject: 'SQL',
        marks: 10
      },
      {
        id: 'db-q3',
        text: 'Which type of join returns all rows from both tables?',
        options: ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL OUTER JOIN'],
        correctAnswer: 3,
        difficulty: 'medium',
        subject: 'SQL',
        marks: 10
      },
      {
        id: 'db-q4',
        text: 'What is the purpose of an index in a database?',
        options: ['To store data', 'To speed up queries', 'To create backups', 'To encrypt data'],
        correctAnswer: 1,
        difficulty: 'easy',
        subject: 'Database Design',
        marks: 10
      },
      {
        id: 'db-q5',
        text: 'Which ACID property ensures database consistency after a crash?',
        options: ['Atomicity', 'Consistency', 'Isolation', 'Durability'],
        correctAnswer: 3,
        difficulty: 'hard',
        subject: 'Transactions',
        marks: 10
      }
    ]
  },
  {
    id: 'exam-3',
    title: 'General Knowledge Quiz',
    description: 'Test your general awareness for competitive examinations',
    category: 'competitive',
    class: 'Open',
    classLevel: 'Open',
    subject: 'General Knowledge',
    duration: 30,
    totalMarks: 40,
    totalQuestions: 4,
    passingMarks: 16,
    difficulty: 'easy',
    scheduledStart: now.toISOString(),
    scheduledEnd: nextWeek.toISOString(),
    isEnabled: true,
    isActive: true,
    isPublic: true, // Free exam
    createdBy: 'admin-1',
    instructions: [
      'Quick thinking is key',
      'No negative marking'
    ],
    questions: [
      {
        id: 'gk-q1',
        text: 'What is the capital of Australia?',
        options: ['Sydney', 'Melbourne', 'Canberra', 'Perth'],
        correctAnswer: 2,
        difficulty: 'easy',
        subject: 'Geography',
        marks: 10
      },
      {
        id: 'gk-q2',
        text: 'Who invented the telephone?',
        options: ['Thomas Edison', 'Alexander Graham Bell', 'Nikola Tesla', 'Benjamin Franklin'],
        correctAnswer: 1,
        difficulty: 'easy',
        subject: 'History',
        marks: 10
      },
      {
        id: 'gk-q3',
        text: 'What is the chemical symbol for Gold?',
        options: ['Go', 'Gd', 'Au', 'Ag'],
        correctAnswer: 2,
        difficulty: 'easy',
        subject: 'Science',
        marks: 10
      },
      {
        id: 'gk-q4',
        text: 'In which year did World War II end?',
        options: ['1943', '1944', '1945', '1946'],
        correctAnswer: 2,
        difficulty: 'medium',
        subject: 'History',
        marks: 10
      }
    ]
  },
  {
    id: 'exam-4',
    title: 'Mathematics - Class 10',
    description: 'Final examination covering algebra, geometry, and arithmetic',
    category: 'school',
    class: 'Class 10',
    classLevel: 'Class 10',
    subject: 'Mathematics',
    duration: 90,
    totalMarks: 80,
    totalQuestions: 0,
    passingMarks: 32,
    difficulty: 'medium',
    scheduledStart: tomorrow.toISOString(),
    scheduledEnd: nextWeek.toISOString(),
    isEnabled: false,
    isActive: false,
    isPublic: false,
    createdBy: 'admin-1',
    instructions: [
      'Use rough work if needed',
      'Calculator not allowed'
    ],
    questions: []
  },
  {
    id: 'exam-5',
    title: 'Physics - Mechanics',
    description: 'Test on Newton\'s Laws, Motion, and Forces',
    category: 'school',
    class: 'Class 12',
    classLevel: 'Class 12',
    subject: 'Physics',
    duration: 45,
    totalMarks: 50,
    totalQuestions: 5,
    passingMarks: 20,
    difficulty: 'medium',
    scheduledStart: lastMonth.toISOString(),
    scheduledEnd: nextWeek.toISOString(),
    isEnabled: true,
    isActive: true,
    isPublic: true, // Free exam
    createdBy: 'admin-1',
    instructions: [
      'Read each question carefully',
      'Show your working for calculation questions'
    ],
    questions: [
      {
        id: 'phy-q1',
        text: 'What is the SI unit of force?',
        options: ['Joule', 'Newton', 'Watt', 'Pascal'],
        correctAnswer: 1,
        difficulty: 'easy',
        subject: 'Physics',
        marks: 10
      },
      {
        id: 'phy-q2',
        text: 'According to Newton\'s first law, an object at rest will:',
        options: ['Accelerate', 'Move in a circle', 'Stay at rest unless acted upon by a force', 'Lose energy'],
        correctAnswer: 2,
        difficulty: 'easy',
        subject: 'Physics',
        marks: 10
      },
      {
        id: 'phy-q3',
        text: 'What is the formula for kinetic energy?',
        options: ['KE = mgh', 'KE = ½mv²', 'KE = mv', 'KE = Fd'],
        correctAnswer: 1,
        difficulty: 'easy',
        subject: 'Physics',
        marks: 10
      },
      {
        id: 'phy-q4',
        text: 'What is the acceleration due to gravity on Earth (approximately)?',
        options: ['5 m/s²', '9.8 m/s²', '15 m/s²', '20 m/s²'],
        correctAnswer: 1,
        difficulty: 'easy',
        subject: 'Physics',
        marks: 10
      },
      {
        id: 'phy-q5',
        text: 'Work done is zero when the force is:',
        options: ['Parallel to displacement', 'Perpendicular to displacement', 'Equal to displacement', 'Greater than displacement'],
        correctAnswer: 1,
        difficulty: 'medium',
        subject: 'Physics',
        marks: 10
      }
    ]
  }
];

// Sample Results
export const mockResults: ExamResult[] = [
  {
    attemptId: 'attempt-1',
    examId: 'exam-1',
    examTitle: 'Data Structures & Algorithms',
    studentId: 'student-1',
    studentName: 'Rahul Sharma',
    score: 80,
    totalMarks: 100,
    percentage: 80,
    grade: 'A',
    timeTaken: 2400,
    correctAnswers: 8,
    wrongAnswers: 1,
    unattempted: 1,
    submittedAt: '2024-01-16T10:30:00',
    subjectWiseAnalysis: [
      { subject: 'Algorithms', correct: 4, wrong: 1, total: 5, percentage: 80 },
      { subject: 'Data Structures', correct: 2, wrong: 0, total: 2, percentage: 100 },
      { subject: 'Trees', correct: 2, wrong: 0, total: 3, percentage: 66.67 }
    ]
  },
  {
    attemptId: 'attempt-2',
    examId: 'exam-2',
    examTitle: 'Database Management Systems',
    studentId: 'student-1',
    studentName: 'Rahul Sharma',
    score: 40,
    totalMarks: 50,
    percentage: 80,
    grade: 'A',
    timeTaken: 1800,
    correctAnswers: 4,
    wrongAnswers: 1,
    unattempted: 0,
    submittedAt: '2024-01-21T14:45:00',
    subjectWiseAnalysis: [
      { subject: 'SQL', correct: 2, wrong: 0, total: 2, percentage: 100 },
      { subject: 'Normalization', correct: 1, wrong: 0, total: 1, percentage: 100 },
      { subject: 'Database Design', correct: 1, wrong: 0, total: 1, percentage: 100 },
      { subject: 'Transactions', correct: 0, wrong: 1, total: 1, percentage: 0 }
    ]
  }
];

// Helper function to get grade from percentage
export const getGrade = (percentage: number): string => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
};
