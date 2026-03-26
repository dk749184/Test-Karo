<?php
/**
 * Database Configuration for XAMPP MySQL
 * AI-Based Online Examination System
 */

// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 1);

// CORS Headers - Allow React frontend to connect
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');          // Default XAMPP username
define('DB_PASS', '');              // Default XAMPP password (empty)
define('DB_NAME', 'exam_system');

// Create database connection
function getDBConnection() {
    try {
        $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        
        if ($conn->connect_error) {
            throw new Exception("Connection failed: " . $conn->connect_error);
        }
        
        $conn->set_charset("utf8mb4");
        return $conn;
        
    } catch (Exception $e) {
        sendError("Database connection failed: " . $e->getMessage(), 500);
        exit();
    }
}

// Send JSON response
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode([
        'success' => true,
        'data' => $data
    ]);
    exit();
}

// Send error response
function sendError($message, $statusCode = 400) {
    http_response_code($statusCode);
    echo json_encode([
        'success' => false,
        'error' => $message
    ]);
    exit();
}

// Get JSON input
function getJSONInput() {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        return [];
    }
    
    return $data;
}

// Sanitize input
function sanitize($conn, $data) {
    if (is_array($data)) {
        return array_map(function($item) use ($conn) {
            return sanitize($conn, $item);
        }, $data);
    }
    return $conn->real_escape_string(trim($data));
}

// Verify password
function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

// Hash password
function hashPassword($password) {
    return password_hash($password, PASSWORD_DEFAULT);
}

// Generate JWT Token (simple version)
function generateToken($userId, $role) {
    $header = base64_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload = base64_encode(json_encode([
        'user_id' => $userId,
        'role' => $role,
        'exp' => time() + (24 * 60 * 60) // 24 hours
    ]));
    $signature = base64_encode(hash_hmac('sha256', "$header.$payload", 'your-secret-key', true));
    return "$header.$payload.$signature";
}

// Verify JWT Token
function verifyToken($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return false;
    }
    
    $payload = json_decode(base64_decode($parts[1]), true);
    
    if (!$payload || !isset($payload['exp']) || $payload['exp'] < time()) {
        return false;
    }
    
    return $payload;
}

// Get current user from token
function getCurrentUser() {
    $headers = getallheaders();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    
    if (strpos($authHeader, 'Bearer ') === 0) {
        $token = substr($authHeader, 7);
        return verifyToken($token);
    }
    
    return false;
}

// Check if user is admin
function requireAdmin() {
    $user = getCurrentUser();
    if (!$user || $user['role'] !== 'admin') {
        sendError('Admin access required', 403);
    }
    return $user;
}

// Check if user is logged in
function requireAuth() {
    $user = getCurrentUser();
    if (!$user) {
        sendError('Authentication required', 401);
    }
    return $user;
}
?>
