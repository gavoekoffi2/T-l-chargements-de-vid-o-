import React from "react";
import {
  AbsoluteFill,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

type Particle = { angle: number; size: number; delay: number };

const PARTICLES: Particle[] = Array.from({ length: 14 }).map((_, i) => ({
  angle: (i / 14) * Math.PI * 2 + (i % 2 ? 0.18 : 0),
  size: 70 + ((i * 13) % 40),
  delay: (i % 5) * 1.2,
}));

/**
 * Explosion of an emoji at a precise frame — fired on punch words.
 * Particles spring outward then fade. Layered on top of captions.
 */
export const EmojiBurst: React.FC<{
  emoji: string;
  triggerFrame: number;
  x?: number;
  y?: number;
}> = ({ emoji, triggerFrame, x = 0.5, y = 0.5 }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const local = frame - triggerFrame;
  if (local < 0 || local > fps * 1.2) return null;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: width * x,
          top: height * y,
          transform: "translate(-50%, -50%)",
        }}
      >
        {PARTICLES.map((p, idx) => {
          const prog = spring({
            frame: local - p.delay,
            fps,
            config: { damping: 14, mass: 0.7, stiffness: 100 },
          });
          const fade = Math.max(0, 1 - local / (fps * 1.1));
          const r = prog * 380;
          const dx = Math.cos(p.angle) * r;
          const dy = Math.sin(p.angle) * r;
          const rot = prog * 240 * (idx % 2 ? -1 : 1);
          return (
            <span
              key={idx}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                fontSize: p.size,
                transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg) scale(${0.4 + prog})`,
                opacity: fade,
                filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.5))",
              }}
            >
              {emoji}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
