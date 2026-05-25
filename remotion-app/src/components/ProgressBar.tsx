import { AbsoluteFill, useCurrentFrame } from 'remotion';
import React from 'react';
import { VIDEO_DURATION_FRAMES } from '../constants';

export const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const pct = Math.min(1, frame / VIDEO_DURATION_FRAMES);

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: 8,
          background: 'rgba(255,255,255,0.12)',
        }}
      >
        <div
          style={{
            width: `${pct * 100}%`,
            height: '100%',
            background:
              'linear-gradient(90deg, #FF3CAC 0%, #784BA0 50%, #2B86C5 100%)',
            boxShadow: '0 0 14px rgba(255,60,172,0.7)',
            transition: 'none',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
