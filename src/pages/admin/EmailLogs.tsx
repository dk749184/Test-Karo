import { useState, useEffect } from 'react';
import { getEmailLogs, clearEmailLogs, EmailLog, isEmailConfigured } from '../../services/emailService';

export function EmailLogs() {
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);
  const [filter, setFilter] = useState('all');
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  useEffect(() => {
    loadEmails();
  }, []);

  const loadEmails = () => {
    const sentEmails = getEmailLogs();
    setEmails(sentEmails.sort((a: EmailLog, b: EmailLog) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ));
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all email logs?')) {
      clearEmailLogs();
      setEmails([]);
    }
  };

  const filteredEmails = emails.filter(email => {
    if (filter === 'all') return true;
    return email.type === filter;
  });

  const configured = isEmailConfigured();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📧 Email Logs</h1>
          <p className="text-gray-600 mt-1">View all sent confirmation emails</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowSetupGuide(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <span>⚙️</span> Setup Guide
          </button>
          <button
            onClick={loadEmails}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <span>🔄</span> Refresh
          </button>
          <button
            onClick={handleClearAll}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
          >
            <span>🗑️</span> Clear All
          </button>
        </div>
      </div>

      {/* Configuration Status */}
      <div className={`rounded-xl p-4 ${configured ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{configured ? '✅' : '⚠️'}</span>
          <div>
            <h3 className={`font-semibold ${configured ? 'text-green-800' : 'text-yellow-800'}`}>
              {configured ? 'EmailJS Configured - Real Emails Enabled' : 'EmailJS Not Configured - Simulation Mode'}
            </h3>
            <p className={`text-sm ${configured ? 'text-green-600' : 'text-yellow-600'}`}>
              {configured 
                ? 'Emails are being sent to students via EmailJS.'
                : 'Emails are being simulated. Click "Setup Guide" to enable real email sending.'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="text-3xl font-bold text-blue-600">{emails.length}</div>
          <div className="text-gray-600 text-sm">Total Emails</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="text-3xl font-bold text-green-600">
            {emails.filter(e => e.type === 'exam_confirmation').length}
          </div>
          <div className="text-gray-600 text-sm">Exam Confirmations</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="text-3xl font-bold text-purple-600">
            {emails.filter(e => e.type === 'result_notification').length}
          </div>
          <div className="text-gray-600 text-sm">Result Notifications</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="text-3xl font-bold text-emerald-600">
            {emails.filter(e => e.status === 'sent').length}
          </div>
          <div className="text-gray-600 text-sm">Successfully Sent</div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <div className="flex items-center gap-4">
          <span className="text-gray-600">Filter by type:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="all">All Emails</option>
            <option value="exam_confirmation">Exam Confirmation</option>
            <option value="result_notification">Result Notification</option>
          </select>
        </div>
      </div>

      {/* Email List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {filteredEmails.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-2">📭</div>
            <p>No emails sent yet</p>
            <p className="text-sm mt-2">Emails will appear here when students complete exams</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">To</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Subject</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Type</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Sent At</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Method</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredEmails.map((email) => (
                  <tr key={email.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-800">{email.to}</td>
                    <td className="px-4 py-3 text-gray-800 max-w-xs truncate">{email.subject}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        email.type === 'exam_confirmation' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {email.type === 'exam_confirmation' ? '📝 Exam' : '📊 Result'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-sm">
                      {new Date(email.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        email.status === 'sent' 
                          ? 'bg-green-100 text-green-800'
                          : email.status === 'simulated'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {email.status === 'sent' ? '✓ Sent' : email.status === 'simulated' ? '🔄 Simulated' : '✗ Failed'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        email.method === 'emailjs' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {email.method === 'emailjs' ? '📧 EmailJS' : '💾 Local'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedEmail(email)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Email Preview Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold text-gray-800">📧 Email Preview</h2>
              <button
                onClick={() => setSelectedEmail(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Email Details */}
            <div className="p-4 bg-gray-50 border-b">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">To:</span>
                  <span className="ml-2 text-gray-800 font-medium">{selectedEmail.to}</span>
                </div>
                <div>
                  <span className="text-gray-500">Sent At:</span>
                  <span className="ml-2 text-gray-800 font-medium">
                    {new Date(selectedEmail.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">Subject:</span>
                  <span className="ml-2 text-gray-800 font-medium">{selectedEmail.subject}</span>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <span className={`ml-2 font-medium ${
                    selectedEmail.status === 'sent' ? 'text-green-600' : 
                    selectedEmail.status === 'simulated' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {selectedEmail.status === 'sent' ? '✓ Sent via EmailJS' : 
                     selectedEmail.status === 'simulated' ? '🔄 Simulated (Not actually sent)' : '✗ Failed'}
                  </span>
                </div>
              </div>
            </div>

            {/* Email Body */}
            <div className="p-4 overflow-y-auto max-h-96">
              <pre className="bg-gray-100 p-4 rounded-lg whitespace-pre-wrap font-mono text-sm">
                {selectedEmail.content}
              </pre>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedEmail.content);
                  alert('Email content copied to clipboard!');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                📋 Copy Content
              </button>
              <button
                onClick={() => setSelectedEmail(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Setup Guide Modal */}
      {showSetupGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-600 to-blue-600">
              <h2 className="text-xl font-bold text-white">📧 EmailJS Setup Guide - Send Real Emails FREE</h2>
              <button
                onClick={() => setShowSetupGuide(false)}
                className="text-white hover:text-gray-200 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="space-y-6">
                {/* Step 1 */}
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <h3 className="font-bold text-blue-800 text-lg mb-2">Step 1: Create EmailJS Account (FREE)</h3>
                  <ol className="list-decimal ml-6 space-y-2 text-blue-700">
                    <li>Go to <a href="https://www.emailjs.com/" target="_blank" className="underline font-semibold">https://www.emailjs.com/</a></li>
                    <li>Click <strong>"Sign Up Free"</strong></li>
                    <li>Create account with your email</li>
                    <li>Free plan gives <strong>200 emails/month</strong></li>
                  </ol>
                </div>

                {/* Step 2 */}
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <h3 className="font-bold text-green-800 text-lg mb-2">Step 2: Add Email Service</h3>
                  <ol className="list-decimal ml-6 space-y-2 text-green-700">
                    <li>After login, go to <strong>"Email Services"</strong> in sidebar</li>
                    <li>Click <strong>"Add New Service"</strong></li>
                    <li>Choose <strong>Gmail</strong> or <strong>Outlook</strong></li>
                    <li>Click <strong>"Connect Account"</strong> and authorize</li>
                    <li>Copy your <strong>Service ID</strong> (e.g., service_abc123)</li>
                  </ol>
                </div>

                {/* Step 3 */}
                <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                  <h3 className="font-bold text-yellow-800 text-lg mb-2">Step 3: Create Email Template</h3>
                  <ol className="list-decimal ml-6 space-y-2 text-yellow-700">
                    <li>Go to <strong>"Email Templates"</strong></li>
                    <li>Click <strong>"Create New Template"</strong></li>
                    <li>Set Subject: <code className="bg-yellow-100 px-1 rounded">{"{{subject}}"}</code></li>
                    <li>Set To Email: <code className="bg-yellow-100 px-1 rounded">{"{{to_email}}"}</code></li>
                    <li>Set Content: <code className="bg-yellow-100 px-1 rounded">{"{{message}}"}</code></li>
                    <li>Click <strong>Save</strong></li>
                    <li>Copy your <strong>Template ID</strong> (e.g., template_xyz789)</li>
                  </ol>
                </div>

                {/* Step 4 */}
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                  <h3 className="font-bold text-purple-800 text-lg mb-2">Step 4: Get Public Key</h3>
                  <ol className="list-decimal ml-6 space-y-2 text-purple-700">
                    <li>Go to <strong>"Account"</strong> → <strong>"API Keys"</strong></li>
                    <li>Copy your <strong>Public Key</strong></li>
                  </ol>
                </div>

                {/* Step 5 */}
                <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                  <h3 className="font-bold text-red-800 text-lg mb-2">Step 5: Update Code</h3>
                  <p className="text-red-700 mb-3">Open file: <code className="bg-red-100 px-2 py-1 rounded">src/services/emailService.ts</code></p>
                  <pre className="bg-gray-800 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
{`const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_xxxxxxx',    // Your Service ID
  TEMPLATE_ID: 'template_xxxxxxx',  // Your Template ID
  PUBLIC_KEY: 'xxxxxxxxxxxxxxx',    // Your Public Key
  IS_CONFIGURED: true               // Change to true
};`}
                  </pre>
                </div>

                {/* Success */}
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                  <h3 className="font-bold text-emerald-800 text-lg mb-2">✅ Done! Real Emails Enabled</h3>
                  <p className="text-emerald-700">
                    After updating the config, students will receive real emails when they complete exams!
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
              <a
                href="https://www.emailjs.com/"
                target="_blank"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                🔗 Open EmailJS Website
              </a>
              <button
                onClick={() => setShowSetupGuide(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
