"use client";
import Protected from '../_components/Protected';
import { useEffect, useState } from 'react';
import { fetchRecipientsFromFirebase } from '../_utils/firebase-operations';
import { useUser } from '../_context/UserProvider';

interface Recipient {
  name: string;
  email: string;
}

export default function DashboardClient() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const { user } = useUser();

  useEffect(() => {
    fetchRecipientsFromFirebase({ userId: user?.uid as string })
      .then(data => {
        if (data && data.data && data.data.rawText) {
          setRecipients(data.data.recipients || []);
        } else {
          setRecipients([]); 
        }
      })
      .catch(err => console.error('Error fetching recipients:', err.message));
  }, []);

  return (
    <Protected>
    <div className="sm:mt-2 bg-gradient-to-br from-red-200 to-slate-500 min-h-screen p-4 ">
      <div className="p-4 sm:ml-64 mt-20">
        <h2 className="text-lg font-semibold">Dashboard</h2>
        <p className="mt-2 text-sm text-gray-600">Welcome to your dashboard! Here you can manage your account settings, view analytics, and more.</p>

        <div className="grid grid-cols-2 gap-4 mb-4 mt-10">
          <div className="flex flex-col items-center justify-center h-24 rounded-sm bg-gray-50 dark:bg-gray-800">
            <p className="self-center text-normal sm:text-xl text-gray-400 dark:text-gray-500">Total Campaigns</p>
            <p className="self-center text-2xl text-gray-400 dark:text-gray-500">0</p>
          </div>
          <div className="flex flex-col items-center justify-center h-24 rounded-sm bg-gray-50 dark:bg-gray-800">
            <p className="self-center text-normal sm:text-xl text-gray-400 dark:text-gray-500">Success Rate</p>
            <p className="self-center text-2xl text-gray-400 dark:text-gray-500">0</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4 mt-20">
          <div className="flex flex-col items-center justify-center h-24 rounded-sm bg-gray-50 dark:bg-gray-800">
            <p className="self-center text-normal sm:text-xl text-gray-400 dark:text-gray-500">Recipients</p>
            <p className="self-center text-2xl text-gray-400 dark:text-gray-500">{recipients.length > 0 ? recipients.length : 0}</p>
          </div>
          <div className="flex flex-col items-center justify-center h-24 rounded-sm bg-gray-50 dark:bg-gray-800">
            <p className="self-center text-normal sm:text-xl text-gray-400 dark:text-gray-500">Sent</p>
            <p className="self-center text-2xl text-gray-400 dark:text-gray-500">0</p>
          </div>
          <div className="flex flex-col items-center justify-center h-24 rounded-sm bg-gray-50 dark:bg-gray-800">
            <p className="self-center text-normal sm:text-xl text-gray-400 dark:text-gray-500">Failed</p>
            <p className="self-center text-2xl text-gray-400 dark:text-gray-500">0</p>
          </div>
        </div>
      </div>
    </div>
    </Protected>
  );
}
