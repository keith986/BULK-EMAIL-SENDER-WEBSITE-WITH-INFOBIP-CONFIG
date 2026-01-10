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
  logClientLogin,
  fetchSystemSettings,
  getUserByEmail,
  checkUserLoginStatus
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

  const [registrationEnabled, setRegistrationEnabled] = useState<boolean>(false);
  const [checkingRegistration, setCheckingRegistration] = useState<boolean>(true);

  const [otpResendTimer, setOtpResendTimer] = useState<number>(0);
  const [otpAttempts, setOtpAttempts] = useState<number>(0);
  const [isRateLimited, setIsRateLimited] = useState<boolean>(false);
  const [rateLimitEndTime, setRateLimitEndTime] = useState<number>(0);
  
  const locationDataCache = useRef<{
    data: { ipAddress: string; location: string; userAgent: string } | null;
    timestamp: number;
  }>({ data: null, timestamp: 0 });
  
  const lastOtpRequestTime = useRef<number>(0);
  const requestTimestamps = useRef<number[]>([]);

  useEffect(() => {
    const checkRegistrationStatus = async () => {
      try {
        const result = await fetchSystemSettings();
        if (result.code === 777 && result.data) {
          console.log('📋 Registration status:', result.data.registrationEnabled);
          setRegistrationEnabled(result.data.registrationEnabled);
        }
      } catch (error) {
        console.error('Error checking registration status:', error);
        setRegistrationEnabled(false);
      } finally {
        setCheckingRegistration(false);
      }
    };

    checkRegistrationStatus();
  }, []);

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

  const getCachedLocationData = async () => {
    const now = Date.now();
    const CACHE_DURATION = 5 * 60 * 1000;

    if (
      locationDataCache.current.data && 
      now - locationDataCache.current.timestamp < CACHE_DURATION
    ) {
      return locationDataCache.current.data;
    }

    try {
      const data = await getUserLocationData();
      locationDataCache.current = {
        data,
        timestamp: now
      };
      return data;
    } catch (error) {
      console.error('Error fetching location data:', error);
      return locationDataCache.current.data || {
        ipAddress: 'Unknown',
        location: 'Unknown',
        userAgent: navigator.userAgent || 'Unknown'
      };
    }
  };

  const checkRateLimit = (): boolean => {
    const now = Date.now();
    const WINDOW_MS = 60 * 1000;
    const MAX_REQUESTS = 3;

    requestTimestamps.current = requestTimestamps.current.filter(
      timestamp => now - timestamp < WINDOW_MS
    );

    if (requestTimestamps.current.length >= MAX_REQUESTS) {
      const lockDuration = 2 * 60 * 1000;
      setIsRateLimited(true);
      setRateLimitEndTime(now + lockDuration);
      toast.error('Too many attempts. Please wait 2 minutes before trying again.');
      return false;
    }

    return true;
  };

  const getWaitTime = (): number => {
    const baseDelay = 30;
    const increment = 30;
    return Math.min(baseDelay + (otpAttempts * increment), 120);
  };

  const checkUserEligibility = async (email: string): Promise<{ 
    canProceed: boolean; 
    isNewUser: boolean; 
    message?: string 
  }> => {
    try {
      console.log('🔍 Checking user eligibility for:', email);
      
      const result = await getUserByEmail({ email });
      
      console.log('📊 getUserByEmail result:', { code: result.code, message: result.message });
      
      if (result.code === 777) {
        console.log('✅ User EXISTS in Firestore - allowing login');
        return { canProceed: true, isNewUser: false };
      } else if (result.code === 404) {
        console.log('❌ User NOT FOUND in Firestore');
        console.log('📋 Registration enabled?', registrationEnabled);
        
        if (!registrationEnabled) {
          console.log('✅ Registration ENABLED - allowing new user');
          return { canProceed: true, isNewUser: true };
        } else {
          console.log('🚫 Registration DISABLED - BLOCKING new user');
          return { 
            canProceed: false, 
            isNewUser: true,
            message: 'This email is not registered in our system. Please contact the administrator for access.' 
          };
        }
      } else {
        console.error('⚠️ Error checking user:', result.message);
        return { 
          canProceed: false, 
          isNewUser: true,
          message: 'Unable to verify your account. Please try again later.' 
        };
      }
    } catch (error) {
      console.error('⚠️ Exception in checkUserEligibility:', error);
      return { 
        canProceed: false, 
        isNewUser: true,
        message: 'Unable to verify your account. Please try again later.' 
      };
    }
  };

  const handleSendOTP = async (e?: React.FormEvent) => {
  if (e) e.preventDefault();
  
  console.log('🚀 handleSendOTP called for:', isData.email);
  
  if (!isData.email) {
    toast.info("Email is required!");
    return;
  }

  if (isRateLimited) {
    const remainingTime = Math.ceil((rateLimitEndTime - Date.now()) / 1000);
    toast.error(`Rate limited. Please wait ${remainingTime} seconds.`);
    return;
  }

  if (otpResendTimer > 0) {
    toast.info(`Please wait ${otpResendTimer} seconds before requesting a new OTP.`);
    return;
  }

  if (!checkRateLimit()) {
    return;
  }

  const now = Date.now();
  const timeSinceLastRequest = now - lastOtpRequestTime.current;
  if (timeSinceLastRequest < 5000) {
    toast.info('Please wait a moment before requesting another OTP.');
    return;
  }

  setIsLoading(true);

  try {
    console.log('🔍 Step 1: Checking user eligibility...');
    const eligibility = await checkUserEligibility(isData.email);
    
    console.log('📋 Eligibility result:', eligibility);
    
    if (!eligibility.canProceed) {
      console.log('🚫 USER BLOCKED - Stopping here, NO OTP will be sent');
      console.log('📝 Reason:', eligibility.message);
      
      toast.error(eligibility.message || 'This email is not registered in our system.');
      
      setIsLoading(false);
      setRegistrationEnabled(false);
      setStep('email');
      
      console.log('⛔ Returning early - OTP sending code will NOT execute');
      return;
    }

    // NEW: Check if user is suspended before sending OTP
    if (!eligibility.isNewUser) {
      console.log('🔍 Step 2: Checking if existing user is suspended...');
      const loginStatus = await checkUserLoginStatus({ email: isData.email });
      
      console.log('📋 Login status result:', loginStatus);
      
      if (!loginStatus.canLogin) {
        console.log('🚫 USER SUSPENDED - Login disabled');
        toast.error(loginStatus.message);
        
        // Log the failed login attempt
        const locationData = await getCachedLocationData();
        await logClientLogin({
          userEmail: isData.email,
          status: 'failed',
          failureReason: 'Account suspended',
          ipAddress: locationData.ipAddress,
          userAgent: locationData.userAgent,
          location: locationData.location
        });
        
        setIsLoading(false);
        return;
      }
      
      console.log('✅ User is active - proceeding...');
    }

    console.log('✅ USER ELIGIBLE - Proceeding to send OTP');
    
    setIsNewUser(eligibility.isNewUser);

    const locationData = await getCachedLocationData();
    
    const logPromise = logClientLogin({
      userEmail: isData.email,
      status: 'otp_sent',
      ipAddress: locationData.ipAddress,
      userAgent: locationData.userAgent,
      location: locationData.location
    });

    console.log('📝 Creating OTP in Firestore...');
    const result = await createOTP({ email: isData.email });
    
    if (result.code === 777 && result.otp) {
      console.log('✉️ Sending OTP email via API...');
      
      const emailResponse = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: isData.email, 
          otp: result.otp 
        })
      });

      if (emailResponse.ok) {
        console.log('✅ OTP email sent successfully');
        
        lastOtpRequestTime.current = now;
        requestTimestamps.current.push(now);
        setOtpAttempts(prev => prev + 1);
        
        const waitTime = getWaitTime();
        setOtpResendTimer(waitTime);
        
        logPromise.catch(err => console.error('Failed to log OTP sent:', err));
        
        toast.success(`OTP sent! Check your email.`);
        setStep('otp');
      } else {
        console.error('❌ Failed to send OTP email - API returned error');
        toast.error('Failed to send OTP email. Please try again.');
      }
    } else {
      console.error('❌ Failed to create OTP in Firestore');
      toast.error(result.message || 'Failed to generate OTP. Please try again.');
    }
  } catch (err) {
    console.error('❌ Error in handleSendOTP:', err);
    const message = err instanceof Error ? err.message : String(err);
    console.log(message)
    toast.error('An error occurred. Please try again.');
  } finally {
    console.log('🏁 handleSendOTP complete, setting isLoading to false');
    setIsLoading(false);
  }
  };

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
    const locationData = await getCachedLocationData();

    const result = await verifyOTP({ 
      email: isData.email, 
      otp: isData.otp 
    });

    if (result.code === 777) {
      const userIsNew = result.isNewUser || false;
      setIsNewUser(userIsNew);

      logClientLogin({
        userEmail: isData.email,
        status: 'otp_verified',
        ipAddress: locationData.ipAddress,
        userAgent: locationData.userAgent,
        location: locationData.location
      }).catch(err => console.error('Failed to log OTP verified:', err));

      if (userIsNew) {
        if (!registrationEnabled) {
          toast.error('New user registration is currently disabled. Please contact the administrator.');
          setStep('email');
          setRegistrationEnabled(false);
          return;
        }
        
        toast.success('OTP verified! Please complete your profile.');
        setStep('details');
      } else {
        // NEW: Double-check suspension status before allowing login
        const loginStatus = await checkUserLoginStatus({ email: isData.email });
        
        if (!loginStatus.canLogin) {
          toast.error(loginStatus.message);
          
          await logClientLogin({
            userEmail: isData.email,
            status: 'failed',
            failureReason: 'Account suspended',
            ipAddress: locationData.ipAddress,
            userAgent: locationData.userAgent,
            location: locationData.location
          });
          
          setIsLoading(false);
          setStep('email');
          return;
        }
        
        const signInResult = await signInOTPUser({ email: isData.email });
        
        if (signInResult.code === 777) {
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

  const handleCompleteSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!registrationEnabled) {
      toast.error('Registration is currently disabled. Please contact the administrator.');
      setRegistrationEnabled(false);
      return;
    }

    if (!isData.username) {
      toast.info("Please enter your name!");
      return;
    }

    setIsLoading(true);

    try {
      const locationData = await getCachedLocationData();

      const result = await createUserWithOTP({ 
        email: isData.email, 
        displayName: isData.username 
      });

      if (result.code === 777) {
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
    console.log('🔍 Google sign-in attempted, checking registration status...');
    console.log('📋 Registration enabled?', registrationEnabled);
    
    if (!registrationEnabled) {
      console.log('🚫 Registration disabled - blocking Google sign-in');
      toast.error('New user registration is currently disabled. Please contact the administrator.');
      setRegistrationEnabled(false);
      return;
    }

    console.log('✅ Registration enabled - proceeding with Google sign-in');
    setIsLoading(true);
    
    try {
      const locationData = await getCachedLocationData();

      const result = await signUpWithGoogleAccount();
      
      if (result?.code === 777) {
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

  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  if (checkingRegistration) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-slate-900 mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!registrationEnabled && step === 'email') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-6">
        <ToastContainer position="top-right" autoClose={7000} hideProgressBar={false} closeOnClick draggable pauseOnHover theme="light" />
        
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-lg border border-slate-100 text-center">
            <div className="mx-auto w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-slate-900 mb-4">
              Registration Temporarily Closed
            </h1>

            <p className="text-slate-600 mb-8 leading-relaxed max-w-md mx-auto">
              New user registration is currently disabled. 
              Only existing users with registered email addresses can access the system.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left max-w-md mx-auto">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">Already have an account?</h3>
                  <p className="text-sm text-blue-800">
                    If your email is registered in our system, you can still sign in. 
                    Click on I Have an Account button below to proceed with login.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                href="/" 
                className="w-full sm:w-auto px-6 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors inline-flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
              </Link>
              
              <button
                onClick={() => {
                  console.log('👤 User clicked "I Have an Account" - enabling form');
                  setRegistrationEnabled(true);
                }}
                className="w-full sm:w-auto px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors inline-flex items-center justify-center gap-2"
              >
                I Have an Account
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-200">
              <p className="text-sm text-slate-500">
                Need urgent access? Contact the administrator at{' '}
                <a href="mailto:admin@bulky.com" className="text-slate-900 hover:underline font-medium">
                  admin@bulky.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-6">
      <ToastContainer position="top-right" autoClose={7000} hideProgressBar={false} closeOnClick draggable pauseOnHover theme="light" />
      
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left Panel */}
        <div className="hidden md:block bg-gradient-to-br from-slate-900 to-red-600 text-white rounded-3xl p-8 shadow-xl">
          <h2 className="text-3xl font-extrabold">Welcome to Bulky</h2>
          <p className="mt-4 text-slate-100/90">Professional email campaign manager.</p>
          <ul className="mt-6 space-y-3 text-sm text-slate-100/70">
            <li>• Batch sending</li>
            <li>• Template + CSV support</li>
            <li>• Delivery monitoring</li>
            <li>• Secure OTP authentication</li>
          </ul>
          
          <div className="mt-8 pt-8 border-t border-white/20">
            <p className="text-xs text-slate-300 mb-3">Authentication Steps:</p>
            <div className="space-y-2">
              <div className={`flex items-center gap-2 ${step === 'email' ? 'text-white' : 'text-slate-400'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 'email' ? 'bg-white text-slate-900' : 'bg-slate-700'}`}>1</div>
                <span className="text-sm">Enter Email</span>
              </div>
              <div className={`flex items-center gap-2 ${step === 'otp' ? 'text-white' : 'text-slate-400'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 'otp' ? 'bg-white text-slate-900' : 'bg-slate-700'}`}>2</div>
                <span className="text-sm">Verify OTP</span>
              </div>
              <div className={`flex items-center gap-2 ${step === 'details' ? 'text-white' : 'text-slate-400'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 'details' ? 'bg-white text-slate-900' : 'bg-slate-700'}`}>3</div>
                <span className="text-sm">Complete Profile</span>
              </div>
            </div>
          </div>

          {(otpResendTimer > 0 || isRateLimited) && (
            <div className="mt-6 p-4 bg-white/10 rounded-lg border border-white/20">
              <p className="text-xs text-slate-200 mb-2">Security Notice:</p>
              {isRateLimited ? (
                <p className="text-sm text-white font-medium">
                  ⏱ Too many attempts. Locked for {formatTimer(Math.ceil((rateLimitEndTime - Date.now()) / 1000))}
                </p>
              ) : (
                <p className="text-sm text-white">
                  ⏱ Next OTP request in: {formatTimer(otpResendTimer)}
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
            {step === 'email' && (
              <>
                <button 
                  onClick={handleGoogle} 
                  disabled={isLoading}
                  className="w-full inline-flex items-center justify-center gap-3 px-4 py-3 rounded-md border hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
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

            {step === 'email' && (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
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
                      Verifying email...
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
                  Only registered emails can access this system
                </p>
              </form>
            )}

            {step === 'otp' && (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Verification Code</label>
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
                  {isLoading ? 'Verifying...' : 'Verify Code'}
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

            {step === 'details' && isNewUser && (
              <form onSubmit={handleCompleteSignup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
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
                  {isLoading ? 'Creating Account...' : 'Complete Signup'}
                </button>
              </form>
            )}

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