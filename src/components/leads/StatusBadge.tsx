import React from 'react';
import { LeadStatus } from '@/types';

interface StatusBadgeProps {
  status: LeadStatus;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<LeadStatus, { label: string; className: string }> = {
  New: {
    label: 'New',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  Contacted: {
    label: 'Contacted',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  Interested: {
    label: 'Interested',
    className: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  Won: {
    label: 'Won',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  Lost: {
    label: 'Lost',
    className: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.New;

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      } ${config.className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70" />
      {config.label}
    </span>
  );
};
