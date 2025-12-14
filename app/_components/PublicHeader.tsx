"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function PublicHeader(){
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

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

         {/* Desktop Navigation */}
         <nav className="hidden md:flex items-center gap-6 text-sm text-slate-700">
            <Link className={`hover:text-slate-900 ${pathname === '/' ? 'text-slate-900 font-semibold' : ''}`} href="/">Home</Link>
            <Link className={`hover:text-slate-900 ${pathname === '/about' ? 'text-slate-900 font-semibold' : ''}`} href="/about">About</Link>
            <Link className={`hover:text-slate-900 ${pathname === '/services' ? 'text-slate-900 font-semibold' : ''}`} href="/services">Services</Link>
            <Link className={`hover:text-slate-900 ${pathname === '/pricing' ? 'text-slate-900 font-semibold' : ''}`} href="/pricing">Pricing</Link>
            <Link className={`hover:text-slate-900 ${pathname === '/contact' ? 'text-slate-900 font-semibold' : ''}`} href="/contact">Contact</Link>
            <Link className="bg-slate-900 text-white px-3 py-2 rounded-sm hover:bg-slate-800 transition-colors" href="/auth">Get Started</Link>
         </nav>

         {/* Mobile Menu Button */}
         <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 text-slate-700 hover:text-slate-900 focus:outline-none"
            aria-label="Toggle menu"
         >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
               )}
            </svg>
         </button>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
         <nav className="md:hidden bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg">
            <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-3">
               <Link 
                  className={`py-2 px-3 rounded-sm hover:bg-slate-100 transition-colors ${pathname === '/' ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-700'}`}
                  href="/" 
                  onClick={closeMobileMenu}
               >
                  Home
               </Link>
               <Link 
                  className={`py-2 px-3 rounded-sm hover:bg-slate-100 transition-colors ${pathname === '/about' ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-700'}`}
                  href="/about" 
                  onClick={closeMobileMenu}
               >
                  About
               </Link>
               <Link 
                  className={`py-2 px-3 rounded-sm hover:bg-slate-100 transition-colors ${pathname === '/services' ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-700'}`}
                  href="/services" 
                  onClick={closeMobileMenu}
               >
                  Services
               </Link>
               <Link 
                  className={`py-2 px-3 rounded-sm hover:bg-slate-100 transition-colors ${pathname === '/pricing' ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-700'}`}
                  href="/pricing" 
                  onClick={closeMobileMenu}
               >
                  Pricing
               </Link>
               <Link 
                  className={`py-2 px-3 rounded-sm hover:bg-slate-100 transition-colors ${pathname === '/contact' ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-700'}`}
                  href="/contact" 
                  onClick={closeMobileMenu}
               >
                  Contact
               </Link>
               <Link 
                  className="bg-slate-900 text-white px-3 py-3 rounded-sm hover:bg-slate-800 transition-colors text-center font-medium mt-2"
                  href="/auth" 
                  onClick={closeMobileMenu}
               >
                  Get Started
               </Link>
            </div>
         </nav>
      )}
   </header>
  )
}