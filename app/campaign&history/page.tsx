"use client";
import Protected from '../_components/Protected';
import { useState } from 'react';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function CampaignHistory() {
    // Campaign results state
const [results, setResults] = useState([]);
const [sentCount, setSentCount] = useState(0);
const [successCount, setSuccessCount] = useState(0);
const [failedCount, setFailedCount] = useState(0);
const [totalEmails, setTotalEmails] = useState(0);
    return (
      <Protected>
        <div className='sm:mt-21 mt-5 bg-gradient-to-br from-red-200 to-slate-500 min-h-screen p-4 sm:ml-64 sm:ml-60 '>
  <div className="max-w-7xl mx-auto sm:mr-10 sm:ml-10">
    <div className="bg-gradient-to-br from-white to-slate-200 rounded-xl p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Campaign History</h2>
      
      {/* Empty State - No campaigns yet */}
      {results.length === 0 ? (
        <div className="text-center py-12">
          <RefreshCw className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No campaigns sent yet</p>
          <p className="text-sm text-gray-500 mt-2">
            Start by composing your first email campaign
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Campaign Statistics Dashboard */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-4">Latest Campaign Results</h3>
            
            <div className="grid grid-cols-4 gap-4 mb-4">
              {/* Total Sent */}
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Sent</p>
                <p className="text-3xl font-bold text-indigo-600">{sentCount}</p>
              </div>
              
              {/* Successful */}
              <div className="text-center">
                <p className="text-sm text-gray-600">Successful</p>
                <p className="text-3xl font-bold text-green-600">{successCount}</p>
              </div>
              
              {/* Failed */}
              <div className="text-center">
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-3xl font-bold text-red-600">{failedCount}</p>
              </div>
              
              {/* Success Rate */}
              <div className="text-center">
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-3xl font-bold text-indigo-600">
                  {totalEmails > 0 ? ((successCount / totalEmails) * 100).toFixed(1) : '0'}%
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Results Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Message
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Batch
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {results.map((result, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    {/* Email Address */}
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {result.email}
                    </td>
                    
                    {/* Status Badge */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        result.status === 'success' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {result.status === 'success' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        {result.status}
                      </span>
                    </td>
                    
                    {/* Message */}
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {result.message}
                    </td>
                    
                    {/* Batch Number */}
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {result.batchIndex + 1}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  </div>
        </div>
      </Protected>
    );
}