'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  X,
  LogIn,
  ShieldCheck,
  Check,
  AlertCircle,
  Database,
  Lock,
  Crown,
  KeyRound,
  UserCheck,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const {
    user,
    isConfigured,
    ownerEmail,
    isOwner,
    isRegistrationLocked,
    signIn,
    setupOwnerAccount,
    signOut,
  } = useAuth();

  const [email, setEmail] = useState(ownerEmail || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setLoading(true);

    try {
      if (!isRegistrationLocked) {
        // First-time owner setup
        const res = await setupOwnerAccount(email, password);
        if (res.error) {
          setErrorMsg(res.error.message);
        } else {
          setInfoMsg(
            res.message || 'Personal Owner Account created successfully! Registration is now locked to your account.'
          );
          if (!res.message) {
            setTimeout(() => onClose(), 800);
          }
        }
      } else {
        // Existing owner sign in
        const res = await signIn(email, password);
        if (res.error) {
          setErrorMsg(res.error.message);
        } else {
          setInfoMsg('Successfully signed in as Owner!');
          setTimeout(() => onClose(), 800);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An authentication error occurred.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-white rounded-2xl border border-neutral-200 shadow-2xl overflow-hidden transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-amber-400 flex items-center justify-center shadow-xs">
              {user ? <Crown className="w-4 h-4" /> : <Lock className="w-4 h-4 text-white" />}
            </div>
            <div>
              <h3 id="auth-modal-title" className="text-sm font-semibold text-neutral-900">
                {user
                  ? 'Personal Owner Account'
                  : isRegistrationLocked
                  ? 'Personal Owner Login'
                  : 'Set Up Personal Owner Account'}
              </h3>
              <p className="text-xs text-neutral-500">
                {user ? 'Verified Sole Owner Workspace' : 'Private Single-User Mode'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-md hover:bg-neutral-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {user ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>Logged in as Owner</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider font-bold bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-600" /> Sole Owner
                  </span>
                </div>
                <p className="text-sm font-semibold text-neutral-900">{user.email}</p>
                <p className="text-[11px] text-neutral-600 leading-relaxed">
                  All your leads and outreach data are secured in your personal Supabase database. Only you have access.
                </p>
              </div>

              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-xs text-neutral-600 space-y-1">
                <p className="font-medium text-neutral-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-neutral-700" />
                  <span>Security Status: Private & Restricted</span>
                </p>
                <p className="text-[11px] text-neutral-500">
                  Registration is closed to the public. Only authorized owner credentials can access this app.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await signOut();
                    onClose();
                  }}
                  className="px-4 py-2 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : !isConfigured ? (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2.5">
                  <Database className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                  <div className="text-xs text-amber-900 space-y-1.5">
                    <p className="font-semibold">Supabase Cloud is not yet configured</p>
                    <p className="text-amber-800 leading-relaxed">
                      Leads are currently saved in your local browser storage. Add your Supabase credentials to .env.local for cloud persistence.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  Continue in PIN-Protected Mode
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Security Banner */}
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-neutral-900">
                  <ShieldCheck className="w-4 h-4 text-neutral-800" />
                  <span>
                    {isRegistrationLocked
                      ? 'Private Single-Owner App'
                      : 'Initial Setup: 1 Master Account Only'}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-600 leading-relaxed">
                  {isRegistrationLocked
                    ? `This application is closed to the public. Only the personal owner (${ownerEmail}) can sign in.`
                    : 'Set up your master personal account. Once created, registration will be permanently locked.'}
                </p>
              </div>

              {errorMsg && (
                <div className="space-y-2">
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-700">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>

                  {errorMsg.toLowerCase().includes('confirm') && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-1.5 text-amber-900">
                      <p className="font-semibold flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                        <span>Instant Fix for &quot;Email not confirmed&quot;:</span>
                      </p>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        Run this single SQL command in your Supabase SQL Editor to verify your account immediately:
                      </p>
                      <pre className="bg-neutral-900 text-neutral-100 p-2 rounded text-[10px] font-mono overflow-x-auto select-all">
UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL;
                      </pre>
                      <p className="text-[10px] text-amber-700">
                        Or in Supabase: Go to Authentication &gt; Providers &gt; Email &gt; toggle OFF &quot;Confirm email&quot;.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {infoMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2 text-xs text-emerald-800">
                  <Check className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{infoMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Personal Owner Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={ownerEmail || 'your-personal-email@gmail.com'}
                  className="w-full px-3 py-2 text-xs text-neutral-900 border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full px-3 py-2 text-xs text-neutral-900 border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 shadow-2xs"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5 shadow-xs"
              >
                {loading ? (
                  <span>Processing...</span>
                ) : !isRegistrationLocked ? (
                  <>
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Register Master Account</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In as Owner</span>
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <p className="text-[11px] text-neutral-400 flex items-center justify-center gap-1">
                  <Lock className="w-3 h-3 text-neutral-400" />
                  <span>No other account can be registered. Restricted exclusively to you.</span>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

