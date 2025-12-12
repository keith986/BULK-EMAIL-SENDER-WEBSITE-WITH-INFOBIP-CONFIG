"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUpWithEmailandPassword, signUpWithGoogleAccount, signInWithEmailandPassword } from '../_utils/firebase-operations'; 
import { toast, ToastContainer } from 'react-toastify';
import { useEffect } from 'react';
import { useUser } from '../_context/UserProvider';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [isData, setIsData] = useState({
    username: '',
    email: '',
    passcode: ''
  })
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { user, signOut, loading: userLoading } = useUser();

  // If the user is already signed-in, redirect off this page
  useEffect(() => {
    const validateUser = async () => {
      if (!userLoading && user) {
      // already signed in — send to dashboard
      if (user.profile?.role === 'customer'){
      router.replace('/dashboard');
      }else{
      router.replace('/admin/dashboard');
      }
    }else{
        await signOut();
        router.push('/auth');
    }
    }

    validateUser();
    
  }, [user, userLoading, router, signOut]);

  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

      if (mode === 'signup') {
        if(!isData.username || !isData.email || !isData.passcode){
        toast.info("Username, Email and Password are required!");
        setIsLoading(false);
        return;
        }
      try {
        const result = await signUpWithEmailandPassword({ username: isData.username, email: isData.email, password: isData.passcode });
        if (result?.code === 777) {
          toast.success(result.message || 'Successfully created account.');
          // reset form and switch to login state so user can sign in
          setIsData({ username: '', email: '', passcode: '' });
          setMode('login');
          setIsLoading(false);
        } else {
          toast.error(`${result?.message || 'Signup failed.'}${result?.errorCode ? ` (${result.errorCode})` : ''}`);
          setIsData({ username: '', email: '', passcode: '' });
          setMode('login');
          setIsLoading(false);
        }
        
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        toast.error(message);
        setIsData({ username: '', email: '', passcode: '' });
        setMode('login');
        setIsLoading(false);
      }
    }

     if (mode === 'login') {
         if(!isData.email || !isData.passcode){
        toast.info("Email and Password are required!");
        setIsLoading(false);
        return;
        }
            try {
              const result = await signInWithEmailandPassword({ email: isData.email, password: isData.passcode });
              if (result?.code === 777) {
                toast.success('Signed in successfully');
                // reset
                setIsData({ username: '', email: '', passcode: '' });
                setIsLoading(false);
                const uid = result.uid;
                // redirect to dashboard — UserProvider will provide the auth state application-wide
                if (uid) router.push('/dashboard');
              } else {
                toast.error(`${result?.message || 'Sign-in failed.'}${result?.errorCode ? ` (${result.errorCode})` : ''}`);
                setIsLoading(false);
              }
            } catch (err) {
              const message = err instanceof Error ? err.message : String(err);
              toast.error(message);
              setIsLoading(false);
            }
     }

  };

  const handleGoogle = async() => {
    setIsLoading(true);
    if (mode === 'signup') {
      try {
        const result = await signUpWithGoogleAccount();
        if (result?.code === 777) {
          toast.success(result.message || 'Successfully created account with Google.');
          // reset form and switch to login
          setIsData({ username: '', email: '', passcode: '' });
          setMode('login');
          setIsLoading(false);
        } else {
          toast.error(`${result?.message || 'Google signup failed.'}${result?.errorCode ? ` (${result.errorCode})` : ''}`);
          setIsData({ username: '', email: '', passcode: '' });
          setMode('login');
          setIsLoading(false);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        toast.error(message);
        setIsData({ username: '', email: '', passcode: '' });
        setMode('login');
        setIsLoading(false);
      }
    }

    if(mode === 'login'){
        try{
            const result = await signUpWithGoogleAccount();
            if (result?.code === 777) {
                toast.success('Signed in with Google successfully');
                // reset
                setIsData({ username: '', email: '', passcode: '' });
                setIsLoading(false);
                const uid = result.uid;
                // redirect to dashboard — UserProvider will provide the auth state application-wide
                if (uid) router.push('/dashboard');
                } else {
                toast.error(`${result?.message || 'Google Sign-in failed.'}${result?.errorCode ? ` (${result.errorCode})` : ''}`);
                setIsLoading(false);
                }
        }catch(err){
            const message = err instanceof Error ? err.message : String(err);
            toast.error(message);
            setIsLoading(false);
        }
    }

  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-6">
        <ToastContainer position="top-right" autoClose={7000} hideProgressBar={false} closeOnClick draggable pauseOnHover theme={"light"} />
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="hidden md:block bg-gradient-to-br from-slate-900 to-red-600 text-white rounded-3xl p-8 shadow-xl">
          <h2 className="text-3xl font-extrabold">Welcome to Bulky</h2>
          <p className="mt-4 text-slate-100/90">Professional email campaign manager. Create campaigns, upload recipients and track results.</p>
          <ul className="mt-6 space-y-3 text-sm text-slate-100/70">
            <li>• Batch sending and scheduling</li>
            <li>• Template + CSV support</li>
            <li>• Delivery retries and monitoring</li>
          </ul>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-lg border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-slate-700 flex items-center justify-center text-white font-bold">B</div>
              <div className="text-lg font-semibold">Bulky</div>
            </div>
            <Link href="/" className="text-sm text-slate-500 hover:underline">Back to site</Link>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <button onClick={handleGoogle} className="w-full inline-flex items-center justify-center gap-3 px-4 py-3 rounded-md border hover:bg-slate-50">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className="opacity-80"><path d="M21.805 10.023h-9.792v3.954h5.606c-.243 1.582-1.686 4.64-5.606 4.64-3.36 0-6.103-2.767-6.103-6.175s2.743-6.175 6.103-6.175c1.918 0 3.2.822 3.935 1.536l2.676-2.581C18.293 3.216 16.155 2 12.013 2 6.605 2 2.07 6.61 2.07 12s4.535 10 9.943 10c5.727 0 9.792-4.016 9.792-9.977 0-.67-.074-1.315-.0-1.999z" fill="#4285F4"/></svg>
                <span className="text-sm text-slate-700">Continue with Google</span>
              </button>
            </div>

            <div className="flex items-center justify-center gap-3 text-sm text-slate-400">
              <div className="h-px bg-slate-100 w-full" />
              <div>or </div>
              <div className="h-px bg-slate-100 w-full" />
            </div>

            <div className="flex gap-3 items-center justify-center text-sm">
              <button onClick={() => setMode('login')} className={`px-3 py-2 rounded-md ${mode === 'login' ? 'bg-slate-900 text-white' : 'border'}`}>Login</button>
              <button onClick={() => setMode('signup')} className={`px-3 py-2 rounded-md ${mode === 'signup' ? 'bg-amber-500 text-white' : 'border'}`}>Sign up</button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Full name</label>
                  <input value={isData.username} name="username" id="username" onChange={(e) => setIsData({...isData, username: e.target.value})} placeholder="Your name" className="w-full px-3 py-2 border rounded-md" />
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-500 mb-1">Email</label>
                <input value={isData.email} name="email" id="email" onChange={(e) => setIsData({...isData, email: e.target.value})} placeholder="you@example.com" type="email" className="w-full px-3 py-2 border rounded-md" />
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Password</label>
                <div className="relative">
                  <input
                    value={isData.passcode}
                    name="passcode"
                    id="passcode"
                    onChange={(e) => setIsData({...isData, passcode: e.target.value} )}
                    placeholder="Choose a secure password"
                    type={showPassword ? 'text' : 'password'}
                    className="w-full px-3 py-2 border rounded-md pr-10"
                    aria-describedby="toggle-pass-visibility"
                  />
                  <button
                    type="button"
                    id="toggle-pass-visibility"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-eye-off"><path d="M17.94 17.94A10.08 10.08 0 0 1 12 19c-5.523 0-10-4.477-10-7s4.477-7 10-7c2.21 0 4.31.66 6.06 1.76"/><path d="M1 1l22 22"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-eye"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div> 
                <span className="text-sm text-slate-500">By continuing you agree to our <a className="underline" href="#">Terms</a>.</span>
              <div className="flex items-center justify-center">
                <button type="submit" disabled={isLoading} className="w-full px-4 py-2 bg-slate-900 text-white rounded-md cursor-pointer hover:bg-gradient-to-br hover:from-red-900 hover:to-slate-700 hover:transform hover:scale-105 hover:delay-100">
                {isLoading ? 'Please wait...' :
                    mode === 'login' ? 'Sign in' : 'Create account'
                }
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
