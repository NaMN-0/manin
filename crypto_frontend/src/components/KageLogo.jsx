import React from 'react';

export default function KageLogo({ className, style, width = 40, height = 40 }) {
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
      {/* Master Shape - Improved from favicon.svg */}
      <path
        d="M50 5 L95 25 L85 85 L50 95 L15 85 L5 25 Z"
        fill="url(#logoGradient)"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="2"
      />
      {/* Ninja Mask Cutout */}
      <path d="M20 40 H80 V60 H20 Z" fill="#0a0a0f" />
      
      {/* Eyes from favicon.svg design */}
      <rect x="30" y="45" width="5" height="10" rx="2" fill="white" />
      <rect x="65" y="42" width="5" height="14" rx="2" fill="#0ea5e9" />
      
      {/* Headband Line */}
      <path
        d="M10 25 C10 25, 30 15, 50 25 C70 35, 90 25, 90 25"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.9"
      />
      
      {/* Subtle Branding Pulse for the React component */}
      <circle
        cx="50"
        cy="50"
        r="45"
        stroke="white"
        strokeWidth="0.5"
        opacity="0.2"
      >
        <animate
          attributeName="opacity"
          values="0.2;0.05;0.2"
          dur="3s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
}
