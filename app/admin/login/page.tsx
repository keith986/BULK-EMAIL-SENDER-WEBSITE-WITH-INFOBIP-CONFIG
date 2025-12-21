"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../_lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useUser } from '../../_context/UserProvider';
import { createOTP, verifyOTP, logAdminLogin, getUserLocationData } from '../../_utils/firebase-operations';

const ADMIN_EMAILS = [
  'keithkelly986@gmail.com'
  // Add more admin emails as needed
];

type Step = 'credentials' | 'otp' | 'success';

export default function AdminLogin() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const { user, signOut } = useUser();
  // Add this at the component level
  const [locationData, setLocationData] = useState<{
  ipAddress: string;
  location: string;
  userAgent: string;
  }>({
  ipAddress: 'Unknown',
  location: 'Unknown',
  userAgent: 'Unknown'
  });

  useEffect(() => {
    // Check if already authenticated as admin
    const checkAuth = async () => {
      const userA = auth.currentUser;
      if (userA && ADMIN_EMAILS.includes(userA.email || '')) {
        if(user?.profile?.role === 'admin'){
          setIsAuthenticated(true);
          router.push('/admin/dashboard');
        }else{
          router.push('/dashboard');
        }
      }else{
        await signOut();
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, [router, signOut, user]);

  // Add useEffect to get location data on mount
useEffect(() => {
  const fetchLocation = async () => {
    const data = await getUserLocationData();
    setLocationData(data);
  };
  fetchLocation();
}, []);

// Updated handleCredentialsSubmit with logging
const handleCredentialsSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    // Validate email format
    if (!email || !email.includes('@')) {
      await logAdminLogin({
        adminEmail: email,
        status: 'failed',
        failureReason: 'Invalid email format',
        ...locationData
      });
      throw new Error('Please enter a valid email address');
    }

    // Validate password
    if (!password || password.length < 6) {
      await logAdminLogin({
        adminEmail: email,
        status: 'failed',
        failureReason: 'Password too short',
        ...locationData
      });
      throw new Error('Password must be at least 6 characters');
    }

    // Check if user is admin
    const isAdmin = await validateAdmin(email);
    if (!isAdmin) {
      await logAdminLogin({
        adminEmail: email,
        status: 'failed',
        failureReason: 'Not an admin email',
        ...locationData
      });
      throw new Error('Access denied. Admin privileges required.');
    }

    // Verify credentials
    try {
      await signInWithEmailAndPassword(auth, email, password);
      await auth.signOut();
    } catch (authError) {
      await logAdminLogin({
        adminEmail: email,
        status: 'failed',
        failureReason: 'Invalid credentials',
        ...locationData
      });
      throw authError;
    }

    // Generate and send OTP
    const otpResult = await createOTP({ email });
    
    if (otpResult.code === 777 && otpResult.otp) {
      const emailResponse = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          otp: otpResult.otp,
          isAdmin: true
        })
      });

      if (emailResponse.ok) {
        // Log OTP sent
        await logAdminLogin({
          adminEmail: email,
          status: 'otp_sent',
          ...locationData
        });
        
        setOtpSent(true);
        setStep('otp');
        setError('');
      } else {
        await logAdminLogin({
          adminEmail: email,
          status: 'failed',
          failureReason: 'Failed to send OTP',
          ...locationData
        });
        throw new Error('Failed to send OTP. Please try again.');
      }
    }
    
  } catch (err: unknown) {
    console.error('Login error:', err);
    const error = err as { code?: string; message?: string };
    
    // Handle specific Firebase errors
    if (error.code === 'auth/user-not-found') {
      setError('No account found with this email address');
    } else if (error.code === 'auth/wrong-password') {
      setError('Incorrect password');
    } else if (error.code === 'auth/invalid-email') {
      setError('Invalid email address format');
    } else if (error.code === 'auth/user-disabled') {
      setError('This account has been disabled');
    } else if (error.code === 'auth/too-many-requests') {
      setError('Too many failed attempts. Please try again later');
    } else {
      setError(error.message || 'Login failed. Please try again.');
    }
  } finally {
    setLoading(false);
  }
};

  const validateAdmin = async (userEmail: string): Promise<boolean> => {
    // Check if email is in the admin list
    if (!ADMIN_EMAILS.includes(userEmail)) {
      return false;
    }

    // Optional: Additional verification from Firestore
    try {
      const adminsQuery = query(
        collection(db, 'admins'),
        where('email', '==', userEmail),
        where('role', '==', 'admin')
      );
      const snapshot = await getDocs(adminsQuery);
      
      if (snapshot.empty && ADMIN_EMAILS.includes(userEmail)) {
        return true;
      }
      
      return !snapshot.empty;
    } catch (err: unknown) {
      console.log('Using default admin email list', err);
      return ADMIN_EMAILS.includes(userEmail);
    }
  };

  /*
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate email format
      if (!email || !email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      // Validate password
      if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      // Check if user is admin before attempting login
      const isAdmin = await validateAdmin(email);
      if (!isAdmin) {
        throw new Error('Access denied. Admin privileges required.');
      }

      // Verify credentials with Firebase Auth (but don't sign in yet)
      await signInWithEmailAndPassword(auth, email, password);
      
      // Sign out immediately - we'll sign in again after OTP verification
      await auth.signOut();

      // Generate and send OTP
      const otpResult = await createOTP({ email });
      
      if (otpResult.code === 777 && otpResult.otp) {
        // Send OTP via email
        const emailResponse = await fetch('/api/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email, 
            otp: otpResult.otp,
            isAdmin: true // Flag for admin OTP email template
          })
        });

        if (emailResponse.ok) {
          setOtpSent(true);
          setStep('otp');
          setError('');
        } else {
          throw new Error('Failed to send OTP. Please try again.');
        }
      } else {
        throw new Error('Failed to generate OTP. Please try again.');
      }
      
    } catch (err: unknown) {
      console.error('Login error:', err);
      const error = err as { code?: string; message?: string };
      
      // Handle specific Firebase errors
      if (error.code === 'auth/user-not-found') {
        setError('No account found with this email address');
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address format');
      } else if (error.code === 'auth/user-disabled') {
        setError('This account has been disabled');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later');
      } else {
        setError(error.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };


  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!otp || otp.length !== 6) {
        throw new Error('Please enter a valid 6-digit OTP');
      }

      // Verify OTP
      const verifyResult = await verifyOTP({ email, otp });

      if (verifyResult.code === 777) {
        // OTP verified - now sign in with Firebase Auth
        await signInWithEmailAndPassword(auth, email, password);
        
        // Double-check admin status after login
        const stillAdmin = await validateAdmin(email);
        if (!stillAdmin) {
          await auth.signOut();
          throw new Error('Access denied. Admin privileges required.');
        }

        // Success
        setStep('success');
        setIsAuthenticated(true);
        
        // Redirect after a brief success message
        setTimeout(() => {
          router.push('/admin/dashboard');
        }, 1500);
      } else {
        throw new Error(verifyResult.message || 'Invalid OTP. Please try again.');
      }
      
    } catch (err: unknown) {
      console.error('OTP verification error:', err);
      const error = err as { message?: string };
      setError(error.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
*/

// Updated handleOtpSubmit with logging
const handleOtpSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    if (!otp || otp.length !== 6) {
      await logAdminLogin({
        adminEmail: email,
        status: 'failed',
        failureReason: 'Invalid OTP format',
        ...locationData
      });
      throw new Error('Please enter a valid 6-digit OTP');
    }

    // Verify OTP
    const verifyResult = await verifyOTP({ email, otp });

    if (verifyResult.code === 777) {
      // Log OTP verified
      await logAdminLogin({
        adminEmail: email,
        status: 'otp_verified',
        ...locationData
      });

      // Sign in with Firebase Auth
      await signInWithEmailAndPassword(auth, email, password);
      
      // Double-check admin status
      const stillAdmin = await validateAdmin(email);
      if (!stillAdmin) {
        await auth.signOut();
        await logAdminLogin({
          adminEmail: email,
          status: 'failed',
          failureReason: 'Admin status check failed',
          ...locationData
        });
        throw new Error('Access denied. Admin privileges required.');
      }

      // Log successful login
      await logAdminLogin({
        adminEmail: email,
        status: 'success',
        ...locationData
      });

      setStep('success');
      setIsAuthenticated(true);
      
      setTimeout(() => {
        router.push('/admin/dashboard');
      }, 1500);
    } else {
      await logAdminLogin({
        adminEmail: email,
        status: 'failed',
        failureReason: 'Invalid OTP code',
        ...locationData
      });
      throw new Error(verifyResult.message || 'Invalid OTP. Please try again.');
    }
    
  } catch (err: unknown) {
    console.error('OTP verification error:', err);
    const error = err as { message?: string };
    setError(error.message || 'OTP verification failed. Please try again.');
  } finally {
    setLoading(false);
  }
};


  const handleResendOtp = async () => {
    setError('');
    setLoading(true);

    try {
      const otpResult = await createOTP({ email });
      
      if (otpResult.code === 777 && otpResult.otp) {
        const emailResponse = await fetch('/api/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email, 
            otp: otpResult.otp,
            isAdmin: true
          })
        });

        if (emailResponse.ok) {
          setError('');
          alert('New OTP sent to your email!');
        } else {
          throw new Error('Failed to send OTP');
        }
      }
    } catch (err) {
      const error = err as { message?: string };
      setError(error.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToCredentials = () => {
    setStep('credentials');
    setOtp('');
    setError('');
  };

  if (isAuthenticated && step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Granted!</h2>
          <p className="text-gray-600">Redirecting to admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4">
            <Shield className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Admin Portal</h1>
          <p className="text-blue-100">
            {step === 'credentials' && 'Secure access for administrators only'}
            {step === 'otp' && 'Two-Factor Authentication'}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="bg-white/20 backdrop-blur-sm rounded-full p-1 mb-6">
          <div className="flex items-center justify-between">
            <div className={`flex-1 flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
              step === 'credentials' ? 'bg-white text-blue-600' : 'text-white'
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step === 'credentials' ? 'bg-blue-600 text-white' : 'bg-white/30'
              }`}>1</div>
              <span className="text-sm font-medium hidden sm:inline">Credentials</span>
            </div>
            <div className={`flex-1 flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
              step === 'otp' ? 'bg-white text-blue-600' : 'text-white'
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step === 'otp' ? 'bg-blue-600 text-white' : 'bg-white/30'
              }`}>2</div>
              <span className="text-sm font-medium hidden sm:inline">Verify OTP</span>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Step 1: Credentials */}
          {step === 'credentials' && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Verifying credentials...
                  </div>
                ) : (
                  'Continue to Verification'
                )}
              </button>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <Mail className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Check Your Email</h3>
                <p className="text-sm text-gray-600">
                  We have sent a 6-digit verification code to
                </p>
                <p className="text-sm font-semibold text-gray-800 mt-1">{email}</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2 text-center">
                  Enter Verification Code
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl tracking-[0.5em] font-bold focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  required
                  disabled={loading}
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Code expires in 10 minutes
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Verifying code...
                  </div>
                ) : (
                  'Verify & Sign In'
                )}
              </button>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors disabled:opacity-50"
                >
                  Did not receive code? Resend
                </button>
                <button
                  type="button"
                  onClick={handleBackToCredentials}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  ← Back to login
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-white/80">
            Protected by two-factor authentication
          </p>
        </div>
      </div>
    </div>
  );
}