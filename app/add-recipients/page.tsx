"use client";
import { useState, useRef } from "react";
import { Upload } from "lucide-react";

export default function AddRecipients() {
    // State variables
const [recipients, setRecipients] = useState([]);
const [recipientText, setRecipientText] = useState('');
const [totalEmails, setTotalEmails] = useState(0);
const fileInputRef = useRef(null);

// Parse recipients from text
const parseRecipients = (text) => {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && line.includes('@'))
    .map(line => {
      const parts = line.split(',');
      if (parts.length >= 2) {
        return { name: parts[0].trim(), email: parts[1].trim() };
      }
      return { name: '', email: parts[0].trim() };
    });
};

// Handle text change in textarea
const handleTextChange = (text) => {
  setRecipientText(text);
  const parsed = parseRecipients(text);
  setRecipients(parsed);
  setTotalEmails(parsed.length);
};

// Handle CSV file upload
const handleFileUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const text = event.target.result;
    setRecipientText(text);
    const parsed = parseRecipients(text);
    setRecipients(parsed);
    setTotalEmails(parsed.length);
  };
  reader.readAsText(file);
};

    return (
        <div className="sm:mt-21 bg-gradient-to-br from-red-200 to-slate-500 min-h-screen p-4 sm:ml-64">
  <div className="max-w-4xl mx-auto">
    <div className="rounded-xl bg-gradient-to-br from-white to-slate-200 p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Manage Recipients</h2>
      <div className="bg-green-50 p-6 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-4">Upload or Enter Recipients</h3>
        <div>
          {/* CSV Upload Section */}
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload CSV File
          </label>
          <div className="flex gap-2 mb-4">
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current.click()}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Upload className="w-5 h-5" />
              Upload CSV File
            </button>
          </div>
          
          {/* Format Instructions */}
          <p className="text-xs text-gray-600 mb-3">
            Format: Name, email@example.com or just email@example.com (one per line)
          </p>
          
          {/* Manual Entry Section */}
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Or Enter Manually
          </label>
          <textarea
            value={recipientText}
            onChange={(e) => handleTextChange(e.target.value)}
            rows={15}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm"
            placeholder="John Doe, john@example.com&#10;Jane Smith, jane@example.com&#10;bob@example.com"
          />
          
          {/* Total Count Display */}
          <div className="mt-4 p-4 bg-white rounded-lg border border-green-200">
            <p className="text-lg font-semibold text-gray-800">
              Total Recipients: <span className="text-green-600">{recipients.length.toLocaleString() || totalEmails.toLocaleString() || 0}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
        </div>
    );
}