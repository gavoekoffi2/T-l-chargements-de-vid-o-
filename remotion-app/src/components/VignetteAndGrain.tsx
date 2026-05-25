import { AbsoluteFill, useCurrentFrame, random } from 'remotion';
import React from 'react';

/** Cinematic vignette + animated film grain overlay. */
export const VignetteAndGrain: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 2); // change grain every 2 frames

  // Pre-compute a small set of grain dots
  const dots: { x: number; y: number; o: number }[] = [];
  for (let i = 0; i < 80; i++) {
    dots.push({
      x: random(`gx-${seed}-${i}`) * 100,
      y: random(`gy-${seed}-${i}`) * 100,
      o: random(`go-${seed}-${i}`) * 0.18,
    });
  }

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {/* Vignette */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.55) 100%)',
          mixBlendMode: 'multiply',
        }}
      />
      {/* Subtle grain via SVG */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ opacity: 0.35, mixBlendMode: 'overlay' }}
      >
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={0.25} fill={`rgba(255,255,255,${d.o})`} />
        ))}
      </svg>
    </AbsoluteFill>
  );
};
