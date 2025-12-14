import Link from 'next/link'
import PublicHeader from '../_components/PublicHeader';
import PublicFooter from '../_components/PublicFooter';

export default function ServicesPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 text-slate-900 relative overflow-hidden font-sans">
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
        
        <div className="max-w-6xl mx-auto px-6 pt-28 pb-16">
          {/* Header Section */}
          <header className="mb-12 text-center">
            <div className="inline-block mb-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-semibold rounded-full shadow-lg">
              Our Services
            </div>
            <h1 className="text-5xl font-extrabold leading-tight bg-gradient-to-r from-slate-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
              Services
            </h1>
            <p className="mt-4 text-lg text-slate-700 max-w-2xl mx-auto leading-relaxed">
              Everything Bulky provides for scaling email campaigns with confidence and reliability.
            </p>
          </header>

          {/* Core Services - 3 Column Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 mb-12">
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border-2 border-blue-100 shadow-lg hover:shadow-2xl transition-all hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Batch Sending</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Split large lists into batches to avoid rate limits and distribute load efficiently across your campaigns.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border-2 border-purple-100 shadow-lg hover:shadow-2xl transition-all hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Deliverability Tools</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Comprehensive analytics to help you monitor opens, bounces and overall campaign performance.
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mb-12 bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 p-8 rounded-3xl shadow-2xl text-white">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1">
                <h4 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Ready to Get Started?
                </h4>
                <p className="text-white/90 leading-relaxed">
                  Be part of our teams sending reliable email campaigns with Bulky today. No credit card required.
                </p>
              </div>
              <Link href="/auth" className="px-8 py-3 bg-white text-orange-600 font-bold rounded-lg hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all whitespace-nowrap">
                Get Started
              </Link>
            </div>
          </div>

          {/* Advanced Services - 2x2 Grid */}
          <section className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Advanced Features
              </h2>
              <p className="mt-2 text-slate-600">Professional tools for power users and enterprises</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl border-2 border-indigo-100 shadow-lg hover:shadow-2xl transition-all hover:scale-105">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <h4 className="font-bold text-xl text-slate-900 mb-3">API & Integrations</h4>
                <p className="text-slate-600 leading-relaxed">
                  Direct API support, Infobip integration, webhooks and programmatic control for seamless automations.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full">REST API</span>
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full">Webhooks</span>
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full">Infobip</span>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl border-2 border-cyan-100 shadow-lg hover:shadow-2xl transition-all hover:scale-105">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <h4 className="font-bold text-xl text-slate-900 mb-3">Analytics & Reporting</h4>
                <p className="text-slate-600 leading-relaxed">
                  Real-time metrics for sent, delivered, opened and clicked — so you can iterate quickly and improve results.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-cyan-50 text-cyan-700 text-xs font-semibold rounded-full">Real-time</span>
                  <span className="px-3 py-1 bg-cyan-50 text-cyan-700 text-xs font-semibold rounded-full">Dashboards</span>
                  <span className="px-3 py-1 bg-cyan-50 text-cyan-700 text-xs font-semibold rounded-full">Export</span>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl border-2 border-pink-100 shadow-lg hover:shadow-2xl transition-all hover:scale-105">
                <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="font-bold text-xl text-slate-900 mb-3">Templates & Personalization</h4>
                <p className="text-slate-600 leading-relaxed">
                  Create reusable templates with substitution tags and preview per recipient before sending campaigns.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-pink-50 text-pink-700 text-xs font-semibold rounded-full">Merge Tags</span>
                  <span className="px-3 py-1 bg-pink-50 text-pink-700 text-xs font-semibold rounded-full">Preview</span>
                  <span className="px-3 py-1 bg-pink-50 text-pink-700 text-xs font-semibold rounded-full">Variables</span>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl border-2 border-red-100 shadow-lg hover:shadow-2xl transition-all hover:scale-105">
                <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <h4 className="font-bold text-xl text-slate-900 mb-3">Monitoring & Alerts</h4>
                <p className="text-slate-600 leading-relaxed">
                  Proactive alerts on bounces, delivery problems, or rate limit thresholds so you stay informed 24/7.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-full">Email Alerts</span>
                </div>
              </div>
            </div>
          </section>

          {/* Bottom CTA */}
          <div className="bg-gradient-to-br from-slate-50/80 to-white/80 backdrop-blur-sm p-8 rounded-3xl border-2 border-slate-200 shadow-xl text-center">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Need a Custom Solution?</h3>
            <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
              We offer enterprise plans with dedicated support, custom integrations, and tailored deliverability consulting.
            </p>
            <Link href="/contact" className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all">
              Contact Sales
            </Link>
          </div>
        </div>

        <PublicFooter />
      </div>
    </main>
  );
}