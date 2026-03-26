-- =============================================
-- AI-BASED ONLINE EXAMINATION SYSTEM
-- Database Schema for MySQL (XAMPP)
-- =============================================

-- Create Database
CREATE DATABASE IF NOT EXISTS exam_system;
USE exam_system;

-- =============================================
-- 1. USERS TABLE (Students & Admins)
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'admin') DEFAULT 'student',
    phone VARCHAR(15),
    roll_number VARCHAR(50),
    department VARCHAR(100),
    semester VARCHAR(20),
    profile_image TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- 2. EXAMS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100) NOT NULL,
    class_name VARCHAR(50),
    category ENUM('school', 'college', 'competitive') DEFAULT 'school',
    duration INT NOT NULL COMMENT 'Duration in minutes',
    total_marks INT DEFAULT 0,
    passing_marks INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_public BOOLEAN DEFAULT FALSE COMMENT 'Can be attempted without login',
    start_time DATETIME,
    end_time DATETIME,
    instructions TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================
-- 3. QUESTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    question_text TEXT NOT NULL,
    option_a VARCHAR(500) NOT NULL,
    option_b VARCHAR(500) NOT NULL,
    option_c VARCHAR(500),
    option_d VARCHAR(500),
    correct_answer ENUM('A', 'B', 'C', 'D') NOT NULL,
    marks INT DEFAULT 1,
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    subject VARCHAR(100),
    topic VARCHAR(100),
    explanation TEXT,
    question_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
);

-- =============================================
-- 4. EXAM ATTEMPTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS exam_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    user_id INT,
    guest_name VARCHAR(100),
    guest_email VARCHAR(100),
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    time_taken INT COMMENT 'Time taken in seconds',
    total_questions INT DEFAULT 0,
    attempted_questions INT DEFAULT 0,
    correct_answers INT DEFAULT 0,
    wrong_answers INT DEFAULT 0,
    score DECIMAL(5,2) DEFAULT 0,
    percentage DECIMAL(5,2) DEFAULT 0,
    status ENUM('in_progress', 'completed', 'terminated') DEFAULT 'in_progress',
    is_passed BOOLEAN DEFAULT FALSE,
    violations INT DEFAULT 0,
    violation_details TEXT,
    auto_submitted BOOLEAN DEFAULT FALSE,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================
-- 5. STUDENT ANSWERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS student_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT NOT NULL,
    question_id INT NOT NULL,
    selected_answer ENUM('A', 'B', 'C', 'D'),
    is_correct BOOLEAN DEFAULT FALSE,
    is_marked_review BOOLEAN DEFAULT FALSE,
    time_spent INT DEFAULT 0 COMMENT 'Time spent in seconds',
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (attempt_id) REFERENCES exam_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- =============================================
-- 6. EMAIL LOGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS email_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipient_email VARCHAR(100) NOT NULL,
    recipient_name VARCHAR(100),
    subject VARCHAR(255) NOT NULL,
    message TEXT,
    email_type ENUM('exam_confirmation', 'result_notification', 'registration', 'other') DEFAULT 'other',
    status ENUM('sent', 'failed', 'pending') DEFAULT 'pending',
    error_message TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 7. VIOLATION LOGS TABLE (Anti-Cheating)
-- =============================================
CREATE TABLE IF NOT EXISTS violation_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT NOT NULL,
    violation_type ENUM('tab_switch', 'fullscreen_exit', 'copy_paste', 'right_click', 'devtools', 'screenshot', 'other') NOT NULL,
    violation_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details TEXT,
    FOREIGN KEY (attempt_id) REFERENCES exam_attempts(id) ON DELETE CASCADE
);

-- =============================================
-- 8. SUBJECTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 9. TOPICS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS topics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    class_name VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- =============================================
-- INSERT DEFAULT DATA
-- =============================================

-- Insert Admin User (Password: admin123)
INSERT INTO users (name, email, password, role, phone) VALUES
('Admin', 'admin@demo.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', '9999999999');

-- Insert Demo Student (Password: student123)
INSERT INTO users (name, email, password, role, phone, roll_number, department, semester) VALUES
('Demo Student', 'student@demo.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', '9876543210', 'STU001', 'Computer Science', '6th');

-- Insert Subjects
INSERT INTO subjects (name, code, description) VALUES
('Mathematics', 'MATH', 'Mathematics subject'),
('Physics', 'PHY', 'Physics subject'),
('Chemistry', 'CHEM', 'Chemistry subject'),
('Biology', 'BIO', 'Biology subject'),
('Computer Science', 'CS', 'Computer Science subject'),
('English', 'ENG', 'English subject'),
('General Knowledge', 'GK', 'General Knowledge');

-- Insert Topics for Mathematics
INSERT INTO topics (subject_id, name, class_name) VALUES
(1, 'Algebra', 'Class 10'),
(1, 'Algebra', 'Class 12'),
(1, 'Trigonometry', 'Class 10'),
(1, 'Trigonometry', 'Class 12'),
(1, 'Calculus', 'Class 12'),
(1, 'Geometry', 'Class 10'),
(1, 'Statistics', 'Class 12');

-- Insert Topics for Physics
INSERT INTO topics (subject_id, name, class_name) VALUES
(2, 'Mechanics', 'Class 11'),
(2, 'Mechanics', 'Class 12'),
(2, 'Electricity', 'Class 12'),
(2, 'Optics', 'Class 12'),
(2, 'Thermodynamics', 'Class 11');

-- Insert Topics for Computer Science
INSERT INTO topics (subject_id, name, class_name) VALUES
(5, 'Programming Basics', 'Class 11'),
(5, 'Data Structures', 'Class 12'),
(5, 'Database', 'College'),
(5, 'Networking', 'College');

-- Insert Sample Exam
INSERT INTO exams (title, description, subject, class_name, category, duration, total_marks, passing_marks, is_active, is_public, start_time, end_time, created_by) VALUES
('Mathematics Class 10 Test', 'Basic mathematics test covering algebra and geometry', 'Mathematics', 'Class 10', 'school', 30, 50, 20, TRUE, TRUE, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), 1),
('Physics Class 12 Test', 'Physics test covering mechanics and electricity', 'Physics', 'Class 12', 'school', 45, 100, 40, TRUE, FALSE, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), 1),
('Computer Science Basics', 'Programming fundamentals test', 'Computer Science', 'Class 11', 'school', 30, 50, 20, TRUE, TRUE, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), 1);

-- Insert Sample Questions for Exam 1
INSERT INTO questions (exam_id, question_text, option_a, option_b, option_c, option_d, correct_answer, marks, difficulty, subject, topic) VALUES
(1, 'Solve: 2x + 5 = 15. Find x.', '3', '5', '7', '10', 'B', 2, 'easy', 'Mathematics', 'Algebra'),
(1, 'What is the value of (a+b)² - (a-b)²?', '2ab', '4ab', 'a² + b²', '2a² + 2b²', 'B', 2, 'medium', 'Mathematics', 'Algebra'),
(1, 'Find the roots of x² - 5x + 6 = 0', 'x = 2, 3', 'x = 1, 6', 'x = -2, -3', 'x = 2, -3', 'A', 2, 'medium', 'Mathematics', 'Algebra'),
(1, 'The sum of angles in a triangle is:', '90°', '180°', '270°', '360°', 'B', 2, 'easy', 'Mathematics', 'Geometry'),
(1, 'Area of a circle with radius r is:', 'πr', '2πr', 'πr²', '2πr²', 'C', 2, 'easy', 'Mathematics', 'Geometry');

-- Insert Sample Questions for Exam 2
INSERT INTO questions (exam_id, question_text, option_a, option_b, option_c, option_d, correct_answer, marks, difficulty, subject, topic) VALUES
(2, 'The SI unit of force is:', 'Joule', 'Newton', 'Watt', 'Pascal', 'B', 2, 'easy', 'Physics', 'Mechanics'),
(2, 'Acceleration due to gravity on Earth is approximately:', '8.9 m/s²', '9.8 m/s²', '10.8 m/s²', '11.8 m/s²', 'B', 2, 'easy', 'Physics', 'Mechanics'),
(2, 'Ohm''s law states that V = ?', 'I/R', 'IR', 'R/I', 'I + R', 'B', 2, 'easy', 'Physics', 'Electricity'),
(2, 'The unit of electric current is:', 'Volt', 'Ohm', 'Ampere', 'Watt', 'C', 2, 'easy', 'Physics', 'Electricity'),
(2, 'Power is defined as:', 'Work × Time', 'Work / Time', 'Force × Time', 'Force / Time', 'B', 2, 'medium', 'Physics', 'Mechanics');

-- Insert Sample Questions for Exam 3
INSERT INTO questions (exam_id, question_text, option_a, option_b, option_c, option_d, correct_answer, marks, difficulty, subject, topic) VALUES
(3, 'Which is a valid variable name in most programming languages?', '2variable', 'my-var', 'my_var', 'my var', 'C', 2, 'easy', 'Computer Science', 'Programming'),
(3, 'What is the output of: print(2 + 3 * 4)?', '20', '14', '24', '11', 'B', 2, 'easy', 'Computer Science', 'Programming'),
(3, 'Which data structure uses LIFO?', 'Queue', 'Stack', 'Array', 'Linked List', 'B', 2, 'medium', 'Computer Science', 'Data Structures'),
(3, 'SQL stands for:', 'Structured Query Language', 'Simple Query Language', 'Standard Query Language', 'Sequential Query Language', 'A', 2, 'easy', 'Computer Science', 'Database'),
(3, 'Which is not a programming language?', 'Python', 'Java', 'HTML', 'C++', 'C', 2, 'easy', 'Computer Science', 'Programming');

-- =============================================
-- USEFUL VIEWS
-- =============================================

-- View: Exam with question count
CREATE OR REPLACE VIEW exam_summary AS
SELECT 
    e.*,
    COUNT(q.id) as question_count,
    SUM(q.marks) as calculated_total_marks,
    u.name as created_by_name
FROM exams e
LEFT JOIN questions q ON e.id = q.exam_id
LEFT JOIN users u ON e.created_by = u.id
GROUP BY e.id;

-- View: Student Results
CREATE OR REPLACE VIEW student_results AS
SELECT 
    ea.*,
    e.title as exam_title,
    e.subject,
    e.total_marks,
    e.passing_marks,
    u.name as student_name,
    u.email as student_email,
    u.roll_number
FROM exam_attempts ea
JOIN exams e ON ea.exam_id = e.id
LEFT JOIN users u ON ea.user_id = u.id;

-- =============================================
-- INDEXES FOR BETTER PERFORMANCE
-- =============================================
CREATE INDEX idx_exams_active ON exams(is_active);
CREATE INDEX idx_exams_schedule ON exams(start_time, end_time);
CREATE INDEX idx_questions_exam ON questions(exam_id);
CREATE INDEX idx_attempts_user ON exam_attempts(user_id);
CREATE INDEX idx_attempts_exam ON exam_attempts(exam_id);
CREATE INDEX idx_answers_attempt ON student_answers(attempt_id);

-- =============================================
-- END OF SCHEMA
-- =============================================
