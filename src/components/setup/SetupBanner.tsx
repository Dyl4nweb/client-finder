'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, HelpCircle, X, ExternalLink, Key, Database } from 'lucide-react';

export const SetupBanner: React.FC = () => {
  const { isConfigured: isSupabaseReady } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed && isSupabaseReady) return null;

  return (
    <>
      <div className="bg-neutral-100 border-b border-neutral-200 px-4 py-2 text-xs text-neutral-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isSupabaseReady ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isSupabaseReady ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </span>
          <span>
            {isSupabaseReady ? (
              <span className="text-neutral-800 font-medium">Supabase Cloud Connected</span>
            ) : (
              <span>
                <strong className="font-semibold text-neutral-900">Sandbox Preview:</strong> Running in local storage mode.
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1 font-medium text-neutral-800 hover:text-neutral-950 underline underline-offset-2 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Setup Guide & API Keys</span>
          </button>
          {!isSupabaseReady && (
            <button
              onClick={() => setDismissed(true)}
              className="text-neutral-400 hover:text-neutral-600 cursor-pointer p-0.5"
              aria-label="Dismiss banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div
            className="w-full max-w-lg bg-white rounded-xl border border-neutral-200 shadow-xl overflow-hidden"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/70">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-neutral-800" />
                <h3 className="text-sm font-semibold text-neutral-900">
                  Integration & Setup Guide
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-md hover:bg-neutral-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Step 1: Google Places API */}
              <div className="space-y-2 border border-neutral-200 rounded-lg p-4 bg-neutral-50/50">
                <div className="flex items-center gap-2 text-neutral-900 font-semibold text-xs">
                  <Key className="w-4 h-4 text-blue-600" />
                  <span>1. Google Places API (Real Business Search)</span>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  To search live businesses across real cities, provide your Google Cloud Places API key in <code className="bg-neutral-200 px-1 py-0.5 rounded text-[11px]">.env.local</code>.
                </p>
                <div className="text-xs text-neutral-600 space-y-1 pl-2">
                  <p>• Enable <strong className="font-medium text-neutral-900">Places API (New)</strong> or <strong className="font-medium text-neutral-900">Places API</strong> in Google Cloud Console</p>
                  <p>• Add to <code className="bg-neutral-200 px-1 py-0.5 rounded text-[11px]">.env.local</code>: <code className="font-mono text-neutral-800">GOOGLE_PLACES_API_KEY=AIzaSy...</code></p>
                  <p>• Or use the Google Maps Demo Key for testing</p>
                </div>
                <a
                  href="https://console.cloud.google.com/google/maps-apis/credentials?utm_campaign=gmp_git_agentskills_v1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline pt-1"
                >
                  <span>Google Cloud Console Credentials</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Step 2: Supabase PostgreSQL */}
              <div className="space-y-2 border border-neutral-200 rounded-lg p-4 bg-neutral-50/50">
                <div className="flex items-center gap-2 text-neutral-900 font-semibold text-xs">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span>2. Supabase PostgreSQL & Auth</span>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Store leads securely in your PostgreSQL database with Row Level Security (RLS) so each user accesses only their own clients.
                </p>
                <div className="text-xs text-neutral-600 space-y-1 pl-2">
                  <p>• Open Supabase Dashboard &gt; SQL Editor</p>
                  <p>• Execute the queries in <code className="bg-neutral-200 px-1 py-0.5 rounded text-[11px]">supabase/schema.sql</code></p>
                  <p>• Add keys to <code className="bg-neutral-200 px-1 py-0.5 rounded text-[11px]">.env.local</code>:</p>
                  <pre className="bg-neutral-900 text-neutral-100 p-2 rounded text-[10px] font-mono overflow-x-auto mt-1">
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
                  </pre>
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-neutral-50/70 border-t border-neutral-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg cursor-pointer"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
