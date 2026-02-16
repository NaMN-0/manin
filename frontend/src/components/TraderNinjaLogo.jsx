export default function TraderNinjaLogo({ className, style }) {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      {/* Background Shape - Stylized Shuriken / Shield Base */}
      <path
        d="M50 5 L95 25 L85 85 L50 95 L15 85 L5 25 Z"
        fill="url(#logoGradient)"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="2"
      />

      {/* Ninja Mask Cutout */}
      <path d="M20 40 H80 V60 H20 Z" fill="#0a0a0f" />

      {/* Eyes - Left Eye (Candlestick) */}
      <rect x="30" y="45" width="5" height="10" rx="2" fill="white" />
      <rect x="32" y="42" width="1" height="16" fill="white" opacity="0.5" />

      {/* Eyes - Right Eye (Bullish Candle) */}
      <rect x="65" y="42" width="5" height="14" rx="2" fill="#10b981" />
      <rect x="67" y="40" width="1" height="18" fill="#10b981" opacity="0.8" />

      {/* Headband Ties / Graph Line */}
      <path
        d="M10 25 C10 25, 30 15, 50 25 C70 35, 90 25, 90 25"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.9"
      />

      {/* Branding Pulse */}
      <circle
        cx="50"
        cy="50"
        r="45"
        stroke="url(#pulseGradient)"
        strokeWidth="1"
        opacity="0.5"
      >
        <animate
          attributeName="r"
          values="45;48;45"
          dur="3s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.5;0.2;0.5"
          dur="3s"
          repeatCount="indefinite"
        />
      </circle>

      <defs>
        <linearGradient
          id="logoGradient"
          x1="0"
          y1="0"
          x2="100"
          y2="100"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--primary-dark)" />
        </linearGradient>
        <linearGradient
          id="pulseGradient"
          x1="0"
          y1="0"
          x2="100"
          y2="0"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0" />
          <stop offset="50%" stopColor="var(--primary)" stopOpacity="1" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}
