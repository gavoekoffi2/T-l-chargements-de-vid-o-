import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion';
import React from 'react';
import { FPS } from '../constants';

type Pulse = {
  /** seconds */
  start: number;
  /** seconds */
  duration: number;
  /** target scale (1 = no zoom) */
  scale: number;
  /** ease in/out */
  ease?: 'in' | 'out' | 'inout';
};

/**
 * Camera-style zooms synchronized with hooks and "niveau N" reveals.
 * Each pulse: scale up over half the duration, hold briefly, then back to 1.
 */
const DEFAULT_PULSES: Pulse[] = [
  // Hook: "niveau 4 actuellement" – punch zoom
  { start: 5.4, duration: 1.8, scale: 1.14 },
  // "bloquées au niveau 1" – emphasis
  { start: 7.6, duration: 1.6, scale: 1.10 },
  // Intro reveal "Claude, Monsieur IA"
  { start: 25.5, duration: 1.7, scale: 1.08 },
  // "abonne-toi. On y va." energy boost
  { start: 31.4, duration: 1.3, scale: 1.12 },
  // Niveau 1
  { start: 45.0, duration: 1.6, scale: 1.10 },
  // Exemples ChatGPT/DeepSeek/Claude
  { start: 56.0, duration: 1.6, scale: 1.08 },
  // Niveau 2
  { start: 65.3, duration: 1.6, scale: 1.10 },
  // N8N/Make/Zapier
  { start: 82.3, duration: 1.6, scale: 1.08 },
  // Niveau 3
  { start: 87.2, duration: 1.6, scale: 1.10 },
  // Niveau 4
  { start: 118.0, duration: 1.6, scale: 1.12 },
  // Conclusion
  { start: 150.0, duration: 2.0, scale: 1.10 },
];

const DEFAULT_SHAKES: { start: number; duration: number; intensity: number }[] = [
  { start: 5.6, duration: 0.45, intensity: 6 },
  { start: 31.5, duration: 0.4, intensity: 5 },
  { start: 45.2, duration: 0.4, intensity: 5 },
  { start: 65.5, duration: 0.4, intensity: 5 },
  { start: 87.4, duration: 0.4, intensity: 5 },
  { start: 118.2, duration: 0.5, intensity: 7 },
];

type ZoomTrackProps = {
  children: React.ReactNode;
  pulses?: Pulse[];
  shakes?: { start: number; duration: number; intensity: number }[];
};

export const ZoomTrack: React.FC<ZoomTrackProps> = ({
  children,
  pulses = DEFAULT_PULSES,
  shakes = DEFAULT_SHAKES,
}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;

  // Compute current scale (max over active pulses, default 1)
  let scale = 1;
  for (const p of pulses) {
    if (t >= p.start && t <= p.start + p.duration) {
      const local = (t - p.start) / p.duration;
      // Smooth: 0 → 1 (peak at 0.4) → 0
      const env = interpolate(local, [0, 0.4, 1], [0, 1, 0], {
        easing: Easing.inOut(Easing.cubic),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      const s = 1 + (p.scale - 1) * env;
      if (s > scale) scale = s;
    }
  }

  // Shake
  let dx = 0;
  let dy = 0;
  for (const s of shakes) {
    if (t >= s.start && t <= s.start + s.duration) {
      const local = (t - s.start) / s.duration;
      const damp = 1 - local; // decay
      dx += Math.sin(frame * 1.6) * s.intensity * damp;
      dy += Math.cos(frame * 1.9) * s.intensity * damp;
    }
  }

  return (
    <AbsoluteFill
      style={{
        transform: `translate(${dx}px, ${dy}px) scale(${scale})`,
        transformOrigin: '50% 45%',
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
