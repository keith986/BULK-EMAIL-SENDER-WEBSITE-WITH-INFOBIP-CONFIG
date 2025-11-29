import Link from 'next/link';
import PublicHeader from '../_components/PublicHeader';
import PublicFooter from '../_components/PublicFooter';

export default function AboutPage() {
  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-white via-slate-50 to-slate-100 mt-20">
      <PublicHeader />
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-extrabold text-slate-900">About Bulky</h1>
          <p className="mt-2 text-slate-600">Learn how Bulky helps teams reliably send high-volume email campaigns.</p>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h2 className="text-xl font-semibold">Our Mission</h2>
            <p className="mt-2 text-sm text-slate-600">Bulky exists to make sending email campaigns easy and reliable — with batching, retries and insightful reporting so teams can focus on content and results.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h2 className="text-xl font-semibold">Who we serve</h2>
            <p className="mt-2 text-sm text-slate-600">We work with marketing teams, agencies and small businesses to provide a dependable, scalable platform for campaign sending.</p>
          </div>
        </section>

        <section className="mt-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-semibold">Get started</h3>
          <p className="mt-2 text-sm text-slate-600">Create an account and start sending campaigns in minutes.</p>
          <div className="mt-4 flex gap-2">
            <Link href="/auth" className="px-4 py-2 bg-slate-900 text-white rounded">Sign up / Login</Link>
            <Link href="/compose&send" className="px-4 py-2 border rounded">Compose</Link>
          </div>
        </section>

          <section className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h4 className="font-semibold">Our Team</h4>
              <p className="mt-2 text-sm text-slate-600">Small, focused engineering and deliverability teams building reliable sending pipelines.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h4 className="font-semibold">Security & Compliance</h4>
              <p className="mt-2 text-sm text-slate-600">We follow standard secure practices and respect subscriber data — support for DKIM/SPF, API key-based sending and secure storage.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h4 className="font-semibold">Why Bulky</h4>
              <ul className="mt-2 text-sm text-slate-600 space-y-2 list-disc list-inside">
                <li>Simple batching and retry logic</li>
                <li>Affordable pricing and predictable quotas</li>
                <li>Easy integration via our UI and APIs</li>
              </ul>
            </div>
          </section>

          <section className="mt-10 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="font-semibold">Our story</h3>
            <p className="mt-2 text-sm text-slate-600">Built by email operators who needed a lightweight, reliable sender — no heavy marketing cloud required.</p>
          </section>

        </div>

        <PublicFooter />
    </main>
  );
}
