<?php
/**
 * Students Management API
 * Handles: Get all students, delete student, update status
 */

require_once 'config.php';

$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';
$studentId = isset($_GET['id']) ? intval($_GET['id']) : 0;

switch ($method) {
    case 'GET':
        if ($action === 'all') {
            getAllStudents($conn);
        } elseif ($action === 'stats') {
            getStudentStats($conn);
        } elseif ($studentId > 0) {
            getStudentById($conn, $studentId);
        } else {
            getAllStudents($conn);
        }
        break;
    case 'POST':
        if ($action === 'toggle-status') {
            toggleStudentStatus($conn, $studentId);
        }
        break;
    case 'DELETE':
        deleteStudent($conn, $studentId);
        break;
    default:
        sendError('Method not allowed', 405);
}

/**
 * Get All Students (Admin only)
 */
function getAllStudents($conn) {
    requireAdmin();
    
    $search = isset($_GET['search']) ? sanitize($conn, $_GET['search']) : '';
    $department = isset($_GET['department']) ? sanitize($conn, $_GET['department']) : '';
    
    $sql = "SELECT id, name, email, phone, roll_number, department, semester, 
                   profile_image, is_active, created_at,
                   (SELECT COUNT(*) FROM exam_attempts WHERE user_id = users.id AND status = 'completed') as exams_taken,
                   (SELECT AVG(percentage) FROM exam_attempts WHERE user_id = users.id AND status = 'completed') as avg_score
            FROM users 
            WHERE role = 'student'";
    
    if (!empty($search)) {
        $sql .= " AND (name LIKE '%$search%' OR email LIKE '%$search%' OR roll_number LIKE '%$search%')";
    }
    
    if (!empty($department)) {
        $sql .= " AND department = '$department'";
    }
    
    $sql .= " ORDER BY created_at DESC";
    
    $result = $conn->query($sql);
    $students = [];
    
    while ($row = $result->fetch_assoc()) {
        $row['is_active'] = (bool)$row['is_active'];
        $row['avg_score'] = $row['avg_score'] ? round($row['avg_score'], 2) : 0;
        $students[] = $row;
    }
    
    sendResponse($students);
}

/**
 * Get Student Stats
 */
function getStudentStats($conn) {
    requireAdmin();
    
    // Total students
    $totalSql = "SELECT COUNT(*) as total FROM users WHERE role = 'student'";
    $total = $conn->query($totalSql)->fetch_assoc()['total'];
    
    // Today registered
    $todaySql = "SELECT COUNT(*) as today FROM users WHERE role = 'student' AND DATE(created_at) = CURDATE()";
    $today = $conn->query($todaySql)->fetch_assoc()['today'];
    
    // This week
    $weekSql = "SELECT COUNT(*) as week FROM users WHERE role = 'student' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
    $week = $conn->query($weekSql)->fetch_assoc()['week'];
    
    // Active students
    $activeSql = "SELECT COUNT(*) as active FROM users WHERE role = 'student' AND is_active = 1";
    $active = $conn->query($activeSql)->fetch_assoc()['active'];
    
    // By department
    $deptSql = "SELECT department, COUNT(*) as count FROM users WHERE role = 'student' AND department IS NOT NULL AND department != '' GROUP BY department";
    $deptResult = $conn->query($deptSql);
    $byDepartment = [];
    while ($row = $deptResult->fetch_assoc()) {
        $byDepartment[] = $row;
    }
    
    sendResponse([
        'total' => intval($total),
        'today' => intval($today),
        'this_week' => intval($week),
        'active' => intval($active),
        'by_department' => $byDepartment
    ]);
}

/**
 * Get Single Student by ID
 */
function getStudentById($conn, $studentId) {
    requireAdmin();
    
    $sql = "SELECT id, name, email, phone, roll_number, department, semester, 
                   profile_image, is_active, created_at
            FROM users 
            WHERE id = ? AND role = 'student'";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $studentId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        sendError('Student not found', 404);
    }
    
    $student = $result->fetch_assoc();
    $student['is_active'] = (bool)$student['is_active'];
    
    // Get exam history
    $examsSql = "SELECT ea.*, e.title as exam_title, e.subject
                 FROM exam_attempts ea
                 JOIN exams e ON ea.exam_id = e.id
                 WHERE ea.user_id = ? AND ea.status = 'completed'
                 ORDER BY ea.end_time DESC";
    $examsStmt = $conn->prepare($examsSql);
    $examsStmt->bind_param("i", $studentId);
    $examsStmt->execute();
    $examsResult = $examsStmt->get_result();
    
    $exams = [];
    while ($row = $examsResult->fetch_assoc()) {
        $row['is_passed'] = (bool)$row['is_passed'];
        $exams[] = $row;
    }
    
    $student['exam_history'] = $exams;
    
    sendResponse($student);
}

/**
 * Toggle Student Active Status
 */
function toggleStudentStatus($conn, $studentId) {
    requireAdmin();
    
    if ($studentId <= 0) {
        sendError('Invalid student ID');
    }
    
    $sql = "UPDATE users SET is_active = NOT is_active, updated_at = NOW() WHERE id = ? AND role = 'student'";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $studentId);
    
    if ($stmt->execute()) {
        $statusSql = "SELECT is_active FROM users WHERE id = ?";
        $statusStmt = $conn->prepare($statusSql);
        $statusStmt->bind_param("i", $studentId);
        $statusStmt->execute();
        $result = $statusStmt->get_result()->fetch_assoc();
        
        sendResponse([
            'message' => 'Student status updated',
            'is_active' => (bool)$result['is_active']
        ]);
    } else {
        sendError('Failed to update student status');
    }
}

/**
 * Delete Student
 */
function deleteStudent($conn, $studentId) {
    requireAdmin();
    
    if ($studentId <= 0) {
        sendError('Invalid student ID');
    }
    
    $sql = "DELETE FROM users WHERE id = ? AND role = 'student'";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $studentId);
    
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            sendResponse(['message' => 'Student deleted successfully']);
        } else {
            sendError('Student not found', 404);
        }
    } else {
        sendError('Failed to delete student');
    }
}

$conn->close();
?>
