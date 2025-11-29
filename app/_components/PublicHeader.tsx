import Link from 'next/link'

export default function PublicHeader(){
  return (
    <header className="w-full fixed top-0 left-0 z-30 backdrop-blur-md bg-white/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-slate-700 rounded-lg flex items-center justify-center text-white font-bold">B</div>
            <div>
               <div className="text-xl font-semibold">Bulky</div>
               <div className="text-xs text-slate-500 hidden sm:block">Professional Email Campaign Manager</div>
            </div>
         </div>
         <nav className="hidden md:flex items-center gap-6 text-sm text-slate-700">
            <Link className="hover:text-slate-900" href="/">Home</Link>
            <Link className="hover:text-slate-900" href="/about">About</Link>
            <Link className="hover:text-slate-900" href="/services">Services</Link>
            <Link className="hover:text-slate-900" href="/pricing">Pricing</Link>
            <Link className="hover:text-slate-900" href="/contact">Contact</Link>
            <Link className="bg-slate-900 text-white px-3 py-2 rounded-sm" href="/auth">Get Started</Link>
         </nav>
      </div>
   </header>
  )
}
