import React from 'react';

export default function KageLogo({ className, style, width = 40, height = 40, variant = 'default' }) {
  // Master Colors
  const primary = "#0ea5e9";
  const dark = "#0a0a0f";

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <defs>
        <linearGradient
          id="logoGradient"
          x1="0"
          y1="0"
          x2="100"
          y2="100"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>
      </defs>

      {/* Base Shield - Always present as the signature of KAGE AI */}
      <path
        d="M50 5 L95 25 L85 85 L50 95 L15 85 L5 25 Z"
        fill="url(#logoGradient)"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="2"
      />

      {variant === 'default' && (
        <>
          <path d="M20 40 H80 V60 H20 Z" fill={dark} />
          <rect x="30" y="45" width="5" height="10" rx="2" fill="white" />
          <rect x="65" y="42" width="5" height="14" rx="2" fill={primary} />
          <path
            d="M10 25 C10 25, 30 15, 50 25 C70 35, 90 25, 90 25"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.9"
          />
        </>
      )}

      {variant === 'zap' && (
        <path
          d="M45 30 L65 30 L40 50 L60 50 L35 75"
          stroke="white"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {variant === 'shield' && (
        <path
          d="M35 45 L45 55 L65 35"
          stroke="white"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {variant === 'trend' && (
        <path
          d="M30 65 L45 50 L55 60 L75 35"
          stroke="white"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {variant === 'target' && (
         <circle cx="50" cy="50" r="15" stroke="white" strokeWidth="4" />
      )}
    </svg>
  );
}
