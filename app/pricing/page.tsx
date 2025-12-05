import Link from 'next/link'
import PublicHeader from '../_components/PublicHeader';
import PublicFooter from '../_components/PublicFooter';

export default function FeaturesPage(){
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
        
        <div className="max-w-7xl mx-auto px-6 pt-28 pb-16">
          {/* Header Section */}
          <header className="mb-16 text-center">
            <div className="inline-block mb-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-semibold rounded-full shadow-lg">
              Powerful Features
            </div>
            <h1 className="text-5xl font-extrabold leading-tight bg-gradient-to-r from-slate-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
              Everything You Need to Succeed
            </h1>
            <p className="mt-4 text-lg text-slate-700 max-w-3xl mx-auto leading-relaxed">
              Bulky provides enterprise-grade email campaign tools with the simplicity your team deserves. Send, track, and optimize with confidence.
            </p>
          </header>

          {/* Hero Feature */}
          <div className="mb-16 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 p-10 rounded-3xl shadow-2xl text-white">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div> 
                <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-semibold mb-4">
                  Core Feature
                </div>
                <h2 className="text-4xl font-bold mb-4">Smart Batch Processing</h2>
                <p className="text-white/90 mb-6 leading-relaxed">
                  Send millions of emails reliably with intelligent batch processing. Our system automatically splits large campaigns into optimized batches, respecting rate limits and maximizing deliverability.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Automatic batch size optimization</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Configurable delays between batches</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Real-time progress monitoring</span>
                  </li>
                </ul>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="bg-white rounded-lg p-4 shadow-xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-slate-700">Coins used </span>
                    <span className="text-xs text-slate-500">2000 / 6000</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3 mb-3">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full" style={{width: '40%'}}></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-green-50 p-2 rounded text-center">
                      <div className="font-bold text-green-700">8,234</div>
                      <div className="text-green-600">Sent</div>
                    </div>
                    <div className="bg-blue-50 p-2 rounded text-center">
                      <div className="font-bold text-blue-700">11,766</div>
                      <div className="text-blue-600">Pending</div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded text-center">
                      <div className="font-bold text-slate-700">98.5%</div>
                      <div className="text-slate-600">Success</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
           

            {/* Feature 2 */}
            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl border-2 border-blue-100 shadow-lg hover:shadow-2xl transition-all hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Advanced Analytics</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                Track opens, clicks, bounces, and conversions in real-time. Make data-driven decisions with comprehensive campaign insights.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-700">
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Real-time dashboards
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Export to CSV/Excel
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl border-2 border-purple-100 shadow-lg hover:shadow-2xl transition-all hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Template Builder</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                Design beautiful emails with our drag-and-drop builder or use pre-made templates. Full HTML customization available.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-700">
                  <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  50+ pre-made templates
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Custom HTML support
                </div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl border-2 border-pink-100 shadow-lg hover:shadow-2xl transition-all hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Personalization</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                Make every email personal with merge tags, dynamic content, and conditional logic. Increase engagement dramatically.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-700">
                  <svg className="w-4 h-4 text-pink-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Unlimited merge fields
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <svg className="w-4 h-4 text-pink-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Dynamic content blocks
                </div>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl border-2 border-orange-100 shadow-lg hover:shadow-2xl transition-all hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Smart Alerts</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                Stay informed with intelligent notifications. Get alerted about bounces, delivery issues, or campaign milestones.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-700">
                  <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Email & Slack notifications
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Custom threshold triggers
                </div>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl border-2 border-cyan-100 shadow-lg hover:shadow-2xl transition-all hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Developer API</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                Integrate Bulky into your workflow with our comprehensive REST API. Full documentation and SDKs available.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-700">
                  <svg className="w-4 h-4 text-cyan-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  RESTful API endpoints
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <svg className="w-4 h-4 text-cyan-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Webhook integrations
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-br from-slate-50/80 to-white/80 backdrop-blur-sm p-10 rounded-3xl border-2 border-slate-200 shadow-xl text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready to Experience These Features?</h2>
            <p className="text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Start your free trial today and see why thousands of teams trust Bulky for their email campaigns.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/auth" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all">
                Start Now
              </Link>
              <Link href="/pricing" className="px-8 py-4 border-2 border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-all">
                View Pricing
              </Link>
            </div>
          </div>
        </div>

        <PublicFooter />
      </div>
    </main>
  )
}