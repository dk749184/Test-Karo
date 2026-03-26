// ============================================
// AUTHENTICATION CONTEXT
// Handles user login, logout, session management
// Saves registered users to Supabase Cloud Database
// ============================================

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { sendWelcomeEmail } from '../services/emailService';

interface RegisteredUser extends User {
  password: string;
  registeredAt: string;
  profileImage?: string;
  instituteName?: string;
  instituteCode?: string;
  assignedDepartments?: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  register: (userData: {
    name: string;
    email: string;
    password: string;
    rollNumber: string;
    phone: string;
    department: string;
    semester: string;
    instituteCode?: string;
  }) => Promise<{ success: boolean; message: string }>;
  updateProfile: (updates: Partial<User>) => void;
  updateProfileImage: (imageData: string) => void;
  getAllStudents: () => Promise<RegisteredUser[]>;
  deleteStudent: (studentId: string) => Promise<void>;
  updateStudent: (studentId: string, updates: Partial<RegisteredUser>) => Promise<void>;
  createInstitute: (data: { name: string; email: string; password: string; instituteName: string; instituteCode: string }) => Promise<{ success: boolean; message: string }>;
  getAllInstitutes: () => Promise<RegisteredUser[]>;
  deleteInstitute: (id: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo credentials for testing (fallback if Supabase not configured)
const DEMO_USERS: RegisteredUser[] = [
  {
    id: 'student-demo',
    name: 'Demo Student',
    email: 'student@demo.com',
    password: 'student123',
    role: 'student',
    rollNumber: 'DEMO001',
    department: 'Computer Applications',
    phone: '9876543210',
    semester: '6th',
    registeredAt: new Date().toISOString(),
    profileImage: ''
  },
  {
    id: 'admin-demo',
    name: 'Demo Admin',
    email: 'admin@demo.com',
    password: 'admin123',
    role: 'admin',
    department: 'Administration',
    registeredAt: new Date().toISOString(),
    profileImage: ''
  },
  {
    id: 'institute-demo',
    name: 'Demo Institute',
    email: 'institute@demo.com',
    password: 'institute123',
    role: 'institute',
    department: 'Administration',
    instituteName: 'Demo Institute of Technology',
    instituteCode: 'DIT001',
    assignedDepartments: ['Computer Applications', 'Computer Science', 'MCA'],
    registeredAt: new Date().toISOString(),
    profileImage: ''
  }
];

// Get all registered users from localStorage (fallback)
const getRegisteredUsersLocal = (): RegisteredUser[] => {
  const saved = localStorage.getItem('registeredUsers');
  if (saved) {
    return JSON.parse(saved);
  }
  localStorage.setItem('registeredUsers', JSON.stringify(DEMO_USERS));
  return DEMO_USERS;
};

// Save users to localStorage (fallback)
const saveRegisteredUsersLocal = (users: RegisteredUser[]) => {
  localStorage.setItem('registeredUsers', JSON.stringify(users));
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      const savedUser = localStorage.getItem('examUser');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    setIsLoading(true);
    
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║              🔐 LOGIN ATTEMPT                            ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 Role:', role);
    console.log('🔗 Supabase configured:', isSupabaseConfigured());
    console.log('');
    
    try {
      // First try Supabase
      if (isSupabaseConfigured()) {
        console.log('🔄 STEP 1: Trying Supabase login...');
        console.log('');
        
        try {
          // Set timeout for Supabase query
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Supabase query timeout after 10 seconds')), 10000)
          );
          
          // First, let's check if we can connect to Supabase
          console.log('   📡 Connecting to Supabase...');
          
          const listQuery = supabase
            .from('users')
            .select('id, email, role, name, password_hash')
            .limit(10);
          
          const { data: allUsers, error: listError } = await Promise.race([
            listQuery,
            timeoutPromise
          ]) as any;
          
          if (listError) {
            console.log('');
            console.log('   ❌ SUPABASE ERROR:');
            console.log('      Code:', listError.code);
            console.log('      Message:', listError.message);
            console.log('      Hint:', listError.hint || 'None');
            console.log('');
            
            if (listError.code === '42P01') {
              console.log('   ⚠️ Table "users" does not exist!');
              console.log('   📋 Please run SQL schema in Supabase Dashboard.');
            }
          } else {
            console.log('   ✅ Connected to Supabase!');
            console.log('   📊 Total users in DB:', allUsers?.length || 0);
            console.log('');
            
            if (allUsers && allUsers.length > 0) {
              console.log('   👥 Users in database:');
              allUsers.forEach((u: any, i: number) => {
                console.log(`      ${i + 1}. ${u.email} | ${u.role} | ${u.name} | pwd: ${u.password_hash}`);
              });
              console.log('');
            }
          }
          
          // Now try to find the specific user
          console.log(`   🔍 Searching for user: ${email} (${role})...`);
          
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email.toLowerCase().trim())
            .eq('role', role)
            .single();

          if (error) {
            console.log('   ⚠️ Query error:', error.message);
            console.log('   ⚠️ Error code:', error.code);
          }

          if (data) {
            console.log('');
            console.log('   ✅ USER FOUND!');
            console.log('      Name:', data.name);
            console.log('      Email:', data.email);
            console.log('      Role:', data.role);
            console.log('');
            console.log('   🔐 Password check:');
            console.log('      DB password:', data.password_hash);
            console.log('      Input password:', password);
            console.log('      Match:', data.password_hash === password ? '✅ YES' : '❌ NO');
            console.log('');
            
            if (data.password_hash === password) {
              console.log('   ✅✅✅ SUPABASE LOGIN SUCCESSFUL! ✅✅✅');
              console.log('');
              
              const loggedInUser: User = {
                id: data.id,
                name: data.name,
                email: data.email,
                role: data.role,
                rollNumber: data.roll_number,
                department: data.department,
                phone: data.phone,
                semester: data.semester,
                profileImage: data.profile_image,
                instituteName: data.institute_name,
                instituteCode: data.student_institute_code || data.institute_code,
                assignedDepartments: data.assigned_departments
              };

              setUser(loggedInUser);
              localStorage.setItem('examUser', JSON.stringify(loggedInUser));
              setIsLoading(false);
              return true;
            } else {
              console.log('   ❌ Password mismatch! Login failed.');
            }
          } else {
            console.log('');
            console.log('   ❌ No user found with:');
            console.log('      Email:', email);
            console.log('      Role:', role);
            console.log('');
          }
          
          console.log('   ⚠️ Supabase login failed, trying localStorage fallback...');
          console.log('');
        } catch (supabaseError: any) {
          console.log('');
          console.log('   ❌ SUPABASE CONNECTION ERROR:');
          console.log('      ', supabaseError?.message || supabaseError);
          console.log('');
          console.log('   ⚠️ Falling back to localStorage...');
          console.log('');
        }
      } else {
        console.log('⚠️ Supabase not configured, using localStorage only');
        console.log('');
      }
      
      // Fallback to localStorage (always try if Supabase fails)
      console.log('🔄 Trying localStorage login...');
      await new Promise(resolve => setTimeout(resolve, 300));
      const users = getRegisteredUsersLocal();
      console.log('📦 Local users:', users.map(u => ({ email: u.email, role: u.role })));
      
      const foundUser = users.find(u => 
        u.email.toLowerCase() === email.toLowerCase() && 
        u.password === password && 
        u.role === role
      );

      if (foundUser) {
        console.log('✅ localStorage login successful!');
        const { password: _, ...userWithoutPassword } = foundUser;
        setUser(userWithoutPassword);
        localStorage.setItem('examUser', JSON.stringify(userWithoutPassword));
        setIsLoading(false);
        return true;
      }
      
      console.log('❌ Login failed - no matching user found');
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('❌ Login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('examUser');
    localStorage.removeItem('examAttempt');
  };

  // Register new student
  const register = async (userData: {
    name: string;
    email: string;
    password: string;
    rollNumber: string;
    phone: string;
    department: string;
    semester: string;
    instituteCode?: string;
  }): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);
    
    try {
      if (isSupabaseConfigured()) {
        // Check if email already exists
        const { data: existingEmail } = await supabase
          .from('users')
          .select('id')
          .eq('email', userData.email.toLowerCase())
          .single();

        if (existingEmail) {
          setIsLoading(false);
          return { success: false, message: 'Email already registered!' };
        }

        // Check if roll number already exists
        const { data: existingRoll } = await supabase
          .from('users')
          .select('id')
          .eq('roll_number', userData.rollNumber)
          .single();

        if (existingRoll) {
          setIsLoading(false);
          return { success: false, message: 'Roll number already registered!' };
        }

        // Insert new user
        const { data: newUser, error } = await supabase
          .from('users')
          .insert({
            email: userData.email.toLowerCase(),
            password_hash: userData.password, // In production, hash this!
            name: userData.name,
            role: 'student',
            roll_number: userData.rollNumber,
            phone: userData.phone,
            department: userData.department,
            semester: userData.semester,
            profile_image: '',
            student_institute_code: userData.instituteCode || ''
          })
          .select()
          .single();

        if (error) {
          console.error('Registration error:', error);
          setIsLoading(false);
          return { success: false, message: 'Registration failed. Please try again.' };
        }

        const loggedInUser: User = {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          rollNumber: newUser.roll_number,
          department: newUser.department,
          phone: newUser.phone,
          semester: newUser.semester,
          profileImage: newUser.profile_image
        };

        setUser(loggedInUser);
        localStorage.setItem('examUser', JSON.stringify(loggedInUser));
        
        // Send welcome email
        console.log('📧 Sending welcome email to:', loggedInUser.email);
        try {
          const emailResult = await sendWelcomeEmail({
            to_email: loggedInUser.email,
            to_name: loggedInUser.name,
            roll_number: loggedInUser.rollNumber
          });
          console.log('📧 Welcome email result:', emailResult);
        } catch (emailError) {
          console.error('📧 Welcome email error:', emailError);
        }
        
        setIsLoading(false);
        return { success: true, message: 'Registration successful! Welcome email sent.' };
      } else {
        // Fallback to localStorage
        await new Promise(resolve => setTimeout(resolve, 500));
        const users = getRegisteredUsersLocal();
        
        if (users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
          setIsLoading(false);
          return { success: false, message: 'Email already registered!' };
        }
        
        if (users.some(u => u.rollNumber === userData.rollNumber)) {
          setIsLoading(false);
          return { success: false, message: 'Roll number already registered!' };
        }

        const newUser: RegisteredUser = {
          id: `student-${Date.now()}`,
          name: userData.name,
          email: userData.email,
          password: userData.password,
          role: 'student',
          rollNumber: userData.rollNumber,
          phone: userData.phone,
          department: userData.department,
          semester: userData.semester,
          instituteCode: userData.instituteCode,
          registeredAt: new Date().toISOString(),
          profileImage: ''
        };

        users.push(newUser);
        saveRegisteredUsersLocal(users);

        const { password: _, ...userWithoutPassword } = newUser;
        setUser(userWithoutPassword);
        localStorage.setItem('examUser', JSON.stringify(userWithoutPassword));
        
        // Send welcome email
        console.log('📧 Sending welcome email to:', userWithoutPassword.email);
        try {
          const emailResult = await sendWelcomeEmail({
            to_email: userWithoutPassword.email,
            to_name: userWithoutPassword.name,
            roll_number: userWithoutPassword.rollNumber
          });
          console.log('📧 Welcome email result:', emailResult);
        } catch (emailError) {
          console.error('📧 Welcome email error:', emailError);
        }
        
        setIsLoading(false);
        return { success: true, message: 'Registration successful! Welcome email sent.' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      setIsLoading(false);
      return { success: false, message: 'Registration failed. Please try again.' };
    }
  };

  // Update profile
  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return;

    try {
      if (isSupabaseConfigured()) {
        const updateData: Record<string, unknown> = {};
        if (updates.name) updateData.name = updates.name;
        if (updates.phone) updateData.phone = updates.phone;
        if (updates.department) updateData.department = updates.department;
        if (updates.semester) updateData.semester = updates.semester;

        await supabase
          .from('users')
          .update(updateData)
          .eq('id', user.id);
      }

      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('examUser', JSON.stringify(updatedUser));

      // Also update in localStorage (fallback)
      const users = getRegisteredUsersLocal();
      const userIndex = users.findIndex(u => u.id === user.id);
      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...updates };
        saveRegisteredUsersLocal(users);
      }
    } catch (error) {
      console.error('Update profile error:', error);
    }
  };

  // Update profile image
  const updateProfileImage = async (imageData: string) => {
    if (!user) return;

    try {
      if (isSupabaseConfigured()) {
        await supabase
          .from('users')
          .update({ profile_image: imageData })
          .eq('id', user.id);
      }

      const updatedUser = { ...user, profileImage: imageData };
      setUser(updatedUser);
      localStorage.setItem('examUser', JSON.stringify(updatedUser));

      // Also update in localStorage (fallback)
      const users = getRegisteredUsersLocal();
      const userIndex = users.findIndex(u => u.id === user.id);
      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], profileImage: imageData };
        saveRegisteredUsersLocal(users);
      }
    } catch (error) {
      console.error('Update profile image error:', error);
    }
  };

  // Get all students (for admin)
  const getAllStudents = async (): Promise<RegisteredUser[]> => {
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('role', 'student')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Get students error:', error);
          return [];
        }

        return data.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          password: '', // Don't expose password
          role: u.role,
          rollNumber: u.roll_number,
          department: u.department,
          phone: u.phone,
          semester: u.semester,
          registeredAt: u.created_at,
          profileImage: u.profile_image
        }));
      } else {
        const users = getRegisteredUsersLocal();
        return users.filter(u => u.role === 'student');
      }
    } catch (error) {
      console.error('Get students error:', error);
      return [];
    }
  };

  // Delete student (for admin)
  const deleteStudent = async (studentId: string): Promise<void> => {
    try {
      if (isSupabaseConfigured()) {
        await supabase
          .from('users')
          .delete()
          .eq('id', studentId);
      }

      // Also delete from localStorage
      const users = getRegisteredUsersLocal();
      const filteredUsers = users.filter(u => u.id !== studentId);
      saveRegisteredUsersLocal(filteredUsers);
    } catch (error) {
      console.error('Delete student error:', error);
    }
  };

  // Update student (for admin)
  const updateStudent = async (studentId: string, updates: Partial<RegisteredUser>): Promise<void> => {
    try {
      if (isSupabaseConfigured()) {
        const updateData: Record<string, unknown> = {};
        if (updates.name) updateData.name = updates.name;
        if (updates.email) updateData.email = updates.email;
        if (updates.phone) updateData.phone = updates.phone;
        if (updates.rollNumber) updateData.roll_number = updates.rollNumber;
        if (updates.department) updateData.department = updates.department;
        if (updates.semester) updateData.semester = updates.semester;

        const { error } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', studentId);

        if (error) {
          console.error('Update student error:', error);
          throw error;
        }
      }

      // Also update in localStorage (fallback)
      const users = getRegisteredUsersLocal();
      const userIndex = users.findIndex(u => u.id === studentId);
      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...updates };
        saveRegisteredUsersLocal(users);
      }
    } catch (error) {
      console.error('Update student error:', error);
      throw error;
    }
  };

  // Create institute (for admin)
  const createInstitute = async (data: { name: string; email: string; password: string; instituteName: string; instituteCode: string }): Promise<{ success: boolean; message: string }> => {
    try {
      const users = getRegisteredUsersLocal();
      if (users.some(u => u.email.toLowerCase() === data.email.toLowerCase())) {
        return { success: false, message: 'Email already registered!' };
      }
      if (users.some(u => u.instituteCode === data.instituteCode)) {
        return { success: false, message: 'Institute code already exists!' };
      }
      const newInstitute: RegisteredUser = {
        id: `institute-${Date.now()}`,
        name: data.name,
        email: data.email,
        password: data.password,
        role: 'institute',
        instituteName: data.instituteName,
        instituteCode: data.instituteCode,
        assignedDepartments: [],
        registeredAt: new Date().toISOString(),
        profileImage: ''
      };
      users.push(newInstitute);
      saveRegisteredUsersLocal(users);

      if (isSupabaseConfigured()) {
        await supabase.from('users').insert({
          email: data.email.toLowerCase(),
          password_hash: data.password,
          name: data.name,
          role: 'institute',
          institute_name: data.instituteName,
          institute_code: data.instituteCode,
          department: 'Institute',
        });
      }
      return { success: true, message: 'Institute account created successfully!' };
    } catch (error) {
      console.error('Create institute error:', error);
      return { success: false, message: 'Failed to create institute account.' };
    }
  };

  // Get all institutes (for admin)
  const getAllInstitutes = async (): Promise<RegisteredUser[]> => {
    try {
      const users = getRegisteredUsersLocal();
      return users.filter(u => u.role === 'institute');
    } catch (error) {
      console.error('Get institutes error:', error);
      return [];
    }
  };

  // Delete institute (for admin)
  const deleteInstitute = async (id: string): Promise<void> => {
    try {
      const users = getRegisteredUsersLocal();
      saveRegisteredUsersLocal(users.filter(u => u.id !== id));
      if (isSupabaseConfigured()) {
        await supabase.from('users').delete().eq('id', id);
      }
    } catch (error) {
      console.error('Delete institute error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      register,
      updateProfile,
      updateProfileImage,
      getAllStudents,
      deleteStudent,
      updateStudent,
      createInstitute,
      getAllInstitutes,
      deleteInstitute
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
