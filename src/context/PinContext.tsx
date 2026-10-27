'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface PinContextType {
  isLocked: boolean;
  loading: boolean;
  unlock: (enteredPin: string) => boolean;
  lock: () => void;
  updatePin: (oldPin: string, newPin: string) => { success: boolean; error?: string };
  hasCustomPin: boolean;
}

const PIN_SESSION_KEY = 'client_finder_pin_session_unlocked';
const PIN_CUSTOM_STORAGE_KEY = 'client_finder_custom_pin';

const PinContext = createContext<PinContextType>({
  isLocked: true,
  loading: true,
  unlock: () => false,
  lock: () => {},
  updatePin: () => ({ success: false }),
  hasCustomPin: false,
});

export function PinProvider({ children }: { children: React.ReactNode }) {
  const [isLocked, setIsLocked] = useState(true);
  const [loading, setLoading] = useState(true);
  const [currentPin, setCurrentPin] = useState('1234');
  const [hasCustomPin, setHasCustomPin] = useState(false);

  useEffect(() => {
    // 1. Resolve configured PIN (env variable or custom in localStorage, fallback '1234')
    const envPin = process.env.NEXT_PUBLIC_APP_PIN;
    const customPin = localStorage.getItem(PIN_CUSTOM_STORAGE_KEY);

    if (customPin && customPin.trim().length >= 4) {
      setCurrentPin(customPin.trim());
      setHasCustomPin(true);
    } else if (envPin && envPin.trim().length >= 4) {
      setCurrentPin(envPin.trim());
      setHasCustomPin(true);
    } else {
      setCurrentPin('1234');
      setHasCustomPin(false);
    }

    // 2. Check if already unlocked in this browser session
    const unlockedSession = sessionStorage.getItem(PIN_SESSION_KEY);
    if (unlockedSession === 'true') {
      setIsLocked(false);
    } else {
      setIsLocked(true);
    }

    setLoading(false);
  }, []);

  const unlock = (enteredPin: string): boolean => {
    if (enteredPin === currentPin) {
      setIsLocked(false);
      sessionStorage.setItem(PIN_SESSION_KEY, 'true');
      return true;
    }
    return false;
  };

  const lock = () => {
    sessionStorage.removeItem(PIN_SESSION_KEY);
    setIsLocked(true);
  };

  const updatePin = (oldPin: string, newPin: string) => {
    if (oldPin !== currentPin) {
      return { success: false, error: 'Current PIN is incorrect.' };
    }
    if (!newPin || newPin.length < 4) {
      return { success: false, error: 'New PIN must be at least 4 digits.' };
    }

    localStorage.setItem(PIN_CUSTOM_STORAGE_KEY, newPin);
    setCurrentPin(newPin);
    setHasCustomPin(true);
    return { success: true };
  };

  return (
    <PinContext.Provider
      value={{
        isLocked,
        loading,
        unlock,
        lock,
        updatePin,
        hasCustomPin,
      }}
    >
      {children}
    </PinContext.Provider>
  );
}

export function usePin() {
  return useContext(PinContext);
}
