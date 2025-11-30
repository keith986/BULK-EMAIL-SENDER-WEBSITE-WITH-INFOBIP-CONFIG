"use client";
import Link from 'next/link';
import PublicFooter from './_components/PublicFooter';
import PublicHeader from './_components/PublicHeader';
import { useUser } from './_context/UserProvider';
import { useState, useEffect } from 'react';
import { fetchCampaignsFromFirebase } from './_utils/firebase-operations';

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

export default function LandingPage() {
   const { user } = useUser();
   const [campaigns, setCampaigns] = useState<CampaignDoc[]>([]);
   const [loading, setLoading] = useState<boolean>(false);

   // Calculate overall stats from all campaigns
   const totalSent = campaigns.reduce((sum, c) => sum + (c.stats?.sent ?? 0), 0);
   const totalFailed = campaigns.reduce((sum, c) => sum + (c.stats?.failed ?? 0), 0);
   const totalEmails = totalSent + totalFailed;
   const successRate = totalEmails > 0 ? ((totalSent / totalEmails) * 100).toFixed(1) : '0';

   // Fetch campaigns if user is logged in
   useEffect(() => {
      const uid = user?.uid;
      if (!uid) {
         return;
      }
      
      // Use a flag to prevent state updates after unmount
      let isMounted = true;
      
      const loadCampaigns = async () => {
         if (isMounted) setLoading(true);
         
         try {
            const resp = await fetchCampaignsFromFirebase({ userId: uid });
            
            if (!isMounted) return;
            
            if (resp.code === 777 && resp.data) {
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
            } else {
               setCampaigns([]);
            }
         } catch (err) {
            console.error('Error fetching campaigns:', err instanceof Error ? err.message : String(err));
         } finally {
            if (isMounted) setLoading(false);
         }
      };
      
      loadCampaigns();
      
      return () => {
         isMounted = false;
      };
   }, [user?.uid]);

   return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 text-slate-900 relative overflow-hidden">
         {/* Email template inspired background pattern */}
         <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-100 to-transparent"></div>
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-purple-100 to-transparent"></div>
            <div className="absolute top-1/4 left-10 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl"></div>
            <div className="absolute top-1/3 right-10 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl"></div>
            <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl"></div>
         </div>
         
         <div className="relative z-10">
            <PublicHeader />

         <section className="pt-28 pb-20 relative">
            <div className="max-w-7xl mx-auto px-6 flex flex-col-reverse md:flex-row items-center gap-12">
               <div className="w-full md:w-1/2">
                  <div className="inline-block mb-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-semibold rounded-full shadow-lg">
                  Professional Email Campaigns
                  </div>
                  <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight bg-gradient-to-r from-slate-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                     Send bulk email campaigns — fast, reliable, and measurable.
                  </h1>
                  <p className="mt-4 text-lg text-slate-700 leading-relaxed">Bulky helps teams send large volume email campaigns with batching, automatic retries, and helpful analytics so you focus on results — not delivery details.</p>

                  <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
                     <div className="bg-white/80 backdrop-blur-sm border border-blue-100 p-4 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105">
                        <div className="text-xs uppercase text-blue-600 font-bold">Scale</div>
                        <div className="font-semibold mt-1 text-slate-900">Batch sending</div>
                        <div className="text-sm text-slate-600 mt-2">Split large lists into manageable batches to avoid rate limits.</div>
                     </div>
                     <div className="bg-white/80 backdrop-blur-sm border border-purple-100 p-4 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105">
                        <div className="text-xs uppercase text-purple-600 font-bold">Reliable</div>
                        <div className="font-semibold mt-1 text-slate-900">Automatic retries</div>
                        <div className="text-sm text-slate-600 mt-2">Handles temporary errors and retries intelligently.</div>
                     </div>
                     <div className="bg-white/80 backdrop-blur-sm border border-pink-100 p-4 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 hidden sm:block">
                        <div className="text-xs uppercase text-pink-600 font-bold">Insight</div>
                        <div className="font-semibold mt-1 text-slate-900">Campaign analytics</div>
                        <div className="text-sm text-slate-600 mt-2">Track sent, failed, and opened metrics in one place.</div>
                     </div>
                  </div>
               </div>

               <div className="w-full md:w-1/2 flex items-center justify-center">
                  <div className="w-full max-w-md bg-white/90 backdrop-blur-lg border-2 border-blue-200 rounded-3xl p-6 shadow-2xl hover:shadow-3xl transition-all">
                     <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 rounded-2xl p-5 text-white shadow-lg">
                        <div className="font-bold text-lg flex items-center justify-between">
                           <span className="flex items-center gap-2">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                 <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                                 <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
                              </svg>
                              Campaign Status
                           </span>
                           {user && loading && (
                              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                           )}
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-4 text-xs text-white/95">
                           <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                              <div className="text-3xl font-bold">
                                 {user ? (loading ? '--' : totalSent.toLocaleString()) : '--'}
                              </div>
                              <div className="mt-1 font-medium">Sent</div>
                           </div>
                           <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                              <div className="text-3xl font-bold">
                                 {user ? (loading ? '--' : totalFailed.toLocaleString()) : '--'}
                              </div>
                              <div className="mt-1 font-medium">Failed</div>
                           </div>
                           <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                              <div className="text-3xl font-bold">
                                 {user ? (loading ? '--' : `${successRate}%`) : '--'}
                              </div>
                              <div className="mt-1 font-medium">Success</div>
                           </div>
                        </div>
                        {user && !loading && campaigns.length > 0 && (
                           <div className="mt-3 pt-3 border-t border-white/20 text-xs text-white/80">
                              <div className="flex justify-between">
                                 <span>Total campaigns:</span>
                                 <span className="font-semibold">{campaigns.length}</span>
                              </div>
                              <div className="flex justify-between mt-1">
                                 <span>Total recipients:</span>
                                 <span className="font-semibold">{totalEmails.toLocaleString()}</span>
                              </div>
                           </div>
                        )}
                        {user && !loading && campaigns.length === 0 && (
                           <div className="mt-3 pt-3 border-t border-white/20 text-xs text-white/80 text-center">
                              No campaigns yet. Start by creating your first one!
                           </div>
                        )}
                        {!user && (
                           <div className="mt-3 pt-3 border-t border-white/20 text-xs text-white/80 text-center">
                              <Link href="/auth" className="underline hover:text-white">Sign in</Link> to see your campaign stats
                           </div>
                        )}
                     </div>

                     <div className="mt-5 p-4 bg-white rounded-lg border border-slate-100 -mb-3">
                        <div className="text-sm text-slate-600">Quick start</div>
                        <div className="mt-3 text-xs text-slate-400">Create a campaign → upload recipients → configure batching → start sending</div>
                        <div className="mt-4 flex gap-2">
                           {user ? (
                              <>
                                 <Link href="/compose&send" className="text-xs px-3 py-2 rounded bg-slate-900 text-white hover:bg-slate-800">Compose</Link>
                                 <Link href="/add-recipients" className="text-xs px-3 py-2 rounded border hover:bg-slate-50">Add recipients</Link>
                                 <Link href="/campaign&history" className="text-xs px-3 py-2 rounded border border-blue-500 text-blue-600 hover:bg-blue-50">View History</Link>
                              </>
                           ) : (
                              <>
                                 <Link href="/auth" className="text-xs px-3 py-2 rounded bg-slate-900 text-white hover:bg-slate-800">Sign In</Link>
                                 <Link href="/auth" className="text-xs px-3 py-2 rounded border hover:bg-slate-50">Sign Up</Link>
                              </>
                           )}
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </section>


         <div className="mt-16 mb-8 px-6">
            <div className="max-w-7xl mx-auto">
               <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Powerful Features</h2>
                  <p className="mt-2 text-slate-600">Everything you need to run successful email campaigns</p>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border-2 border-red-100 shadow-lg hover:shadow-2xl transition-all hover:scale-105 hover:border-red-200">
                     <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     </div>
                     <div className="font-bold text-lg text-slate-900">Batching & Scheduling</div>
                     <div className="text-sm mt-2 text-slate-600 leading-relaxed">Control batch sizes, delays and scheduling to maximize deliverability.</div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border-2 border-slate-200 shadow-lg hover:shadow-2xl transition-all hover:scale-105 hover:border-slate-300">
                     <div className="w-14 h-14 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                     </div>
                     <div className="font-bold text-lg text-slate-900">CSV Upload + Templates</div>
                     <div className="text-sm mt-2 text-slate-600 leading-relaxed">Use your own lists or templates for fast campaign creation.</div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border-2 border-green-100 shadow-lg hover:shadow-2xl transition-all hover:scale-105 hover:border-green-200">
                     <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     </div>
                     <div className="font-bold text-lg text-slate-900">Auto Retry Logic</div>
                     <div className="text-sm mt-2 text-slate-600 leading-relaxed">Retries, error handling and monitoring to keep campaigns moving.</div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border-2 border-blue-100 shadow-lg hover:shadow-2xl transition-all hover:scale-105 hover:border-blue-200">
                     <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                     </div>
                     <div className="font-bold text-lg text-slate-900">Real-time Analytics</div>
                     <div className="text-sm mt-2 text-slate-600 leading-relaxed">Track delivery rates, opens, clicks, and bounces in real-time dashboards.</div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border-2 border-purple-100 shadow-lg hover:shadow-2xl transition-all hover:scale-105 hover:border-purple-200">
                     <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
                     </div>
                     <div className="font-bold text-lg text-slate-900">Personalization Engine</div>
                     <div className="text-sm mt-2 text-slate-600 leading-relaxed">Dynamic content with merge tags for personalized recipient experiences.</div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border-2 border-orange-100 shadow-lg hover:shadow-2xl transition-all hover:scale-105 hover:border-orange-200">
                     <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                     </div>
                     <div className="font-bold text-lg text-slate-900">API & Webhooks</div>
                     <div className="text-sm mt-2 text-slate-600 leading-relaxed">Integrate with your existing tools via REST API and webhook notifications.</div>
                  </div>
               </div>
            </div>
         </div>

         {/* public footer */}
         <PublicFooter />
         </div>
      </main>
   );
}