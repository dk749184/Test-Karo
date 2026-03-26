// ============================================
// PUBLIC LANDING PAGE - HOME PAGE
// Shows all exams - Public exams can be attempted without login
// ============================================

import { useState } from 'react';
import { useExam } from '../context/ExamContext';
import { Exam } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import {
  GraduationCap,
  Clock,
  Users,
  Award,
  Search,
  BookOpen,
  Building,
  Trophy,
  Play,
  Lock,
  Globe,
  Star,
  CheckCircle,
  Shield,
  Zap,
  FileText,
  ArrowRight,
  Menu,
  X
} from 'lucide-react';

interface LandingPageProps {
  onLoginClick: () => void;
  onStartGuestExam: (exam: Exam, guestInfo: { name: string; email: string }) => void;
}

export function LandingPage({ onLoginClick, onStartGuestExam }: LandingPageProps) {
  const { exams } = useExam();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Get active exams only
  const now = new Date();
  const activeExams = exams.filter(exam => {
    if (!exam.isActive) return false;
    const start = new Date(exam.scheduledStart || 0);
    const end = new Date(exam.scheduledEnd || Date.now() + 86400000);
    return now >= start && now <= end;
  });

  // Filter exams
  const filteredExams = activeExams.filter(exam => {
    const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          exam.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || exam.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Count exams by category
  const categoryCounts = {
    all: activeExams.length,
    school: activeExams.filter(e => e.category === 'school').length,
    college: activeExams.filter(e => e.category === 'college').length,
    competitive: activeExams.filter(e => e.category === 'competitive').length,
  };

  // Handle starting a public exam
  const handleStartExam = (exam: Exam) => {
    if (exam.isPublic) {
      setSelectedExam(exam);
      setShowGuestForm(true);
    } else {
      onLoginClick();
    }
  };

  // Handle guest form submit
  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedExam && guestName.trim() && guestEmail.trim()) {
      onStartGuestExam(selectedExam, { name: guestName, email: guestEmail });
    }
  };

  // Categories for tabs
  const categories = [
    { id: 'all', label: 'All Exams', icon: BookOpen },
    { id: 'school', label: 'School', icon: GraduationCap },
    { id: 'college', label: 'College', icon: Building },
    { id: 'competitive', label: 'Competitive', icon: Trophy },
  ];

  // Features list
  const features = [
    { icon: Shield, title: 'Secure Exams', desc: 'Anti-cheating protection' },
    { icon: Zap, title: 'AI Powered', desc: 'Smart question generation' },
    { icon: Clock, title: 'Timed Tests', desc: 'Auto-submit on time expiry' },
    { icon: Award, title: 'Instant Results', desc: 'Get scores immediately' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Guest Registration Modal */}
      {showGuestForm && selectedExam && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md animate-fade-in">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Play className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Start Free Exam</h3>
                <p className="text-gray-500 mt-1">{selectedExam.title}</p>
              </div>

              <form onSubmit={handleGuestSubmit} className="space-y-4">
                <Input
                  label="Your Name"
                  placeholder="Enter your full name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  required
                />
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="Enter your email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  required
                  helperText="We'll send your result to this email"
                />

                <div className="bg-blue-50 rounded-lg p-4 text-sm">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900">Exam Details</p>
                      <ul className="text-blue-700 mt-1 space-y-1">
                        <li>• {selectedExam.totalQuestions} Questions</li>
                        <li>• {selectedExam.duration} Minutes Duration</li>
                        <li>• {selectedExam.subject}</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => {
                      setShowGuestForm(false);
                      setSelectedExam(null);
                      setGuestName('');
                      setGuestEmail('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    <Play className="w-4 h-4 mr-2" />
                    Start Exam
                  </Button>
                </div>
              </form>

              <p className="text-center text-sm text-gray-500 mt-4">
                Want to track your progress?{' '}
                <button onClick={onLoginClick} className="text-blue-600 hover:underline font-medium">
                  Create an account
                </button>
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Navigation */}
      <nav className="bg-white/10 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">🎯 Test Karo</h1>
                <p className="text-xs text-gray-300 hidden sm:block">AI-Powered Examination</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#exams" className="text-gray-300 hover:text-white transition-colors">Exams</a>
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="#about" className="text-gray-300 hover:text-white transition-colors">About</a>
              <Button onClick={onLoginClick} size="sm">
                <Lock className="w-4 h-4 mr-2" />
                Login / Register
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-white p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/10 backdrop-blur-md border-t border-white/10 p-4 space-y-4">
            <a href="#exams" className="block text-gray-300 hover:text-white py-2">Exams</a>
            <a href="#features" className="block text-gray-300 hover:text-white py-2">Features</a>
            <a href="#about" className="block text-gray-300 hover:text-white py-2">About</a>
            <Button onClick={onLoginClick} fullWidth>
              <Lock className="w-4 h-4 mr-2" />
              Login / Register
            </Button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-sm text-gray-300 mb-6">
            <Star className="w-4 h-4 text-yellow-400" />
            <span>Trusted by 10,000+ Students</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            AI-Powered Online
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> Examination </span>
            System
          </h1>
          
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            Take exams anytime, anywhere. Advanced anti-cheating protection, 
            instant results, and AI-generated questions for effective learning.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => document.getElementById('exams')?.scrollIntoView({ behavior: 'smooth' })}>
              <Play className="w-5 h-5 mr-2" />
              Browse Free Exams
            </Button>
            <Button variant="secondary" size="lg" onClick={onLoginClick} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Lock className="w-5 h-5 mr-2" />
              Student Login
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-4xl mx-auto">
            {[
              { value: activeExams.length + '+', label: 'Active Exams' },
              { value: '10K+', label: 'Students' },
              { value: '15+', label: 'Subjects' },
              { value: '99%', label: 'Uptime' },
            ].map((stat, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <p className="text-2xl md:text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-gray-400 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-4 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Why Choose Test Karo?</h2>
            <p className="text-gray-400">Advanced features for modern online examinations</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-white/20 transition-all">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Exams Section */}
      <section id="exams" className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">Available Exams</h2>
            <p className="text-gray-400">Choose from a variety of exams across different categories</p>
          </div>

          {/* Search and Categories */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 mb-8 border border-white/10">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search exams..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Category Tabs */}
              <div className="flex gap-2 overflow-x-auto">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl whitespace-nowrap transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    <cat.icon className="w-4 h-4" />
                    <span>{cat.label}</span>
                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                      {categoryCounts[cat.id as keyof typeof categoryCounts]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Exams Grid */}
          {filteredExams.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Exams Found</h3>
              <p className="text-gray-400">Try changing your search or category filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExams.map((exam) => (
                <div
                  key={exam.id}
                  className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden hover:bg-white/20 transition-all group"
                >
                  {/* Exam Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        exam.isPublic 
                          ? 'bg-green-400/20 text-green-300 border border-green-400/30'
                          : 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/30'
                      }`}>
                        {exam.isPublic ? (
                          <>
                            <Globe className="w-3 h-3 inline mr-1" />
                            Free Access
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3 inline mr-1" />
                            Login Required
                          </>
                        )}
                      </span>
                      <span className="text-white/80 text-xs capitalize">{exam.category}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white">{exam.title}</h3>
                  </div>

                  {/* Exam Details */}
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-300">
                        <BookOpen className="w-4 h-4 text-blue-400" />
                        <span>{exam.subject}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <FileText className="w-4 h-4 text-purple-400" />
                        <span>{exam.totalQuestions} Questions</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <Clock className="w-4 h-4 text-green-400" />
                        <span>{exam.duration} Minutes</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <Users className="w-4 h-4 text-yellow-400" />
                        <span>{Math.floor(Math.random() * 500) + 100} Attempted</span>
                      </div>
                    </div>

                    {/* Difficulty Badge */}
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        exam.difficulty === 'easy' ? 'bg-green-500/20 text-green-300' :
                        exam.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-red-500/20 text-red-300'
                      }`}>
                        {exam.difficulty.charAt(0).toUpperCase() + exam.difficulty.slice(1)}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {exam.class}
                      </span>
                    </div>

                    {/* Action Button */}
                    <Button
                      onClick={() => handleStartExam(exam)}
                      fullWidth
                      className="group-hover:shadow-lg"
                    >
                      {exam.isPublic ? (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Start Free Exam
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 mr-2" />
                          Login to Attempt
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 px-4 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">About Test Karo</h2>
              <p className="text-gray-300 mb-4">
                Test Karo is an AI-powered online examination system designed for modern education. 
                Our platform provides secure, reliable, and efficient online testing for schools, 
                colleges, and competitive exam preparation.
              </p>
              <p className="text-gray-300 mb-6">
                With advanced anti-cheating measures, AI-generated questions, and instant results, 
                we make online examinations fair, accessible, and effective.
              </p>

              <ul className="space-y-3">
                {[
                  'AI-powered question generation',
                  'Real-time anti-cheating detection',
                  'Instant result & detailed analytics',
                  'Secure & encrypted exam environment',
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <Button className="mt-8" onClick={onLoginClick}>
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: GraduationCap, title: 'For Students', desc: 'Practice & improve with instant feedback' },
                { icon: Building, title: 'For Institutions', desc: 'Conduct secure online examinations' },
                { icon: Trophy, title: 'For Competitions', desc: 'Host competitive exams at scale' },
                { icon: Award, title: 'Certifications', desc: 'Issue certificates for achievements' },
              ].map((item, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                  <item.icon className="w-8 h-8 text-blue-400 mb-3" />
                  <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 md:p-12">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Learning?</h2>
            <p className="text-blue-100 mb-8 max-w-xl mx-auto">
              Join thousands of students who are already using Test Karo to prepare for their exams.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={onLoginClick}
                className="bg-white text-blue-600 hover:bg-gray-100"
              >
                Create Free Account
              </Button>
              <Button 
                variant="secondary" 
                size="lg"
                onClick={() => document.getElementById('exams')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Browse Exams
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/30 border-t border-white/10 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">🎯 Test Karo</h1>
                <p className="text-xs text-gray-400">AI-Based Examination System</p>
              </div>
            </div>

            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Test Karo. MCA Final Year Project.
            </p>

            <div className="flex items-center gap-4">
              <a href="#" className="text-gray-400 hover:text-white text-sm">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
