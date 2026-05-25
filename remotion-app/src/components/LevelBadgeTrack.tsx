import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import React from 'react';

type Badge = {
  level: number;
  label: string;
  start: number;
  duration: number;
  color: string;
};

// Synchronized with "Le niveau N de l'intelligence artificielle…"
const BADGES: Badge[] = [
  { level: 1, label: 'Chatbots', start: 45.3, duration: 4.2, color: '#FF3CAC' },
  { level: 2, label: 'Automatisations', start: 65.5, duration: 4.2, color: '#FFB400' },
  { level: 3, label: 'Agents IA', start: 87.4, duration: 4.2, color: '#00E5FF' },
  { level: 4, label: 'Orchestrateurs', start: 118.4, duration: 4.6, color: '#A8FF35' },
];

export const LevelBadgeTrack: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const active = BADGES.find((b) => t >= b.start - 0.2 && t <= b.start + b.duration + 0.3);
  if (!active) return null;
  return <LevelBadge badge={active} t={t} fps={fps} />;
};

const LevelBadge: React.FC<{ badge: Badge; t: number; fps: number }> = ({ badge, t, fps }) => {
  const age = (t - badge.start) * fps;
  const inSpr = spring({
    frame: Math.max(0, age),
    fps,
    config: { damping: 9, stiffness: 160, mass: 0.6 },
  });
  const timeLeft = badge.start + badge.duration - t;
  const outFade = interpolate(timeLeft, [0, 0.3], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const scale = interpolate(inSpr, [0, 0.6, 1], [0.3, 1.18, 1]);
  const opacity = interpolate(inSpr, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' }) * outFade;
  const rotate = interpolate(inSpr, [0, 1], [-15, 0]);

  // Big "LEVEL N" text top centered
  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 220,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          transform: `scale(${scale}) rotate(${rotate}deg)`,
          opacity,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <div
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 56,
            fontWeight: 800,
            color: '#fff',
            background: 'rgba(0,0,0,0.6)',
            padding: '10px 28px',
            borderRadius: 18,
            border: `3px solid ${badge.color}`,
            textShadow: `0 0 12px ${badge.color}`,
            letterSpacing: 4,
            textTransform: 'uppercase',
          }}
        >
          NIVEAU
        </div>
        <div
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 340,
            fontWeight: 900,
            color: badge.color,
            lineHeight: 0.85,
            WebkitTextStroke: '8px #000',
            paintOrder: 'stroke fill',
            textShadow: `0 0 48px ${badge.color}, 0 0 100px ${badge.color}88`,
            letterSpacing: -10,
          }}
        >
          {badge.level}
        </div>
        <div
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 64,
            fontWeight: 900,
            color: '#fff',
            background: badge.color,
            padding: '14px 36px',
            borderRadius: 22,
            textTransform: 'uppercase',
            letterSpacing: 2,
            boxShadow: `0 12px 40px ${badge.color}aa`,
            textShadow: '0 2px 0 rgba(0,0,0,0.4)',
          }}
        >
          {badge.label}
        </div>
      </div>
    </AbsoluteFill>
  );
};
