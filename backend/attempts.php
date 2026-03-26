<?php
/**
 * Exam Attempts API
 * Handles: Starting exam, submitting answers, getting results
 */

require_once 'config.php';

$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';
$attemptId = isset($_GET['id']) ? intval($_GET['id']) : 0;

switch ($action) {
    case 'start':
        startExam($conn);
        break;
    case 'submit':
        submitExam($conn);
        break;
    case 'save-answer':
        saveAnswer($conn);
        break;
    case 'result':
        getResult($conn, $attemptId);
        break;
    case 'my-results':
        getMyResults($conn);
        break;
    case 'all-results':
        getAllResults($conn);
        break;
    case 'violation':
        recordViolation($conn);
        break;
    case 'guest-start':
        startGuestExam($conn);
        break;
    case 'guest-submit':
        submitGuestExam($conn);
        break;
    default:
        sendError('Invalid action', 400);
}

/**
 * Start Exam (Logged in user)
 */
function startExam($conn) {
    $user = requireAuth();
    $data = getJSONInput();
    
    $examId = intval($data['exam_id'] ?? $data['examId'] ?? 0);
    
    if ($examId <= 0) {
        sendError('Invalid exam ID');
    }
    
    // Check if exam exists and is active
    $examSql = "SELECT * FROM exams WHERE id = ? AND is_active = 1";
    $examStmt = $conn->prepare($examSql);
    $examStmt->bind_param("i", $examId);
    $examStmt->execute();
    $examResult = $examStmt->get_result();
    
    if ($examResult->num_rows === 0) {
        sendError('Exam not found or not active', 404);
    }
    
    $exam = $examResult->fetch_assoc();
    
    // Check schedule
    $now = date('Y-m-d H:i:s');
    if ($now < $exam['start_time']) {
        sendError('Exam has not started yet');
    }
    if ($now > $exam['end_time']) {
        sendError('Exam has ended');
    }
    
    // Check if already attempted
    $checkSql = "SELECT id FROM exam_attempts WHERE exam_id = ? AND user_id = ? AND status = 'completed'";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bind_param("ii", $examId, $user['user_id']);
    $checkStmt->execute();
    if ($checkStmt->get_result()->num_rows > 0) {
        sendError('You have already attempted this exam');
    }
    
    // Check for in-progress attempt
    $inProgressSql = "SELECT id FROM exam_attempts WHERE exam_id = ? AND user_id = ? AND status = 'in_progress'";
    $inProgressStmt = $conn->prepare($inProgressSql);
    $inProgressStmt->bind_param("ii", $examId, $user['user_id']);
    $inProgressStmt->execute();
    $inProgressResult = $inProgressStmt->get_result();
    
    if ($inProgressResult->num_rows > 0) {
        // Return existing attempt
        $existingAttempt = $inProgressResult->fetch_assoc();
        $attemptId = $existingAttempt['id'];
    } else {
        // Create new attempt
        $ipAddress = $_SERVER['REMOTE_ADDR'] ?? '';
        $questionCount = 0;
        
        // Get question count
        $qCountSql = "SELECT COUNT(*) as count FROM questions WHERE exam_id = ?";
        $qCountStmt = $conn->prepare($qCountSql);
        $qCountStmt->bind_param("i", $examId);
        $qCountStmt->execute();
        $qCountResult = $qCountStmt->get_result();
        $questionCount = $qCountResult->fetch_assoc()['count'];
        
        $insertSql = "INSERT INTO exam_attempts (exam_id, user_id, start_time, total_questions, ip_address) 
                      VALUES (?, ?, NOW(), ?, ?)";
        $insertStmt = $conn->prepare($insertSql);
        $insertStmt->bind_param("iiis", $examId, $user['user_id'], $questionCount, $ipAddress);
        
        if (!$insertStmt->execute()) {
            sendError('Failed to start exam');
        }
        
        $attemptId = $conn->insert_id;
    }
    
    // Get questions (randomized)
    $questionsSql = "SELECT id, question_text, option_a, option_b, option_c, option_d, marks 
                     FROM questions WHERE exam_id = ? ORDER BY RAND()";
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
            'marks' => $q['marks']
        ];
    }
    
    sendResponse([
        'attempt_id' => $attemptId,
        'exam' => [
            'id' => $exam['id'],
            'title' => $exam['title'],
            'duration' => $exam['duration'],
            'total_marks' => $exam['total_marks'],
            'instructions' => $exam['instructions']
        ],
        'questions' => $questions
    ]);
}

/**
 * Start Guest Exam (Public exams, no login required)
 */
function startGuestExam($conn) {
    $data = getJSONInput();
    
    $examId = intval($data['exam_id'] ?? $data['examId'] ?? 0);
    $guestName = sanitize($conn, $data['name'] ?? '');
    $guestEmail = sanitize($conn, $data['email'] ?? '');
    
    if ($examId <= 0) {
        sendError('Invalid exam ID');
    }
    
    if (empty($guestName) || empty($guestEmail)) {
        sendError('Name and email are required');
    }
    
    // Check if exam exists, is active, and is public
    $examSql = "SELECT * FROM exams WHERE id = ? AND is_active = 1 AND is_public = 1";
    $examStmt = $conn->prepare($examSql);
    $examStmt->bind_param("i", $examId);
    $examStmt->execute();
    $examResult = $examStmt->get_result();
    
    if ($examResult->num_rows === 0) {
        sendError('Exam not found or not available for guests', 404);
    }
    
    $exam = $examResult->fetch_assoc();
    
    // Check schedule
    $now = date('Y-m-d H:i:s');
    if ($now < $exam['start_time'] || $now > $exam['end_time']) {
        sendError('Exam is not currently available');
    }
    
    // Get question count
    $qCountSql = "SELECT COUNT(*) as count FROM questions WHERE exam_id = ?";
    $qCountStmt = $conn->prepare($qCountSql);
    $qCountStmt->bind_param("i", $examId);
    $qCountStmt->execute();
    $questionCount = $qCountStmt->get_result()->fetch_assoc()['count'];
    
    // Create attempt
    $ipAddress = $_SERVER['REMOTE_ADDR'] ?? '';
    $insertSql = "INSERT INTO exam_attempts (exam_id, guest_name, guest_email, start_time, total_questions, ip_address) 
                  VALUES (?, ?, ?, NOW(), ?, ?)";
    $insertStmt = $conn->prepare($insertSql);
    $insertStmt->bind_param("issis", $examId, $guestName, $guestEmail, $questionCount, $ipAddress);
    
    if (!$insertStmt->execute()) {
        sendError('Failed to start exam');
    }
    
    $attemptId = $conn->insert_id;
    
    // Get questions (randomized)
    $questionsSql = "SELECT id, question_text, option_a, option_b, option_c, option_d, marks 
                     FROM questions WHERE exam_id = ? ORDER BY RAND()";
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
            'marks' => $q['marks']
        ];
    }
    
    sendResponse([
        'attempt_id' => $attemptId,
        'exam' => [
            'id' => $exam['id'],
            'title' => $exam['title'],
            'duration' => $exam['duration'],
            'total_marks' => $exam['total_marks'],
            'instructions' => $exam['instructions']
        ],
        'questions' => $questions
    ]);
}

/**
 * Save Single Answer
 */
function saveAnswer($conn) {
    $data = getJSONInput();
    
    $attemptId = intval($data['attempt_id'] ?? $data['attemptId'] ?? 0);
    $questionId = intval($data['question_id'] ?? $data['questionId'] ?? 0);
    $selectedAnswer = strtoupper($data['answer'] ?? '');
    $isMarkedReview = isset($data['marked_review']) ? ($data['marked_review'] ? 1 : 0) : 0;
    
    if ($attemptId <= 0 || $questionId <= 0) {
        sendError('Invalid attempt or question ID');
    }
    
    if (!in_array($selectedAnswer, ['A', 'B', 'C', 'D', ''])) {
        sendError('Invalid answer');
    }
    
    // Get correct answer
    $correctSql = "SELECT correct_answer FROM questions WHERE id = ?";
    $correctStmt = $conn->prepare($correctSql);
    $correctStmt->bind_param("i", $questionId);
    $correctStmt->execute();
    $correctResult = $correctStmt->get_result();
    
    if ($correctResult->num_rows === 0) {
        sendError('Question not found');
    }
    
    $correctAnswer = $correctResult->fetch_assoc()['correct_answer'];
    $isCorrect = ($selectedAnswer === $correctAnswer) ? 1 : 0;
    
    // Check if answer already exists
    $checkSql = "SELECT id FROM student_answers WHERE attempt_id = ? AND question_id = ?";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bind_param("ii", $attemptId, $questionId);
    $checkStmt->execute();
    $existing = $checkStmt->get_result();
    
    if ($existing->num_rows > 0) {
        // Update existing answer
        $updateSql = "UPDATE student_answers SET selected_answer = ?, is_correct = ?, is_marked_review = ?, answered_at = NOW() 
                      WHERE attempt_id = ? AND question_id = ?";
        $updateStmt = $conn->prepare($updateSql);
        $updateStmt->bind_param("siiii", $selectedAnswer, $isCorrect, $isMarkedReview, $attemptId, $questionId);
        $updateStmt->execute();
    } else {
        // Insert new answer
        $insertSql = "INSERT INTO student_answers (attempt_id, question_id, selected_answer, is_correct, is_marked_review) 
                      VALUES (?, ?, ?, ?, ?)";
        $insertStmt = $conn->prepare($insertSql);
        $insertStmt->bind_param("iisii", $attemptId, $questionId, $selectedAnswer, $isCorrect, $isMarkedReview);
        $insertStmt->execute();
    }
    
    sendResponse(['message' => 'Answer saved']);
}

/**
 * Submit Exam (Logged in user)
 */
function submitExam($conn) {
    $user = requireAuth();
    $data = getJSONInput();
    
    $attemptId = intval($data['attempt_id'] ?? $data['attemptId'] ?? 0);
    $answers = $data['answers'] ?? [];
    $violations = intval($data['violations'] ?? 0);
    $autoSubmitted = isset($data['auto_submitted']) ? ($data['auto_submitted'] ? 1 : 0) : 0;
    
    if ($attemptId <= 0) {
        sendError('Invalid attempt ID');
    }
    
    // Verify attempt belongs to user
    $verifySql = "SELECT ea.*, e.total_marks, e.passing_marks FROM exam_attempts ea 
                  JOIN exams e ON ea.exam_id = e.id 
                  WHERE ea.id = ? AND ea.user_id = ?";
    $verifyStmt = $conn->prepare($verifySql);
    $verifyStmt->bind_param("ii", $attemptId, $user['user_id']);
    $verifyStmt->execute();
    $verifyResult = $verifyStmt->get_result();
    
    if ($verifyResult->num_rows === 0) {
        sendError('Attempt not found', 404);
    }
    
    $attempt = $verifyResult->fetch_assoc();
    
    if ($attempt['status'] === 'completed') {
        sendError('Exam already submitted');
    }
    
    // Save all answers
    foreach ($answers as $questionId => $answer) {
        $qId = intval($questionId);
        $selectedAnswer = strtoupper($answer);
        
        if (!in_array($selectedAnswer, ['A', 'B', 'C', 'D'])) {
            continue;
        }
        
        // Get correct answer
        $correctSql = "SELECT correct_answer FROM questions WHERE id = ?";
        $correctStmt = $conn->prepare($correctSql);
        $correctStmt->bind_param("i", $qId);
        $correctStmt->execute();
        $correctResult = $correctStmt->get_result();
        
        if ($correctResult->num_rows === 0) continue;
        
        $correctAnswer = $correctResult->fetch_assoc()['correct_answer'];
        $isCorrect = ($selectedAnswer === $correctAnswer) ? 1 : 0;
        
        // Check if exists
        $checkSql = "SELECT id FROM student_answers WHERE attempt_id = ? AND question_id = ?";
        $checkStmt = $conn->prepare($checkSql);
        $checkStmt->bind_param("ii", $attemptId, $qId);
        $checkStmt->execute();
        
        if ($checkStmt->get_result()->num_rows > 0) {
            $updateSql = "UPDATE student_answers SET selected_answer = ?, is_correct = ?, answered_at = NOW() 
                          WHERE attempt_id = ? AND question_id = ?";
            $updateStmt = $conn->prepare($updateSql);
            $updateStmt->bind_param("siii", $selectedAnswer, $isCorrect, $attemptId, $qId);
            $updateStmt->execute();
        } else {
            $insertSql = "INSERT INTO student_answers (attempt_id, question_id, selected_answer, is_correct) 
                          VALUES (?, ?, ?, ?)";
            $insertStmt = $conn->prepare($insertSql);
            $insertStmt->bind_param("iisi", $attemptId, $qId, $selectedAnswer, $isCorrect);
            $insertStmt->execute();
        }
    }
    
    // Calculate results
    $resultSql = "SELECT 
                    COUNT(*) as attempted,
                    SUM(is_correct) as correct,
                    SUM(CASE WHEN is_correct = 0 THEN 1 ELSE 0 END) as wrong
                  FROM student_answers WHERE attempt_id = ?";
    $resultStmt = $conn->prepare($resultSql);
    $resultStmt->bind_param("i", $attemptId);
    $resultStmt->execute();
    $results = $resultStmt->get_result()->fetch_assoc();
    
    $attempted = intval($results['attempted']);
    $correct = intval($results['correct']);
    $wrong = intval($results['wrong']);
    
    // Calculate score
    $scoreSql = "SELECT SUM(q.marks) as score 
                 FROM student_answers sa 
                 JOIN questions q ON sa.question_id = q.id 
                 WHERE sa.attempt_id = ? AND sa.is_correct = 1";
    $scoreStmt = $conn->prepare($scoreSql);
    $scoreStmt->bind_param("i", $attemptId);
    $scoreStmt->execute();
    $score = floatval($scoreStmt->get_result()->fetch_assoc()['score'] ?? 0);
    
    $percentage = $attempt['total_marks'] > 0 ? ($score / $attempt['total_marks']) * 100 : 0;
    $isPassed = $score >= $attempt['passing_marks'] ? 1 : 0;
    
    // Calculate time taken
    $startTime = strtotime($attempt['start_time']);
    $timeTaken = time() - $startTime;
    
    // Update attempt
    $updateAttemptSql = "UPDATE exam_attempts SET 
                          end_time = NOW(),
                          time_taken = ?,
                          attempted_questions = ?,
                          correct_answers = ?,
                          wrong_answers = ?,
                          score = ?,
                          percentage = ?,
                          status = 'completed',
                          is_passed = ?,
                          violations = ?,
                          auto_submitted = ?
                         WHERE id = ?";
    $updateAttemptStmt = $conn->prepare($updateAttemptSql);
    $updateAttemptStmt->bind_param("iiiddiiiii", $timeTaken, $attempted, $correct, $wrong, $score, $percentage, $isPassed, $violations, $autoSubmitted, $attemptId);
    $updateAttemptStmt->execute();
    
    sendResponse([
        'message' => 'Exam submitted successfully',
        'result' => [
            'attempt_id' => $attemptId,
            'total_questions' => $attempt['total_questions'],
            'attempted' => $attempted,
            'correct' => $correct,
            'wrong' => $wrong,
            'score' => $score,
            'total_marks' => $attempt['total_marks'],
            'percentage' => round($percentage, 2),
            'is_passed' => (bool)$isPassed,
            'time_taken' => $timeTaken,
            'violations' => $violations
        ]
    ]);
}

/**
 * Submit Guest Exam
 */
function submitGuestExam($conn) {
    $data = getJSONInput();
    
    $attemptId = intval($data['attempt_id'] ?? $data['attemptId'] ?? 0);
    $answers = $data['answers'] ?? [];
    $violations = intval($data['violations'] ?? 0);
    $autoSubmitted = isset($data['auto_submitted']) ? ($data['auto_submitted'] ? 1 : 0) : 0;
    
    if ($attemptId <= 0) {
        sendError('Invalid attempt ID');
    }
    
    // Get attempt
    $verifySql = "SELECT ea.*, e.total_marks, e.passing_marks FROM exam_attempts ea 
                  JOIN exams e ON ea.exam_id = e.id 
                  WHERE ea.id = ? AND ea.user_id IS NULL";
    $verifyStmt = $conn->prepare($verifySql);
    $verifyStmt->bind_param("i", $attemptId);
    $verifyStmt->execute();
    $verifyResult = $verifyStmt->get_result();
    
    if ($verifyResult->num_rows === 0) {
        sendError('Attempt not found', 404);
    }
    
    $attempt = $verifyResult->fetch_assoc();
    
    if ($attempt['status'] === 'completed') {
        sendError('Exam already submitted');
    }
    
    // Save all answers (same logic as submitExam)
    foreach ($answers as $questionId => $answer) {
        $qId = intval($questionId);
        $selectedAnswer = strtoupper($answer);
        
        if (!in_array($selectedAnswer, ['A', 'B', 'C', 'D'])) continue;
        
        $correctSql = "SELECT correct_answer FROM questions WHERE id = ?";
        $correctStmt = $conn->prepare($correctSql);
        $correctStmt->bind_param("i", $qId);
        $correctStmt->execute();
        $correctResult = $correctStmt->get_result();
        
        if ($correctResult->num_rows === 0) continue;
        
        $correctAnswer = $correctResult->fetch_assoc()['correct_answer'];
        $isCorrect = ($selectedAnswer === $correctAnswer) ? 1 : 0;
        
        $checkSql = "SELECT id FROM student_answers WHERE attempt_id = ? AND question_id = ?";
        $checkStmt = $conn->prepare($checkSql);
        $checkStmt->bind_param("ii", $attemptId, $qId);
        $checkStmt->execute();
        
        if ($checkStmt->get_result()->num_rows > 0) {
            $updateSql = "UPDATE student_answers SET selected_answer = ?, is_correct = ? WHERE attempt_id = ? AND question_id = ?";
            $updateStmt = $conn->prepare($updateSql);
            $updateStmt->bind_param("siii", $selectedAnswer, $isCorrect, $attemptId, $qId);
            $updateStmt->execute();
        } else {
            $insertSql = "INSERT INTO student_answers (attempt_id, question_id, selected_answer, is_correct) VALUES (?, ?, ?, ?)";
            $insertStmt = $conn->prepare($insertSql);
            $insertStmt->bind_param("iisi", $attemptId, $qId, $selectedAnswer, $isCorrect);
            $insertStmt->execute();
        }
    }
    
    // Calculate results
    $resultSql = "SELECT COUNT(*) as attempted, SUM(is_correct) as correct FROM student_answers WHERE attempt_id = ?";
    $resultStmt = $conn->prepare($resultSql);
    $resultStmt->bind_param("i", $attemptId);
    $resultStmt->execute();
    $results = $resultStmt->get_result()->fetch_assoc();
    
    $attempted = intval($results['attempted']);
    $correct = intval($results['correct']);
    $wrong = $attempted - $correct;
    
    $scoreSql = "SELECT SUM(q.marks) as score FROM student_answers sa JOIN questions q ON sa.question_id = q.id WHERE sa.attempt_id = ? AND sa.is_correct = 1";
    $scoreStmt = $conn->prepare($scoreSql);
    $scoreStmt->bind_param("i", $attemptId);
    $scoreStmt->execute();
    $score = floatval($scoreStmt->get_result()->fetch_assoc()['score'] ?? 0);
    
    $percentage = $attempt['total_marks'] > 0 ? ($score / $attempt['total_marks']) * 100 : 0;
    $isPassed = $score >= $attempt['passing_marks'] ? 1 : 0;
    $timeTaken = time() - strtotime($attempt['start_time']);
    
    $updateAttemptSql = "UPDATE exam_attempts SET end_time = NOW(), time_taken = ?, attempted_questions = ?, correct_answers = ?, wrong_answers = ?, score = ?, percentage = ?, status = 'completed', is_passed = ?, violations = ?, auto_submitted = ? WHERE id = ?";
    $updateAttemptStmt = $conn->prepare($updateAttemptSql);
    $updateAttemptStmt->bind_param("iiiddiiiii", $timeTaken, $attempted, $correct, $wrong, $score, $percentage, $isPassed, $violations, $autoSubmitted, $attemptId);
    $updateAttemptStmt->execute();
    
    sendResponse([
        'message' => 'Exam submitted successfully',
        'result' => [
            'attempt_id' => $attemptId,
            'total_questions' => $attempt['total_questions'],
            'attempted' => $attempted,
            'correct' => $correct,
            'wrong' => $wrong,
            'score' => $score,
            'total_marks' => $attempt['total_marks'],
            'percentage' => round($percentage, 2),
            'is_passed' => (bool)$isPassed,
            'time_taken' => $timeTaken
        ]
    ]);
}

/**
 * Get Single Result
 */
function getResult($conn, $attemptId) {
    if ($attemptId <= 0) {
        sendError('Invalid attempt ID');
    }
    
    $sql = "SELECT ea.*, e.title as exam_title, e.subject, e.total_marks as exam_total_marks,
                   u.name as student_name, u.email as student_email
            FROM exam_attempts ea
            JOIN exams e ON ea.exam_id = e.id
            LEFT JOIN users u ON ea.user_id = u.id
            WHERE ea.id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $attemptId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        sendError('Result not found', 404);
    }
    
    $attempt = $result->fetch_assoc();
    
    // Get answers with questions
    $answersSql = "SELECT sa.*, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, 
                          q.correct_answer, q.explanation
                   FROM student_answers sa
                   JOIN questions q ON sa.question_id = q.id
                   WHERE sa.attempt_id = ?";
    $answersStmt = $conn->prepare($answersSql);
    $answersStmt->bind_param("i", $attemptId);
    $answersStmt->execute();
    $answersResult = $answersStmt->get_result();
    
    $answers = [];
    while ($a = $answersResult->fetch_assoc()) {
        $answers[] = $a;
    }
    
    $attempt['answers'] = $answers;
    
    sendResponse($attempt);
}

/**
 * Get My Results (Current user)
 */
function getMyResults($conn) {
    $user = requireAuth();
    
    $sql = "SELECT ea.*, e.title as exam_title, e.subject
            FROM exam_attempts ea
            JOIN exams e ON ea.exam_id = e.id
            WHERE ea.user_id = ? AND ea.status = 'completed'
            ORDER BY ea.end_time DESC";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $user['user_id']);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $results = [];
    while ($row = $result->fetch_assoc()) {
        $row['is_passed'] = (bool)$row['is_passed'];
        $results[] = $row;
    }
    
    sendResponse($results);
}

/**
 * Get All Results (Admin)
 */
function getAllResults($conn) {
    requireAdmin();
    
    $sql = "SELECT ea.*, e.title as exam_title, e.subject,
                   COALESCE(u.name, ea.guest_name) as student_name,
                   COALESCE(u.email, ea.guest_email) as student_email,
                   u.roll_number
            FROM exam_attempts ea
            JOIN exams e ON ea.exam_id = e.id
            LEFT JOIN users u ON ea.user_id = u.id
            WHERE ea.status = 'completed'
            ORDER BY ea.end_time DESC";
    $result = $conn->query($sql);
    
    $results = [];
    while ($row = $result->fetch_assoc()) {
        $row['is_passed'] = (bool)$row['is_passed'];
        $row['auto_submitted'] = (bool)$row['auto_submitted'];
        $results[] = $row;
    }
    
    sendResponse($results);
}

/**
 * Record Violation
 */
function recordViolation($conn) {
    $data = getJSONInput();
    
    $attemptId = intval($data['attempt_id'] ?? $data['attemptId'] ?? 0);
    $violationType = sanitize($conn, $data['type'] ?? 'other');
    $details = sanitize($conn, $data['details'] ?? '');
    
    if ($attemptId <= 0) {
        sendError('Invalid attempt ID');
    }
    
    $sql = "INSERT INTO violation_logs (attempt_id, violation_type, details) VALUES (?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("iss", $attemptId, $violationType, $details);
    
    if ($stmt->execute()) {
        // Update violation count in attempt
        $updateSql = "UPDATE exam_attempts SET violations = violations + 1 WHERE id = ?";
        $updateStmt = $conn->prepare($updateSql);
        $updateStmt->bind_param("i", $attemptId);
        $updateStmt->execute();
        
        sendResponse(['message' => 'Violation recorded']);
    } else {
        sendError('Failed to record violation');
    }
}

$conn->close();
?>
