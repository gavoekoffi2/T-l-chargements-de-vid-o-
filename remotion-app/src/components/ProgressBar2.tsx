import { AbsoluteFill, useCurrentFrame } from 'remotion';
import React from 'react';
import { VIDEO_DURATION_FRAMES } from '../constants2';

export const ProgressBar2: React.FC = () => {
  const frame = useCurrentFrame();
  const pct = Math.min(1, frame / VIDEO_DURATION_FRAMES);

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: 8,
        background: 'rgba(255,255,255,0.12)',
      }}>
        <div style={{
          width: `${pct * 100}%`, height: '100%',
          background: 'linear-gradient(90deg, #4285F4 0%, #8E54E9 50%, #FF6B9D 100%)',
          boxShadow: '0 0 14px rgba(142,84,233,0.7)',
        }} />
      </div>
    </AbsoluteFill>
  );
};
