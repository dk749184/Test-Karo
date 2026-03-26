// ============================================
// MANAGE STUDENTS PAGE - Admin
// View, Edit, Delete registered students
// ============================================

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { 
  Users, Search, Trash2, Eye, Mail, Phone, Hash, 
  Building, Calendar, Clock, Download, UserX, CheckCircle,
  XCircle, RefreshCw, Edit, Save, X
} from 'lucide-react';

interface StudentData {
  id: string;
  name: string;
  email: string;
  rollNumber?: string;
  phone?: string;
  department?: string;
  semester?: string;
  registeredAt?: string;
  profileImage?: string;
}

export function ManageStudents() {
  const { getAllStudents, deleteStudent, updateStudent } = useAuth();
  const [students, setStudents] = useState<StudentData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [filterDepartment, setFilterDepartment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentData | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    rollNumber: '',
    department: '',
    semester: ''
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Load students
  const loadStudents = async () => {
    setIsLoading(true);
    try {
      const allStudents = await getAllStudents();
      setStudents(allStudents);
    } catch (error) {
      console.error('Error loading students:', error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadStudents();
  }, []);

  // Filter students
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.rollNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesDepartment = !filterDepartment || student.department === filterDepartment;
    
    return matchesSearch && matchesDepartment;
  });

  // Get unique departments
  const departments = [...new Set(students.map(s => s.department).filter(Boolean))];

  // Handle delete
  const handleDelete = async (studentId: string) => {
    await deleteStudent(studentId);
    await loadStudents();
    setShowDeleteConfirm(null);
  };

  // Handle edit click
  const handleEditClick = (student: StudentData) => {
    setEditingStudent(student);
    setEditForm({
      name: student.name || '',
      email: student.email || '',
      phone: student.phone || '',
      rollNumber: student.rollNumber || '',
      department: student.department || '',
      semester: student.semester || ''
    });
    setIsEditing(true);
    setSaveMessage('');
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!editingStudent) return;
    
    setSaveLoading(true);
    setSaveMessage('');
    
    try {
      await updateStudent(editingStudent.id, {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        rollNumber: editForm.rollNumber,
        department: editForm.department,
        semester: editForm.semester
      });
      
      setSaveMessage('✅ Student updated successfully!');
      await loadStudents();
      
      setTimeout(() => {
        setIsEditing(false);
        setEditingStudent(null);
        setSaveMessage('');
      }, 1500);
    } catch (error) {
      setSaveMessage('❌ Error updating student');
      console.error('Error updating student:', error);
    }
    
    setSaveLoading(false);
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Roll Number', 'Phone', 'Department', 'Semester', 'Registered At'];
    const rows = filteredStudents.map(s => [
      s.name,
      s.email,
      s.rollNumber || '',
      s.phone || '',
      s.department || '',
      s.semester || '',
      s.registeredAt ? new Date(s.registeredAt).toLocaleDateString() : ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students_list.csv';
    a.click();
  };

  // Format date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const departmentOptions = [
    'Computer Science',
    'Information Technology',
    'Electronics',
    'Mechanical',
    'Civil',
    'Electrical',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Commerce',
    'Arts',
    'Other'
  ];

  const semesterOptions = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-600" />
            Manage Students
          </h1>
          <p className="text-gray-600 mt-1">View, edit and manage all registered students</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadStudents}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm">Total Students</p>
              <p className="text-3xl font-bold">{students.length}</p>
            </div>
            <Users className="w-10 h-10 opacity-50" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-r from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Today Registered</p>
              <p className="text-3xl font-bold">
                {students.filter(s => {
                  if (!s.registeredAt) return false;
                  const today = new Date().toDateString();
                  return new Date(s.registeredAt).toDateString() === today;
                }).length}
              </p>
            </div>
            <CheckCircle className="w-10 h-10 opacity-50" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Departments</p>
              <p className="text-3xl font-bold">{departments.length}</p>
            </div>
            <Building className="w-10 h-10 opacity-50" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">This Week</p>
              <p className="text-3xl font-bold">
                {students.filter(s => {
                  if (!s.registeredAt) return false;
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return new Date(s.registeredAt) >= weekAgo;
                }).length}
              </p>
            </div>
            <Calendar className="w-10 h-10 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by name, email, or roll number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Loading State */}
      {isLoading ? (
        <Card className="p-12 text-center">
          <RefreshCw className="w-12 h-12 text-indigo-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading students...</p>
        </Card>
      ) : (
        /* Students Table */
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Roll No.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registered
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <UserX className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No students found</p>
                      <p className="text-gray-400 text-sm">
                        {searchTerm ? 'Try different search terms' : 'Students will appear here after registration'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center overflow-hidden">
                            {student.profileImage ? (
                              <img 
                                src={student.profileImage} 
                                alt={student.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-indigo-600 font-medium">
                                {student.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{student.name}</p>
                            <p className="text-sm text-gray-500">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          <Hash className="w-3 h-3 mr-1" />
                          {student.rollNumber || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm">
                          <p className="flex items-center gap-1 text-gray-600">
                            <Phone className="w-3 h-3" />
                            {student.phone || 'N/A'}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm">
                          <p className="text-gray-900">{student.department || 'N/A'}</p>
                          <p className="text-gray-500">{student.semester || ''} Semester</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(student.registeredAt)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedStudent(student)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditClick(student)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Edit Student"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(student.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Student"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* View Student Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
                {selectedStudent.profileImage ? (
                  <img 
                    src={selectedStudent.profileImage} 
                    alt={selectedStudent.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-indigo-600 text-2xl font-bold">
                    {selectedStudent.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-gray-900">{selectedStudent.name}</h3>
              <p className="text-gray-500">{selectedStudent.email}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Hash className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-xs text-gray-500">Roll Number</p>
                  <p className="font-medium">{selectedStudent.rollNumber || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-xs text-gray-500">Phone Number</p>
                  <p className="font-medium">{selectedStudent.phone || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium">{selectedStudent.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Building className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-xs text-gray-500">Department</p>
                  <p className="font-medium">{selectedStudent.department || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-xs text-gray-500">Semester</p>
                  <p className="font-medium">{selectedStudent.semester || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Clock className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-xs text-gray-500">Registered On</p>
                  <p className="font-medium">{formatDate(selectedStudent.registeredAt)}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button 
                variant="outline"
                onClick={() => {
                  setSelectedStudent(null);
                  handleEditClick(selectedStudent);
                }} 
                className="flex-1"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button 
                onClick={() => setSelectedStudent(null)} 
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Edit Student Modal */}
      {isEditing && editingStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Edit className="w-5 h-5 text-indigo-600" />
                Edit Student
              </h3>
              <button 
                onClick={() => {
                  setIsEditing(false);
                  setEditingStudent(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {saveMessage && (
              <div className={`p-3 rounded-lg mb-4 ${
                saveMessage.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {saveMessage}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="Enter email"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Roll Number
                  </label>
                  <Input
                    value={editForm.rollNumber}
                    onChange={(e) => setEditForm({ ...editForm, rollNumber: e.target.value })}
                    placeholder="Enter roll number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <Input
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="Enter phone"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <select
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select Department</option>
                    {departmentOptions.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Semester
                  </label>
                  <select
                    value={editForm.semester}
                    onChange={(e) => setEditForm({ ...editForm, semester: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select Semester</option>
                    {semesterOptions.map(sem => (
                      <option key={sem} value={sem}>{sem}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button 
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditingStudent(null);
                }}
                className="flex-1"
                disabled={saveLoading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveEdit}
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={saveLoading || !editForm.name || !editForm.email}
              >
                {saveLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Student?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this student? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Delete
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
