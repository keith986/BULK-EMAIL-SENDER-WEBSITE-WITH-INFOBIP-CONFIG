"use client";
import Protected from '../_components/Protected';
import { useState, useEffect } from 'react';
import { useUser } from '../_context/UserProvider';
import { fetchCampaignsFromFirebase } from '../_utils/firebase-operations';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

type CampaignResult = {
  email: string;
  status: string;
  message?: string;
  batchIndex: number;
};

type CampaignDoc = {
  id: string;
  userId: string;
  subject?: string;
  recipientsCount?: number;
  results?: CampaignResult[];
  stats?: { total?: number; sent?: number; failed?: number };
  createdAt?: { seconds?: number } | string;
};

export default function CampaignHistory() {
    // Campaign results state
  const { user } = useUser();
  const [campaigns, setCampaigns] = useState<CampaignDoc[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignDoc | null>(null);

  // derived values for stats
  const results = selectedCampaign?.results ?? [];
  const sentCount = selectedCampaign?.stats?.sent ?? results.filter(r => r.status === 'sent').length;
  const successCount = sentCount;
  const failedCount = selectedCampaign?.stats?.failed ?? results.filter(r => r.status !== 'sent').length;
  const totalEmails = selectedCampaign?.stats?.total ?? results.length;

  useEffect(() => {
    const uid = user?.uid;
    if (!uid) return;
    // avoid calling setState synchronously in effect body
    setTimeout(() => setLoading(true), 0);
    fetchCampaignsFromFirebase({ userId: uid })
      .then(resp => {
        if (resp.code === 777 && resp.data) {
          // normalize results so they conform to CampaignResult type
          const normalized = resp.data.map(c => {
            const rawResults = Array.isArray(c.results) ? c.results : [];
            const results: CampaignResult[] = rawResults.map((r, i) => {
              const rr = r as Record<string, unknown>;
              const email = typeof rr.email === 'string' ? rr.email : String(rr.email ?? '');
              const status = typeof rr.status === 'string' ? rr.status : (typeof rr.statusCode === 'number' && rr.statusCode === 200 ? 'sent' : 'error');
              const message = typeof rr.message === 'string' ? rr.message : (typeof rr.body === 'string' ? String(rr.body).slice(0, 300) : undefined);
              const batchIndex = typeof rr.batchIndex === 'number' ? rr.batchIndex : i;
              return { email, status, message, batchIndex };
            });
            return { ...c, results } as CampaignDoc;
          });
          setCampaigns(normalized);
          setSelectedCampaign(normalized[0] ?? null);
        } else {
          setCampaigns([]);
          setSelectedCampaign(null);
        }
      })
      .catch(err => console.error('Error fetching campaigns:', err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, [user?.uid]);
    return (
      <Protected>
        <div className='sm:mt-21 mt-5 bg-gradient-to-br from-red-200 to-slate-500 min-h-screen p-4 sm:ml-64 sm:ml-60 '>
          <div className="max-w-7xl mx-auto sm:mr-10 sm:ml-10">
            <div className="bg-gradient-to-br from-white to-slate-200 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Campaign History</h2>

              {loading ? (
                <div className="text-center py-12">Loading campaigns…</div>
              ) : campaigns.length === 0 ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No campaigns sent yet</p>
                  <p className="text-sm text-gray-500 mt-2">Start by composing your first email campaign</p>
                </div>
              ) : (
                <div className="sm:grid sm:grid-cols-4 sm:gap-6">
                  <div className="col-span-1 bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                    <h4 className="font-semibold mb-3">Campaigns</h4>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {campaigns.map((c) => (
                        <button key={c.id} onClick={() => setSelectedCampaign(c)} className={`w-full text-left p-3 rounded ${selectedCampaign?.id === c.id ? 'bg-indigo-50 border-indigo-200' : 'hover:bg-gray-50'}`}>
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-gray-800 truncate">{c.subject || 'No subject'}</div>
                            <div className="text-xs text-gray-500">{c.recipientsCount ?? '-'}</div>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">{c.createdAt ? (typeof c.createdAt === 'string' ? new Date(c.createdAt).toLocaleString() : (c.createdAt.seconds ? new Date(c.createdAt.seconds * 1000).toLocaleString() : '')) : ''}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="col-span-3 space-y-4">
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg">
                      <h3 className="font-semibold text-gray-800 mb-4">Latest Campaign Results</h3>
                      <div className="md:grid grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Total Sent</p>
                          <p className="text-3xl font-bold text-indigo-600">{sentCount}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Successful</p>
                          <p className="text-3xl font-bold text-green-600">{successCount}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Failed</p>
                          <p className="text-3xl font-bold text-red-600">{failedCount}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Success Rate</p>
                          <p className="text-3xl font-bold text-indigo-600">{totalEmails > 0 ? ((successCount / totalEmails) * 100).toFixed(1) : '0'}%</p>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto bg-white rounded-lg p-4 border border-gray-100 overflow-y-auto" style={{ maxHeight: '400px' }}>
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Message</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Batch</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {results.map((result: CampaignResult, index: number) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-800">{result.email}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${result.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  {result.status === 'success' ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                  {result.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">{result.message}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{result.batchIndex + 1}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Protected>
    );
}