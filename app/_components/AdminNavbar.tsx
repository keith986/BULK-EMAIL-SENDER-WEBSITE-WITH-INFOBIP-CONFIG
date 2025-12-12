"use client";
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Shield, LogOut,ChevronDown } from 'lucide-react';
import { auth } from '../_lib/firebase';
import { useUser } from '../_context/UserProvider';

export default function AdminNavbar() {
  const router = useRouter();
  const { user } = useUser();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const pathname = usePathname();

   // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.user-menu') && !target.closest('.user-menu-button')) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (
    pathname === '/' ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/about') ||
    pathname.startsWith('/services') || 
    pathname.startsWith('/pricing') ||
    pathname.startsWith('/contact') ||
    pathname.startsWith('/admin/login') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/compose&send') ||
    pathname.startsWith('/add-recipients') ||
    pathname.startsWith('/recipients') ||
    pathname.startsWith('/payment') ||
    pathname.startsWith('/batch-settings') ||
    pathname.startsWith('/api-config') ||
    pathname.startsWith('/campaign&history') 
  ) return null;


  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };


  return (
    <>
      {/* Desktop Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-slate-100 border-b border-gray-200 z-50 shadow-sm ">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left Section - Logo and Navigation */}
            <div className="flex items-center flex-1">
              {/* Logo */}
              <div className="flex items-center gap-3 mr-8">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
                  <p className="text-xs text-gray-500">Dashboard Control</p>
                </div>
              </div>

            </div>

            {/* Right Section - Search, Notifications, Profile */}
            <div className="flex items-center gap-3">
                
              {/* User Profile */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="user-menu-button flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {user?.email?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-800">
                      {user?.displayName || 'Admin'}
                    </p>
                    <p className="text-xs text-gray-500">Administrator</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-600 hidden sm:block" />
                </button>

                {/* User Menu Dropdown */}
                {showUserMenu && (
                  <div className="user-menu absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-800">
                        {user?.email || 'admin@example.com'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Admin Account</p>
                    </div>
                   
                    <div className="border-t border-gray-200 py-2">
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </nav>
      {/* Spacer to prevent content from going under fixed navbar */}
      <div className="h-8 bg-slate-600" />
    </>
  );
}