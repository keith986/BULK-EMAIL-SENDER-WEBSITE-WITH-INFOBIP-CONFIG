"use client";
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '../_context/UserProvider';
import { useState, useEffect, useRef } from 'react';
import Protected from './Protected';

export default function Navbar() {
  const pathname = usePathname();
  const { user, loading, signOut } = useUser();
  const router = useRouter();

  // State for dropdown visibility
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Refs for click outside detection
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);
  
  // Don't show the global navbar on the public landing page or public marketing routes
  if (
    pathname === '/' ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/about') ||
    pathname.startsWith('/services') || 
    pathname.startsWith('/pricing') ||
    pathname.startsWith('/contact') ||
    pathname.startsWith('/admin/login') ||
    pathname.startsWith('/admin/dashboard')
  ) return null;

  const handleDropDown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  }

  const handleNavbarDropdown = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  }

  return (
    <Protected>
      <div>
        <nav className="bg-gradient-to-r from-slate-900 to-blue-900 border-none shadow-lg dark:bg-gray-900 fixed w-full z-20 top-0 left-0 border-b dark:border-gray-600">
          <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
            <Link href="/" className="flex items-center space-x-3 rtl:space-x-reverse">
              <svg className="w-6 h-6 text-white dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeLinecap="round" strokeWidth="2" d="m3.5 5.5 7.893 6.036a1 1 0 0 0 1.214 0L20.5 5.5M4 19h16a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1Z"/>
              </svg>
              <div className="flex flex-col">
                <span className="text-2xl font-semibold whitespace-nowrap text-white dark:text-white">Bulky</span>
                <span className="text-sm font-semibold whitespace-nowrap text-white dark:text-white hidden md:block">Professional Email Campaign Manager</span>
              </div>
            </Link>
            
            <div className="flex items-center md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
              <button 
                type="button" 
                className="flex text-sm bg-gray-800 rounded-full w-10 h-10 justify-center items-center md:me-0 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-100" 
                id="user-menu-button" 
                onClick={handleDropDown} 
                ref={buttonRef}
              >
                <span className='text-white dark:text-white text-xl'>
                  {loading ? '…' : user?.displayName ? user.displayName.charAt(0).toUpperCase() : (user?.email?.charAt(0).toUpperCase() ?? '...')}
                </span>
              </button>
              
              {isDropdownOpen && (
                <div className="z-50 my-4 absolute md:top-10 top-10 right-10 text-base list-none bg-white divide-y divide-gray-100 rounded-lg shadow-sm dark:bg-gray-700 dark:divide-gray-600" id="user-dropdown" ref={dropdownRef}>
                  <div className="px-4 py-3">
                    <span className="block text-sm text-gray-900 dark:text-white">{user?.displayName ?? 'anonymous'}</span>
                    <span className="block text-sm text-gray-500 truncate dark:text-gray-400">{user?.email ?? '—'}</span>
                  </div>
                  <ul className="py-2" aria-labelledby="user-menu-button">
                    <li>
                      <Link href="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white">Dashboard</Link>
                    </li>
                    <li>
                      <Link href="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white">Settings</Link>
                    </li>
                    <li>
                      <a href="/payment" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white">Payment</a>
                    </li>
                    <li>
                      <button onClick={async () => { await signOut(); router.push('/'); }} className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white">Sign out</button>
                    </li>
                  </ul>
                </div>
              )}
              
              <button 
                onClick={handleNavbarDropdown} 
                data-collapse-toggle="navbar-user" 
                type="button" 
                className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-white rounded-lg md:hidden hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600" 
                aria-controls="navbar-user" 
                aria-expanded={isMobileMenuOpen}
              >
                <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h15M1 7h15M1 13h15"/>
                </svg>
              </button>
            </div>
            
            <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} items-center justify-between w-full md:flex md:w-auto md:order-1`} id="navbar-user">
              <ul className="flex flex-col font-medium p-4 md:p-0 mt-4 md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0 bg-slate-800 md:bg-transparent rounded-lg md:rounded-none">
                <li>
                  <Link href="/" className="block py-2 px-3 text-white bg-blue-700 rounded-sm md:bg-transparent md:text-gray-100 md:p-0 md:dark:text-gray-100" aria-current="page">Home</Link>
                </li>
                <li>
                  <Link href="/about" className="block py-2 px-3 text-gray-200 rounded-sm hover:bg-gray-700 md:hover:bg-transparent md:hover:text-gray-100 md:p-0 dark:text-white md:dark:hover:text-gray-100 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700">About</Link>
                </li>
                <li>
                  <Link href="/services" className="block py-2 px-3 text-gray-200 rounded-sm hover:bg-gray-700 md:hover:bg-transparent md:hover:text-gray-100 md:p-0 dark:text-white md:dark:hover:text-gray-100 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700">Services</Link>
                </li>
                <li>
                  <Link href="/pricing" className="block py-2 px-3 text-gray-200 rounded-sm hover:bg-gray-700 md:hover:bg-transparent md:hover:text-gray-100 md:p-0 dark:text-white md:dark:hover:text-gray-100 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700">Pricing</Link>
                </li>
                <li>
                  <Link href="/contact" className="block py-2 px-3 text-gray-200 rounded-sm hover:bg-gray-700 md:hover:bg-transparent md:hover:text-gray-100 md:p-0 dark:text-white md:dark:hover:text-gray-100 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700">Contact</Link>
                </li>
              </ul>
            </div>
          </div>
        </nav>
      </div>
    </Protected>
  );
}