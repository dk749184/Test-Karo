import emailjs from '@emailjs/browser';

// ============================================
// 📧 EmailJS Configuration
// ============================================
// 
// FREE EMAIL SETUP INSTRUCTIONS:
// 
// 1. Go to https://www.emailjs.com/
// 2. Click "Sign Up Free" (200 emails/month free)
// 3. After login, go to "Email Services" → "Add New Service"
// 4. Choose Gmail/Outlook → Connect your email
// 5. Go to "Email Templates" → "Create New Template"
// 6. Use this template content:
//
//    Subject: {{subject}}
//    
//    To: {{to_email}}
//    
//    {{message}}
//
// 7. Save template and copy:
//    - Service ID (from Email Services page)
//    - Template ID (from Email Templates page)
//    - Public Key (from Account → API Keys)
//
// 8. Replace the values below:
// ============================================

const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_5tsu68j',
  TEMPLATE_ID: 'template_lv8h1x1',
  PUBLIC_KEY: 'no9CR2LiwwEdtOcus',
  IS_CONFIGURED: true
};

// Initialize EmailJS on load
const initEmailJS = () => {
  if (typeof window !== 'undefined' && EMAILJS_CONFIG.IS_CONFIGURED) {
    console.log('📧 Initializing EmailJS...');
    // EmailJS will be initialized when first email is sent
  }
};

initEmailJS();

export interface EmailData {
  to: string;
  subject: string;
  studentName: string;
  examTitle: string;
  examDate: string;
  duration: string;
  questionsAttempted: number;
  totalQuestions: number;
  submissionTime: string;
  violations?: number;
}

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  content: string;
  status: 'sent' | 'failed' | 'simulated';
  timestamp: Date;
  type: 'exam_confirmation' | 'result_notification' | 'other';
  method: 'emailjs' | 'simulation';
}

// Initialize EmailJS
if (EMAILJS_CONFIG.IS_CONFIGURED) {
  emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
}

// Generate email HTML content
const generateEmailHTML = (data: EmailData): string => {
  const violationWarning = data.violations && data.violations > 0 
    ? `\n\n⚠️ Important Notice:\nDuring your exam, ${data.violations} violation(s) were detected. This has been recorded and may affect your final evaluation.`
    : '';

  return `
Dear ${data.studentName},

Thank you for attending the examination "${data.examTitle}".
Your exam has been submitted successfully.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 EXAM DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 Exam Name: ${data.examTitle}
📅 Date: ${data.examDate}
⏱️ Duration: ${data.duration}
✅ Questions Attempted: ${data.questionsAttempted} / ${data.totalQuestions}
🕐 Submission Time: ${data.submissionTime}
${violationWarning}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏳ RESULT ANNOUNCEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your result will be announced within 24 hours.
You will receive another email notification once your result is ready.

Please log in to your student portal to check your result after 24 hours.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Best of luck! 🍀

Regards,
Test Karo Team
AI-Powered Examination System

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This is an automated email. Please do not reply.
For support, contact: support@examportal.com
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `.trim();
};

// Save email log to localStorage
const saveEmailLog = (log: EmailLog): void => {
  const logs = getEmailLogs();
  logs.unshift(log);
  localStorage.setItem('email_logs', JSON.stringify(logs));
};

// Get all email logs
export const getEmailLogs = (): EmailLog[] => {
  const logs = localStorage.getItem('email_logs');
  return logs ? JSON.parse(logs) : [];
};

// Clear all email logs
export const clearEmailLogs = (): void => {
  localStorage.setItem('email_logs', JSON.stringify([]));
};

// Send email using EmailJS
export const sendExamConfirmationEmail = async (data: EmailData): Promise<{ success: boolean; message: string; method: string }> => {
  const emailContent = generateEmailHTML(data);
  
  // If EmailJS is configured, send real email
  if (EMAILJS_CONFIG.IS_CONFIGURED) {
    try {
      const templateParams = {
        to_email: data.to,
        to_name: data.studentName,
        subject: `✅ Exam Submission Confirmation - ${data.examTitle}`,
        message: emailContent,
        exam_title: data.examTitle,
        exam_date: data.examDate,
        duration: data.duration,
        questions_attempted: `${data.questionsAttempted} / ${data.totalQuestions}`,
        submission_time: data.submissionTime,
      };

      const response = await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        templateParams
      );

      if (response.status === 200) {
        const log: EmailLog = {
          id: `email_${Date.now()}`,
          to: data.to,
          subject: `✅ Exam Submission Confirmation - ${data.examTitle}`,
          content: emailContent,
          status: 'sent',
          timestamp: new Date(),
          type: 'exam_confirmation',
          method: 'emailjs'
        };
        saveEmailLog(log);

        return { 
          success: true, 
          message: 'Email sent successfully to ' + data.to,
          method: 'emailjs'
        };
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      console.error('EmailJS Error:', error);
      
      const log: EmailLog = {
        id: `email_${Date.now()}`,
        to: data.to,
        subject: `✅ Exam Submission Confirmation - ${data.examTitle}`,
        content: emailContent,
        status: 'failed',
        timestamp: new Date(),
        type: 'exam_confirmation',
        method: 'emailjs'
      };
      saveEmailLog(log);

      return { 
        success: false, 
        message: 'Failed to send email. Please check EmailJS configuration.',
        method: 'emailjs'
      };
    }
  } else {
    // Simulation mode - save to localStorage and show instructions
    const log: EmailLog = {
      id: `email_${Date.now()}`,
      to: data.to,
      subject: `✅ Exam Submission Confirmation - ${data.examTitle}`,
      content: emailContent,
      status: 'simulated',
      timestamp: new Date(),
      type: 'exam_confirmation',
      method: 'simulation'
    };
    saveEmailLog(log);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    return { 
      success: true, 
      message: 'Email simulated (EmailJS not configured). See setup instructions below.',
      method: 'simulation'
    };
  }
};

// Send result notification email
export const sendResultEmail = async (
  to: string,
  studentName: string,
  examTitle: string,
  score: number,
  totalMarks: number,
  percentage: number,
  grade: string
): Promise<{ success: boolean; message: string }> => {
  
  const emailContent = `
Dear ${studentName},

Your result for "${examTitle}" is now available!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 YOUR RESULT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 Exam: ${examTitle}
✅ Score: ${score} / ${totalMarks}
📈 Percentage: ${percentage}%
🏆 Grade: ${grade}

${percentage >= 60 ? '🎉 Congratulations! You have passed the examination.' : '📚 We encourage you to review the topics and try again.'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Log in to your student portal to view detailed analysis.

Best Regards,
Test Karo Team

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This is an automated email. Please do not reply.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `.trim();

  if (EMAILJS_CONFIG.IS_CONFIGURED) {
    try {
      const templateParams = {
        to_email: to,
        to_name: studentName,
        subject: `📊 Your Result - ${examTitle}`,
        message: emailContent,
      };

      await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        templateParams
      );

      const log: EmailLog = {
        id: `email_${Date.now()}`,
        to: to,
        subject: `📊 Your Result - ${examTitle}`,
        content: emailContent,
        status: 'sent',
        timestamp: new Date(),
        type: 'result_notification',
        method: 'emailjs'
      };
      saveEmailLog(log);

      return { success: true, message: 'Result email sent successfully!' };
    } catch (error) {
      console.error('EmailJS Error:', error);
      return { success: false, message: 'Failed to send result email' };
    }
  } else {
    // Simulation mode
    const log: EmailLog = {
      id: `email_${Date.now()}`,
      to: to,
      subject: `📊 Your Result - ${examTitle}`,
      content: emailContent,
      status: 'simulated',
      timestamp: new Date(),
      type: 'result_notification',
      method: 'simulation'
    };
    saveEmailLog(log);

    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, message: 'Result email simulated' };
  }
};

// Send Welcome Email on Registration
export const sendWelcomeEmail = async (data: {
  to_email: string;
  to_name: string;
  roll_number?: string;
}): Promise<{ success: boolean; message: string }> => {
  console.log('📧📧📧 SENDING WELCOME EMAIL 📧📧📧');
  console.log('📧 To:', data.to_email);
  console.log('📧 Name:', data.to_name);

  const emailContent = `
Dear ${data.to_name},

🎉 Welcome to TestKaro!

Your account has been created successfully.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 YOUR DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📧 Email: ${data.to_email}
${data.roll_number ? `🎫 Roll Number: ${data.roll_number}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ WHAT YOU CAN DO NOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Take online exams
• View your results & analytics
• Track your progress
• Practice with AI-generated questions

🔗 Login at: ${window.location.origin}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Best Regards,
TestKaro Team
AI-Powered Examination System

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This is an automated email. Please do not reply.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `.trim();

  if (EMAILJS_CONFIG.IS_CONFIGURED) {
    try {
      const templateParams = {
        to_email: data.to_email,
        to_name: data.to_name,
        subject: '🎉 Welcome to TestKaro - Registration Successful!',
        message: emailContent,
      };

      console.log('📤 Sending welcome email via EmailJS...');
      
      const response = await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        templateParams
      );

      if (response.status === 200) {
        console.log('✅ Welcome email sent successfully!');
        
        const log: EmailLog = {
          id: `email_${Date.now()}`,
          to: data.to_email,
          subject: '🎉 Welcome to TestKaro!',
          content: emailContent,
          status: 'sent',
          timestamp: new Date(),
          type: 'other',
          method: 'emailjs'
        };
        saveEmailLog(log);

        return { success: true, message: 'Welcome email sent successfully!' };
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      console.error('❌ Failed to send welcome email:', error);
      
      const log: EmailLog = {
        id: `email_${Date.now()}`,
        to: data.to_email,
        subject: '🎉 Welcome to TestKaro!',
        content: emailContent,
        status: 'failed',
        timestamp: new Date(),
        type: 'other',
        method: 'emailjs'
      };
      saveEmailLog(log);

      return { success: false, message: `Failed to send email: ${error}` };
    }
  } else {
    // Simulation mode
    console.log('⚠️ EmailJS not configured, simulating email...');
    
    const log: EmailLog = {
      id: `email_${Date.now()}`,
      to: data.to_email,
      subject: '🎉 Welcome to TestKaro!',
      content: emailContent,
      status: 'simulated',
      timestamp: new Date(),
      type: 'other',
      method: 'simulation'
    };
    saveEmailLog(log);

    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, message: 'Welcome email simulated' };
  }
};

// Check if EmailJS is configured
export const isEmailConfigured = (): boolean => {
  return EMAILJS_CONFIG.IS_CONFIGURED;
};

// Get configuration status
export const getEmailConfigStatus = () => ({
  isConfigured: EMAILJS_CONFIG.IS_CONFIGURED,
  serviceId: EMAILJS_CONFIG.SERVICE_ID,
  templateId: EMAILJS_CONFIG.TEMPLATE_ID,
});

// Alias for backward compatibility
export interface ExamCompletionEmail {
  studentName: string;
  studentEmail: string;
  examTitle: string;
  examDate: string;
  examDuration: string;
  questionsAttempted: number;
  totalQuestions: number;
  submissionTime: string;
}

export const sendExamCompletionEmail = async (data: ExamCompletionEmail): Promise<boolean> => {
  const emailData: EmailData = {
    to: data.studentEmail,
    subject: `✅ Exam Submission Confirmation - ${data.examTitle}`,
    studentName: data.studentName,
    examTitle: data.examTitle,
    examDate: data.examDate,
    duration: data.examDuration,
    questionsAttempted: data.questionsAttempted,
    totalQuestions: data.totalQuestions,
    submissionTime: data.submissionTime,
  };
  
  const result = await sendExamConfirmationEmail(emailData);
  return result.success;
};
