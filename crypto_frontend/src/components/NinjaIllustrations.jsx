import { useMemo } from "react";

// 🎨 BRAND PALETTE
const C = {
  primary: "#0ea5e9", // Sky Blue
  success: "#10b981", // Emerald
  danger: "#ef4444", // Crimson
  warning: "#f59e0b", // Amber
  violet: "#8b5cf6", // Violet
  suitDark: "#0f172a", // Slate 900
  suitLight: "#1e293b", // Slate 800
  metal: "#94a3b8", // Slate 400
  gold: "#fbbf24", // Gold
};

// 🛠️ UTILS & BUILDER
const CommonDefs = () => (
  <defs>
    <linearGradient
      id="headGradient"
      x1="0"
      y1="-45"
      x2="0"
      y2="45"
      gradientUnits="userSpaceOnUse"
    >
      <stop offset="0%" stopColor={C.suitLight} />
      <stop offset="100%" stopColor={C.suitDark} />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#fcd34d" />
      <stop offset="100%" stopColor="#d97706" />
    </linearGradient>
    <linearGradient id="dangerGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#ef4444" />
      <stop offset="100%" stopColor="#7f1d1d" />
    </linearGradient>
    <linearGradient id="successGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#10b981" />
      <stop offset="100%" stopColor="#064e3b" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
      <feMerge>
        <feMergeNode in="coloredBlur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="glitch-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feOffset result="offOut" in="SourceGraphic" dx="2" dy="0" />
      <feColorMatrix
        result="matrixOut"
        in="offOut"
        type="matrix"
        values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
      />
      <feGaussianBlur result="blurOut" in="matrixOut" stdDeviation="1" />
      <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
    </filter>
  </defs>
);

// 👤 CORE PARTS
const NinjaHead = ({
  x,
  y,
  scale = 1,
  rotate = 0,
  expression = "neutral",
  colorOverride,
  opacity = 1,
}) => (
  <g
    transform={`translate(${x}, ${y}) scale(${scale}) rotate(${rotate})`}
    opacity={opacity}
  >
    <path
      d="M0 -45 L45 -25 L35 35 L0 45 L-35 35 L-45 -25 Z"
      fill={colorOverride || "url(#headGradient)"}
      stroke={C.suitLight}
      strokeWidth="2"
    />
    <path d="M-30 -10 H30 V10 H-30 Z" fill={C.suitDark} />
    <g>
      <rect x="-20" y="-5" width="5" height="10" rx="2" fill="white" />
      {expression === "neutral" && (
        <rect x="15" y="-8" width="5" height="14" rx="2" fill={C.success} />
      )}
      {expression === "angry" && (
        <path d="M15 -5 L25 -2 L23 10 L13 7 Z" fill={C.danger} />
      )}
      {expression === "happy" && (
        <path
          d="M15 2 Q20 -5 25 2"
          stroke={C.success}
          strokeWidth="3"
          fill="none"
        />
      )}
      {expression === "zen" && (
        <rect x="15" y="-2" width="6" height="4" rx="1" fill={C.violet} />
      )}
      {expression === "money" && (
        <text x="12" y="8" fontSize="12" fill={C.gold}>
          $
        </text>
      )}
      {expression === "cyber" && (
        <rect x="15" y="-5" width="8" height="8" fill={C.primary}>
          <animate
            attributeName="opacity"
            values="0.5;1;0.5"
            dur="0.5s"
            repeatCount="indefinite"
          />
        </rect>
      )}
      {expression === "pain" && (
        <path d="M15 -2 L25 8 M25 -2 L15 8" stroke={C.date} strokeWidth="2" />
      )}
    </g>
  </g>
);

const RoboBody = ({ x, y, color = C.primary, rotate = 0 }) => (
  <g transform={`translate(${x}, ${y}) rotate(${rotate})`}>
    <rect x="-15" y="0" width="30" height="40" rx="10" fill={C.suitDark} />
    <path d="M-10 5 H10" stroke={C.suitLight} strokeWidth="2" />
    <circle cx="0" cy="25" r="5" fill={color}>
      <animate
        attributeName="opacity"
        values="0.5;1;0.5"
        dur="2s"
        repeatCount="indefinite"
      />
    </circle>
  </g>
);

// 📦 PROPS
const Scroll = ({ x, y, scale = 1, rotate = 0 }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale}) rotate(${rotate})`}>
    <rect
      x="-20"
      y="-30"
      width="40"
      height="60"
      fill="#fef3c7"
      stroke="#d97706"
      strokeWidth="2"
      rx="2"
    />
    <path
      d="M-10 -20 H10 M-10 -10 H10 M-10 0 H0"
      stroke="#b45309"
      strokeWidth="2"
    />
    <circle cx="0" cy="15" r="5" fill="#ef4444" opacity="0.5" />
  </g>
);

const Coin = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <circle
      cx="0"
      cy="0"
      r="15"
      fill="url(#goldGrad)"
      stroke="#b45309"
      strokeWidth="1"
    />
    <text x="-4" y="5" fontSize="14" fontWeight="bold" fill="#78350f">
      $
    </text>
  </g>
);

const Shuriken = ({ x, y, spin = false, scale = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <path
      d="M0 -20 L5 -5 L20 0 L5 5 L0 20 L-5 5 L-20 0 L-5 -5 Z"
      fill={C.metal}
      stroke="white"
      strokeWidth="1"
    >
      {spin && (
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 0 0"
          to="360 0 0"
          dur="0.5s"
          repeatCount="indefinite"
        />
      )}
    </path>
    <circle cx="0" cy="0" r="3" fill="black" />
  </g>
);

const Candle = ({ x, y, type = "green", height = 40, scale = 1 }) => {
  const color = type === "green" ? C.success : C.danger;
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <line
        x1="0"
        y1={-height / 2 - 10}
        x2="0"
        y2={height / 2 + 10}
        stroke={color}
        strokeWidth="2"
      />
      <rect x="-6" y={-height / 2} width="12" height={height} fill={color} />
    </g>
  );
};

// 🌀 SCENES & COMPOSITIONS

// 1. Scene: The Void (Meditation)
export const NinjaSceneVoid = ({ width, height, className }) => (
  <svg
    width={width}
    height={height}
    viewBox="-150 -150 300 300"
    className={className}
  >
    <CommonDefs />
    <circle
      cx="0"
      cy="0"
      r="100"
      fill="none"
      stroke={C.suitLight}
      strokeWidth="1"
      opacity="0.3"
    />
    <NinjaHead x={0} y={-20} expression="zen" scale={1.2} />
    <RoboBody x={0} y={30} color={C.violet} />
    <path
      d="M-60 80 Q0 100 60 80"
      stroke={C.violet}
      strokeWidth="2"
      fill="none"
      opacity="0.5"
    />
    {/* Floating Props */}
    <Scroll x={-80} y={-50} rotate={-15} scale={0.8} />
    <Shuriken x={80} y={-40} scale={0.8} />
  </svg>
);

// 2. Scene: The Swarm (Chaos/Noise)
export const NinjaSceneSwarm = ({ width, height, className }) => (
  <svg
    width={width}
    height={height}
    viewBox="-150 -150 300 300"
    className={className}
  >
    <CommonDefs />
    {/* Confusing Background */}
    <path
      d="M-100 -50 L100 50 M-100 50 L100 -50"
      stroke={C.danger}
      strokeWidth="1"
      opacity="0.2"
    />

    {/* Bear Head */}
    <g transform="translate(-60, -40)">
      <path d="M-30 -30 L30 -30 L20 30 L-20 30 Z" fill={C.suitLight} />
      <path d="M-30 -30 Q-40 -50 -10 -40" fill={C.suitLight} />
      <path d="M30 -30 Q40 -50 10 -40" fill={C.suitLight} />
      <NinjaHead
        x={0}
        y={0}
        expression="angry"
        colorOverride="url(#dangerGrad)"
        scale={0.8}
      />
    </g>
    {/* Distant Bear */}
    <g transform="translate(70, 60) scale(0.6)">
      <NinjaHead x={0} y={0} expression="angry" colorOverride="#7f1d1d" />
    </g>
    {/* Panic Ninja */}
    <g transform="translate(0, 50)">
      <NinjaHead x={0} y={0} expression="pain" />
      <text x="-15" y="-40" fill={C.danger} fontSize="20" fontWeight="bold">
        !?
      </text>
    </g>
    <Candle x={50} y={-50} type="red" height={60} />
    <Candle x={-80} y={80} type="red" height={40} />
  </svg>
);

// 3. Scene: The Algorithm (Analysis)
export const NinjaSceneAlgo = ({ width, height, className }) => (
  <svg
    width={width}
    height={height}
    viewBox="-150 -150 300 300"
    className={className}
  >
    <CommonDefs />
    {/* Grid */}
    <defs>
      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path
          d="M 20 0 L 0 0 0 20"
          fill="none"
          stroke={C.primary}
          strokeWidth="0.5"
          opacity="0.3"
        />
      </pattern>
    </defs>
    <rect x="-150" y="-150" width="300" height="300" fill="url(#grid)" />

    {/* Central Intelligence */}
    <NinjaHead x={0} y={-30} expression="cyber" scale={1.5} />
    <circle
      cx="0"
      cy="-30"
      r="60"
      fill="none"
      stroke={C.primary}
      strokeWidth="1"
      strokeDasharray="5 5"
    >
      <animateTransform
        attributeName="transform"
        type="rotate"
        from="0 0 -30"
        to="360 0 -30"
        dur="10s"
        repeatCount="indefinite"
      />
    </circle>

    {/* Data Streams */}
    <path
      d="M-100 80 L-50 20"
      stroke={C.success}
      strokeWidth="2"
      opacity="0.6"
    />
    <path d="M100 80 L50 20" stroke={C.success} strokeWidth="2" opacity="0.6" />
    <path d="M0 100 V40" stroke={C.primary} strokeWidth="2" opacity="0.6" />

    <Candle x={-80} y={50} type="green" height={30} scale={0.8} />
    <Candle x={80} y={50} type="green" height={50} scale={0.8} />
  </svg>
);

// 4. Scene: The Strike (Execution)
export const NinjaSceneStrike = ({ width, height, className }) => (
  <svg
    width={width}
    height={height}
    viewBox="-150 -150 300 300"
    className={className}
  >
    <CommonDefs />
    {/* Slash Effect */}
    <path
      d="M-150 50 L150 -50"
      stroke="white"
      strokeWidth="8"
      opacity="0.8"
      filter="url(#glow)"
    >
      <animate
        attributeName="stroke-dasharray"
        values="0,400; 400,0"
        dur="0.2s"
        fill="freeze"
      />
      <animate
        attributeName="opacity"
        values="0.8;0"
        dur="0.5s"
        begin="0.1s"
        fill="freeze"
      />
    </path>

    {/* Sliced Bear (Top Half) */}
    <g transform="translate(50, -40) rotate(15)">
      <path d="M-20 0 L20 0 L20 -30 L-20 -30 Z" fill={C.danger} opacity="0.5" />
      <NinjaHead
        x={0}
        y={-15}
        expression="pain"
        colorOverride="#7f1d1d"
        scale={0.8}
      />
    </g>

    {/* Sliced Bear (Bottom Half) */}
    <g transform="translate(-50, 40) rotate(-15)">
      <path d="M-20 0 L20 0 L20 30 L-20 30 Z" fill={C.danger} opacity="0.5" />
      <RoboBody x={0} y={10} color={C.danger} />
    </g>

    {/* Hero Ninja - Action Pose */}
    <g transform="translate(0, 0)">
      <NinjaHead x={0} y={-10} expression="angry" />
      <path d="M-30 10 L30 -10" stroke={C.suitLight} strokeWidth="4" />{" "}
      {/* Arms */}
      <Shuriken x={40} y={-20} spin={true} />
    </g>
  </svg>
);

// 5. Scene: The Summit (Victory)
export const NinjaSceneVictory = ({ width, height, className }) => (
  <svg
    width={width}
    height={height}
    viewBox="-150 -150 300 300"
    className={className}
  >
    <CommonDefs />
    {/* Sun/Moon */}
    <circle cx="0" cy="-60" r="80" fill="url(#goldGrad)" opacity="0.2" />

    {/* Mountain of Coins */}
    <path d="M-100 150 L0 50 L100 150 Z" fill={C.suitLight} opacity="0.5" />

    {/* Hero on Top */}
    <g transform="translate(0, 40)">
      <RoboBody x={0} y={0} color={C.gold} />
      <NinjaHead x={0} y={-15} expression="happy" />
      <path d="M-15 10 L-30 -20" stroke={C.suitLight} strokeWidth="4" />{" "}
      {/* Raised Arm */}
      <Coin x={-30} y={-30} />
    </g>

    {/* Floating Wealth */}
    <Coin x={60} y={0} scale={0.8} />
    <Coin x={-60} y={20} scale={0.7} />
    <Coin x={80} y={80} scale={0.9} />
  </svg>
);

// 🔄 EXISTING EXPORTS (Kept for backward compatibility, updated visuals where needed)
export function NinjaHeadOne({ width = 32, height = 32, className }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="-50 -50 100 100"
      className={className}
    >
      <CommonDefs />
      <NinjaHead x={0} y={0} scale={0.8} />
    </svg>
  );
}
export function NinjaSlicing({ width = 120, height = 120, className }) {
  return (
    <NinjaSceneStrike width={width} height={height} className={className} />
  );
} // Mapped to new scene
export function NinjaSuccess({ width = 120, height = 120, className }) {
  return (
    <NinjaSceneVictory width={width} height={height} className={className} />
  );
} // Mapped to new scene
export function NinjaMeditating({ width = 120, height = 120, className }) {
  return <NinjaSceneVoid width={width} height={height} className={className} />;
} // Mapped to new scene
export const NinjaZen = NinjaMeditating;
export const NinjaChaos = NinjaSceneSwarm;
export const NinjaLogic = NinjaSceneAlgo;

// Simple Ones
export function NinjaBull({ width = 120, height = 120, className }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="-100 -100 200 200"
      className={className}
    >
      <CommonDefs />
      <path d="M-40 20 L0 -40 L40 20" fill={C.success} opacity="0.2" />
      <g transform="translate(0, 10)">
        <RoboBody x={0} y={0} color={C.success} />
        <NinjaHead x={0} y={-15} expression="angry" />
        <path
          d="M-25 -25 L-35 -40 M25 -25 L35 -40"
          stroke={C.success}
          strokeWidth="4"
        />{" "}
        {/* Horns */}
      </g>
    </svg>
  );
}

export function NinjaBear({ width = 120, height = 120, className }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="-100 -100 200 200"
      className={className}
    >
      <CommonDefs />
      <g transform="translate(0, 10)">
        <RoboBody x={0} y={0} color={C.danger} />
        <NinjaHead x={0} y={-15} expression="angry" colorOverride="#7f1d1d" />
        <path
          d="M-20 -25 Q-30 -40 -40 -20 M20 -25 Q30 -40 40 -20"
          fill={C.danger}
        />{" "}
        {/* Ears */}
      </g>
    </svg>
  );
}

export function NinjaHacker({ width = 120, height = 120, className }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="-100 -100 200 200"
      className={className}
    >
      <CommonDefs />
      <rect
        x="-50"
        y="-40"
        width="100"
        height="70"
        rx="4"
        stroke={C.success}
        fill="none"
        opacity="0.5"
      />
      <text
        x="-40"
        y="-10"
        fill={C.success}
        fontSize="10"
        fontFamily="monospace"
      >
        010101
      </text>
      <NinjaHead x={0} y={0} expression="cyber" />
    </svg>
  );
}
export const NinjaGlitch = NinjaHacker;

export function NinjaDiamond({ width = 120, height = 120, className }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="-100 -100 200 200"
      className={className}
    >
      <CommonDefs />
      <path
        d="M0 -60 L35 0 L0 60 L-35 0 Z"
        fill="url(#goldGrad)"
        opacity="0.8"
      />
      <NinjaHead x={0} y={0} expression="money" />
    </svg>
  );
}

export function NinjaSpeed({ width = 120, height = 120, className }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="-100 -100 200 200"
      className={className}
    >
      <CommonDefs />
      <g transform="skewX(-20)">
        <NinjaHead x={0} y={0} expression="angry" />
        <path
          d="M-60 0 H-20"
          stroke={C.primary}
          strokeWidth="2"
          opacity="0.5"
        />
      </g>
    </svg>
  );
}

export function NinjaShield({ width = 120, height = 120, className }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="-100 -100 200 200"
      className={className}
    >
      <CommonDefs />
      <path
        d="M0 -60 L50 -30 V20 L0 60 L-50 20 V-30 Z"
        fill={C.suitDark}
        stroke={C.primary}
        strokeWidth="2"
      />
      <NinjaHead x={0} y={0} scale={0.8} />
    </svg>
  );
}

export function NinjaRocket({ width = 120, height = 120, className }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="-100 -100 200 200"
      className={className}
    >
      <CommonDefs />
      <g transform="rotate(45)">
        <path d="M-15 30 L0 70 L15 30" fill={C.warning} />
        <rect x="-15" y="-30" width="30" height="60" rx="15" fill={C.metal} />
        <NinjaHead x={0} y={-10} expression="happy" />
      </g>
    </svg>
  );
}

export function NinjaAI({ width = 120, height = 120, className }) {
  return <NinjaSceneAlgo width={width} height={height} className={className} />;
}

export function NinjaMaster({ width = 120, height = 120, className }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="-100 -100 200 200"
      className={className}
    >
      <CommonDefs />
      <circle cx="0" cy="0" r="70" fill={C.gold} opacity="0.2" />
      <NinjaHead x={0} y={-10} expression="zen" />
      <path
        d="M-20 40 Q0 60 20 40"
        stroke={C.gold}
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );
}
export const NinjaPro = NinjaMaster;
export const NinjaVictory = NinjaHeroVictory;

export function NinjaInitiate({ width = 120, height = 120, className }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="-100 -100 200 200"
      className={className}
    >
      <CommonDefs />
      <NinjaHead x={0} y={0} />
      <rect x="-20" y="30" width="40" height="5" fill={C.suitLight} />
    </svg>
  );
}
export const NinjaDojo = NinjaInitiate;

// ☕ MISC
export function NinjaCoffee({ width = 120, height = 120, className }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="-100 -100 200 200"
      className={className}
    >
      <CommonDefs />
      <NinjaHead x={0} y={0} />
      <path
        d="M20 10 Q30 0 20 -10"
        stroke="white"
        strokeWidth="2"
        fill="none"
        opacity="0.5"
      />
    </svg>
  );
}

// 🦸‍♂️ MANIN COMPANION HEROES (Updated for high fidelity)
export function NinjaHeroIdle({ width = 120, height = 120, className }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="-100 -100 200 200"
      className={className}
    >
      <CommonDefs />
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 -5; 0 5; 0 -5"
          dur="3s"
          repeatCount="indefinite"
        />
        <RoboBody x={0} y={0} color={C.primary} />
        <path
          d="M-15 10 Q-40 20 -50 50"
          stroke={C.primary}
          strokeWidth="4"
          fill="none"
          opacity="0.8"
        >
          <animate
            attributeName="d"
            values="M-15 10 Q-40 20 -50 50; M-15 10 Q-35 30 -60 40; M-15 10 Q-40 20 -50 50"
            dur="4s"
            repeatCount="indefinite"
          />
        </path>
        <NinjaHead x={0} y={-15} expression="neutral" />
      </g>
      <ellipse cx="0" cy="50" rx="20" ry="5" fill="black" opacity="0.3">
        <animate
          attributeName="rx"
          values="20;15;20"
          dur="3s"
          repeatCount="indefinite"
        />
      </ellipse>
    </svg>
  );
}

export function NinjaHeroScanning({ width = 120, height = 120, className }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="-100 -100 200 200"
      className={className}
    >
      <CommonDefs />
      <g>
        <RoboBody x={0} y={0} color={C.primary} />
        <NinjaHead x={0} y={-15} expression="cyber" />
        {/* Scanner Beam */}
        <path d="M0 -15 L-60 -50 L60 -50 Z" fill={C.primary} opacity="0.2">
          <animate
            attributeName="opacity"
            values="0.1;0.3;0.1"
            dur="1s"
            repeatCount="indefinite"
          />
        </path>
      </g>
    </svg>
  );
}

export function NinjaHeroDash({ width = 120, height = 120, className }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="-100 -100 200 200"
      className={className}
    >
      <CommonDefs />
      <g transform="skewX(-20)">
        <RoboBody x={0} y={0} color={C.primary} />
        <NinjaHead x={0} y={-15} expression="angry" />
        <path d="M-50 0 H-20" stroke="white" strokeWidth="2" opacity="0.4" />
        <path d="M-60 20 H-30" stroke="white" strokeWidth="2" opacity="0.4" />
      </g>
    </svg>
  );
}

export function NinjaHeroShield({ width = 120, height = 120, className }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="-100 -100 200 200"
      className={className}
    >
      <CommonDefs />
      <g>
        <RoboBody x={0} y={0} color={C.primary} />
        <NinjaHead x={0} y={-15} expression="neutral" />
        <circle
          cx="0"
          cy="0"
          r="60"
          fill="none"
          stroke={C.primary}
          strokeWidth="2"
          opacity="0.5"
        >
          <animate
            attributeName="r"
            values="60;62;60"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      </g>
    </svg>
  );
}

export function NinjaHeroVictory({ width = 120, height = 120, className }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="-100 -100 200 200"
      className={className}
    >
      <CommonDefs />
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0; 0 -15; 0 0"
          dur="0.6s"
          repeatCount="indefinite"
        />
        <RoboBody x={0} y={0} color={C.gold} />
        <NinjaHead x={0} y={-15} expression="happy" />
        {/* Confetti */}
        <rect
          x="-30"
          y="-40"
          width="5"
          height="5"
          fill={C.gold}
          transform="rotate(15)"
        />
        <rect
          x="30"
          y="-50"
          width="5"
          height="5"
          fill={C.gold}
          transform="rotate(-15)"
        />
      </g>
    </svg>
  );
}
export const NinjaHeroConfused = NinjaHeroIdle;
export const NinjaHeroGlitch = NinjaHeroIdle;

// 💎 PREMIUM ILLUSTRATIONS
export function NinjaEliteUpgrade({ width = 300, height = 300, className }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="-150 -150 300 300"
      className={className}
    >
      <CommonDefs />
      {/* Background Atmosphere */}
      <circle
        cx="0"
        cy="0"
        r="140"
        fill="none"
        stroke={C.primary}
        strokeWidth="0.5"
        strokeDasharray="1 5"
        opacity="0.2"
      />
      <circle
        cx="0"
        cy="0"
        r="100"
        fill="none"
        stroke={C.gold}
        strokeWidth="1"
        strokeDasharray="10 10"
        opacity="0.1"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 0 0"
          to="360 0 0"
          dur="20s"
          repeatCount="indefinite"
        />
      </circle>

      {/* Power Core / Platforms */}
      <ellipse
        cx="0"
        cy="80"
        rx="60"
        ry="15"
        fill={C.primary}
        opacity="0.1"
        filter="url(#glow)"
      />
      <ellipse cx="0" cy="85" rx="40" ry="8" fill={C.primary} opacity="0.2" />

      {/* Floating Data Modules */}
      <g transform="translate(-80, -40)">
        <animateTransform
          attributeName="transform"
          type="translate"
          values="-80 -40; -80 -50; -80 -40"
          dur="4s"
          repeatCount="indefinite"
        />
        <rect
          x="-20"
          y="-15"
          width="40"
          height="30"
          rx="4"
          fill={C.suitDark}
          stroke={C.primary}
          strokeWidth="1"
          opacity="0.6"
        />
        <path
          d="M-10 0 H10 M-10 5 H5"
          stroke={C.primary}
          strokeWidth="1"
          opacity="0.8"
        />
        <circle cx="15" cy="-8" r="2" fill={C.success} />
      </g>
      <g transform="translate(80, -60)">
        <animateTransform
          attributeName="transform"
          type="translate"
          values="80 -60; 80 -50; 80 -60"
          dur="5s"
          repeatCount="indefinite"
        />
        <rect
          x="-25"
          y="-20"
          width="50"
          height="40"
          rx="4"
          fill={C.suitDark}
          stroke={C.gold}
          strokeWidth="1"
          opacity="0.6"
        />
        <Candle x={0} y={0} type="green" height={20} scale={0.6} />
        <path
          d="M-15 -10 L15 -10"
          stroke={C.gold}
          strokeWidth="1"
          opacity="0.4"
        />
      </g>

      {/* Main Hero Aura */}
      <circle
        cx="0"
        cy="0"
        r="50"
        fill="url(#goldGrad)"
        opacity="0.05"
        filter="url(#glow)"
      >
        <animate
          attributeName="r"
          values="50;55;50"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>

      {/* Hero Ninja - Elite Pose */}
      <g transform="translate(0, 10)">
        <RoboBody x={0} y={0} color={C.gold} />
        <NinjaHead x={0} y={-15} expression="cyber" scale={1.2} />

        {/* Elite Mantle / Energy Wings */}
        <path
          d="M-20 -5 Q-60 -40 -40 -60 Q-20 -40 -20 -5"
          fill={C.primary}
          opacity="0.15"
        />
        <path
          d="M20 -5 Q60 -40 40 -60 Q20 -40 20 -5"
          fill={C.primary}
          opacity="0.15"
        />

        {/* Holding a glowing orb of data */}
        <g transform="translate(0, -60)">
          <circle cx="0" cy="0" r="12" fill="white" filter="url(#glow)">
            <animate
              attributeName="opacity"
              values="0.4;0.9;0.4"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </circle>
          <path
            d="M-8 -8 L8 8 M8 -8 L-8 8"
            stroke={C.primary}
            strokeWidth="1"
          />
        </g>
      </g>

      {/* Connection Rays */}
      <g opacity="0.3">
        <line
          x1="0"
          y1="-50"
          x2="-60"
          y2="-40"
          stroke={C.primary}
          strokeWidth="0.5"
          strokeDasharray="2 2"
        >
          <animate
            attributeName="stroke-dashoffset"
            values="0;20"
            dur="10s"
            repeatCount="indefinite"
          />
        </line>
        <line
          x1="0"
          y1="-50"
          x2="60"
          y2="-60"
          stroke={C.gold}
          strokeWidth="0.5"
          strokeDasharray="2 2"
        >
          <animate
            attributeName="stroke-dashoffset"
            values="20;0"
            dur="10s"
            repeatCount="indefinite"
          />
        </line>
      </g>
    </svg>
  );
}

// 🎲 Randomizer
const ALL_ILLUSTRATIONS = [
  NinjaSceneVoid,
  NinjaSceneSwarm,
  NinjaSceneAlgo,
  NinjaSceneStrike,
  NinjaSceneVictory,
  NinjaDiamond,
  NinjaSpeed,
  NinjaShield,
  NinjaRocket,
  NinjaCoffee,
  NinjaMaster,
  NinjaPop,
  NinjaEliteUpgrade,
];

// 🚀 NEW COMPONENTS (Requested)
export function NinjaPop({ width = 120, height = 120, className }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="-100 -100 200 200"
      className={className}
    >
      <CommonDefs />
      <defs>
        <clipPath id="circleClip">
          <circle cx="0" cy="0" r="50" />
        </clipPath>
      </defs>
      <circle
        cx="0"
        cy="0"
        r="50"
        fill={C.suitDark}
        stroke={C.primary}
        strokeWidth="2"
      />
      <g clipPath="url(#circleClip)">
        <rect x="-60" y="0" width="120" height="60" fill={C.suitLight} />
        <g transform="translate(0, 20)">
          <NinjaHead x={0} y={0} expression="happy" />
        </g>
      </g>
    </svg>
  );
}

export const NinjaCharting = NinjaSceneAlgo;

export function NinjaTarget({ width = 120, height = 120, className }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="-100 -100 200 200"
      className={className}
    >
      <CommonDefs />
      {/* Target Board */}
      <circle
        cx="0"
        cy="0"
        r="60"
        fill="white"
        stroke={C.danger}
        strokeWidth="10"
      />
      <circle
        cx="0"
        cy="0"
        r="40"
        fill="white"
        stroke={C.danger}
        strokeWidth="10"
      />
      <circle cx="0" cy="0" r="20" fill={C.danger} />

      {/* Shuriken hitting center */}
      <Shuriken x={0} y={0} scale={0.8} />

      {/* Ninja Peeking */}
      <g transform="translate(40, 40) rotate(-15)">
        <NinjaHead x={0} y={0} expression="happy" scale={0.6} />
      </g>
    </svg>
  );
}

export function NinjaValues({ width = 120, height = 120, className }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="-100 -100 200 200"
      className={className}
    >
      <CommonDefs />
      <g transform="translate(0, 10)">
        <RoboBody x={0} y={0} color={C.violet} />
        <NinjaHead x={0} y={-15} expression="happy" />
        <path
          d="M-40 -40 L-20 -20 M40 -40 L20 -20"
          stroke={C.violet}
          strokeWidth="2"
          opacity="0.5"
        />
        <Coin x={0} y={-50} scale={0.8} />
      </g>
    </svg>
  );
}

// 🪙 PENNY STOCK ROCKET (Simplified & Cleaner)
export function NinjaPennyRocket({ width = 200, height = 200, className }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="-100 -100 200 200"
      className={className}
    >
      <CommonDefs />

      {/* Rocket (Clean Flight) */}
      <g transform="rotate(45)">
        {/* Trail */}
        <path d="M-10 40 L0 80 L10 40 Z" fill="url(#goldGrad)" opacity="0.6">
          <animate
            attributeName="opacity"
            values="0.4;0.8;0.4"
            dur="0.5s"
            repeatCount="indefinite"
          />
        </path>

        {/* Body */}
        <path
          d="M-15 40 L0 -40 L15 40 Z"
          fill={C.suitLight}
          stroke={C.primary}
          strokeWidth="2"
        />
        <NinjaHead x={0} y={0} expression="money" scale={0.8} />
      </g>

      {/* Floating Coins (Less clutter, gentle float) */}
      <Coin x={-50} y={0} scale={0.6} />
      <Coin x={60} y={-40} scale={0.5} />
      <Coin x={30} y={60} scale={0.4} />

      {/* Random Twinkle */}
      <circle cx="-30" cy="-60" r="2" fill="white" opacity="0.5">
        <animate
          attributeName="opacity"
          values="0;1;0"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
}

// 👥 SQUADS (Requested: Bigger, Interactive, Smart collaboration)
export function NinjaTeam({ width = 300, height = 200, className }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="-150 -100 300 200"
      className={className}
    >
      <CommonDefs />

      {/* Shared Hologram Table */}
      <ellipse cx="0" cy="60" rx="100" ry="20" fill={C.primary} opacity="0.1" />
      <path
        d="M-80 60 L0 80 L80 60"
        stroke={C.primary}
        strokeWidth="1"
        fill="none"
        opacity="0.3"
      />

      {/* Hologram Chart */}
      <g transform="translate(0, 20)">
        <path
          d="M-40 0 L-20 -20 L0 -10 L20 -40 L40 -30"
          stroke={C.success}
          strokeWidth="2"
          fill="none"
          filter="url(#glow)"
        >
          <animate
            attributeName="stroke-dasharray"
            values="0,200; 200,0"
            dur="2s"
            repeatCount="indefinite"
          />
        </path>
        <circle cx="20" cy="-40" r="3" fill={C.success} />
      </g>

      {/* Members Interacting */}

      {/* Left Member pointing */}
      <g transform="translate(-60, 20) scale(0.9)">
        <RoboBody x={0} y={0} color={C.primary} />
        <NinjaHead x={0} y={-15} expression="angry" />
        <path d="M15 5 L40 -10" stroke={C.suitLight} strokeWidth="3" />{" "}
        {/* Pointing arm */}
      </g>

      {/* Right Member analyzing */}
      <g transform="translate(60, 20) scale(0.9)">
        <RoboBody x={0} y={0} color={C.danger} />
        <NinjaHead x={0} y={-15} expression="cyber" />
        <path d="M-15 5 L-25 15" stroke={C.suitLight} strokeWidth="3" />{" "}
        {/* Crossed arm */}
      </g>

      {/* Center Leader celebrating */}
      <g transform="translate(0, -10)">
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 -10; 0 -15; 0 -10"
          dur="2s"
          repeatCount="indefinite"
        />
        <RoboBody x={0} y={0} color={C.gold} />
        <NinjaHead x={0} y={-15} expression="happy" />
        <path d="M-15 5 L-25 -20" stroke={C.suitLight} strokeWidth="3" />{" "}
        {/* Raised arm */}
      </g>

      {/* Connection Lines */}
      <path
        d="M-60 0 L0 -25 M60 0 L0 -25"
        stroke={C.primary}
        strokeWidth="1"
        strokeDasharray="4 4"
        opacity="0.3"
      >
        <animate
          attributeName="stroke-dashoffset"
          values="100;0"
          dur="1s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  );
}

export function RandomNinja({ width, height, className }) {
  const Comp = useMemo(() => {
    const idx = Math.floor(Math.random() * ALL_ILLUSTRATIONS.length);
    return ALL_ILLUSTRATIONS[idx];
  }, []);
  return <Comp width={width} height={height} className={className} />;
}
