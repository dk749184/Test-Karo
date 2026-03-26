/**
 * API Service for connecting to PHP Backend (XAMPP)
 */

// Base URL for API - Change this to your XAMPP server URL
const API_BASE_URL = 'http://localhost/exam_system/backend';

// Get token from localStorage
const getToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// API request helper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data.data || data;
}

// ==================== AUTH API ====================

export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await apiRequest<{ user: any; token: string }>('/auth.php?action=login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    // Save token
    if (response.token) {
      localStorage.setItem('authToken', response.token);
    }
    
    return response;
  },

  register: async (userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    rollNumber?: string;
    department?: string;
    semester?: string;
  }) => {
    const response = await apiRequest<{ user: any; token: string }>('/auth.php?action=register', {
      method: 'POST',
      body: JSON.stringify({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        phone: userData.phone,
        roll_number: userData.rollNumber,
        department: userData.department,
        semester: userData.semester,
      }),
    });
    
    if (response.token) {
      localStorage.setItem('authToken', response.token);
    }
    
    return response;
  },

  getProfile: async () => {
    return apiRequest<any>('/auth.php?action=profile');
  },

  updateProfile: async (data: any) => {
    return apiRequest<any>('/auth.php?action=update-profile', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    return apiRequest<any>('/auth.php?action=change-password', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });
  },

  uploadProfileImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/auth.php?action=upload-image`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    });
    
    return response.json();
  },

  logout: () => {
    localStorage.removeItem('authToken');
  },
};

// ==================== EXAMS API ====================

export const examsAPI = {
  getPublicExams: async () => {
    return apiRequest<any[]>('/exams.php?action=public');
  },

  getActiveExams: async () => {
    return apiRequest<any[]>('/exams.php?action=active');
  },

  getAllExams: async () => {
    return apiRequest<any[]>('/exams.php?action=all');
  },

  getExamById: async (id: number) => {
    return apiRequest<any>(`/exams.php?id=${id}`);
  },

  createExam: async (examData: any) => {
    return apiRequest<{ id: number; message: string }>('/exams.php?action=create', {
      method: 'POST',
      body: JSON.stringify(examData),
    });
  },

  updateExam: async (id: number, data: any) => {
    return apiRequest<any>(`/exams.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  toggleExamStatus: async (id: number) => {
    return apiRequest<{ is_active: boolean }>(`/exams.php?action=toggle-status&id=${id}`, {
      method: 'POST',
    });
  },

  toggleExamPublic: async (id: number) => {
    return apiRequest<{ is_public: boolean }>(`/exams.php?action=toggle-public&id=${id}`, {
      method: 'POST',
    });
  },

  updateSchedule: async (id: number, startTime: string, endTime: string) => {
    return apiRequest<any>(`/exams.php?action=update-schedule&id=${id}`, {
      method: 'POST',
      body: JSON.stringify({ startTime, endTime }),
    });
  },

  deleteExam: async (id: number) => {
    return apiRequest<any>(`/exams.php?id=${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== EXAM ATTEMPTS API ====================

export const attemptsAPI = {
  startExam: async (examId: number) => {
    return apiRequest<{
      attempt_id: number;
      exam: any;
      questions: any[];
    }>('/attempts.php?action=start', {
      method: 'POST',
      body: JSON.stringify({ exam_id: examId }),
    });
  },

  startGuestExam: async (examId: number, name: string, email: string) => {
    return apiRequest<{
      attempt_id: number;
      exam: any;
      questions: any[];
    }>('/attempts.php?action=guest-start', {
      method: 'POST',
      body: JSON.stringify({ exam_id: examId, name, email }),
    });
  },

  saveAnswer: async (attemptId: number, questionId: number, answer: string) => {
    return apiRequest<any>('/attempts.php?action=save-answer', {
      method: 'POST',
      body: JSON.stringify({
        attempt_id: attemptId,
        question_id: questionId,
        answer,
      }),
    });
  },

  submitExam: async (attemptId: number, answers: Record<number, string>, violations: number, autoSubmitted: boolean) => {
    return apiRequest<{ result: any }>('/attempts.php?action=submit', {
      method: 'POST',
      body: JSON.stringify({
        attempt_id: attemptId,
        answers,
        violations,
        auto_submitted: autoSubmitted,
      }),
    });
  },

  submitGuestExam: async (attemptId: number, answers: Record<number, string>, violations: number) => {
    return apiRequest<{ result: any }>('/attempts.php?action=guest-submit', {
      method: 'POST',
      body: JSON.stringify({
        attempt_id: attemptId,
        answers,
        violations,
      }),
    });
  },

  getResult: async (attemptId: number) => {
    return apiRequest<any>(`/attempts.php?action=result&id=${attemptId}`);
  },

  getMyResults: async () => {
    return apiRequest<any[]>('/attempts.php?action=my-results');
  },

  getAllResults: async () => {
    return apiRequest<any[]>('/attempts.php?action=all-results');
  },

  recordViolation: async (attemptId: number, type: string, details: string) => {
    return apiRequest<any>('/attempts.php?action=violation', {
      method: 'POST',
      body: JSON.stringify({
        attempt_id: attemptId,
        type,
        details,
      }),
    });
  },
};

// ==================== STUDENTS API ====================

export const studentsAPI = {
  getAllStudents: async (search?: string, department?: string) => {
    let url = '/students.php?action=all';
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (department) url += `&department=${encodeURIComponent(department)}`;
    return apiRequest<any[]>(url);
  },

  getStudentStats: async () => {
    return apiRequest<any>('/students.php?action=stats');
  },

  getStudentById: async (id: number) => {
    return apiRequest<any>(`/students.php?id=${id}`);
  },

  toggleStudentStatus: async (id: number) => {
    return apiRequest<any>(`/students.php?action=toggle-status&id=${id}`, {
      method: 'POST',
    });
  },

  deleteStudent: async (id: number) => {
    return apiRequest<any>(`/students.php?id=${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== EMAIL API ====================

export const emailAPI = {
  sendExamConfirmation: async (data: {
    to: string;
    to_name: string;
    exam_title: string;
    exam_date: string;
    duration: string;
    questions_attempted: string;
    submission_time: string;
  }) => {
    return apiRequest<any>('/email.php?action=send-exam-confirmation', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  sendResultEmail: async (data: {
    to: string;
    to_name: string;
    exam_title: string;
    score: string;
    total_marks: string;
    percentage: string;
    result_status: string;
    grade: string;
  }) => {
    return apiRequest<any>('/email.php?action=send-result', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getEmailLogs: async () => {
    return apiRequest<any[]>('/email.php?action=logs');
  },

  clearEmailLogs: async () => {
    return apiRequest<any>('/email.php?action=clear-logs', {
      method: 'POST',
    });
  },
};

// Export all APIs
export default {
  auth: authAPI,
  exams: examsAPI,
  attempts: attemptsAPI,
  students: studentsAPI,
  email: emailAPI,
};
