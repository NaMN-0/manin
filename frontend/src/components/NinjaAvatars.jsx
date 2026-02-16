import {
  C,
  ALL_AVATARS,
  getRandomAvatarId,
  getAvatarById,
} from "../utils/ninjaAvatars";

const BaseNinja = ({ color, headbandColor, eyeType, accessory }) => (
  <svg viewBox="0 0 100 100" width="100%" height="100%">
    <defs>
      <linearGradient id="hoodGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={color} />
        <stop offset="100%" stopColor="#0f172a" />
      </linearGradient>
    </defs>

    {/* Hood/Head */}
    <circle
      cx="50"
      cy="50"
      r="45"
      fill="url(#hoodGrad)"
      stroke="#1e293b"
      strokeWidth="2"
    />

    {/* Face Opening */}
    <path d="M25 40 Q50 30 75 40 L70 80 Q50 90 30 80 Z" fill="#1e293b" />

    {/* Headband */}
    <path
      d="M15 35 Q50 25 85 35"
      stroke={headbandColor}
      strokeWidth="8"
      strokeLinecap="round"
    />
    {/* Tassel */}
    <path
      d="M85 35 Q95 30 95 15"
      stroke={headbandColor}
      strokeWidth="6"
      strokeLinecap="round"
      opacity="0.8"
    />

    {/* Eyes */}
    {eyeType === "normal" && (
      <>
        <circle cx="35" cy="55" r="5" fill="white" />
        <circle cx="65" cy="55" r="5" fill="white" />
      </>
    )}
    {eyeType === "angry" && (
      <>
        <path d="M30 50 L45 58 L30 60 Z" fill="white" />
        <path d="M70 50 L55 58 L70 60 Z" fill="white" />
      </>
    )}
    {eyeType === "cyber" && (
      <rect
        x="25"
        y="50"
        width="50"
        height="10"
        rx="2"
        fill={C.primary}
        opacity="0.8"
      />
    )}
    {eyeType === "void" && (
      <>
        <circle cx="35" cy="55" r="4" fill={C.danger} />
        <circle cx="65" cy="55" r="4" fill={C.danger} />
      </>
    )}

    {/* Accessories */}
    {accessory === "mask" && (
      <path d="M30 70 Q50 60 70 70 V85 Q50 95 30 85 Z" fill={C.maskLight} />
    )}
    {accessory === "mic" && (
      <path d="M70 60 L80 65" stroke={C.success} strokeWidth="3" />
    )}
  </svg>
);

export const AvatarRookie = () => (
  <BaseNinja
    color={C.primary}
    headbandColor="white"
    eyeType="normal"
    accessory="mask"
  />
);

// 2. The Bull (Green)

export const AvatarBull = () => (
  <BaseNinja
    color={C.success}
    headbandColor={C.gold}
    eyeType="angry"
    accessory="mask"
  />
);

// 3. The Bear (Red)

export const AvatarBear = () => (
  <BaseNinja
    color={C.danger}
    headbandColor="#000"
    eyeType="angry"
    accessory="mask"
  />
);

// 4. The Ghost (White/Grey)

export const AvatarGhost = () => (
  <BaseNinja
    color="#94a3b8"
    headbandColor="#cbd5e1"
    eyeType="void"
    accessory=""
  />
);

// 5. The Algo (Cyber)

export const AvatarAlgo = () => (
  <BaseNinja
    color="#3b0764"
    headbandColor={C.primary}
    eyeType="cyber"
    accessory="mic"
  />
);

// 6. The Golden (Pro)

export const AvatarGold = () => (
  <BaseNinja
    color={C.gold}
    headbandColor="white"
    eyeType="normal"
    accessory="mask"
  />
);

// 7. The Shadow (Dark)

export const AvatarShadow = () => (
  <BaseNinja
    color="#020617"
    headbandColor="#334155"
    eyeType="void"
    accessory="mask"
  />
);

// 8. The Viper (Purple)

export const AvatarViper = () => (
  <BaseNinja
    color="#7e22ce"
    headbandColor={C.success}
    eyeType="angry"
    accessory="mask"
  />
);

// 9. The Glitch (Teal)

export const AvatarGlitch = () => (
  <BaseNinja
    color="#14b8a6"
    headbandColor="#0f172a"
    eyeType="cyber"
    accessory=""
  />
);

// 10. The Zen (Orange)

export const AvatarZen = () => (
  <BaseNinja
    color="#f97316"
    headbandColor="#fef3c7"
    eyeType="normal"
    accessory=""
  />
);

// Update ALL_AVATARS to reference the components from this file
ALL_AVATARS[0].Component = AvatarRookie;
ALL_AVATARS[1].Component = AvatarBull;
ALL_AVATARS[2].Component = AvatarBear;
ALL_AVATARS[3].Component = AvatarGhost;
ALL_AVATARS[4].Component = AvatarAlgo;
ALL_AVATARS[5].Component = AvatarGold;
ALL_AVATARS[6].Component = AvatarShadow;
ALL_AVATARS[7].Component = AvatarViper;
ALL_AVATARS[8].Component = AvatarGlitch;
ALL_AVATARS[9].Component = AvatarZen;

// eslint-disable-next-line react-refresh/only-export-components
export { ALL_AVATARS, getRandomAvatarId, getAvatarById };
