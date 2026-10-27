'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

const OWNER_STORAGE_KEY = 'client_finder_owner_email_v1';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isConfigured: boolean;
  ownerEmail: string | null;
  isOwner: boolean;
  isRegistrationLocked: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  setupOwnerAccount: (email: string, password: string) => Promise<{ error: Error | null; message?: string }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null; message?: string }>;
  signOut: () => Promise<void>;
  setDesignatedOwnerEmail: (email: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isConfigured: false,
  ownerEmail: null,
  isOwner: false,
  isRegistrationLocked: false,
  signIn: async () => ({ error: null }),
  setupOwnerAccount: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  setDesignatedOwnerEmail: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [ownerEmail, setOwnerEmail] = useState<string | null>(null);
  const isConfigured = isSupabaseConfigured();

  // Load configured owner email from environment or persistent storage
  useEffect(() => {
    const envOwner = process.env.NEXT_PUBLIC_OWNER_EMAIL?.trim().toLowerCase();
    if (envOwner) {
      setOwnerEmail(envOwner);
      return;
    }

    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(OWNER_STORAGE_KEY);
      if (stored) {
        setOwnerEmail(stored.trim().toLowerCase());
      }
    }
  }, []);

  const saveOwnerEmail = useCallback((email: string) => {
    const clean = email.trim().toLowerCase();
    setOwnerEmail(clean);
    if (typeof window !== 'undefined') {
      localStorage.setItem(OWNER_STORAGE_KEY, clean);
    }
  }, []);

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      // If user is logged in and no owner email was previously fixed, lock to this user!
      if (currentUser?.email && !ownerEmail) {
        saveOwnerEmail(currentUser.email);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser?.email && !ownerEmail) {
        saveOwnerEmail(currentUser.email);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isConfigured, ownerEmail, saveOwnerEmail]);

  // A registration is locked if an owner account is already designated
  const isRegistrationLocked = Boolean(ownerEmail);

  // The logged-in user is verified as owner if their email matches ownerEmail (or if they are the only logged-in user)
  const isOwner = Boolean(
    user && (!ownerEmail || (user.email && user.email.toLowerCase() === ownerEmail.toLowerCase()))
  );

  const signIn = async (email: string, password: string) => {
    if (!isConfigured) {
      return {
        error: new Error(
          'Supabase is not configured yet. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local'
        ),
      };
    }

    const cleanEmail = email.trim().toLowerCase();

    // Strict single-owner protection: reject any email that is not the owner
    if (ownerEmail && cleanEmail !== ownerEmail) {
      return {
        error: new Error(
          `Unauthorized account. This application is restricted exclusively to the personal owner account (${ownerEmail}).`
        ),
      };
    }

    const supabase = createClient();
    if (!supabase) return { error: new Error('Client unavailable') };

    const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    if (error) {
      return { error: new Error(error.message) };
    }

    if (data?.user?.email && !ownerEmail) {
      saveOwnerEmail(data.user.email);
    }

    return { error: null };
  };

  const setupOwnerAccount = async (email: string, password: string) => {
    if (!isConfigured) {
      return {
        error: new Error(
          'Supabase is not configured yet. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local'
        ),
      };
    }

    const cleanEmail = email.trim().toLowerCase();

    // If an owner account is already locked in, refuse further registrations
    if (ownerEmail) {
      return {
        error: new Error(
          `Registration is closed. A master personal owner account is already assigned (${ownerEmail}).`
        ),
      };
    }

    const envOwner = process.env.NEXT_PUBLIC_OWNER_EMAIL?.trim().toLowerCase();
    if (envOwner && cleanEmail !== envOwner) {
      return {
        error: new Error(
          `This email does not match the configured owner email (${envOwner}).`
        ),
      };
    }

    const supabase = createClient();
    if (!supabase) return { error: new Error('Client unavailable') };

    const { data, error } = await supabase.auth.signUp({ email: cleanEmail, password });
    if (error) return { error: new Error(error.message) };

    // Immediately lock registration to this owner account!
    saveOwnerEmail(cleanEmail);

    if (data.session) {
      return { error: null };
    }
    return { error: null, message: 'Check your email for the confirmation link to finalize your owner account.' };
  };

  const signOut = async () => {
    if (isConfigured) {
      const supabase = createClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isConfigured,
        ownerEmail,
        isOwner,
        isRegistrationLocked,
        signIn,
        setupOwnerAccount,
        signUp: setupOwnerAccount, // Alias to setupOwnerAccount for compatibility
        signOut,
        setDesignatedOwnerEmail: saveOwnerEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
