"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  signUpWithGoogleAccount,
  createOTP,
  verifyOTP,
  createUserWithOTP,
  signInOTPUser,
  getUserLocationData,
  logClientLogin
} from '../_utils/firebase-operations'; 
import { toast, ToastContainer } from 'react-toastify';
import { useUser } from '../_context/UserProvider';

export default function AuthPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp' | 'details'>('email');
  const [isData, setIsData] = useState({
    username: '',
    email: '',
    otp: ''
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isNewUser, setIsNewUser] = useState<boolean>(false);
  const { user, loading: userLoading } = useUser();

  // Rate limiting states
  const [otpResendTimer, setOtpResendTimer] = useState<number>(0);
  const [otpAttempts, setOtpAttempts] = useState<number>(0);
  const [isRateLimited, setIsRateLimited] = useState<boolean>(false);
  const [rateLimitEndTime, setRateLimitEndTime] = useState<number>(0);
  
  // Refs for location data caching
  const locationDataCache = useRef<{
    data: { ipAddress: string; location: string; userAgent: string } | null;
    timestamp: number;
  }>({ data: null, timestamp: 0 });
  
  const lastOtpRequestTime = useRef<number>(0);
  const requestTimestamps = useRef<number[]>([]);

  // Redirect if already logged in
  useEffect(() => {
    const validateUser = async () => {
      if (!userLoading && user) {
        if (user.profile?.role === 'customer') {
          router.replace('/dashboard');
        } else {
          router.replace('/admin/dashboard');
        }
      }
    };
    validateUser();
  }, [user, userLoading, router]);

  // OTP resend timer countdown
  useEffect(() => {
    if (otpResendTimer > 0) {
      const interval = setInterval(() => {
        setOtpResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [otpResendTimer]);

  // Rate limit timer countdown
  useEffect(() => {
    if (isRateLimited) {
      const interval = setInterval(() => {
        const now = Date.now();
        if (now >= rateLimitEndTime) {
          setIsRateLimited(false);
          setOtpAttempts(0);
          requestTimestamps.current = [];
          clearInterval(interval);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isRateLimited, rateLimitEndTime]);

  // Get cached or fresh location data
  const getCachedLocationData = async () => {
    const now = Date.now();
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

    // Return cached data if still valid
    if (
      locationDataCache.current.data && 
      now - locationDataCache.current.timestamp < CACHE_DURATION
    ) {
      return locationDataCache.current.data;
    }

    // Fetch fresh data
    try {
      const data = await getUserLocationData();
      locationDataCache.current = {
        data,
        timestamp: now
      };
      return data;
    } catch (error) {
      console.error('Error fetching location data:', error);
      // Return cached data even if expired, or fallback
      return locationDataCache.current.data || {
        ipAddress: 'Unknown',
        location: 'Unknown',
        userAgent: navigator.userAgent || 'Unknown'
      };
    }
  };

  // Check rate limiting
  const checkRateLimit = (): boolean => {
    const now = Date.now();
    const WINDOW_MS = 60 * 1000; // 1 minute window
    const MAX_REQUESTS = 3; // Max 3 OTP requests per minute

    // Clean old timestamps
    requestTimestamps.current = requestTimestamps.current.filter(
      timestamp => now - timestamp < WINDOW_MS
    );

    // Check if rate limited
    if (requestTimestamps.current.length >= MAX_REQUESTS) {
      const lockDuration = 2 * 60 * 1000; // 2 minutes lockout
      setIsRateLimited(true);
      setRateLimitEndTime(now + lockDuration);
      toast.error('Too many attempts. Please wait 2 minutes before trying again.');
      return false;
    }

    return true;
  };

  // Calculate dynamic wait time based on attempts
  const getWaitTime = (): number => {
    // Progressive delays: 30s, 60s, 90s, 120s
    const baseDelay = 30;
    const increment = 30;
    return Math.min(baseDelay + (otpAttempts * increment), 120);
  };

  // Send OTP to email
  const handleSendOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!isData.email) {
      toast.info("Email is required!");
      return;
    }

    // Check if user is rate limited
    if (isRateLimited) {
      const remainingTime = Math.ceil((rateLimitEndTime - Date.now()) / 1000);
      toast.error(`Rate limited. Please wait ${remainingTime} seconds.`);
      return;
    }

    // Check resend timer
    if (otpResendTimer > 0) {
      toast.info(`Please wait ${otpResendTimer} seconds before requesting a new OTP.`);
      return;
    }

    // Check rate limit
    if (!checkRateLimit()) {
      return;
    }

    // Minimum time between requests (prevent spam clicking)
    const now = Date.now();
    const timeSinceLastRequest = now - lastOtpRequestTime.current;
    if (timeSinceLastRequest < 5000) { // 5 second minimum
      toast.info('Please wait a moment before requesting another OTP.');
      return;
    }

    setIsLoading(true);

    try {
      // Get cached location data (reduces API calls)
      const locationData = await getCachedLocationData();
      
      // Log OTP sent (batched - only if successful)
      const logPromise = logClientLogin({
        userEmail: isData.email,
        status: 'otp_sent',
        ipAddress: locationData.ipAddress,
        userAgent: locationData.userAgent,
        location: locationData.location
      });

      // Create OTP in Firestore
      const result = await createOTP({ email: isData.email });
      
      if (result.code === 777 && result.otp) {
        // Send OTP via email
        const emailResponse = await fetch('/api/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: isData.email, 
            otp: result.otp 
          })
        });

        if (emailResponse.ok) {
          // Update tracking
          lastOtpRequestTime.current = now;
          requestTimestamps.current.push(now);
          setOtpAttempts(prev => prev + 1);
          
          // Set progressive timer
          const waitTime = getWaitTime();
          setOtpResendTimer(waitTime);
          
          // Log success (don't await to reduce blocking)
          logPromise.catch(err => console.error('Failed to log OTP sent:', err));
          
          toast.success(`OTP sent! You can request a new one in ${waitTime} seconds.`);
          setStep('otp');
        } else {
          toast.error('Failed to send OTP email');
        }
      } else {
        toast.error(result.message || 'Failed to generate OTP');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP and login/signup
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isData.otp) {
      toast.info("Please enter the OTP!");
      return;
    }

    if (isData.otp.length !== 6) {
      toast.info("OTP must be 6 digits!");
      return;
    }

    setIsLoading(true);

    try {
      // Get cached location data
      const locationData = await getCachedLocationData();

      // Verify OTP
      const result = await verifyOTP({ 
        email: isData.email, 
        otp: isData.otp 
      });

      if (result.code === 777) {
        setIsNewUser(result.isNewUser || false);

        // Log OTP verified (async, don't block)
        logClientLogin({
          userEmail: isData.email,
          status: 'otp_verified',
          ipAddress: locationData.ipAddress,
          userAgent: locationData.userAgent,
          location: locationData.location
        }).catch(err => console.error('Failed to log OTP verified:', err));

        if (result.isNewUser) {
          // New user - ask for display name
          toast.success('OTP verified! Please complete your profile.');
          setStep('details');
        } else {
          // Existing user - sign them in with their stored OTP password
          const signInResult = await signInOTPUser({ email: isData.email });
          
          if (signInResult.code === 777) {
            // Log successful login (async)
            logClientLogin({
              userEmail: isData.email,
              status: 'success',
              ipAddress: locationData.ipAddress,
              userAgent: locationData.userAgent,
              location: locationData.location
            }).catch(err => console.error('Failed to log success:', err));

            toast.success('Login successful!');
            router.push('/dashboard');
          } else {
            // Log failed login (async)
            logClientLogin({
              userEmail: isData.email,
              status: 'failed',
              failureReason: signInResult.message,
              ipAddress: locationData.ipAddress,
              userAgent: locationData.userAgent,
              location: locationData.location
            }).catch(err => console.error('Failed to log failure:', err));

            toast.error(signInResult.message || 'Failed to sign in');
          }
        }
      } else {
        // Log failed OTP verification (async)
        logClientLogin({
          userEmail: isData.email,
          status: 'failed',
          failureReason: 'Invalid OTP',
          ipAddress: locationData.ipAddress,
          userAgent: locationData.userAgent,
          location: locationData.location
        }).catch(err => console.error('Failed to log invalid OTP:', err));

        toast.error(result.message || 'Invalid OTP');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Complete signup for new users
  const handleCompleteSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isData.username) {
      toast.info("Please enter your name!");
      return;
    }

    setIsLoading(true);

    try {
      // Get cached location data
      const locationData = await getCachedLocationData();

      const result = await createUserWithOTP({ 
        email: isData.email, 
        displayName: isData.username 
      });

      if (result.code === 777) {
        // Log successful signup (async)
        logClientLogin({
          userEmail: isData.email,
          status: 'success',
          ipAddress: locationData.ipAddress,
          userAgent: locationData.userAgent,
          location: locationData.location
        }).catch(err => console.error('Failed to log signup:', err));

        toast.success('Account created successfully!');
        router.push('/dashboard');
      } else {
        // Log failed signup (async)
        logClientLogin({
          userEmail: isData.email,
          status: 'failed',
          failureReason: result.message,
          ipAddress: locationData.ipAddress,
          userAgent: locationData.userAgent,
          location: locationData.location
        }).catch(err => console.error('Failed to log failed signup:', err));

        toast.error(result.message || 'Failed to create account');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    setIsLoading(true);
    
    try {
      // Get cached location data
      const locationData = await getCachedLocationData();

      const result = await signUpWithGoogleAccount();
      
      if (result?.code === 777) {
        // Log successful Google login (async)
        logClientLogin({
          userEmail: result.email || 'unknown',
          status: 'success',
          ipAddress: locationData.ipAddress,
          userAgent: locationData.userAgent,
          location: locationData.location
        }).catch(err => console.error('Failed to log Google login:', err));

        toast.success('Signed in with Google successfully!');
        setIsData({ username: '', email: '', otp: '' });
        if (result.uid) router.push('/dashboard');
      } else {
        // Log failed Google login (async)
        logClientLogin({
          userEmail: isData.email || 'unknown',
          status: 'failed',
          failureReason: result?.message || 'Google auth failed',
          ipAddress: locationData.ipAddress,
          userAgent: locationData.userAgent,
          location: locationData.location
        }).catch(err => console.error('Failed to log Google failure:', err));

        toast.error(`${result?.message || 'Google auth failed.'}${result?.errorCode ? ` (${result.errorCode})` : ''}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setIsData({ ...isData, otp: '' });
  };

  // Format timer display
  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-6">
      <ToastContainer position="top-right" autoClose={7000} hideProgressBar={false} closeOnClick draggable pauseOnHover theme="light" />
      
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left Panel - Info */}
        <div className="hidden md:block bg-gradient-to-br from-slate-900 to-red-600 text-white rounded-3xl p-8 shadow-xl">
          <h2 className="text-3xl font-extrabold">Welcome to Bulky</h2>
          <p className="mt-4 text-slate-100/90">Professional email campaign manager. Create campaigns, upload recipients and track results.</p>
          <ul className="mt-6 space-y-3 text-sm text-slate-100/70">
            <li>• Batch sending</li>
            <li>• Template + CSV support</li>
            <li>• Delivery monitoring</li>
            <li>• Secure OTP authentication</li>
          </ul>
          
          {/* Step Indicator */}
          <div className="mt-8 pt-8 border-t border-white/20">
            <p className="text-xs text-slate-300 mb-3">Authentication Steps:</p>
            <div className="space-y-2">
              <div className={`flex items-center gap-2 ${step === 'email' ? 'text-white' : 'text-slate-400'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 'email' ? 'bg-white text-slate-900' : 'bg-slate-700'}`}>
                  1
                </div>
                <span className="text-sm">Enter Email</span>
              </div>
              <div className={`flex items-center gap-2 ${step === 'otp' ? 'text-white' : 'text-slate-400'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 'otp' ? 'bg-white text-slate-900' : 'bg-slate-700'}`}>
                  2
                </div>
                <span className="text-sm">Verify OTP</span>
              </div>
              <div className={`flex items-center gap-2 ${step === 'details' ? 'text-white' : 'text-slate-400'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 'details' ? 'bg-white text-slate-900' : 'bg-slate-700'}`}>
                  3
                </div>
                <span className="text-sm">Complete Profile</span>
              </div>
            </div>
          </div>

          {/* Rate Limit Info */}
          {(otpResendTimer > 0 || isRateLimited) && (
            <div className="mt-6 p-4 bg-white/10 rounded-lg border border-white/20">
              <p className="text-xs text-slate-200 mb-2">Security Notice:</p>
              {isRateLimited ? (
                <p className="text-sm text-white font-medium">
                   Too many attempts. Locked for {formatTimer(Math.ceil((rateLimitEndTime - Date.now()) / 1000))}
                </p>
              ) : (
                <p className="text-sm text-white">
                   Next OTP request in: {formatTimer(otpResendTimer)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right Panel - Auth Form */}
        <div className="bg-white rounded-3xl p-8 shadow-lg border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-slate-700 flex items-center justify-center text-white font-bold">B</div>
              <div className="text-lg font-semibold">Bulky</div>
            </div>
            <Link href="/" className="text-sm text-slate-500 hover:underline">Back to site</Link>
          </div>

          <div className="mb-6">
            <h3 className="text-2xl font-bold text-slate-900">
              {step === 'email' && 'Sign in or Sign up'}
              {step === 'otp' && 'Verify Your Email'}
              {step === 'details' && 'Complete Your Profile'}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {step === 'email' && 'Enter your email to get started'}
              {step === 'otp' && 'Enter the code sent to your email'}
              {step === 'details' && 'Tell us your name to continue'}
            </p>
          </div>

          <div className="space-y-4">
            {/* Google Sign In */}
            {step === 'email' && (
              <>
                <button 
                  onClick={handleGoogle} 
                  disabled={isLoading}
                  className="w-full inline-flex items-center justify-center gap-3 px-4 py-3 rounded-md border hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className="opacity-80">
                    <path d="M21.805 10.023h-9.792v3.954h5.606c-.243 1.582-1.686 4.64-5.606 4.64-3.36 0-6.103-2.767-6.103-6.175s2.743-6.175 6.103-6.175c1.918 0 3.2.822 3.935 1.536l2.676-2.581C18.293 3.216 16.155 2 12.013 2 6.605 2 2.07 6.61 2.07 12s4.535 10 9.943 10c5.727 0 9.792-4.016 9.792-9.977 0-.67-.074-1.315-.0-1.999z" fill="#4285F4"/>
                  </svg>
                  <span className="text-sm text-slate-700">Continue with Google</span>
                </button>

                <div className="flex items-center justify-center gap-3 text-sm text-slate-400">
                  <div className="h-px bg-slate-100 w-full" />
                  <div>or</div>
                  <div className="h-px bg-slate-100 w-full" />
                </div>
              </>
            )}

            {/* Step 1: Email Input */}
            {step === 'email' && (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address
                  </label>
                  <input
                    value={isData.email}
                    onChange={(e) => setIsData({ ...isData, email: e.target.value })}
                    placeholder="you@example.com"
                    type="email"
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || otpResendTimer > 0 || isRateLimited}
                  className="w-full px-4 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-gradient-to-br hover:from-red-900 hover:to-slate-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Sending OTP...
                    </span>
                  ) : otpResendTimer > 0 ? (
                    `Wait ${formatTimer(otpResendTimer)} to resend`
                  ) : isRateLimited ? (
                    'Rate Limited - Please Wait'
                  ) : (
                    'Continue with Email'
                  )}
                </button>
                
                <p className="text-xs text-center text-slate-500">
                  We will send you a one-time code to verify your email
                </p>
              </form>
            )}

            {/* Step 2: OTP Verification */}
            {step === 'otp' && (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Verification Code
                  </label>
                  <input
                    value={isData.otp}
                    onChange={(e) => setIsData({ ...isData, otp: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                    placeholder="000000"
                    maxLength={6}
                    required
                    autoFocus
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg text-center text-2xl tracking-[0.5em] font-bold focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                  />
                  <p className="text-xs text-slate-500 mt-2 text-center">
                    Check your inbox at <span className="font-medium text-slate-700">{isData.email}</span>
                  </p>
                </div>
                
                <button
                  type="submit"
                  disabled={isLoading || isData.otp.length !== 6}
                  className="w-full px-4 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-gradient-to-br hover:from-red-900 hover:to-slate-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Verifying...
                    </span>
                  ) : (
                    'Verify Code'
                  )}
                </button>

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={isLoading || otpResendTimer > 0 || isRateLimited}
                    className="w-full text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {otpResendTimer > 0 
                      ? `Resend code in ${formatTimer(otpResendTimer)}` 
                      : isRateLimited 
                      ? 'Too many attempts - please wait'
                      : 'Did not receive code? Resend'}
                  </button>
                  <button
                    type="button"
                    onClick={handleBackToEmail}
                    disabled={isLoading}
                    className="w-full text-sm text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
                  >
                    ← Change email address
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Complete Profile (New Users Only) */}
            {step === 'details' && isNewUser && (
              <form onSubmit={handleCompleteSignup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Full Name
                  </label>
                  <input
                    value={isData.username}
                    onChange={(e) => setIsData({ ...isData, username: e.target.value })}
                    placeholder="John Doe"
                    required
                    autoFocus
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-gradient-to-br hover:from-red-900 hover:to-slate-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Creating Account...
                    </span>
                  ) : (
                    'Complete Signup'
                  )}
                </button>
              </form>
            )}

            {/* Terms */}
            {step === 'email' && (
              <p className="text-xs text-center text-slate-500 pt-4">
                By continuing, you agree to our{' '}
                <a href="#" className="underline hover:text-slate-700">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="underline hover:text-slate-700">Privacy Policy</a>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}