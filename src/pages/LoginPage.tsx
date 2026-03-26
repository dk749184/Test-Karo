// ============================================
// LOGIN PAGE
// Secure login and registration for students and admins
// ============================================

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { UserRole } from '../types';
import { GraduationCap, Shield, BookOpen, Brain, Lock, CheckCircle, User, Phone, Mail, Hash, Building, Building2, Calendar, ArrowLeft } from 'lucide-react';

interface LoginPageProps {
  onBackToHome?: () => void;
}

export function LoginPage({ onBackToHome }: LoginPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<UserRole>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [instituteCode, setInstituteCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (isLogin) {
        const success = await login(email, password, role);
        if (!success) {
          setError('Invalid credentials. Please check email and password.');
        }
      } else {
        // Validation
        if (password !== confirmPassword) {
          setError('Passwords do not match!');
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters!');
          setIsLoading(false);
          return;
        }
        if (phone.length !== 10) {
          setError('Phone number must be 10 digits!');
          setIsLoading(false);
          return;
        }

        const result = await register({
          name,
          email,
          password,
          rollNumber,
          phone,
          department,
          semester,
          instituteCode: instituteCode.trim().toUpperCase() || undefined
        });
        
        if (!result.success) {
          setError(result.message);
        } else {
          setSuccess('Registration successful! Logging you in...');
        }
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    if (role === 'student') {
      setEmail('student@demo.com');
      setPassword('student123');
    } else if (role === 'institute') {
      setEmail('institute@demo.com');
      setPassword('institute123');
    } else {
      setEmail('admin@demo.com');
      setPassword('admin123');
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setRollNumber('');
    setPhone('');
    setDepartment('');
    setSemester('');
    setError('');
    setSuccess('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 flex items-center justify-center p-4">
      {/* Back to Home Button - TOP LEFT */}
      {onBackToHome && (
        <button
          onClick={onBackToHome}
          className="fixed top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-lg transition-all duration-200 border border-white/20 shadow-lg"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Home</span>
        </button>
      )}

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="text-white space-y-6 hidden lg:block">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">🎯 Test Karo</h1>
              <p className="text-indigo-200">AI-Powered Examination System</p>
            </div>
          </div>
          
          <p className="text-lg text-indigo-100">
            A comprehensive online examination platform with AI-assisted question generation, 
            anti-cheating features, and detailed performance analytics.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-indigo-100">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <span>Secure & Proctored Exams with Anti-Cheating</span>
            </div>
            <div className="flex items-center gap-3 text-indigo-100">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5" />
              </div>
              <span>AI Question Generation from Topics/Syllabus</span>
            </div>
            <div className="flex items-center gap-3 text-indigo-100">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <span>Detailed Analytics & Performance Reports</span>
            </div>
          </div>

          <div className="pt-4 border-t border-white/20">
            <p className="text-sm text-indigo-200">
              MCA Final Year Project - AI-Based Online Examination System
            </p>
          </div>
        </div>

        {/* Right side - Login/Register Form */}
        <Card className="w-full max-w-md mx-auto p-6 lg:p-8 max-h-[90vh] overflow-y-auto">
          <div className="text-center mb-6">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-4">
              <Brain className="w-8 h-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-900">🎯 Test Karo</h1>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isLogin ? 'Welcome Back!' : 'Student Registration'}
            </h2>
            <p className="text-gray-500 mt-1">
              {isLogin ? 'Sign in to continue' : 'Create your account to get started'}
            </p>
          </div>

          {/* Role Toggle - Only for Login */}
          {isLogin && (
            <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
              <button
                onClick={() => setRole('student')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  role === 'student' 
                    ? 'bg-white text-indigo-600 shadow' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                Student
              </button>
              <button
                onClick={() => setRole('admin')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  role === 'admin' 
                    ? 'bg-white text-indigo-600 shadow' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Shield className="w-4 h-4" />
                Admin
              </button>
              <button
                onClick={() => setRole('institute')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  role === 'institute' 
                    ? 'bg-white text-indigo-600 shadow' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Building2 className="w-4 h-4" />
                Institute
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Registration Fields */}
            {!isLogin && (
              <>
                <div className="relative">
                  <User className="absolute left-3 top-9 w-4 h-4 text-gray-400" />
                  <Input
                    label="Full Name *"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>

                <div className="relative">
                  <Hash className="absolute left-3 top-9 w-4 h-4 text-gray-400" />
                  <Input
                    label="Roll Number *"
                    type="text"
                    placeholder="Enter your roll number"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                    className="pl-10"
                    required
                  />
                </div>

                <div className="relative">
                  <Phone className="absolute left-3 top-9 w-4 h-4 text-gray-400" />
                  <Input
                    label="Phone Number *"
                    type="tel"
                    placeholder="10 digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="pl-10"
                    required
                  />
                </div>

                <div className="relative">
                  <Building className="absolute left-3 top-9 w-4 h-4 text-gray-400" />
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department *
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">Select Department</option>
                    <option value="Computer Applications">MCA - Computer Applications</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="Civil">Civil</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="relative">
                  <Calendar className="absolute left-3 top-9 w-4 h-4 text-gray-400" />
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Semester *
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">Select Semester</option>
                    <option value="1st">1st Semester</option>
                    <option value="2nd">2nd Semester</option>
                    <option value="3rd">3rd Semester</option>
                    <option value="4th">4th Semester</option>
                    <option value="5th">5th Semester</option>
                    <option value="6th">6th Semester</option>
                    <option value="7th">7th Semester</option>
                    <option value="8th">8th Semester</option>
                  </select>
                </div>

                <div className="relative">
                  <Hash className="absolute left-3 top-9 w-4 h-4 text-gray-400" />
                  <Input
                    label="Institute Code (Optional)"
                    type="text"
                    placeholder="Enter institute code if applicable"
                    value={instituteCode}
                    onChange={(e) => setInstituteCode(e.target.value.toUpperCase())}
                    className="pl-10 font-mono"
                  />
                  <p className="text-xs text-gray-400 mt-1 ml-1">Get this code from your institute/teacher</p>
                </div>
              </>
            )}

            {/* Common Fields */}
            <div className="relative">
              <Mail className="absolute left-3 top-9 w-4 h-4 text-gray-400" />
              <Input
                label="Email Address *"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-9 w-4 h-4 text-gray-400" />
              <Input
                label="Password *"
                type="password"
                placeholder={isLogin ? "Enter your password" : "Create password (min 6 chars)"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>

            {!isLogin && (
              <div className="relative">
                <Lock className="absolute left-3 top-9 w-4 h-4 text-gray-400" />
                <Input
                  label="Confirm Password *"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <Lock className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                {success}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              {isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          {/* Demo Credentials */}
          {isLogin && (
            <div className="mt-4">
              <button
                onClick={fillDemoCredentials}
                className="w-full text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Use Demo Credentials ({role})
              </button>
            </div>
          )}

          {/* Toggle Login/Register */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                resetForm();
              }}
              className="text-sm text-gray-600 hover:text-indigo-600"
            >
              {isLogin 
                ? "Don't have an account? Register Now" 
                : 'Already have an account? Sign in'}
            </button>
          </div>

          {/* Demo Credentials Box */}
          {isLogin && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 text-center mb-2">Demo Credentials:</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <p className="font-medium text-gray-700">Student</p>
                  <p className="text-gray-500">student@demo.com</p>
                  <p className="text-gray-500">student123</p>
                </div>
                <div className="text-center">
                  <p className="font-medium text-gray-700">Admin</p>
                  <p className="text-gray-500">admin@demo.com</p>
                  <p className="text-gray-500">admin123</p>
                </div>
                <div className="text-center">
                  <p className="font-medium text-gray-700">Institute</p>
                  <p className="text-gray-500">institute@demo.com</p>
                  <p className="text-gray-500">institute123</p>
                </div>
              </div>
            </div>
          )}

          {/* Back to Home button is now at top left corner */}
        </Card>
      </div>
    </div>
  );
}
