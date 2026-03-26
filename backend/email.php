<?php
/**
 * Email API
 * Handles: Sending emails and logging
 */

require_once 'config.php';

// Include PHPMailer if available (optional)
// require_once 'vendor/autoload.php';

$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'send':
        sendEmail($conn);
        break;
    case 'send-exam-confirmation':
        sendExamConfirmation($conn);
        break;
    case 'send-result':
        sendResultEmail($conn);
        break;
    case 'logs':
        getEmailLogs($conn);
        break;
    case 'clear-logs':
        clearEmailLogs($conn);
        break;
    default:
        sendError('Invalid action', 400);
}

/**
 * Send Generic Email
 */
function sendEmail($conn) {
    $data = getJSONInput();
    
    $to = sanitize($conn, $data['to'] ?? '');
    $toName = sanitize($conn, $data['to_name'] ?? '');
    $subject = sanitize($conn, $data['subject'] ?? '');
    $message = sanitize($conn, $data['message'] ?? '');
    $type = sanitize($conn, $data['type'] ?? 'other');
    
    if (empty($to) || empty($subject)) {
        sendError('Recipient email and subject are required');
    }
    
    // Try to send email using PHP mail() function
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-type: text/html; charset=UTF-8\r\n";
    $headers .= "From: AI Exam System <noreply@examystem.com>\r\n";
    
    $htmlMessage = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>AI Examination System</h1>
            </div>
            <div class='content'>
                " . nl2br($message) . "
            </div>
            <div class='footer'>
                <p>This is an automated email. Please do not reply.</p>
            </div>
        </div>
    </body>
    </html>";
    
    $sent = @mail($to, $subject, $htmlMessage, $headers);
    $status = $sent ? 'sent' : 'failed';
    $errorMessage = $sent ? null : 'Mail function failed';
    
    // Log email
    $logSql = "INSERT INTO email_logs (recipient_email, recipient_name, subject, message, email_type, status, error_message) 
               VALUES (?, ?, ?, ?, ?, ?, ?)";
    $logStmt = $conn->prepare($logSql);
    $logStmt->bind_param("sssssss", $to, $toName, $subject, $message, $type, $status, $errorMessage);
    $logStmt->execute();
    
    if ($sent) {
        sendResponse(['message' => 'Email sent successfully']);
    } else {
        // Even if mail() fails, we log it and return success
        // The email might still be sent via EmailJS on frontend
        sendResponse(['message' => 'Email logged', 'status' => 'logged']);
    }
}

/**
 * Send Exam Confirmation Email
 */
function sendExamConfirmation($conn) {
    $data = getJSONInput();
    
    $to = sanitize($conn, $data['to'] ?? $data['email'] ?? '');
    $toName = sanitize($conn, $data['to_name'] ?? $data['name'] ?? '');
    $examTitle = sanitize($conn, $data['exam_title'] ?? '');
    $examDate = sanitize($conn, $data['exam_date'] ?? date('Y-m-d'));
    $duration = sanitize($conn, $data['duration'] ?? '');
    $questionsAttempted = sanitize($conn, $data['questions_attempted'] ?? '');
    $submissionTime = sanitize($conn, $data['submission_time'] ?? date('H:i:s'));
    
    if (empty($to)) {
        sendError('Recipient email is required');
    }
    
    $subject = "✅ Exam Submission Confirmation - " . $examTitle;
    
    $message = "
Dear $toName,

Thank you for attending the examination \"$examTitle\".
Your exam has been submitted successfully.

📋 EXAM DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Exam Name: $examTitle
• Date: $examDate
• Duration: $duration minutes
• Questions Attempted: $questionsAttempted
• Submission Time: $submissionTime
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏳ RESULT ANNOUNCEMENT:
Your result will be announced within 24 hours.
You will receive another email once your result is ready.

Best of luck! 🍀

Regards,
AI Examination System
    ";
    
    // Send email
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-type: text/html; charset=UTF-8\r\n";
    $headers .= "From: AI Exam System <noreply@examsystem.com>\r\n";
    
    $htmlMessage = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.8; color: #333; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 30px; background: #ffffff; border: 1px solid #e5e7eb; }
            .details-box { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .details-box p { margin: 8px 0; }
            .highlight { color: #4F46E5; font-weight: bold; }
            .result-box { background: #FEF3C7; padding: 15px; border-radius: 8px; border-left: 4px solid #F59E0B; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; background: #f9fafb; border-radius: 0 0 10px 10px; }
            .emoji { font-size: 20px; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>✅ Exam Submitted Successfully!</h1>
            </div>
            <div class='content'>
                <p>Dear <strong>$toName</strong>,</p>
                <p>Thank you for attending the examination <span class='highlight'>\"$examTitle\"</span>.</p>
                <p>Your exam has been submitted successfully.</p>
                
                <div class='details-box'>
                    <h3>📋 Exam Details</h3>
                    <p><strong>Exam Name:</strong> $examTitle</p>
                    <p><strong>Date:</strong> $examDate</p>
                    <p><strong>Duration:</strong> $duration minutes</p>
                    <p><strong>Questions Attempted:</strong> $questionsAttempted</p>
                    <p><strong>Submission Time:</strong> $submissionTime</p>
                </div>
                
                <div class='result-box'>
                    <p><strong>⏳ Result Announcement</strong></p>
                    <p>Your result will be announced within <strong>24 hours</strong>.</p>
                    <p>You will receive another email once your result is ready.</p>
                </div>
                
                <p class='emoji'>Best of luck! 🍀</p>
                
                <p>Regards,<br><strong>AI Examination System</strong></p>
            </div>
            <div class='footer'>
                <p>This is an automated email. Please do not reply.</p>
                <p>© " . date('Y') . " AI Examination System. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>";
    
    $sent = @mail($to, $subject, $htmlMessage, $headers);
    $status = $sent ? 'sent' : 'failed';
    
    // Log email
    $logSql = "INSERT INTO email_logs (recipient_email, recipient_name, subject, message, email_type, status) 
               VALUES (?, ?, ?, ?, 'exam_confirmation', ?)";
    $logStmt = $conn->prepare($logSql);
    $logStmt->bind_param("sssss", $to, $toName, $subject, $message, $status);
    $logStmt->execute();
    
    sendResponse([
        'message' => 'Confirmation email sent',
        'status' => $status,
        'email_id' => $conn->insert_id
    ]);
}

/**
 * Send Result Email
 */
function sendResultEmail($conn) {
    $data = getJSONInput();
    
    $to = sanitize($conn, $data['to'] ?? $data['email'] ?? '');
    $toName = sanitize($conn, $data['to_name'] ?? $data['name'] ?? '');
    $examTitle = sanitize($conn, $data['exam_title'] ?? '');
    $score = sanitize($conn, $data['score'] ?? '0');
    $totalMarks = sanitize($conn, $data['total_marks'] ?? '0');
    $percentage = sanitize($conn, $data['percentage'] ?? '0');
    $status = sanitize($conn, $data['result_status'] ?? 'Pass');
    $grade = sanitize($conn, $data['grade'] ?? 'N/A');
    
    if (empty($to)) {
        sendError('Recipient email is required');
    }
    
    $statusEmoji = ($status === 'Pass' || $status === 'Passed') ? '🎉' : '📚';
    $subject = "$statusEmoji Result Announcement - $examTitle";
    
    $message = "
Dear $toName,

Your result for \"$examTitle\" has been announced.

📊 RESULT SUMMARY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Score: $score / $totalMarks
• Percentage: $percentage%
• Grade: $grade
• Status: $status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

" . ($status === 'Pass' || $status === 'Passed' ? 
"Congratulations on passing the exam! 🎊" : 
"Don't lose hope! Keep practicing and try again. 💪") . "

Regards,
AI Examination System
    ";
    
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-type: text/html; charset=UTF-8\r\n";
    $headers .= "From: AI Exam System <noreply@examsystem.com>\r\n";
    
    $statusColor = ($status === 'Pass' || $status === 'Passed') ? '#10B981' : '#EF4444';
    
    $htmlMessage = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.8; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { padding: 30px; background: #ffffff; border: 1px solid #e5e7eb; }
            .result-card { background: #f9fafb; padding: 25px; border-radius: 10px; text-align: center; margin: 20px 0; }
            .score { font-size: 48px; font-weight: bold; color: #4F46E5; }
            .percentage { font-size: 24px; color: #6B7280; }
            .status { display: inline-block; padding: 10px 30px; border-radius: 20px; font-size: 18px; font-weight: bold; color: white; background: $statusColor; margin-top: 15px; }
            .details { display: flex; justify-content: space-around; margin: 20px 0; }
            .detail-item { text-align: center; }
            .detail-value { font-size: 24px; font-weight: bold; color: #374151; }
            .detail-label { font-size: 14px; color: #6B7280; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; background: #f9fafb; border-radius: 0 0 10px 10px; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>$statusEmoji Result Announcement</h1>
                <p style='margin: 0; opacity: 0.9;'>$examTitle</p>
            </div>
            <div class='content'>
                <p>Dear <strong>$toName</strong>,</p>
                <p>Your result has been announced!</p>
                
                <div class='result-card'>
                    <div class='score'>$score / $totalMarks</div>
                    <div class='percentage'>$percentage%</div>
                    <div class='status'>$status</div>
                </div>
                
                <div style='text-align: center; margin: 20px 0;'>
                    <p style='font-size: 20px;'>Grade: <strong>$grade</strong></p>
                </div>
                
                <p style='text-align: center; font-size: 16px;'>" . 
                ($status === 'Pass' || $status === 'Passed' ? 
                "Congratulations on passing the exam! 🎊" : 
                "Don't lose hope! Keep practicing and try again. 💪") . "</p>
                
                <p>Regards,<br><strong>AI Examination System</strong></p>
            </div>
            <div class='footer'>
                <p>This is an automated email. Please do not reply.</p>
            </div>
        </div>
    </body>
    </html>";
    
    $sent = @mail($to, $subject, $htmlMessage, $headers);
    $emailStatus = $sent ? 'sent' : 'failed';
    
    // Log email
    $logSql = "INSERT INTO email_logs (recipient_email, recipient_name, subject, message, email_type, status) 
               VALUES (?, ?, ?, ?, 'result_notification', ?)";
    $logStmt = $conn->prepare($logSql);
    $logStmt->bind_param("sssss", $to, $toName, $subject, $message, $emailStatus);
    $logStmt->execute();
    
    sendResponse([
        'message' => 'Result email sent',
        'status' => $emailStatus
    ]);
}

/**
 * Get Email Logs (Admin only)
 */
function getEmailLogs($conn) {
    requireAdmin();
    
    $sql = "SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT 100";
    $result = $conn->query($sql);
    
    $logs = [];
    while ($row = $result->fetch_assoc()) {
        $logs[] = $row;
    }
    
    sendResponse($logs);
}

/**
 * Clear Email Logs (Admin only)
 */
function clearEmailLogs($conn) {
    requireAdmin();
    
    $sql = "DELETE FROM email_logs";
    if ($conn->query($sql)) {
        sendResponse(['message' => 'Email logs cleared']);
    } else {
        sendError('Failed to clear logs');
    }
}

$conn->close();
?>
