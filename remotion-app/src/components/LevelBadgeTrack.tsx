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
// Compact + short to leave room for B-rolls and avoid covering face for long.
const BADGES: Badge[] = [
  { level: 1, label: 'Chatbots', start: 45.3, duration: 1.8, color: '#FF3CAC' },
  { level: 2, label: 'Automatisations', start: 65.5, duration: 1.8, color: '#FFB400' },
  { level: 3, label: 'Agents IA', start: 87.4, duration: 1.8, color: '#00E5FF' },
  { level: 4, label: 'Orchestrateurs', start: 118.4, duration: 2.2, color: '#A8FF35' },
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
  const scale = interpolate(inSpr, [0, 0.6, 1], [0.5, 1.12, 1]);
  const opacity = interpolate(inSpr, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' }) * outFade;
  const rotate = interpolate(inSpr, [0, 1], [-10, 0]);

  // Horizontal compact banner at the top safe zone (above face)
  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 70,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          transform: `scale(${scale}) rotate(${rotate}deg)`,
          opacity,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          background: 'rgba(0,0,0,0.78)',
          border: `4px solid ${badge.color}`,
          borderRadius: 18,
          padding: '10px 18px',
          boxShadow: `0 8px 28px ${badge.color}aa`,
        }}
      >
        <div
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 28,
            fontWeight: 800,
            color: '#fff',
            letterSpacing: 3,
            textTransform: 'uppercase',
            textShadow: `0 0 8px ${badge.color}`,
          }}
        >
          NIVEAU
        </div>
        <div
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 110,
            fontWeight: 900,
            color: badge.color,
            lineHeight: 0.9,
            WebkitTextStroke: '4px #000',
            paintOrder: 'stroke fill',
            textShadow: `0 0 24px ${badge.color}, 0 0 60px ${badge.color}66`,
            letterSpacing: -4,
            marginTop: -10,
          }}
        >
          {badge.level}
        </div>
        <div
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 36,
            fontWeight: 900,
            color: '#000',
            background: badge.color,
            padding: '8px 18px',
            borderRadius: 12,
            textTransform: 'uppercase',
            letterSpacing: 1,
            boxShadow: `0 4px 16px ${badge.color}aa`,
          }}
        >
          {badge.label}
        </div>
      </div>
    </AbsoluteFill>
  );
};
