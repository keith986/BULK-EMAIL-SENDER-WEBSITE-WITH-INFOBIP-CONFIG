import Link from 'next/link';
import PublicFooter from './_components/PublicFooter';
import PublicHeader from './_components/PublicHeader';

export default function LandingPage() {
   return (
      <main className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-slate-100 text-slate-900">
         <PublicHeader />

         <section className="pt-28 pb-20">
            <div className="max-w-7xl mx-auto px-6 flex flex-col-reverse md:flex-row items-center gap-12">
               <div className="w-full md:w-1/2">
                  <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight text-slate-900">Send bulk email campaigns — fast, reliable, and measurable.</h1>
                  <p className="mt-4 text-lg text-slate-600">Bulky helps teams send large volume email campaigns with batching, automatic retries, and helpful analytics so you focus on results — not delivery details.</p>

                  <div className="mt-6 flex gap-3 flex-wrap">
                     <a href="#features" className="inline-flex items-center gap-2 px-5 py-3 border border-slate-200 rounded-md text-slate-700 hover:bg-slate-50">See Features</a>
                  </div>

                  <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
                     <div className="bg-white border border-slate-100 p-4 rounded-lg shadow-sm">
                        <div className="text-xs uppercase text-slate-400">Scale</div>
                        <div className="font-semibold mt-1">Batch sending</div>
                        <div className="text-sm text-slate-500 mt-2">Split large lists into manageable batches to avoid rate limits.</div>
                     </div>
                     <div className="bg-white border border-slate-100 p-4 rounded-lg shadow-sm">
                        <div className="text-xs uppercase text-slate-400">Reliable</div>
                        <div className="font-semibold mt-1">Automatic retries</div>
                        <div className="text-sm text-slate-500 mt-2">Handles temporary errors and retries intelligently.</div>
                     </div>
                     <div className="bg-white border border-slate-100 p-4 rounded-lg shadow-sm hidden sm:block">
                        <div className="text-xs uppercase text-slate-400">Insight</div>
                        <div className="font-semibold mt-1">Campaign analytics</div>
                        <div className="text-sm text-slate-500 mt-2">Track sent, failed, and opened metrics in one place.</div>
                     </div>
                  </div>
               </div>

               <div className="w-full md:w-1/2 flex items-center justify-center">
                  <div className="w-full max-w-md bg-gradient-to-tr from-white to-slate-50 border border-slate-200 rounded-3xl p-6 shadow-xl">
                     <div className="bg-gradient-to-br from-slate-900 to-red-500 rounded-2xl p-4 text-white">
                        <div className="font-semibold">Campaign Status</div>
                        <div className="mt-3 grid grid-cols-3 gap-3 text-xs text-white/90">
                           <div className="text-center">
                              <div className="text-2xl font-bold">0</div>
                              <div className="mt-1">Sent</div>
                           </div>
                           <div className="text-center">
                              <div className="text-2xl font-bold">0</div>
                              <div className="mt-1">Failed</div>
                           </div>
                           <div className="text-center">
                              <div className="text-2xl font-bold">0</div>
                              <div className="mt-1">Queued</div>
                           </div>
                        </div>
                     </div>

                     <div className="mt-5 p-4 bg-white rounded-lg border border-slate-100 -mb-3">
                        <div className="text-sm text-slate-600">Quick start</div>
                        <div className="mt-3 text-xs text-slate-400">Create a campaign → upload recipients → configure batching → start sending</div>
                        <div className="mt-4 flex gap-2">
                           <Link href="/compose&send" className="text-xs px-3 py-2 rounded bg-slate-900 text-white">Compose</Link>
                           <Link href="/add-recipients" className="text-xs px-3 py-2 rounded border">Add recipients</Link>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </section>


         <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                  <div className="bg-white p-6 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                     <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center text-white mb-3">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     </div>
                     <div className="font-semibold">Batching & Scheduling</div>
                     <div className="text-sm mt-2 text-slate-500">Control batch sizes, delays and scheduling to maximize deliverability.</div>
                  </div>
                  <div className="bg-white p-6 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                     <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg flex items-center justify-center text-white mb-3">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                     </div>
                     <div className="font-semibold">CSV Upload + Templates</div>
                     <div className="text-sm mt-2 text-slate-500">Use your own lists or templates for fast campaign creation.</div>
                  </div>
                  <div className="bg-white p-6 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                     <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white mb-3">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     </div>
                     <div className="font-semibold">Auto Retry Logic</div>
                     <div className="text-sm mt-2 text-slate-500">Retries, error handling and monitoring to keep campaigns moving.</div>
                  </div>
                  <div className="bg-white p-6 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                     <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white mb-3">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                     </div>
                     <div className="font-semibold">Real-time Analytics</div>
                     <div className="text-sm mt-2 text-slate-500">Track delivery rates, opens, clicks, and bounces in real-time dashboards.</div>
                  </div>
                  <div className="bg-white p-6 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                     <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white mb-3">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
                     </div>
                     <div className="font-semibold">Personalization Engine</div>
                     <div className="text-sm mt-2 text-slate-500">Dynamic content with merge tags for personalized recipient experiences.</div>
                  </div>
                  <div className="bg-white p-6 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                     <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white mb-3">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                     </div>
                     <div className="font-semibold">API & Webhooks</div>
                     <div className="text-sm mt-2 text-slate-500">Integrate with your existing tools via REST API and webhook notifications.</div>
                  </div>
         </div>

         {/* public footer */}
         <PublicFooter />
      </main>
   );
}
