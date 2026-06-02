import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS } from "../constants";

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  color: string;
  drift: number;
}

// Génère des particules déterministes (pas d'aléatoire runtime)
function generateParticles(count: number): Particle[] {
  const particleColors = [COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.gold];
  return Array.from({ length: count }, (_, i) => {
    const seed = (i * 137.508 + 1) % 1; // ratio d'or pseudo-aléatoire
    const seed2 = ((i + 7) * 97.3) % 1;
    const seed3 = ((i + 3) * 61.8) % 1;
    const seed4 = ((i + 13) * 42.1) % 1;
    return {
      x: (i / count) * 100,
      y: seed * 100,
      size: 1 + seed2 * 3,
      speed: 0.02 + seed3 * 0.05,
      opacity: 0.2 + seed4 * 0.6,
      color: particleColors[i % particleColors.length],
      drift: (seed2 - 0.5) * 0.3,
    };
  });
}

const PARTICLES = generateParticles(60);

export const ParticleField: React.FC<{ opacity?: number }> = ({
  opacity = 1,
}) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        opacity,
        pointerEvents: "none",
      }}
    >
      {PARTICLES.map((p, i) => {
        const y = ((p.y - frame * p.speed * 100) % 110) - 5;
        const x = p.x + Math.sin(frame * 0.02 + i) * p.drift * 5;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: p.color,
              opacity: p.opacity,
              boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
              filter: `blur(${p.size > 2 ? 0.5 : 0}px)`,
            }}
          />
        );
      })}
    </div>
  );
};
