'use client';

import React from 'react';

interface VarexAvatarProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBadge?: boolean;
  status?: 'online' | 'idle' | 'thinking';
}

export const VarexAvatar: React.FC<VarexAvatarProps> = ({
  size = 'md',
  className = '',
  showBadge = false,
  status = 'online',
}) => {
  const sizeMap = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-14 h-14',
  };

  const eyeSizeMap = {
    xs: 'w-0.5 h-0.5',
    sm: 'w-1 h-1',
    md: 'w-1.5 h-1.5',
    lg: 'w-2 h-2',
    xl: 'w-2.5 h-2.5',
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-xl transition-transform hover:scale-105 ${sizeMap[size]} ${className}`}
      title="Varex AI • Engineered by Dylan Ramos (https://dylanramos.site)"
    >
      {/* Sleek Futuristic AI Face SVG */}
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xs"
      >
        <defs>
          {/* Outer Shell Gradient */}
          <linearGradient id="varexFaceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e1e24" />
            <stop offset="50%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>

          {/* Visor Screen Gradient */}
          <linearGradient id="varexVisorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>

          {/* Golden/Cyber Accent Gradient */}
          <linearGradient id="varexAccentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#818cf8" />
          </linearGradient>
        </defs>

        {/* Outer Head Chassis */}
        <rect
          x="4"
          y="6"
          width="40"
          height="36"
          rx="12"
          fill="url(#varexFaceGradient)"
          stroke="#475569"
          strokeWidth="1.5"
        />

        {/* Cyber Ear/Antenna Nodes */}
        <rect x="1" y="18" width="3" height="12" rx="1.5" fill="#3b82f6" opacity="0.9" />
        <rect x="44" y="18" width="3" height="12" rx="1.5" fill="#3b82f6" opacity="0.9" />

        {/* Top Neural Sensor Accent */}
        <rect x="19" y="8" width="10" height="2" rx="1" fill="#38bdf8" opacity="0.8" />

        {/* Visor / Face Screen */}
        <rect
          x="9"
          y="14"
          width="30"
          height="19"
          rx="7"
          fill="#030712"
          stroke="#1e293b"
          strokeWidth="1"
        />

        {/* Cyber Eyes (Expressive AI Gaze) */}
        <ellipse cx="18" cy="23" rx="3.5" ry="3.8" fill="url(#varexVisorGradient)" />
        <ellipse cx="30" cy="23" rx="3.5" ry="3.8" fill="url(#varexVisorGradient)" />

        {/* Eye Pupil Light Reflections */}
        <circle cx="19" cy="21.5" r="1.2" fill="#ffffff" />
        <circle cx="31" cy="21.5" r="1.2" fill="#ffffff" />

        {/* Subtle Friendly AI Smile / Waveform */}
        <path
          d="M20 28.5C21.5 29.8 26.5 29.8 28 28.5"
          stroke="url(#varexAccentGradient)"
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        {/* Chin Sensor Line */}
        <line x1="21" y1="38" x2="27" y2="38" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" />
      </svg>

      {/* Online Status Dot */}
      {showBadge && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-white ${
            status === 'thinking'
              ? 'bg-amber-400 animate-ping'
              : status === 'idle'
              ? 'bg-neutral-400'
              : 'bg-emerald-500'
          }`}
        />
      )}
    </div>
  );
};
