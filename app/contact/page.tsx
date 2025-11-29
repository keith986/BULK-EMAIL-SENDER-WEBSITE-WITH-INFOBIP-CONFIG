import Link from 'next/link'
import PublicHeader from '../_components/PublicHeader';
import PublicFooter from '../_components/PublicFooter';

export default function ContactPage(){
  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-white via-slate-50 to-slate-100 mt-20">
      <PublicHeader />
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-extrabold text-slate-900">Contact</h1>
          <p className="mt-2 text-slate-600">We'd love to help — reach out anytime for support or sales.</p>
        </header>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <form className="grid gap-3">
            <div>
              <label className="text-sm text-slate-700">Name</label>
              <input className="w-full mt-1 px-3 py-2 border rounded" />
            </div>

            <div>
              <label className="text-sm text-slate-700">Email</label>
              <input className="w-full mt-1 px-3 py-2 border rounded" />
            </div>

            <div>
              <label className="text-sm text-slate-700">Message</label>
              <textarea className="w-full mt-1 px-3 py-2 border rounded" rows={6}></textarea>
            </div>

            <div className="flex items-center gap-2">
              <button type="button" className="px-4 py-2 bg-slate-900 text-white rounded">Send</button>
              <Link href="/" className="text-sm text-slate-500 hover:underline">Back to home</Link>
            </div>
          </form>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="bg-white p-4 rounded-lg border">
            <h4 className="font-semibold">Need help now?</h4>
            <p className="text-sm text-slate-600 mt-2">Support: <a className="text-blue-700" href="mailto:support@bulky.app">support@bulky.app</a></p>
            <p className="text-sm text-slate-600 mt-1">Sales: <a className="text-blue-700" href="mailto:sales@bulky.app">sales@bulky.app</a></p>
            <p className="text-sm text-slate-600 mt-1">Phone: +1 (555) 555-5555</p>
            <p className="text-xs text-slate-400 mt-2">Support hours: Mon–Fri 9:00–18:00 UTC</p>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <h4 className="font-semibold">Frequently asked</h4>
            <ul className="text-sm text-slate-600 mt-2 space-y-2 list-disc list-inside">
              <li>How long does verification take? — Usually a few minutes.</li>
              <li>Can I import large CSVs? — Yes, CSV upload supports large lists (see docs).</li>
              <li>Do you provide dedicated IPs? — Contact sales for enterprise options.</li>
            </ul>
          </div>
        </div>

      </div>

      <PublicFooter />
    </main>
  )
}
