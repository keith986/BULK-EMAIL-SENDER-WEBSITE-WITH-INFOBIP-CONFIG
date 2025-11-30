import Link from 'next/link'
import PublicHeader from '../_components/PublicHeader';
import PublicFooter from '../_components/PublicFooter';

export default function PricingPage(){
  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-white via-slate-50 to-slate-100 mt-20">
      <PublicHeader />
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-extrabold text-slate-900">Pricing</h1>
          <p className="mt-2 text-slate-600">Simple predictable pricing for teams of any size.</p>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center">
            <div className="text-sm uppercase text-slate-400">Starter</div>
            <div className="text-3xl font-bold mt-2">$9<span className="text-sm">/mo</span></div>
            <p className="mt-2 text-sm text-slate-600">Best for small teams and trials.</p>
            <div className="mt-4">
              <Link href="/auth" className="px-4 py-2 bg-slate-900 text-white rounded">Choose</Link>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center">
            <div className="text-sm uppercase text-slate-400">Pro</div>
            <div className="text-3xl font-bold mt-2">$29<span className="text-sm">/mo</span></div>
            <p className="mt-2 text-sm text-slate-600">Popular — advanced features and higher limits.</p>
            <div className="mt-4">
              <Link href="/auth" className="px-4 py-2 bg-amber-500 text-white rounded">Choose</Link>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center">
            <div className="text-sm uppercase text-slate-400">Enterprise</div>
            <div className="text-3xl font-bold mt-2">Custom</div>
            <p className="mt-2 text-sm text-slate-600">Custom plan for large teams and dedicated support.</p>
            <div className="mt-4">
              <Link href="/contact" className="px-4 py-2 border rounded">Contact Sales</Link>
            </div>
          </div>
        </div>

        <section className="mt-10 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-semibold">What is included</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="p-4">
              <div className="font-semibold">Starter</div>
              <ul className="text-sm text-slate-600 mt-2 space-y-1 list-disc list-inside">
                <li>2,000 sends / month</li>
                <li>Basic analytics</li>
                <li>Email templates</li>
              </ul>
            </div>
            <div className="p-4">
              <div className="font-semibold">Pro</div>
              <ul className="text-sm text-slate-600 mt-2 space-y-1 list-disc list-inside">
                <li>20,000 sends / month</li>
                <li>Advanced analytics + A/B tests</li>
                <li>Priority support</li>
              </ul>
            </div>
            <div className="p-4">
              <div className="font-semibold">Enterprise</div>
              <ul className="text-sm text-slate-600 mt-2 space-y-1 list-disc list-inside">
                <li>Custom capacity</li>
                <li>SLAs & Dedicated support</li>
                <li>Onboarding & migrations</li>
              </ul>
            </div>
          </div>
        </section>

      </div>

      <PublicFooter />
    </main>
  )
}