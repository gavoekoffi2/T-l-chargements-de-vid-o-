import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  hue: number;
  phaseOffset: number;
}

function seededRand(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export const ParticleField: React.FC<{ count?: number; intensity?: number }> = ({
  count = 30,
  intensity = 1,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: seededRand(i * 17 + 1) * 100,
      y: seededRand(i * 17 + 2) * 100,
      size: 2 + seededRand(i * 17 + 3) * 6,
      speed: 0.3 + seededRand(i * 17 + 4) * 0.8,
      opacity: 0.15 + seededRand(i * 17 + 5) * 0.35,
      hue: 220 + seededRand(i * 17 + 6) * 120,
      phaseOffset: seededRand(i * 17 + 7) * Math.PI * 2,
    }));
  }, [count]);

  return (
    <svg
      style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1 }}
      width={width}
      height={height}
    >
      {particles.map((p) => {
        const t = (frame * 0.01 * p.speed + p.phaseOffset);
        const driftX = Math.sin(t * 1.3) * 3;
        const driftY = -(frame * p.speed * 0.4) % height;
        const px = ((p.x + driftX) / 100) * width;
        const py = ((p.y / 100) * height + driftY + height) % height;
        const pulse = 0.7 + Math.sin(t * 2.1) * 0.3;

        return (
          <circle
            key={p.id}
            cx={px}
            cy={py}
            r={p.size * pulse * intensity}
            fill={`hsla(${p.hue}, 80%, 70%, ${p.opacity * intensity})`}
            style={{ filter: `blur(${p.size * 0.5}px)` }}
          />
        );
      })}
    </svg>
  );
};
