"use client";
import React, { useState, useEffect } from 'react';
import { useUser } from '../_context/UserProvider';
import { updateClientProfile } from '../_utils/firebase-operations';
import { toast, ToastContainer } from 'react-toastify';

export default function SettingsPage() {
  const { user, loading, refreshProfile } = useUser();
  const [displayName, setDisplayName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (user?.displayName) setDisplayName(user.displayName);
  }, [user?.displayName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return toast.error('You must be signed in to update your profile.');

    if (password && password !== confirmPassword) return toast.info('Passwords do not match.');

    try {
      setSaving(true);
      const resp = await updateClientProfile({ userId: user.uid, displayName: displayName || null, password: password || null });
      if (resp.code === 777) {
        toast.success(resp.message);
        // Refresh profile so UI updates immediately
        await refreshProfile();
      } else {
        toast.error(resp.message);
      }
    } catch (err: unknown) {
      toast.error('Error: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
      setPassword('');
      setConfirmPassword('');
    }
  };

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-200 to-slate-500">
    <div className="p-6 max-w-3xl mx-auto md:mt-20 sm:bg-gradient-to-br sm:from-slate-600 sm:to-slate-500">
      <h1 className="text-2xl font-semibold mb-4">Settings</h1>
      <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Display name</label>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Name to display in the app" />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Change password (optional)</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="w-full border rounded px-3 py-2" placeholder="New password (leave empty to keep current)" />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Confirm password</label>
          <input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" className="w-full border rounded px-3 py-2" placeholder="Confirm new password" />
        </div>

        <div className="flex items-center justify-between">
          <button disabled={saving} type="submit" className="bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-60">{saving ? 'Saving…' : 'Save changes'}</button>
        </div>
      </form>

      <ToastContainer position="top-right" autoClose={7000} hideProgressBar={false} closeOnClick draggable pauseOnHover theme={"light"} />
    </div>
    </div>
  );
  
}
