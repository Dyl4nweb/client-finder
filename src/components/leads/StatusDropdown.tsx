'use client';

import React, { useState } from 'react';
import { LeadStatus } from '@/types';
import { ChevronDown, Check } from 'lucide-react';

interface StatusDropdownProps {
  currentStatus: LeadStatus;
  onChange: (newStatus: LeadStatus) => void;
  disabled?: boolean;
}

const ALL_STATUSES: { value: LeadStatus; label: string; dotColor: string }[] = [
  { value: 'New', label: 'New', dotColor: 'bg-blue-500' },
  { value: 'Contacted', label: 'Contacted', dotColor: 'bg-amber-500' },
  { value: 'Interested', label: 'Interested', dotColor: 'bg-purple-500' },
  { value: 'Won', label: 'Won', dotColor: 'bg-emerald-500' },
  { value: 'Lost', label: 'Lost', dotColor: 'bg-neutral-400' },
];

export const StatusDropdown: React.FC<StatusDropdownProps> = ({
  currentStatus,
  onChange,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);

  const current = ALL_STATUSES.find((s) => s.value === currentStatus) || ALL_STATUSES[0];

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50 focus:outline-hidden focus:ring-2 focus:ring-neutral-400 disabled:opacity-50 cursor-pointer shadow-xs transition-colors"
      >
        <span className={`w-2 h-2 rounded-full ${current.dotColor}`} />
        <span>{current.label}</span>
        <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-30 mt-1 w-36 origin-top-right rounded-md border border-neutral-200 bg-white shadow-lg focus:outline-hidden py-1">
            {ALL_STATUSES.map((status) => (
              <button
                key={status.value}
                type="button"
                onClick={() => {
                  onChange(status.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-neutral-50 transition-colors ${
                  status.value === currentStatus ? 'font-semibold text-neutral-900 bg-neutral-50' : 'text-neutral-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${status.dotColor}`} />
                  {status.label}
                </span>
                {status.value === currentStatus && (
                  <Check className="w-3.5 h-3.5 text-neutral-700" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
