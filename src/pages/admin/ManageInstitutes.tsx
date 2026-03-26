// ============================================
// MANAGE INSTITUTES PAGE - Admin
// Admin creates and manages institute accounts
// Each institute has a unique code; students link via that code
// ============================================

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Building2, Plus, Trash2, RefreshCw, Hash, Mail,
  Lock, User, Copy, CheckCircle, AlertCircle, X, Eye, EyeOff
} from 'lucide-react';

interface InstituteData {
  id: string;
  name: string;
  email: string;
  instituteName?: string;
  instituteCode?: string;
  registeredAt?: string;
}

export function ManageInstitutes() {
  const { getAllInstitutes, createInstitute, deleteInstitute } = useAuth();

  const [institutes, setInstitutes] = useState<InstituteData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    instituteName: '',
    instituteCode: '',
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => { loadInstitutes(); }, []);

  const loadInstitutes = async () => {
    setIsLoading(true);
    try {
      const data = await getAllInstitutes();
      setInstitutes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    if (!form.name || !form.email || !form.password || !form.instituteName || !form.instituteCode) {
      setFormError('All fields are required.');
      return;
    }
    if (form.password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }
    if (!/^[A-Z0-9]+$/.test(form.instituteCode.toUpperCase())) {
      setFormError('Institute Code must be alphanumeric (e.g., IIT001).');
      return;
    }
    setFormLoading(true);
    const result = await createInstitute({
      ...form,
      instituteCode: form.instituteCode.toUpperCase(),
    });
    setFormLoading(false);
    if (result.success) {
      setFormSuccess(result.message);
      setForm({ name: '', email: '', password: '', instituteName: '', instituteCode: '' });
      loadInstitutes();
      setTimeout(() => { setShowForm(false); setFormSuccess(''); }, 2000);
    } else {
      setFormError(result.message);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteInstitute(id);
    setDeleteConfirm(null);
    loadInstitutes();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const generateCode = () => {
    const prefix = form.instituteName.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'INS';
    const num = Math.floor(100 + Math.random() * 900);
    setForm(f => ({ ...f, instituteCode: `${prefix}${num}` }));
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Institutes</h1>
          <p className="text-gray-500 text-sm mt-1">
            Create institute accounts. Share the unique code with students to link them.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadInstitutes}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={() => { setShowForm(true); setFormError(''); setFormSuccess(''); }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> New Institute
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-700">
          <span className="font-semibold">How it works: </span>
          Create an institute account with a unique code → Share the code with students →
          Students enter this code during registration → They appear in that institute's dashboard automatically.
        </div>
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Create Institute Account</h2>
                <p className="text-xs text-gray-500">All fields required</p>
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Institute Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Institute Name *</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="e.g. IIT Hyderabad"
                    value={form.instituteName}
                    onChange={e => setForm(f => ({ ...f, instituteName: e.target.value }))}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Institute Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Institute Code *</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="e.g. IIT001"
                      value={form.instituteCode}
                      onChange={e => setForm(f => ({ ...f, instituteCode: e.target.value.toUpperCase() }))}
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 uppercase"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={generateCode}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-600 whitespace-nowrap"
                  >
                    Auto Generate
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Students will enter this code during registration to link with your institute.</p>
              </div>

              {/* Login Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="e.g. Dr. Ramesh Kumar"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Login Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    placeholder="institute@email.com"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 6 characters"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="w-full pl-9 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {formError && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{formError}
                </div>
              )}
              {formSuccess && (
                <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />{formSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={formLoading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                {formLoading ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Creating...</>
                ) : (
                  <><Plus className="w-4 h-4" /> Create Institute Account</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Institutes List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
        </div>
      ) : institutes.length === 0 ? (
        <div className="bg-white rounded-xl border p-16 text-center shadow-sm">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No institutes created yet.</p>
          <p className="text-sm text-gray-400 mt-1">Click "New Institute" to create the first institute account.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {institutes.map(inst => (
            <div key={inst.id} className="bg-white rounded-xl border shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{inst.instituteName || inst.name}</p>
                    <p className="text-xs text-gray-500">{inst.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setDeleteConfirm(inst.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Institute Code */}
              <div className="bg-indigo-50 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-indigo-500 font-medium">Institute Code</p>
                  <p className="font-mono font-bold text-indigo-700 text-lg tracking-wider">{inst.instituteCode}</p>
                </div>
                <button
                  onClick={() => copyCode(inst.instituteCode || '')}
                  className="flex items-center gap-1 px-2 py-1.5 bg-indigo-100 hover:bg-indigo-200 rounded-lg text-xs font-medium text-indigo-700 transition-colors"
                >
                  {copiedCode === inst.instituteCode ? (
                    <><CheckCircle className="w-3 h-3" /> Copied!</>
                  ) : (
                    <><Copy className="w-3 h-3" /> Copy</>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Mail className="w-3 h-3" />
                <span className="truncate">{inst.email}</span>
              </div>

              {inst.registeredAt && (
                <p className="text-xs text-gray-400">
                  Created: {new Date(inst.registeredAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              )}

              {/* Delete Confirm */}
              {deleteConfirm === inst.id && (
                <div className="border-t pt-3">
                  <p className="text-xs text-red-600 font-medium mb-2">Delete this institute account?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(inst.id)}
                      className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold"
                    >
                      Yes, Delete
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
