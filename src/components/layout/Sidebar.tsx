// ============================================
// SIDEBAR COMPONENT
// Navigation sidebar for dashboard
// ============================================

import { cn } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';
import {
  Brain,
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  BarChart3,
  Settings,
  LogOut,
  Users,
  FileText,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Mail,
  Building2
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ currentPage, onPageChange, isCollapsed, onToggleCollapse }: SidebarProps) {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isInstitute = user?.role === 'institute';

  const studentMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'exams', label: 'Available Exams', icon: BookOpen },
    { id: 'my-results', label: 'My Results', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const adminMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'manage-exams', label: 'Manage Exams', icon: ClipboardList },
    { id: 'create-exam', label: 'Create Exam', icon: PlusCircle },
    { id: 'ai-questions', label: 'AI Questions', icon: Brain },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'institutes', label: 'Institutes', icon: Building2 },
    { id: 'results', label: 'Results', icon: BarChart3 },
    { id: 'email-logs', label: 'Email Logs', icon: Mail },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const instituteMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Building2 },
    { id: 'institute-students', label: 'My Students', icon: Users },
    { id: 'institute-results', label: 'Results', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const menuItems = isAdmin ? adminMenuItems : isInstitute ? instituteMenuItems : studentMenuItems;

  return (
    <aside className={cn(
      'fixed left-0 top-0 h-full bg-gray-900 text-white transition-all duration-300 z-40',
      isCollapsed ? 'w-20' : 'w-64'
    )}>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Brain className="w-8 h-8 text-indigo-400" />
            <span className="font-bold text-lg">🎯 Test Karo</span>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* User Info */}
      <div className={cn(
        'p-4 border-b border-gray-800',
        isCollapsed && 'flex justify-center'
      )}>
        <div className={cn(
          'flex items-center gap-3',
          isCollapsed && 'justify-center'
        )}>
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
            {user?.name?.charAt(0) || 'U'}
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <p className="font-medium truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                isActive 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800',
                isCollapsed && 'justify-center px-2'
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
        <button
          onClick={logout}
          className={cn(
            'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all',
            isCollapsed && 'justify-center px-2'
          )}
          title={isCollapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
