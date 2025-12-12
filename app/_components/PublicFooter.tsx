import Link from 'next/link'

export default function PublicFooter(){
  return (
    <footer className="border-t border-slate-200 mt-10 bg-transparent">
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between text-sm text-slate-600">
         <div className="mb-3 md:mb-0">© {new Date().getFullYear()} Bulky — Built for teams that send lots of email.</div>
         <nav className="flex items-center gap-4">
            <Link href="/about" className="hover:underline cursor-pointer">About</Link>
            <Link href="/services" className="hover:underline cursor-pointer">Services</Link>
            <Link href="/pricing" className="hover:underline cursor-pointer">Pricing</Link>
            <Link href="/contact" className="hover:underline cursor-pointer">Contact</Link>
         </nav>
      </div>
    </footer>
  )
}
