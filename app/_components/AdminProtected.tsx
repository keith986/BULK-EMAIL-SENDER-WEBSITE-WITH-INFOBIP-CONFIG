"use client";
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../_context/UserProvider';

export default function AdminProtected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  const router = useRouter();
  
  const ADMIN_EMAILS = [
    'keithkelly986@gmail.com'
    // Add your admin emails here
  ];

  useEffect(() => {
    if (!loading) {
      if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
        router.push('/admin/login');
      }
    }
  }, [user, loading, router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // If not admin, show access denied (before redirect)
  if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 overflow-hidden">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don not have permission to access the admin panel.</p>
          <p className="text-sm text-gray-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // User is authenticated admin, show children
  return <>{children}</>;
}