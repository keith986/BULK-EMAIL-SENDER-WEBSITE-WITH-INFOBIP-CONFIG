import Link from 'next/link';
import PublicHeader from '../_components/PublicHeader';
import PublicFooter from '../_components/PublicFooter';

export default function AboutPage() {
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
        
        <div className="max-w-6xl mx-auto px-6 pt-28 pb-16">
          {/* Header Section */}
          <header className="mb-12 text-center">
            <div className="inline-block mb-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-semibold rounded-full shadow-lg">
              About Us
            </div>
            <h1 className="text-5xl font-extrabold leading-tight bg-gradient-to-r from-slate-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
              About Bulky
            </h1>
            <p className="mt-4 text-lg text-slate-700 max-w-2xl mx-auto leading-relaxed">
              Learn how Bulky helps teams reliably send high-volume email campaigns with ease and confidence.
            </p>
          </header>

          {/* Mission & Who We Serve */}
          <section className="grid gap-6 md:grid-cols-2 mb-12">
            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl border-2 border-blue-100 shadow-lg hover:shadow-2xl transition-all hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Our Mission</h2>
              <p className="text-slate-600 leading-relaxed">
                Bulky exists to make sending email campaigns easy and reliable — with batching, retries and insightful reporting so teams can focus on content and results.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl border-2 border-purple-100 shadow-lg hover:shadow-2xl transition-all hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Who We Serve</h2>
              <p className="text-slate-600 leading-relaxed">
                We work with marketing teams, agencies and small businesses to provide a dependable, scalable platform for campaign sending.
              </p>
            </div>
          </section>

          {/* Get Started CTA */}
          <section className="mb-12 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 p-8 rounded-3xl shadow-2xl text-white">
            <div className="max-w-2xl">
              <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                Get Started Today
              </h3>
              <p className="text-white/90 mb-6 leading-relaxed">
                Create an account and start sending campaigns in minutes. No credit card required.
              </p>
              <div className="flex gap-3 flex-wrap">
                <Link href="/auth" className="px-6 py-3 bg-white text-purple-700 font-semibold rounded-lg hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all">
                  Sign up / Login
                </Link>
                <Link href="/compose&send" className="px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-all">
                  Compose Campaign
                </Link>
              </div>
            </div>
          </section>

          {/* Three Column Features */}
          <section className="grid gap-6 md:grid-cols-3 mb-12">
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border-2 border-green-100 shadow-lg hover:shadow-2xl transition-all hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h4 className="font-bold text-lg text-slate-900 mb-2">Our Team</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Small, focused engineering and deliverability teams building reliable sending pipelines.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border-2 border-orange-100 shadow-lg hover:shadow-2xl transition-all hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 className="font-bold text-lg text-slate-900 mb-2">Security & Compliance</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                We follow standard secure practices and respect subscriber data — support for DKIM/SPF, API key-based sending and secure storage.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border-2 border-blue-100 shadow-lg hover:shadow-2xl transition-all hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="font-bold text-lg text-slate-900 mb-2">Why Bulky</h4>
              <ul className="text-sm text-slate-600 space-y-2">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Simple batching and retry logic
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Affordable pricing and predictable quotas
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Easy integration via our UI and APIs
                </li>
              </ul>
            </div>
          </section>

          {/* Our Story */}
          <section className="bg-gradient-to-br from-white/80 to-slate-50/80 backdrop-blur-sm p-8 rounded-3xl border-2 border-slate-200 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Our Story</h3>
                <p className="text-slate-700 leading-relaxed">
                  Built by email operators who needed a lightweight, reliable sender — no heavy marketing cloud required. We understand the challenges of high-volume email delivery because we have lived them. That is why we created Bulky: a platform that combines simplicity with power, giving you the tools you need without the complexity you do not.
                </p>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-blue-600">2025</div>
                    <div className="text-sm text-slate-600 mt-1">Founded</div>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-purple-600">--</div>
                    <div className="text-sm text-slate-600 mt-1">Emails Sent</div>
                  </div>
                  <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-pink-600">--%</div>
                    <div className="text-sm text-slate-600 mt-1">Uptime</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <PublicFooter />
      </div>
    </main>
  );
}