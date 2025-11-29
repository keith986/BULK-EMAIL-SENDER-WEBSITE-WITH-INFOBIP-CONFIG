"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../_lib/firebase';

type AppUser = {
  uid: string;
  email: string | null;
  displayName?: string | null;
  profile?: Record<string, unknown> | null;
};

type UserContextValue = {
  user: AppUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within a UserProvider');
  return ctx;
}

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch Firestore client profile if user is present
  const loadProfile = async (fbUser: FirebaseUser) => {
    try {
      const docRef = doc(db, 'clients', fbUser.uid);
      const snap = await getDoc(docRef);
      const profile = snap.exists() ? snap.data() : null;
      // Read displayName from Firestore profile, fallback to Firebase Auth displayName
      const displayName = profile?.displayName ?? fbUser.displayName ?? null;
      setUser({ uid: fbUser.uid, email: fbUser.email ?? null, displayName, profile });
    } catch (err) {
      console.error('UserProvider: failed to load profile', err);
      setUser({ uid: fbUser.uid, email: fbUser.email ?? null, displayName: fbUser.displayName ?? null, profile: null });
    }
  };

  // Make it easy to refresh the profile
  const refreshProfile = async () => {
    const current = auth.currentUser;
    if (!current) return;
    await loadProfile(current);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        // fetch profile data from Firestore (if available)
        await loadProfile(fbUser);
        setLoading(false);
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (err) {
      console.error('UserProvider signOut error', err);
    }
  };

  const value: UserContextValue = { user, loading, signOut, refreshProfile };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export default UserProvider;
