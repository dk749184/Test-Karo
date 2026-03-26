<?php
/**
 * Exams API
 * Handles: CRUD operations for exams
 */

require_once 'config.php';

$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';
$examId = isset($_GET['id']) ? intval($_GET['id']) : 0;

switch ($method) {
    case 'GET':
        if ($action === 'public') {
            getPublicExams($conn);
        } elseif ($action === 'active') {
            getActiveExams($conn);
        } elseif ($action === 'all') {
            getAllExams($conn);
        } elseif ($examId > 0) {
            getExamById($conn, $examId);
        } else {
            getExamsForUser($conn);
        }
        break;
    case 'POST':
        if ($action === 'create') {
            createExam($conn);
        } elseif ($action === 'toggle-status') {
            toggleExamStatus($conn, $examId);
        } elseif ($action === 'toggle-public') {
            toggleExamPublic($conn, $examId);
        } elseif ($action === 'update-schedule') {
            updateExamSchedule($conn, $examId);
        }
        break;
    case 'PUT':
        updateExam($conn, $examId);
        break;
    case 'DELETE':
        deleteExam($conn, $examId);
        break;
    default:
        sendError('Method not allowed', 405);
}

/**
 * Get Public Exams (No login required)
 */
function getPublicExams($conn) {
    $sql = "SELECT e.*, 
                   COUNT(q.id) as question_count,
                   u.name as created_by_name
            FROM exams e
            LEFT JOIN questions q ON e.id = q.exam_id
            LEFT JOIN users u ON e.created_by = u.id
            WHERE e.is_active = 1 
            AND e.start_time <= NOW() 
            AND e.end_time >= NOW()
            GROUP BY e.id
            ORDER BY e.created_at DESC";
    
    $result = $conn->query($sql);
    $exams = [];
    
    while ($row = $result->fetch_assoc()) {
        $row['is_public'] = (bool)$row['is_public'];
        $row['is_active'] = (bool)$row['is_active'];
        $exams[] = $row;
    }
    
    sendResponse($exams);
}

/**
 * Get Active Exams for Student
 */
function getActiveExams($conn) {
    $sql = "SELECT e.*, 
                   COUNT(q.id) as question_count,
                   u.name as created_by_name
            FROM exams e
            LEFT JOIN questions q ON e.id = q.exam_id
            LEFT JOIN users u ON e.created_by = u.id
            WHERE e.is_active = 1 
            AND e.start_time <= NOW() 
            AND e.end_time >= NOW()
            GROUP BY e.id
            ORDER BY e.start_time ASC";
    
    $result = $conn->query($sql);
    $exams = [];
    
    while ($row = $result->fetch_assoc()) {
        $row['is_public'] = (bool)$row['is_public'];
        $row['is_active'] = (bool)$row['is_active'];
        $exams[] = $row;
    }
    
    sendResponse($exams);
}

/**
 * Get All Exams (Admin only)
 */
function getAllExams($conn) {
    requireAdmin();
    
    $sql = "SELECT e.*, 
                   COUNT(q.id) as question_count,
                   u.name as created_by_name,
                   (SELECT COUNT(*) FROM exam_attempts WHERE exam_id = e.id) as attempt_count
            FROM exams e
            LEFT JOIN questions q ON e.id = q.exam_id
            LEFT JOIN users u ON e.created_by = u.id
            GROUP BY e.id
            ORDER BY e.created_at DESC";
    
    $result = $conn->query($sql);
    $exams = [];
    
    while ($row = $result->fetch_assoc()) {
        $row['is_public'] = (bool)$row['is_public'];
        $row['is_active'] = (bool)$row['is_active'];
        $exams[] = $row;
    }
    
    sendResponse($exams);
}

/**
 * Get Exams for Current User
 */
function getExamsForUser($conn) {
    $user = requireAuth();
    
    if ($user['role'] === 'admin') {
        getAllExams($conn);
    } else {
        getActiveExams($conn);
    }
}

/**
 * Get Single Exam by ID
 */
function getExamById($conn, $examId) {
    $sql = "SELECT e.*, 
                   COUNT(q.id) as question_count,
                   u.name as created_by_name
            FROM exams e
            LEFT JOIN questions q ON e.id = q.exam_id
            LEFT JOIN users u ON e.created_by = u.id
            WHERE e.id = ?
            GROUP BY e.id";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $examId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        sendError('Exam not found', 404);
    }
    
    $exam = $result->fetch_assoc();
    $exam['is_public'] = (bool)$exam['is_public'];
    $exam['is_active'] = (bool)$exam['is_active'];
    
    // Get questions
    $questionsSql = "SELECT * FROM questions WHERE exam_id = ? ORDER BY question_order ASC";
    $questionsStmt = $conn->prepare($questionsSql);
    $questionsStmt->bind_param("i", $examId);
    $questionsStmt->execute();
    $questionsResult = $questionsStmt->get_result();
    
    $questions = [];
    while ($q = $questionsResult->fetch_assoc()) {
        $questions[] = [
            'id' => $q['id'],
            'question' => $q['question_text'],
            'options' => [$q['option_a'], $q['option_b'], $q['option_c'], $q['option_d']],
            'correctAnswer' => array_search($q['correct_answer'], ['A', 'B', 'C', 'D']),
            'marks' => $q['marks'],
            'difficulty' => $q['difficulty'],
            'subject' => $q['subject'],
            'topic' => $q['topic'],
            'explanation' => $q['explanation']
        ];
    }
    
    $exam['questions'] = $questions;
    
    sendResponse($exam);
}

/**
 * Create New Exam
 */
function createExam($conn) {
    $user = requireAdmin();
    $data = getJSONInput();
    
    // Validate required fields
    $required = ['title', 'subject', 'duration'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            sendError("$field is required");
        }
    }
    
    $title = sanitize($conn, $data['title']);
    $description = sanitize($conn, $data['description'] ?? '');
    $subject = sanitize($conn, $data['subject']);
    $className = sanitize($conn, $data['class'] ?? $data['class_name'] ?? '');
    $category = sanitize($conn, $data['category'] ?? 'school');
    $duration = intval($data['duration']);
    $totalMarks = intval($data['totalMarks'] ?? $data['total_marks'] ?? 0);
    $passingMarks = intval($data['passingMarks'] ?? $data['passing_marks'] ?? 0);
    $isActive = isset($data['isActive']) ? ($data['isActive'] ? 1 : 0) : 1;
    $isPublic = isset($data['isPublic']) ? ($data['isPublic'] ? 1 : 0) : 0;
    $startTime = $data['startTime'] ?? $data['start_time'] ?? date('Y-m-d H:i:s');
    $endTime = $data['endTime'] ?? $data['end_time'] ?? date('Y-m-d H:i:s', strtotime('+7 days'));
    $instructions = sanitize($conn, $data['instructions'] ?? '');
    
    // Insert exam
    $sql = "INSERT INTO exams (title, description, subject, class_name, category, duration, 
            total_marks, passing_marks, is_active, is_public, start_time, end_time, instructions, created_by) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sssssiiiiisssi", $title, $description, $subject, $className, $category, 
                      $duration, $totalMarks, $passingMarks, $isActive, $isPublic, $startTime, $endTime, 
                      $instructions, $user['user_id']);
    
    if (!$stmt->execute()) {
        sendError('Failed to create exam: ' . $conn->error);
    }
    
    $examId = $conn->insert_id;
    
    // Insert questions if provided
    if (!empty($data['questions']) && is_array($data['questions'])) {
        $questionOrder = 0;
        foreach ($data['questions'] as $q) {
            $questionText = sanitize($conn, $q['question'] ?? $q['question_text'] ?? '');
            $options = $q['options'] ?? [$q['option_a'] ?? '', $q['option_b'] ?? '', $q['option_c'] ?? '', $q['option_d'] ?? ''];
            $optionA = sanitize($conn, $options[0] ?? '');
            $optionB = sanitize($conn, $options[1] ?? '');
            $optionC = sanitize($conn, $options[2] ?? '');
            $optionD = sanitize($conn, $options[3] ?? '');
            
            // Convert correctAnswer index to letter
            $correctIndex = $q['correctAnswer'] ?? $q['correct_answer'] ?? 0;
            if (is_numeric($correctIndex)) {
                $correctAnswer = ['A', 'B', 'C', 'D'][$correctIndex] ?? 'A';
            } else {
                $correctAnswer = strtoupper($correctIndex);
            }
            
            $marks = intval($q['marks'] ?? 1);
            $difficulty = sanitize($conn, $q['difficulty'] ?? 'medium');
            $qSubject = sanitize($conn, $q['subject'] ?? $subject);
            $topic = sanitize($conn, $q['topic'] ?? '');
            $explanation = sanitize($conn, $q['explanation'] ?? '');
            
            $qSql = "INSERT INTO questions (exam_id, question_text, option_a, option_b, option_c, option_d, 
                     correct_answer, marks, difficulty, subject, topic, explanation, question_order) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            
            $qStmt = $conn->prepare($qSql);
            $qStmt->bind_param("issssssississi", $examId, $questionText, $optionA, $optionB, $optionC, $optionD,
                              $correctAnswer, $marks, $difficulty, $qSubject, $topic, $explanation, $questionOrder);
            $qStmt->execute();
            $questionOrder++;
        }
        
        // Update total marks
        $updateMarksSql = "UPDATE exams SET total_marks = (SELECT SUM(marks) FROM questions WHERE exam_id = ?) WHERE id = ?";
        $updateStmt = $conn->prepare($updateMarksSql);
        $updateStmt->bind_param("ii", $examId, $examId);
        $updateStmt->execute();
    }
    
    sendResponse([
        'id' => $examId,
        'message' => 'Exam created successfully'
    ], 201);
}

/**
 * Update Exam
 */
function updateExam($conn, $examId) {
    $user = requireAdmin();
    $data = getJSONInput();
    
    if ($examId <= 0) {
        sendError('Invalid exam ID');
    }
    
    $fields = [];
    $params = [];
    $types = '';
    
    if (isset($data['title'])) {
        $fields[] = 'title = ?';
        $params[] = sanitize($conn, $data['title']);
        $types .= 's';
    }
    if (isset($data['description'])) {
        $fields[] = 'description = ?';
        $params[] = sanitize($conn, $data['description']);
        $types .= 's';
    }
    if (isset($data['subject'])) {
        $fields[] = 'subject = ?';
        $params[] = sanitize($conn, $data['subject']);
        $types .= 's';
    }
    if (isset($data['duration'])) {
        $fields[] = 'duration = ?';
        $params[] = intval($data['duration']);
        $types .= 'i';
    }
    if (isset($data['isActive'])) {
        $fields[] = 'is_active = ?';
        $params[] = $data['isActive'] ? 1 : 0;
        $types .= 'i';
    }
    if (isset($data['isPublic'])) {
        $fields[] = 'is_public = ?';
        $params[] = $data['isPublic'] ? 1 : 0;
        $types .= 'i';
    }
    if (isset($data['startTime'])) {
        $fields[] = 'start_time = ?';
        $params[] = $data['startTime'];
        $types .= 's';
    }
    if (isset($data['endTime'])) {
        $fields[] = 'end_time = ?';
        $params[] = $data['endTime'];
        $types .= 's';
    }
    
    if (empty($fields)) {
        sendError('No fields to update');
    }
    
    $fields[] = 'updated_at = NOW()';
    $params[] = $examId;
    $types .= 'i';
    
    $sql = "UPDATE exams SET " . implode(', ', $fields) . " WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$params);
    
    if ($stmt->execute()) {
        sendResponse(['message' => 'Exam updated successfully']);
    } else {
        sendError('Failed to update exam');
    }
}

/**
 * Toggle Exam Active Status
 */
function toggleExamStatus($conn, $examId) {
    requireAdmin();
    
    if ($examId <= 0) {
        sendError('Invalid exam ID');
    }
    
    $sql = "UPDATE exams SET is_active = NOT is_active, updated_at = NOW() WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $examId);
    
    if ($stmt->execute()) {
        // Get new status
        $statusSql = "SELECT is_active FROM exams WHERE id = ?";
        $statusStmt = $conn->prepare($statusSql);
        $statusStmt->bind_param("i", $examId);
        $statusStmt->execute();
        $result = $statusStmt->get_result();
        $exam = $result->fetch_assoc();
        
        sendResponse([
            'message' => 'Exam status updated',
            'is_active' => (bool)$exam['is_active']
        ]);
    } else {
        sendError('Failed to update exam status');
    }
}

/**
 * Toggle Exam Public/Private
 */
function toggleExamPublic($conn, $examId) {
    requireAdmin();
    
    if ($examId <= 0) {
        sendError('Invalid exam ID');
    }
    
    $sql = "UPDATE exams SET is_public = NOT is_public, updated_at = NOW() WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $examId);
    
    if ($stmt->execute()) {
        // Get new status
        $statusSql = "SELECT is_public FROM exams WHERE id = ?";
        $statusStmt = $conn->prepare($statusSql);
        $statusStmt->bind_param("i", $examId);
        $statusStmt->execute();
        $result = $statusStmt->get_result();
        $exam = $result->fetch_assoc();
        
        sendResponse([
            'message' => 'Exam visibility updated',
            'is_public' => (bool)$exam['is_public']
        ]);
    } else {
        sendError('Failed to update exam visibility');
    }
}

/**
 * Update Exam Schedule
 */
function updateExamSchedule($conn, $examId) {
    requireAdmin();
    $data = getJSONInput();
    
    if ($examId <= 0) {
        sendError('Invalid exam ID');
    }
    
    $startTime = $data['startTime'] ?? $data['start_time'] ?? null;
    $endTime = $data['endTime'] ?? $data['end_time'] ?? null;
    
    if (!$startTime || !$endTime) {
        sendError('Start time and end time are required');
    }
    
    $sql = "UPDATE exams SET start_time = ?, end_time = ?, updated_at = NOW() WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ssi", $startTime, $endTime, $examId);
    
    if ($stmt->execute()) {
        sendResponse(['message' => 'Exam schedule updated successfully']);
    } else {
        sendError('Failed to update schedule');
    }
}

/**
 * Delete Exam
 */
function deleteExam($conn, $examId) {
    requireAdmin();
    
    if ($examId <= 0) {
        sendError('Invalid exam ID');
    }
    
    $sql = "DELETE FROM exams WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $examId);
    
    if ($stmt->execute()) {
        sendResponse(['message' => 'Exam deleted successfully']);
    } else {
        sendError('Failed to delete exam');
    }
}

$conn->close();
?>
