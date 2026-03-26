-- =============================================
-- SUPABASE DATABASE SCHEMA
-- AI-Based Online Examination System
-- =============================================
-- 
-- HOW TO USE:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Copy this entire file
-- 3. Paste and click "Run"
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'admin', 'institute')),
    roll_number VARCHAR(50),
    phone VARCHAR(20),
    department VARCHAR(100),
    semester VARCHAR(20),
    profile_image TEXT,
    institute_name VARCHAR(255),
    institute_code VARCHAR(50),
    student_institute_code VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default admin and student
INSERT INTO users (email, password_hash, name, role, roll_number, phone, department, semester) VALUES
('admin@demo.com', 'admin123', 'Admin User', 'admin', 'ADMIN001', '9999999999', 'Administration', NULL),
('student@demo.com', 'student123', 'Demo Student', 'student', 'STU001', '8888888888', 'Computer Science', '6th'),
('institute@demo.com', 'institute123', 'Demo Institute', 'institute', NULL, NULL, 'Administration', NULL);

UPDATE users SET institute_name = 'Demo Institute of Technology', institute_code = 'DIT001' WHERE email = 'institute@demo.com';

-- =============================================
-- 2. EXAMS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS exams (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL DEFAULT 60,
    total_marks INTEGER NOT NULL DEFAULT 100,
    passing_marks INTEGER NOT NULL DEFAULT 40,
    class_level VARCHAR(50),
    category VARCHAR(20) DEFAULT 'school' CHECK (category IN ('school', 'college', 'competitive')),
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT false,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample exams
INSERT INTO exams (title, subject, description, duration, total_marks, passing_marks, class_level, category, is_active, is_public, start_time, end_time) VALUES
('Mathematics Basic Test', 'Mathematics', 'Basic mathematics test for Class 10', 30, 50, 20, 'Class 10', 'school', true, true, NOW(), NOW() + INTERVAL '30 days'),
('Physics Chapter 1 Test', 'Physics', 'Motion and Force concepts', 45, 100, 40, 'Class 12', 'school', true, false, NOW(), NOW() + INTERVAL '30 days'),
('Computer Science Fundamentals', 'Computer Science', 'Basic programming concepts', 60, 100, 40, 'College', 'college', true, true, NOW(), NOW() + INTERVAL '30 days');

-- =============================================
-- 3. QUESTIONS TABLE (Linked to Exams)
-- =============================================
CREATE TABLE IF NOT EXISTS questions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    option_a VARCHAR(500) NOT NULL,
    option_b VARCHAR(500) NOT NULL,
    option_c VARCHAR(500) NOT NULL,
    option_d VARCHAR(500) NOT NULL,
    correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
    marks INTEGER DEFAULT 1,
    subject VARCHAR(100),
    topic VARCHAR(100),
    difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample questions for Mathematics Test
INSERT INTO questions (exam_id, question_text, option_a, option_b, option_c, option_d, correct_answer, marks, subject, topic, difficulty)
SELECT id, 'What is 15 + 27?', '42', '40', '45', '38', 'A', 2, 'Mathematics', 'Arithmetic', 'easy'
FROM exams WHERE title = 'Mathematics Basic Test';

INSERT INTO questions (exam_id, question_text, option_a, option_b, option_c, option_d, correct_answer, marks, subject, topic, difficulty)
SELECT id, 'Solve: 5x = 25, find x', '3', '4', '5', '6', 'C', 2, 'Mathematics', 'Algebra', 'easy'
FROM exams WHERE title = 'Mathematics Basic Test';

INSERT INTO questions (exam_id, question_text, option_a, option_b, option_c, option_d, correct_answer, marks, subject, topic, difficulty)
SELECT id, 'What is the square root of 144?', '11', '12', '13', '14', 'B', 2, 'Mathematics', 'Arithmetic', 'easy'
FROM exams WHERE title = 'Mathematics Basic Test';

INSERT INTO questions (exam_id, question_text, option_a, option_b, option_c, option_d, correct_answer, marks, subject, topic, difficulty)
SELECT id, 'If a = 3 and b = 4, what is a² + b²?', '25', '24', '23', '26', 'A', 2, 'Mathematics', 'Algebra', 'medium'
FROM exams WHERE title = 'Mathematics Basic Test';

INSERT INTO questions (exam_id, question_text, option_a, option_b, option_c, option_d, correct_answer, marks, subject, topic, difficulty)
SELECT id, 'What is 20% of 150?', '25', '30', '35', '40', 'B', 2, 'Mathematics', 'Percentage', 'easy'
FROM exams WHERE title = 'Mathematics Basic Test';

-- =============================================
-- 4. QUESTION BANK TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS question_bank (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    question_text TEXT NOT NULL,
    option_a VARCHAR(500) NOT NULL,
    option_b VARCHAR(500) NOT NULL,
    option_c VARCHAR(500) NOT NULL,
    option_d VARCHAR(500) NOT NULL,
    correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
    subject VARCHAR(100) NOT NULL,
    topic VARCHAR(100),
    class_level VARCHAR(50),
    difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample questions to question bank
INSERT INTO question_bank (question_text, option_a, option_b, option_c, option_d, correct_answer, subject, topic, class_level, difficulty) VALUES
('What is the value of π (pi) approximately?', '3.14', '2.14', '4.14', '3.41', 'A', 'Mathematics', 'Geometry', 'Class 10', 'easy'),
('Which planet is known as the Red Planet?', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'B', 'Science', 'Solar System', 'Class 8', 'easy'),
('What is the chemical formula for water?', 'H2O', 'CO2', 'NaCl', 'O2', 'A', 'Chemistry', 'Basic Chemistry', 'Class 9', 'easy'),
('Who wrote "Romeo and Juliet"?', 'Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain', 'B', 'English', 'Literature', 'Class 10', 'easy'),
('What is the capital of India?', 'Mumbai', 'Kolkata', 'New Delhi', 'Chennai', 'C', 'General Knowledge', 'Geography', 'Class 6', 'easy'),
('Solve: 2x + 5 = 15', 'x = 4', 'x = 5', 'x = 6', 'x = 7', 'B', 'Mathematics', 'Algebra', 'Class 8', 'easy'),
('What is the SI unit of force?', 'Joule', 'Newton', 'Watt', 'Pascal', 'B', 'Physics', 'Mechanics', 'Class 11', 'easy'),
('Which gas do plants absorb from the atmosphere?', 'Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen', 'C', 'Biology', 'Photosynthesis', 'Class 7', 'easy'),
('What is 15% of 200?', '25', '30', '35', '40', 'B', 'Mathematics', 'Percentage', 'Class 7', 'easy'),
('Which is the largest ocean?', 'Atlantic', 'Indian', 'Pacific', 'Arctic', 'C', 'General Knowledge', 'Geography', 'Class 6', 'easy');

-- =============================================
-- 5. EXAM ATTEMPTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS exam_attempts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    score DECIMAL(5,2),
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER DEFAULT 0,
    wrong_answers INTEGER DEFAULT 0,
    unanswered INTEGER DEFAULT 0,
    violation_count INTEGER DEFAULT 0,
    is_terminated BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'terminated')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 6. STUDENT ANSWERS TABLE (with question details for review)
-- =============================================
CREATE TABLE IF NOT EXISTS student_answers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    attempt_id UUID REFERENCES exam_attempts(id) ON DELETE CASCADE,
    question_id TEXT,
    question_text TEXT,
    option_a TEXT,
    option_b TEXT,
    option_c TEXT,
    option_d TEXT,
    correct_answer CHAR(1),
    selected_answer CHAR(1),
    is_correct BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 7. EMAIL LOGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    subject VARCHAR(500) NOT NULL,
    message TEXT,
    email_type VARCHAR(50) CHECK (email_type IN ('exam_confirmation', 'result_notification', 'welcome')),
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'simulated')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 8. VIOLATION LOGS TABLE (with severity)
-- =============================================
CREATE TABLE IF NOT EXISTS violation_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    attempt_id UUID REFERENCES exam_attempts(id) ON DELETE CASCADE,
    violation_type VARCHAR(100) NOT NULL,
    violation_message TEXT,
    severity VARCHAR(20) DEFAULT 'HIGH' CHECK (severity IN ('HIGH', 'MEDIUM', 'LOW')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 9. ENABLE ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE violation_logs ENABLE ROW LEVEL SECURITY;

-- Create policies (Allow all for now - adjust for production)
CREATE POLICY "Allow all for users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all for exams" ON exams FOR ALL USING (true);
CREATE POLICY "Allow all for questions" ON questions FOR ALL USING (true);
CREATE POLICY "Allow all for question_bank" ON question_bank FOR ALL USING (true);
CREATE POLICY "Allow all for exam_attempts" ON exam_attempts FOR ALL USING (true);
CREATE POLICY "Allow all for student_answers" ON student_answers FOR ALL USING (true);
CREATE POLICY "Allow all for email_logs" ON email_logs FOR ALL USING (true);
CREATE POLICY "Allow all for violation_logs" ON violation_logs FOR ALL USING (true);

-- =============================================
-- DONE! Database is ready.
-- =============================================
