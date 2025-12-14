"use client";
import React, { useState, useEffect } from 'react';
import { useUser } from '../_context/UserProvider';
import { updateClientProfile, fetchClientLoginLogs, getClientLoginStats } from '../_utils/firebase-operations';
import { toast, ToastContainer } from 'react-toastify';
import { Lightbulb } from 'lucide-react'

interface LoginLog {
  userEmail: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  status: 'success' | 'failed' | 'otp_sent' | 'otp_verified';
  failureReason?: string;
  timestamp: Date;
}

interface LoginStats {
  totalLogins: number;
  successfulLogins: number;
  failedLogins: number;
  recentActivity: number;
  lastSuccessfulLogin?: Date;
}

export default function SettingsPage() {
  const { user, loading, refreshProfile } = useUser();
  const [displayName, setDisplayName] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [loginStats, setLoginStats] = useState<LoginStats | null>(null);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(true);
  const [loadingStats, setLoadingStats] = useState<boolean>(true);

  useEffect(() => {
    if (user?.displayName) setDisplayName(user.displayName);
  }, [user?.displayName]);

  // Fetch login logs and stats
  useEffect(() => {
    const fetchLoginData = async () => {
      
      if (!user?.email) return;
      console.log(user.email)
      try {
        setLoadingLogs(true);
        setLoadingStats(true);

        // Fetch login logs
        const logsResponse = await fetchClientLoginLogs({ 
          userEmail: user.email,
          limitCount: 10 
        });
        
        console.log(logsResponse)

        if (logsResponse.code === 777 && logsResponse.data) {
          setLoginLogs(logsResponse.data);
        }

        // Fetch login statistics
        const statsResponse = await getClientLoginStats({ 
          userEmail: user.email 
        });
        
        if (statsResponse.code === 777 && statsResponse.data) {
          setLoginStats(statsResponse.data);
        }
      } catch (err) {
        console.error('Error fetching login data:', err);
      } finally {
        setLoadingLogs(false);
        setLoadingStats(false);
      }
    };

    fetchLoginData();
  }, [user?.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return toast.error('You must be signed in to update your profile.');

    try {
      setSaving(true);
      const resp = await updateClientProfile({ 
        userId: user.uid, 
        displayName: displayName || null, 
        password: null 
      });
      
      if (resp.code === 777) {
        toast.success(resp.message);
        await refreshProfile();
      } else {
        toast.error(resp.message);
      }
    } catch (err: unknown) {
      toast.error('Error: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      success: 'bg-green-100 text-green-700 border-green-200',
      failed: 'bg-red-100 text-red-700 border-red-200',
      otp_sent: 'bg-blue-100 text-blue-700 border-blue-200',
      otp_verified: 'bg-purple-100 text-purple-700 border-purple-200'
    };
    
    const labels = {
      success: 'Success',
      failed: 'Failed',
      otp_sent: 'OTP Sent',
      otp_verified: 'OTP Verified'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-md border ${badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-700'}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const getDeviceIcon = (userAgent?: string) => {
    if (!userAgent) return '💻';
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) return '📱';
    if (ua.includes('tablet') || ua.includes('ipad')) return '📱';
    return '💻';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-200 to-slate-500 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-white" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          <span className="text-white font-medium">Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="sm:mt-21 bg-gradient-to-br from-red-200 to-slate-500 min-h-screen p-4">
      <ToastContainer 
        position="top-right" 
        autoClose={7000} 
        hideProgressBar={false} 
        closeOnClick 
        draggable 
        pauseOnHover 
        theme="light" 
      />
      
      <div className="mx-auto max-w-4xl mt-10 sm:ml-80">
        <div className="max-w-3xl space-y-6">
          {/* Profile Information */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border border-slate-100">
            <div className="mb-6 md:mb-8">
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-1">Profile Information</h2>
              <p className="text-sm text-slate-500">Update your account details</p>
            </div>

            {/* Display Name */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Display Name
              </label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                placeholder="Your display name"
              />
              <p className="text-xs text-slate-500 mt-2">This is how your name will appear in the app</p>
            </div>

            {/* Action Button */}
            <div className="pt-6 border-t border-slate-100">
              <button
                type="submit"
                disabled={saving}
                className="w-full px-6 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-gradient-to-br hover:from-red-900 hover:to-slate-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Saving Changes...
                  </span>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>

          {/* Login Statistics */}
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border border-slate-100">
            <div className="mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-1">Login Statistics</h2>
              <p className="text-sm text-slate-500">Overview of your account activity</p>
            </div>

            {loadingStats ? (
              <div className="flex items-center justify-center py-8">
                <svg className="animate-spin h-6 w-6 text-slate-900" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              </div>
            ) : loginStats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                  <div className="text-2xl font-bold text-blue-900">{loginStats.totalLogins}</div>
                  <div className="text-xs text-blue-700 mt-1">Total Logins</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                  <div className="text-2xl font-bold text-green-900">{loginStats.successfulLogins}</div>
                  <div className="text-xs text-green-700 mt-1">Successful</div>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
                  <div className="text-2xl font-bold text-red-900">{loginStats.failedLogins}</div>
                  <div className="text-xs text-red-700 mt-1">Failed Attempts</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                  <div className="text-2xl font-bold text-purple-900">{loginStats.recentActivity}</div>
                  <div className="text-xs text-purple-700 mt-1">Last 7 Days</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">No statistics available</div>
            )}

            {loginStats?.lastSuccessfulLogin && (
              <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-600">
                  Last successful login: <span className="font-medium text-slate-900">{formatDate(loginStats.lastSuccessfulLogin)}</span>
                </p>
              </div>
            )}
          </div>

          {/* Login Activity */}
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border border-slate-100">
            <div className="mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-1">Recent Login Activity</h2>
              <p className="text-sm text-slate-500">Your last 10 login attempts and activities</p>
            </div>

            {loadingLogs ? (
              <div className="flex items-center justify-center py-8">
                <svg className="animate-spin h-6 w-6 text-slate-900" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              </div>
            ) : loginLogs.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-slate-500 text-sm">No login activity found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {loginLogs.map((log, index) => (
                  <div 
                    key={index} 
                    className="flex flex-col sm:flex-row sm:items-start justify-between p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors gap-3"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="text-2xl flex-shrink-0">
                        {getDeviceIcon(log.userAgent)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {getStatusBadge(log.status)}
                          {log.failureReason && (
                            <span className="text-xs text-red-600 truncate">
                              ({log.failureReason})
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-900 truncate">
                          {log.location || 'Unknown Location'}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          IP: {log.ipAddress || 'Unknown'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {formatDate(log.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {loginLogs.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500 text-center flex items-center justify-center gap-1 font-sans">
                 <Lightbulb className="text-yellow-900"/> If you notice any suspicious activity, please contact us immediately
                </p>
              </div>
            )}
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50 rounded-2xl p-6 border border-red-100">
            <h3 className="text-sm font-semibold text-red-900 mb-2">Danger Zone</h3>
            <p className="text-xs text-red-600 mb-4">Irreversible actions that affect your account</p>
            <button
              type="button"
              onClick={() => toast.info('Account deletion feature coming soon')}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 bg-white hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}