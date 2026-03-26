import React, { useState, useEffect } from 'react';
import { isSupabaseConfigured } from '../lib/supabase';

const SetupPage: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (isSupabaseConfigured()) {
      setCurrentStep(4);
      setTestStatus('success');
    }
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const testConnection = async () => {
    setTestStatus('testing');
    
    if (!isSupabaseConfigured()) {
      setTestStatus('error');
      return;
    }

    try {
      const { supabase } = await import('../lib/supabase');
      const { error } = await supabase.from('users').select('id').limit(1);
      
      if (error) {
        setTestStatus('error');
      } else {
        setTestStatus('success');
      }
    } catch {
      setTestStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🗄️ Database Setup</h1>
          <p className="text-blue-200">Connect your app to Supabase Cloud Database (FREE)</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3, 4].map((step) => (
              <React.Fragment key={step}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  currentStep >= step ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-300'
                }`}>
                  {currentStep > step ? '✓' : step}
                </div>
                {step < 4 && (
                  <div className={`w-16 h-1 ${currentStep > step ? 'bg-green-500' : 'bg-gray-600'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Step 1: Create Supabase Account */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Step 1: Create Supabase Account (FREE) 🆓
              </h2>
              <div className="bg-blue-50 rounded-xl p-6 mb-6">
                <ol className="space-y-4 text-gray-700">
                  <li className="flex items-start gap-3">
                    <span className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                    <div>
                      <p>Open Supabase website:</p>
                      <a 
                        href="https://supabase.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-semibold"
                      >
                        https://supabase.com →
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                    <p>Click <strong>"Start your project"</strong> button</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                    <p>Sign up with <strong>GitHub</strong> (easiest) or Email</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
                    <p>Click <strong>"New Project"</strong></p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">5</span>
                    <div>
                      <p>Fill project details:</p>
                      <ul className="mt-2 ml-4 space-y-1 text-sm">
                        <li>• Name: <code className="bg-gray-200 px-2 py-1 rounded">exam-system</code></li>
                        <li>• Database Password: <strong>Choose a strong password (save it!)</strong></li>
                        <li>• Region: <strong>Select nearest to you</strong></li>
                      </ul>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">6</span>
                    <p>Click <strong>"Create new project"</strong> (wait 2-3 minutes)</p>
                  </li>
                </ol>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                <p className="text-green-800">
                  <strong>✅ FREE Tier includes:</strong> 500MB Database, Unlimited API requests, 50,000 monthly active users
                </p>
              </div>

              <button
                onClick={() => setCurrentStep(2)}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
              >
                Account Created → Next Step
              </button>
            </div>
          )}

          {/* Step 2: Create Tables */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Step 2: Create Database Tables 📊
              </h2>
              <div className="bg-blue-50 rounded-xl p-6 mb-6">
                <ol className="space-y-4 text-gray-700">
                  <li className="flex items-start gap-3">
                    <span className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                    <p>In Supabase Dashboard, click <strong>"SQL Editor"</strong> (left sidebar)</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                    <p>Click <strong>"New query"</strong></p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                    <div>
                      <p>Copy this SQL code and paste in editor:</p>
                      <div className="mt-3 relative">
                        <button
                          onClick={() => copyToClipboard(sqlSchema, 'sql')}
                          className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                        >
                          {copied === 'sql' ? '✓ Copied!' : '📋 Copy SQL'}
                        </button>
                        <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs max-h-60 overflow-auto">
                          {sqlSchema.substring(0, 500)}...
                        </pre>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        💡 Full SQL is in file: <code>database/supabase_schema.sql</code>
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
                    <p>Click <strong>"Run"</strong> button (or press Ctrl+Enter)</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">5</span>
                    <p>You should see <strong>"Success. No rows returned"</strong></p>
                  </li>
                </ol>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
                >
                  Tables Created → Next Step
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Get API Keys */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Step 3: Get API Keys & Update Code 🔑
              </h2>
              <div className="bg-blue-50 rounded-xl p-6 mb-6">
                <ol className="space-y-4 text-gray-700">
                  <li className="flex items-start gap-3">
                    <span className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                    <p>In Supabase Dashboard, click <strong>"Settings"</strong> (gear icon, bottom left)</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                    <p>Click <strong>"API"</strong> in the sidebar</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                    <div>
                      <p>Copy these values:</p>
                      <div className="mt-2 space-y-2">
                        <div className="bg-white p-3 rounded border">
                          <p className="text-sm text-gray-500">Project URL:</p>
                          <code className="text-blue-600">https://xxxxx.supabase.co</code>
                        </div>
                        <div className="bg-white p-3 rounded border">
                          <p className="text-sm text-gray-500">anon/public key:</p>
                          <code className="text-blue-600 text-xs break-all">eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</code>
                        </div>
                      </div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
                    <div>
                      <p>Open file: <code className="bg-gray-200 px-2 py-1 rounded">src/lib/supabase.ts</code></p>
                      <p className="mt-2">Update these lines:</p>
                      <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm mt-2">
{`const SUPABASE_URL = 'https://xxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1...';`}
                      </pre>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">5</span>
                    <p>Save the file and <strong>refresh this page</strong></p>
                  </li>
                </ol>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <p className="text-yellow-800">
                  <strong>⚠️ Note:</strong> After updating supabase.ts, you need to rebuild the project:
                  <code className="block mt-2 bg-yellow-100 p-2 rounded">npm run build</code>
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setCurrentStep(4)}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
                >
                  Code Updated → Test Connection
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Test Connection */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Step 4: Test Connection ✅
              </h2>
              
              <div className="bg-gray-50 rounded-xl p-6 mb-6 text-center">
                {testStatus === 'idle' && (
                  <div>
                    <p className="text-gray-600 mb-4">Click the button to test your database connection</p>
                    <button
                      onClick={testConnection}
                      className="bg-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 transition"
                    >
                      🔌 Test Connection
                    </button>
                  </div>
                )}

                {testStatus === 'testing' && (
                  <div>
                    <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Testing connection...</p>
                  </div>
                )}

                {testStatus === 'success' && (
                  <div>
                    <div className="text-6xl mb-4">✅</div>
                    <h3 className="text-2xl font-bold text-green-600 mb-2">Connection Successful!</h3>
                    <p className="text-gray-600 mb-6">Your database is connected and ready to use.</p>
                    <button
                      onClick={onComplete}
                      className="bg-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 transition"
                    >
                      🚀 Start Using the App
                    </button>
                  </div>
                )}

                {testStatus === 'error' && (
                  <div>
                    <div className="text-6xl mb-4">❌</div>
                    <h3 className="text-2xl font-bold text-red-600 mb-2">Connection Failed</h3>
                    <p className="text-gray-600 mb-4">Please check your Supabase credentials and try again.</p>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left mb-4">
                      <p className="text-red-800 font-semibold">Troubleshooting:</p>
                      <ul className="text-red-700 text-sm mt-2 space-y-1">
                        <li>• Check if SUPABASE_URL is correct (starts with https://)</li>
                        <li>• Check if SUPABASE_ANON_KEY is correct (long JWT token)</li>
                        <li>• Make sure you ran the SQL schema in Step 2</li>
                        <li>• Rebuild the project after updating credentials</li>
                      </ul>
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setCurrentStep(3)}
                        className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition"
                      >
                        ← Check Credentials
                      </button>
                      <button
                        onClick={testConnection}
                        className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
                      >
                        🔄 Try Again
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {testStatus !== 'success' && testStatus !== 'error' && (
                <button
                  onClick={() => setCurrentStep(3)}
                  className="w-full bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition"
                >
                  ← Back
                </button>
              )}
            </div>
          )}
        </div>

        {/* Skip Option */}
        {testStatus !== 'success' && (
          <div className="text-center mt-6">
            <button
              onClick={onComplete}
              className="text-blue-300 hover:text-white transition"
            >
              Skip setup (use demo mode with localStorage) →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// SQL Schema for copy
const sqlSchema = `-- SUPABASE DATABASE SCHEMA
-- AI-Based Online Examination System

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'student',
    roll_number VARCHAR(50),
    phone VARCHAR(20),
    department VARCHAR(100),
    semester VARCHAR(20),
    profile_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Default users
INSERT INTO users (email, password_hash, name, role) VALUES
('admin@demo.com', 'admin123', 'Admin User', 'admin'),
('student@demo.com', 'student123', 'Demo Student', 'student');

-- See full schema in: database/supabase_schema.sql`;

export default SetupPage;
