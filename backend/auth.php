<?php
/**
 * Authentication API
 * Handles: Login, Register, Profile, Logout
 */

require_once 'config.php';

$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'login':
        handleLogin($conn);
        break;
    case 'register':
        handleRegister($conn);
        break;
    case 'profile':
        handleProfile($conn);
        break;
    case 'update-profile':
        handleUpdateProfile($conn);
        break;
    case 'change-password':
        handleChangePassword($conn);
        break;
    case 'upload-image':
        handleUploadImage($conn);
        break;
    default:
        sendError('Invalid action', 400);
}

/**
 * Handle User Login
 */
function handleLogin($conn) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendError('Method not allowed', 405);
    }
    
    $data = getJSONInput();
    
    $email = sanitize($conn, $data['email'] ?? '');
    $password = $data['password'] ?? '';
    
    if (empty($email) || empty($password)) {
        sendError('Email and password are required');
    }
    
    // Find user
    $sql = "SELECT * FROM users WHERE email = ? AND is_active = 1";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        sendError('Invalid email or password');
    }
    
    $user = $result->fetch_assoc();
    
    // Verify password
    if (!password_verify($password, $user['password'])) {
        sendError('Invalid email or password');
    }
    
    // Generate token
    $token = generateToken($user['id'], $user['role']);
    
    // Remove password from response
    unset($user['password']);
    
    sendResponse([
        'user' => $user,
        'token' => $token,
        'message' => 'Login successful'
    ]);
}

/**
 * Handle User Registration
 */
function handleRegister($conn) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendError('Method not allowed', 405);
    }
    
    $data = getJSONInput();
    
    // Validate required fields
    $required = ['name', 'email', 'password'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            sendError("$field is required");
        }
    }
    
    $name = sanitize($conn, $data['name']);
    $email = sanitize($conn, $data['email']);
    $password = $data['password'];
    $phone = sanitize($conn, $data['phone'] ?? '');
    $rollNumber = sanitize($conn, $data['roll_number'] ?? $data['rollNumber'] ?? '');
    $department = sanitize($conn, $data['department'] ?? '');
    $semester = sanitize($conn, $data['semester'] ?? '');
    
    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendError('Invalid email format');
    }
    
    // Check password length
    if (strlen($password) < 6) {
        sendError('Password must be at least 6 characters');
    }
    
    // Check if email exists
    $checkSql = "SELECT id FROM users WHERE email = ?";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bind_param("s", $email);
    $checkStmt->execute();
    if ($checkStmt->get_result()->num_rows > 0) {
        sendError('Email already registered');
    }
    
    // Check if roll number exists
    if (!empty($rollNumber)) {
        $checkRoll = "SELECT id FROM users WHERE roll_number = ?";
        $checkRollStmt = $conn->prepare($checkRoll);
        $checkRollStmt->bind_param("s", $rollNumber);
        $checkRollStmt->execute();
        if ($checkRollStmt->get_result()->num_rows > 0) {
            sendError('Roll number already registered');
        }
    }
    
    // Hash password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    
    // Insert user
    $sql = "INSERT INTO users (name, email, password, role, phone, roll_number, department, semester) 
            VALUES (?, ?, ?, 'student', ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sssssss", $name, $email, $hashedPassword, $phone, $rollNumber, $department, $semester);
    
    if ($stmt->execute()) {
        $userId = $conn->insert_id;
        
        // Generate token
        $token = generateToken($userId, 'student');
        
        // Get user data
        $user = [
            'id' => $userId,
            'name' => $name,
            'email' => $email,
            'role' => 'student',
            'phone' => $phone,
            'roll_number' => $rollNumber,
            'department' => $department,
            'semester' => $semester
        ];
        
        sendResponse([
            'user' => $user,
            'token' => $token,
            'message' => 'Registration successful'
        ], 201);
    } else {
        sendError('Registration failed: ' . $conn->error);
    }
}

/**
 * Get User Profile
 */
function handleProfile($conn) {
    $user = requireAuth();
    
    $sql = "SELECT id, name, email, role, phone, roll_number, department, semester, profile_image, created_at 
            FROM users WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $user['user_id']);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        sendError('User not found', 404);
    }
    
    sendResponse($result->fetch_assoc());
}

/**
 * Update User Profile
 */
function handleUpdateProfile($conn) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'PUT') {
        sendError('Method not allowed', 405);
    }
    
    $user = requireAuth();
    $data = getJSONInput();
    
    $name = sanitize($conn, $data['name'] ?? '');
    $phone = sanitize($conn, $data['phone'] ?? '');
    $department = sanitize($conn, $data['department'] ?? '');
    $semester = sanitize($conn, $data['semester'] ?? '');
    
    $sql = "UPDATE users SET name = ?, phone = ?, department = ?, semester = ?, updated_at = NOW() 
            WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ssssi", $name, $phone, $department, $semester, $user['user_id']);
    
    if ($stmt->execute()) {
        sendResponse(['message' => 'Profile updated successfully']);
    } else {
        sendError('Failed to update profile');
    }
}

/**
 * Change Password
 */
function handleChangePassword($conn) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendError('Method not allowed', 405);
    }
    
    $user = requireAuth();
    $data = getJSONInput();
    
    $currentPassword = $data['current_password'] ?? '';
    $newPassword = $data['new_password'] ?? '';
    
    if (empty($currentPassword) || empty($newPassword)) {
        sendError('Current password and new password are required');
    }
    
    if (strlen($newPassword) < 6) {
        sendError('New password must be at least 6 characters');
    }
    
    // Get current user
    $sql = "SELECT password FROM users WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $user['user_id']);
    $stmt->execute();
    $result = $stmt->get_result();
    $userData = $result->fetch_assoc();
    
    // Verify current password
    if (!password_verify($currentPassword, $userData['password'])) {
        sendError('Current password is incorrect');
    }
    
    // Update password
    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
    $updateSql = "UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?";
    $updateStmt = $conn->prepare($updateSql);
    $updateStmt->bind_param("si", $hashedPassword, $user['user_id']);
    
    if ($updateStmt->execute()) {
        sendResponse(['message' => 'Password changed successfully']);
    } else {
        sendError('Failed to change password');
    }
}

/**
 * Upload Profile Image
 */
function handleUploadImage($conn) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendError('Method not allowed', 405);
    }
    
    $user = requireAuth();
    
    if (!isset($_FILES['image'])) {
        sendError('No image file uploaded');
    }
    
    $file = $_FILES['image'];
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (!in_array($file['type'], $allowedTypes)) {
        sendError('Invalid file type. Allowed: JPG, PNG, GIF, WEBP');
    }
    
    if ($file['size'] > 2 * 1024 * 1024) { // 2MB limit
        sendError('File size must be less than 2MB');
    }
    
    // Create uploads directory if not exists
    $uploadDir = 'uploads/profiles/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    // Generate unique filename
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = 'profile_' . $user['user_id'] . '_' . time() . '.' . $extension;
    $filepath = $uploadDir . $filename;
    
    if (move_uploaded_file($file['tmp_name'], $filepath)) {
        // Update database
        $imageUrl = $filepath;
        $sql = "UPDATE users SET profile_image = ?, updated_at = NOW() WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("si", $imageUrl, $user['user_id']);
        
        if ($stmt->execute()) {
            sendResponse([
                'message' => 'Image uploaded successfully',
                'image_url' => $imageUrl
            ]);
        } else {
            sendError('Failed to update profile image');
        }
    } else {
        sendError('Failed to upload image');
    }
}

$conn->close();
?>
