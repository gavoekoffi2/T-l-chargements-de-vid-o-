import { AbsoluteFill, useCurrentFrame, random } from 'remotion';
import React from 'react';
import { FPS } from '../constants';

type Burst = { start: number; duration: number; count: number; hue: number };
// Particle bursts on hooks and level reveals
const BURSTS: Burst[] = [
  { start: 5.4, duration: 1.4, count: 28, hue: 320 },
  { start: 31.4, duration: 1.2, count: 22, hue: 200 },
  { start: 45.2, duration: 1.2, count: 22, hue: 280 },
  { start: 65.5, duration: 1.2, count: 22, hue: 30 },
  { start: 87.4, duration: 1.2, count: 22, hue: 140 },
  { start: 118.4, duration: 1.6, count: 36, hue: 50 },
];

export const ParticlesTrack: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {BURSTS.map((b, bi) => {
        if (t < b.start || t > b.start + b.duration) return null;
        const local = (t - b.start) / b.duration; // 0..1
        return (
          <React.Fragment key={bi}>
            {Array.from({ length: b.count }).map((_, i) => {
              const angle = random(`a-${bi}-${i}`) * Math.PI * 2;
              const dist = (300 + random(`d-${bi}-${i}`) * 600) * local;
              const size = 6 + random(`s-${bi}-${i}`) * 14;
              const x = 540 + Math.cos(angle) * dist;
              const y = 960 + Math.sin(angle) * dist;
              const opacity = 1 - local;
              const hueJit = b.hue + (random(`h-${bi}-${i}`) - 0.5) * 40;
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: x,
                    top: y,
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    background: `hsl(${hueJit}, 95%, 65%)`,
                    boxShadow: `0 0 ${size * 2}px hsl(${hueJit}, 95%, 70%)`,
                    opacity,
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              );
            })}
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};
