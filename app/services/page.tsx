import Link from 'next/link'
import PublicHeader from '../_components/PublicHeader';
import PublicFooter from '../_components/PublicFooter';

export default function ServicesPage() {
  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-white via-slate-50 to-slate-100 mt-20">
      <PublicHeader />
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-extrabold text-slate-900">Services</h1>
          <p className="mt-2 text-slate-600">Everything Bulky provides for scaling email campaigns.</p>
        </header>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="font-semibold">Batch Sending</h3>
            <p className="text-sm mt-2 text-slate-600">Split large lists into batches to avoid rate limits and distribute load.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="font-semibold">Retry & backoff</h3>
            <p className="text-sm mt-2 text-slate-600">Automatic retrying for transient delivery failures with exponential backoff.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="font-semibold">Deliverability Tools</h3>
            <p className="text-sm mt-2 text-slate-600">Tools and analytics to help you monitor opens, bounces and performance.</p>
          </div>

        </div>

        <div className="mt-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h4 className="text-lg font-semibold">Start</h4>
          <div className="mt-3">
            <Link href="/auth" className="px-4 py-2 bg-amber-500 text-white rounded">Get Started</Link>
          </div>
        </div>

        <section className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h4 className="font-semibold">API & Integrations</h4>
            <p className="mt-2 text-sm text-slate-600">Direct API support, Infobip integration, webhooks and programmatic control for automations.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h4 className="font-semibold">Analytics & Reporting</h4>
            <p className="mt-2 text-sm text-slate-600">Real-time metrics for sent, delivered, opened and clicked — so you can iterate quickly.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h4 className="font-semibold">Templates & Personalization</h4>
            <p className="mt-2 text-sm text-slate-600">Create templates with substitution tags and preview per recipient before sending.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h4 className="font-semibold">Monitoring & Alerts</h4>
            <p className="mt-2 text-sm text-slate-600">Alerts on bounces, delivery problems, or rate limit thresholds so you stay informed.</p>
          </div>
        </section>

      </div>

      <PublicFooter />
    </main>
  );
}
