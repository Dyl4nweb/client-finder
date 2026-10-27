'use client';

import React, { useState } from 'react';
import { usePin } from '@/context/PinContext';
import { X, KeyRound, Check, AlertCircle } from 'lucide-react';

interface ChangePinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePinModal: React.FC<ChangePinModalProps> = ({ isOpen, onClose }) => {
  const { updatePin } = usePin();
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (newPin !== confirmPin) {
      setErrorMsg('New PIN codes do not match.');
      return;
    }

    if (newPin.length < 4) {
      setErrorMsg('PIN must be at least 4 digits.');
      return;
    }

    const res = updatePin(oldPin, newPin);
    if (!res.success) {
      setErrorMsg(res.error || 'Unable to update PIN. Please verify your current PIN.');
    } else {
      setSuccessMsg('PIN code successfully updated!');
      setTimeout(() => {
        onClose();
        setOldPin('');
        setNewPin('');
        setConfirmPin('');
        setSuccessMsg(null);
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-150">
      <div
        className="w-full max-w-sm bg-white rounded-2xl border border-neutral-200 shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 bg-neutral-50">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-neutral-800" />
            <h3 className="text-sm font-semibold text-neutral-900">
              Change Secret PIN
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-md hover:bg-neutral-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {errorMsg && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2 text-xs text-emerald-800">
              <Check className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Current PIN
            </label>
            <input
              type="password"
              required
              value={oldPin}
              onChange={(e) => setOldPin(e.target.value)}
              placeholder="••••"
              className="w-full px-3 py-2 text-xs text-neutral-900 border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-neutral-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              New PIN Code
            </label>
            <input
              type="password"
              required
              minLength={4}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              placeholder="••••"
              className="w-full px-3 py-2 text-xs text-neutral-900 border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-neutral-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Confirm New PIN
            </label>
            <input
              type="password"
              required
              minLength={4}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              placeholder="••••"
              className="w-full px-3 py-2 text-xs text-neutral-900 border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-neutral-900"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-xs"
            >
              Save New PIN
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
