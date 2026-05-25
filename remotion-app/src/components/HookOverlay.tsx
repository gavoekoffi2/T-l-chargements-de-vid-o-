import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import React from 'react';

type Hook = { text: string; start: number; duration: number; color: string };

// Strategic hooks for retention (separate from caption track to make them BIG)
const HOOKS: Hook[] = [
  { text: '⚠️ NIVEAU 4 ATTEINT', start: 0.4, duration: 4.0, color: '#FF1744' },
  { text: 'OÙ EN ES-TU ?', start: 33.5, duration: 3.5, color: '#FFEB3B' },
];

export const HookOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const active = HOOKS.find((h) => t >= h.start && t <= h.start + h.duration);
  if (!active) return null;
  return <HookCard hook={active} t={t} fps={fps} />;
};

const HookCard: React.FC<{ hook: Hook; t: number; fps: number }> = ({ hook, t, fps }) => {
  const age = (t - hook.start) * fps;
  const inSpr = spring({
    frame: Math.max(0, age),
    fps,
    config: { damping: 8, stiffness: 140, mass: 0.6 },
  });
  const timeLeft = hook.start + hook.duration - t;
  const out = interpolate(timeLeft, [0, 0.4], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const scale = interpolate(inSpr, [0, 0.7, 1], [0.4, 1.15, 1]);
  const opacity = interpolate(inSpr, [0, 0.5], [0, 1], { extrapolateRight: 'clamp' }) * out;
  const skew = interpolate(inSpr, [0, 1], [-15, 0]);

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          transform: `scale(${scale}) skewX(${skew}deg)`,
          opacity,
          fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: 900,
          fontSize: 120,
          color: '#fff',
          textTransform: 'uppercase',
          background: hook.color,
          padding: '24px 48px',
          borderRadius: 24,
          letterSpacing: -2,
          boxShadow: `0 16px 60px ${hook.color}, 0 0 100px ${hook.color}66`,
          WebkitTextStroke: '4px #000',
          paintOrder: 'stroke fill',
          textShadow: '0 6px 0 rgba(0,0,0,0.4)',
          border: '6px solid #000',
        }}
      >
        {hook.text}
      </div>
    </AbsoluteFill>
  );
};
