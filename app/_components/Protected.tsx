"use client";
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../_context/UserProvider';

export default function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  console.log('Protected user:', user);
  // keep the loading UI visible for at least this many ms so the user sees the spinner
  const MIN_LOADING_MS = 1000; // 1s
  const startRef = useRef<number | null>(null);
  // start showing the loading skeleton immediately so the protected page is not briefly visible
  const [showLoading, setShowLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (loading) {
      // record when loading started and ensure the loading UI is visible
      startRef.current = startRef.current ?? Date.now();
      // schedule the state update asynchronously to avoid a sync setState inside the effect
      timer = setTimeout(() => setShowLoading(true), 16);
    } else {
      // if we never recorded a start time (loading was false from the start), set it now so the
      // skeleton still stays visible for at least MIN_LOADING_MS
      startRef.current = startRef.current ?? Date.now();
      // when loading stops, ensure the loading UI stays visible for at least MIN_LOADING_MS
      const started = startRef.current ?? Date.now();
      const elapsed = Date.now() - started;
      const remaining = Math.max(0, MIN_LOADING_MS - elapsed);

      timer = setTimeout(() => {
        setShowLoading(false);
        // only redirect after we've ensured the loading UI was visible for the minimum time
        if (!user) router.replace('/auth');

      }, remaining);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [user, loading, router]);

  if (showLoading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-white flex flex-col overflow-hidden">
        <header className="h-20 w-full border-b border-slate-200 bg-white/50 backdrop-blur-md animate-pulse flex items-center px-6">
          <div className="h-8 w-28 bg-slate-200 rounded-md" />
        </header>

        <main className="flex-1 grid place-items-center">
          <div className="max-w-4xl w-full px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm animate-pulse">
                  <div className="h-6 w-1/3 bg-slate-200 rounded mb-4" />
                  <div className="h-4 w-full bg-slate-200 rounded mb-2" />
                  <div className="h-4 w-full bg-slate-200 rounded mb-2" />
                  <div className="h-4 w-3/4 bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }
  

  return <>{children}</>;
}
