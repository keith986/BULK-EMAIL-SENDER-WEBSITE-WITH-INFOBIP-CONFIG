"use client";
import Protected from '../_components/Protected';
import { useState, useRef } from "react";
import { Upload } from "lucide-react";
import { uploadRecipientsToFirebase } from '../_utils/firebase-operations';
import { toast, ToastContainer } from "react-toastify";
import { useUser } from '../_context/UserProvider';

interface Recipient {
  name: string;
  email: string;
}

export default function AddRecipients() {
    // State variables
const [recipients, setRecipients] = useState<Recipient[]>([]);
const [recipientText, setRecipientText] = useState('');
const [totalEmails, setTotalEmails] = useState(0);
const fileInputRef = useRef<HTMLInputElement | null>(null);
const [isLoading, setIsLoading] = useState(false);
const { user } = useUser();

// Parse recipients from text
const parseRecipients = (text: string): Recipient[] => {
  return text
    .split('\n')
    .map((line: string) => line.trim())
    .filter((line: string) => line && line.includes('@'))
    .map((line: string) => {
      const parts = line.split(',');
      if (parts.length >= 2) {
        return { name: parts[0].trim(), email: parts[1].trim() };
      }
      return { name: '', email: parts[0].trim() };
    });
};

// Handle text change in textarea
const handleTextChange = (text: string) => {
  setRecipientText(text);
  const parsed = parseRecipients(text);
  setRecipients(parsed);
  setTotalEmails(parsed.length);
};

// Handle CSV file upload
const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event: ProgressEvent<FileReader>) => {
    const text = String(event.target?.result ?? '');
    setRecipientText(text);
    const parsed = parseRecipients(text);
    setRecipients(parsed);
    setTotalEmails(parsed.length);
  };
  reader.readAsText(file);
};

// Save recipients to Firebase using the service
  const saveRecipients = async () => {
    if (recipients.length === 0) {
      toast.info('Please add recipients before saving');
      return;
    }
    setIsLoading(true);
    try {
      const result = await uploadRecipientsToFirebase({
        userId: user?.uid as string,
        recipients: recipients,
        totalCount: recipients.length,
        rawText: recipientText
      });

      if (result.code === 777) {
        // Give immediate feedback about how many were added (if helper returned count)
        const added = typeof result.added === 'number' ? result.added : undefined;
        if (added === 0) {
          toast.info('No new recipients were added — all entries are duplicates of existing records.');
        } else if (added && added > 0) {
          toast.success(`${added} new recipient(s) added.`);
          // clear inputs only when we actually added recipients
          const id_recepients = document.getElementById('recipients');
          if (id_recepients) {
            const ta = id_recepients as HTMLTextAreaElement;
            ta.value = '';
          }
          setRecipientText('');
          setRecipients([]);
          setTotalEmails(0);
        } else {
          // fallback to generic message
          toast.success(result.message);
        }
      } else {
        toast.error('Error: ' + result.message);
      }
    } catch (error) {
      console.error('Error saving to Firebase:', error);
      toast.error('Error saving recipients');
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

    return (
      <Protected>
        <div className="sm:mt-21 bg-gradient-to-br from-red-200 to-slate-500 min-h-screen p-4 sm:ml-64">
  <div className="max-w-4xl mx-auto">
    <div className="rounded-xl bg-gradient-to-br from-white to-slate-200 p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Manage Recipients</h2>
      <ToastContainer position="top-right" autoClose={7000} hideProgressBar={false} closeOnClick draggable pauseOnHover theme={"light"} />
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
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Upload className="w-5 h-5" />
              Upload CSV File
            </button>
          </div>
          
          {/* Format Instructions */}
          <p className="text-xs text-gray-600 mb-3">
            Format: email@example.com (one per line)
          </p>
          
          {/* Manual Entry Section */}
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Or Enter Manually
          </label>
          <textarea
            value={recipientText}
            onChange={(e) => handleTextChange(e.target.value)}
            rows={15}
            id="recipients"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm"
            placeholder="john@example.com"
          />
          
          {/* Total Count Display */}
          <div className="mt-4 p-4 bg-white rounded-lg border border-green-200">
            <p className="text-lg font-semibold text-gray-800">
              Total Recipients: <span className="text-green-600">{recipients.length.toLocaleString() || totalEmails.toLocaleString() || 0}</span>
            </p>
          </div>

          <div className="mt-4">
                <button
                  onClick={saveRecipients}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer"
                >
                  {isLoading ? (
                    <span>Loading...</span>
                  ) : (
                    <span>Save</span>
                  )}
                </button>
              </div>

        </div>
      </div>
    </div>
  </div>
        </div>
      </Protected>
    );
}