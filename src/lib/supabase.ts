// Supabase Cloud Database Configuration
// Free tier: 500MB storage, unlimited API requests

import { createClient } from '@supabase/supabase-js';

// Supabase credentials
const SUPABASE_URL = 'https://moohbnhciqgoirxraphc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vb2hibmhjaXFnb2lyeHJhcGhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNzAyOTYsImV4cCI6MjA4NjY0NjI5Nn0.6SubZdF8-r9Z_sVpGPvxi9djufXamntGp7cFQNXCRr0';

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return SUPABASE_URL.includes('supabase.co') && SUPABASE_ANON_KEY.length > 50;
};

// Create Supabase client with retry options
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
  db: {
    schema: 'public',
  },
});

// Connection status tracking
let isConnected = false;
let connectionCheckPromise: Promise<boolean> | null = null;

// Check Supabase connection with detailed logging
export const checkConnection = async (): Promise<boolean> => {
  if (connectionCheckPromise) {
    return connectionCheckPromise;
  }
  
  connectionCheckPromise = (async () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║        🔄 CHECKING SUPABASE CONNECTION                    ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('📡 URL:', SUPABASE_URL);
    console.log('🔑 Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...');
    
    try {
      // Set timeout for connection check
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000)
      );
      
      const queryPromise = supabase.from('users').select('id, email, role, name').limit(10);
      
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;
      
      if (error) {
        console.log('');
        console.log('❌ SUPABASE ERROR:');
        console.log('   Message:', error.message);
        console.log('   Code:', error.code);
        console.log('   Hint:', error.hint || 'None');
        console.log('');
        
        // Check for common errors
        if (error.code === '42P01') {
          console.log('⚠️ Table "users" does not exist!');
          console.log('📋 Please run the SQL schema in Supabase Dashboard.');
        } else if (error.code === 'PGRST301') {
          console.log('⚠️ RLS Policy blocking access!');
          console.log('📋 Please add RLS policies to allow access.');
        }
        
        isConnected = false;
        return false;
      }
      
      console.log('');
      console.log('✅ SUPABASE CONNECTED SUCCESSFULLY!');
      console.log('📊 Users in database:', data?.length || 0);
      
      if (data && data.length > 0) {
        console.log('');
        console.log('👥 Users found:');
        data.forEach((u: any, i: number) => {
          console.log(`   ${i + 1}. ${u.email} (${u.role}) - ${u.name}`);
        });
      } else {
        console.log('⚠️ No users found in database!');
        console.log('📋 Please insert demo users or register new users.');
      }
      console.log('');
      
      isConnected = true;
      return true;
    } catch (err: any) {
      console.log('');
      console.log('❌ SUPABASE CONNECTION FAILED!');
      console.log('   Error:', err?.message || err);
      console.log('');
      console.log('📋 Possible solutions:');
      console.log('   1. Check internet connection');
      console.log('   2. Verify Supabase URL and API Key');
      console.log('   3. Check if Supabase project is active');
      console.log('   4. Run SQL schema to create tables');
      console.log('');
      isConnected = false;
      return false;
    } finally {
      connectionCheckPromise = null;
    }
  })();
  
  return connectionCheckPromise;
};

// Get connection status
export const getConnectionStatus = () => isConnected;

// Safe query wrapper with fallback
export const safeQuery = async <T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  fallbackFn?: () => T
): Promise<T | null> => {
  try {
    const { data, error } = await queryFn();
    if (error) {
      console.warn('⚠️ Supabase query error:', error.message);
      if (fallbackFn) return fallbackFn();
      return null;
    }
    return data;
  } catch (err) {
    console.warn('❌ Supabase query failed:', err);
    if (fallbackFn) return fallbackFn();
    return null;
  }
};

// Database Types
export interface DbUser {
  id?: string;
  email: string;
  password_hash: string;
  name: string;
  role: 'student' | 'admin';
  roll_number?: string;
  phone?: string;
  department?: string;
  semester?: string;
  profile_image?: string;
  created_at?: string;
}

export interface DbExam {
  id?: string;
  title: string;
  subject: string;
  description?: string;
  duration: number;
  total_marks: number;
  passing_marks: number;
  class_level: string;
  category: 'school' | 'college' | 'competitive';
  is_active: boolean;
  is_public: boolean;
  start_time: string;
  end_time: string;
  created_by?: string;
  created_at?: string;
}

export interface DbQuestion {
  id?: string;
  exam_id?: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  marks: number;
  subject?: string;
  topic?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  created_at?: string;
}

export interface DbQuestionBank {
  id?: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  subject: string;
  topic: string;
  class_level: string;
  difficulty: 'easy' | 'medium' | 'hard';
  created_by?: string;
  created_at?: string;
}

export interface DbExamAttempt {
  id?: string;
  exam_id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  score?: number;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  unanswered: number;
  violation_count: number;
  is_terminated: boolean;
  status: 'in_progress' | 'completed' | 'terminated';
  created_at?: string;
}

export interface DbStudentAnswer {
  id?: string;
  attempt_id: string;
  question_id: string;
  selected_answer: string;
  is_correct: boolean;
  created_at?: string;
}

export interface DbEmailLog {
  id?: string;
  recipient_email: string;
  recipient_name: string;
  subject: string;
  message: string;
  email_type: 'exam_confirmation' | 'result_notification' | 'welcome';
  status: 'sent' | 'failed' | 'simulated';
  created_at?: string;
}

export interface DbViolationLog {
  id?: string;
  attempt_id: string;
  violation_type: string;
  violation_message: string;
  created_at?: string;
}
