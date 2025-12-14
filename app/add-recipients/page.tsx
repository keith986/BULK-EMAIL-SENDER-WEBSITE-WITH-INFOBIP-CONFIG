"use client";
import Protected from '../_components/Protected';
import { useState, useRef, useEffect } from "react";
import { Upload, AlertCircle } from "lucide-react";
import { uploadRecipientsToFirebase } from '../_utils/firebase-operations';
import { toast, ToastContainer } from "react-toastify";
import { useUser } from '../_context/UserProvider';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../_lib/firebase';

interface Recipient {
  name: string;
  email: string;
}

interface UserData {
  subscriptionStatus: 'free' | '2000c' | '6000c' | '10000c' | 'customc';
  totalRecipientsLimit?: number;
}

// Define contact limits for each package
const PACKAGE_LIMITS = {
  'free': 1,
  '2000c': 2000,
  '6000c': 2000,
  '10000c': 2000,
  'customc': Infinity
};

export default function AddRecipients() {
  // State variables
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [recipientText, setRecipientText] = useState('');
  const [totalEmails, setTotalEmails] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();
  const [currentRecipientCount, setCurrentRecipientCount] = useState(0);
  const [contactLimit, setContactLimit] = useState(1);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'free' | '2000c' | '6000c' | '10000c' | 'customc'>('free');

  // Fetch user's current subscription and recipient count
  useEffect(() => {
    const fetchUserLimits = async () => {
      if (!user?.uid) return;

      try {
        // Fetch user's subscription status
        const userDoc = await getDoc(doc(db, 'clients', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserData;
          const subStatus = userData.subscriptionStatus || 'free';
          setSubscriptionStatus(subStatus);
          
          // Set contact limit based on package
          const limit = PACKAGE_LIMITS[subStatus];
          setContactLimit(limit);
        }

        // Fetch current recipient count
        const recipientsDoc = await getDoc(doc(db, 'recipients', user.uid));
        if (recipientsDoc.exists()) {
          const data = recipientsDoc.data();
          setCurrentRecipientCount(data.totalCount || 0);
        }
      } catch (error) {
        console.error('Error fetching user limits:', error);
      }
    };

    fetchUserLimits();
  }, [user?.uid]);

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

    // Check if adding these recipients would exceed the limit
    const projectedTotal = currentRecipientCount + recipients.length;
    
    if (projectedTotal > contactLimit) {
      const remainingSlots = contactLimit - currentRecipientCount;
      toast.error(
        `Contact limit exceeded! Your ${subscriptionStatus.toUpperCase()} package allows ${contactLimit.toLocaleString()} contacts. ` +
        `You currently have ${currentRecipientCount.toLocaleString()} contacts. ` +
        `You can only add ${remainingSlots} more contact(s). ` +
        `Please upgrade your package to add more contacts.`,
        { autoClose: 10000 }
      );
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
        const added = typeof result.added === 'number' ? result.added : undefined;
        if (added === 0) {
          toast.info('No new recipients were added — all entries are duplicates of existing records.');
        } else if (added && added > 0) {
          toast.success(`${added} new recipient(s) added successfully!`);
          
          // Update current count
          setCurrentRecipientCount(prev => prev + added);
          
          // Clear inputs
          const id_recepients = document.getElementById('recipients');
          if (id_recepients) {
            const ta = id_recepients as HTMLTextAreaElement;
            ta.value = '';
          }
          setRecipientText('');
          setRecipients([]);
          setTotalEmails(0);
        } else {
          toast.success(result.message);
        }
      } else {
        toast.error('Error: ' + result.message);
      }
    } catch (error) {
      console.error('Error saving to Firebase:', error);
      toast.error('Error saving recipients');
    } finally {
      setIsLoading(false);
    }
  };

  const remainingContacts = contactLimit - currentRecipientCount;
  const willExceedLimit = recipients.length > remainingContacts;
  const usagePercentage = (currentRecipientCount / contactLimit) * 100;

  return (
    <Protected>
      <div className="sm:mt-21 bg-gradient-to-br from-red-200 to-slate-500 min-h-screen p-4 sm:ml-64">
        <div className="max-w-4xl mx-auto mt-20">
          <div className="rounded-xl bg-gradient-to-br from-white to-slate-200 p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Manage Recipients</h2>
            <ToastContainer position="top-right" autoClose={7000} hideProgressBar={false} closeOnClick draggable pauseOnHover theme={"light"} />
            
            {/* Contact Limit Warning */}
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Contact Limit: {subscriptionStatus.toUpperCase()} Package
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        Current: <span className="font-semibold text-gray-800">{currentRecipientCount.toLocaleString()}</span> / {contactLimit === Infinity ? 'Unlimited' : contactLimit.toLocaleString()}
                      </span>
                      <span className={`font-semibold ${remainingContacts <= 100 ? 'text-red-600' : 'text-green-600'}`}>
                        {contactLimit === Infinity ? 'Unlimited remaining' : `${remainingContacts.toLocaleString()} remaining`}
                      </span>
                    </div>
                    {contactLimit !== Infinity && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            usagePercentage >= 90 ? 'bg-red-500' :
                            usagePercentage >= 75 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                  {contactLimit !== Infinity && remainingContacts <= 100 && (
                    <p className="text-xs text-yellow-500 mt-2">
                      Consider upgrading your package to add more contacts.
                    </p>
                  )}
                </div>
              </div>
            </div>

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
                
                {/* Total Count Display with Warning */}
                <div className={`mt-4 p-4 rounded-lg border ${
                  willExceedLimit ? 'bg-red-50 border-red-300' : 'bg-white border-green-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold text-gray-800">
                      Recipients to Add: <span className={willExceedLimit ? 'text-red-600' : 'text-green-600'}>
                        {recipients.length.toLocaleString()}
                      </span>
                    </p>
                    {willExceedLimit && (
                      <span className="text-sm font-semibold text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        Exceeds Limit!
                      </span>
                    )}
                  </div>
                  {willExceedLimit && (
                    <p className="text-sm text-red-600 mt-2">
                      You can only add {remainingContacts.toLocaleString()} more contact(s). 
                      Please remove {(recipients.length - remainingContacts).toLocaleString()} recipient(s) or upgrade your package.
                    </p>
                  )}
                </div>

                <div className="mt-4">
                  <button
                    onClick={saveRecipients}
                    disabled={isLoading || willExceedLimit}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                      isLoading || willExceedLimit
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 cursor-pointer'
                    } text-white`}
                  >
                    {isLoading ? (
                      <span>Loading...</span>
                    ) : willExceedLimit ? (
                      <span>Limit Exceeded</span>
                    ) : (
                      <span>Save Recipients</span>
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