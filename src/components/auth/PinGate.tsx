'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePin } from '@/context/PinContext';
import { Lock, Delete, ArrowRight, ShieldCheck, KeyRound, AlertCircle } from 'lucide-react';

interface PinGateProps {
  children: React.ReactNode;
}

export const PinGate: React.FC<PinGateProps> = ({ children }) => {
  const { isLocked, loading, unlock } = usePin();
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const handleKeyPress = useCallback((digit: string) => {
    setErrorMsg(null);
    setPinInput((prev) => {
      if (prev.length < 8) {
        return prev + digit;
      }
      return prev;
    });
  }, []);

  const handleDelete = useCallback(() => {
    setErrorMsg(null);
    setPinInput((prev) => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    setErrorMsg(null);
    setPinInput('');
  }, []);

  const handleSubmit = useCallback(() => {
    if (pinInput.length === 0) return;

    const ok = unlock(pinInput);
    if (!ok) {
      setErrorMsg('Incorrect PIN code. Please try again.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPinInput('');
    } else {
      setPinInput('');
      setErrorMsg(null);
    }
  }, [pinInput, unlock]);

  // Physical keyboard support
  useEffect(() => {
    if (!isLocked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Enter') {
        handleSubmit();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocked, handleKeyPress, handleDelete, handleSubmit, handleClear]);

  // Auto-submit when length reaches 4
  useEffect(() => {
    if (pinInput.length === 4) {
      const ok = unlock(pinInput);
      if (!ok) {
        // Only trigger error if not matching
        setErrorMsg('Incorrect PIN code. Please try again.');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setPinInput('');
      } else {
        setPinInput('');
        setErrorMsg(null);
      }
    }
  }, [pinInput, unlock]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-4">
        <div
          className={`w-full max-w-sm bg-white rounded-3xl border border-neutral-200 shadow-xl p-6 sm:p-8 space-y-6 transition-transform ${
            shake ? 'translate-x-[-8px] transition-none animate-shake' : ''
          }`}
        >
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center mx-auto shadow-md">
              <Lock className="w-5 h-5 text-cyan-400" />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-neutral-900">
              Personal Workspace Gate
            </h1>
            <p className="text-xs text-neutral-500">
              Enter your private PIN code to unlock client tracking & Varex AI.
            </p>
          </div>

          {/* PIN Display Dots */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center justify-center gap-3 py-2">
              {[0, 1, 2, 3].map((idx) => {
                const isFilled = pinInput.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full border transition-all duration-150 ${
                      isFilled
                        ? 'bg-neutral-900 border-neutral-900 scale-110 shadow-xs'
                        : 'border-neutral-300 bg-neutral-100'
                    }`}
                  />
                );
              })}
            </div>

            {errorMsg && (
              <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeyPress(num)}
                className="h-12 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-100 active:bg-neutral-200 text-neutral-900 font-semibold text-base shadow-2xs transition-colors cursor-pointer flex items-center justify-center"
              >
                {num}
              </button>
            ))}

            <button
              type="button"
              onClick={handleClear}
              className="h-12 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 active:bg-neutral-200 text-neutral-600 text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex items-center justify-center uppercase tracking-wider"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              className="h-12 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-100 active:bg-neutral-200 text-neutral-900 font-semibold text-base shadow-2xs transition-colors cursor-pointer flex items-center justify-center"
            >
              0
            </button>

            <button
              type="button"
              onClick={handleDelete}
              className="h-12 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 active:bg-neutral-200 text-neutral-600 shadow-2xs transition-colors cursor-pointer flex items-center justify-center"
              aria-label="Delete last digit"
            >
              <Delete className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom unlock button for manual or 4+ digit PINs */}
          {pinInput.length > 0 && (
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full py-2.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>Unlock Application</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Footnote */}
          <div className="pt-2 border-t border-neutral-200/50 text-center">
            <p className="text-[11px] font-medium text-neutral-600">
              Personal Account • Kurt Dylan Viray
            </p>
            <p className="text-[10px] text-neutral-400 mt-0.5 font-mono">
              kurtdylanviray@gmail.com
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
