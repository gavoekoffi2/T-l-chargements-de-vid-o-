import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, staticFile, Img } from 'remotion';
import React from 'react';
import overlays from '../overlays.json';

type Overlay = {
  id: string;
  brand: string;
  logo: string;
  color: string;
  start: number;
  duration: number;
  side: 'left' | 'right';
  y: number;
  subtitle?: string;
};

export const LogoOverlayTrack: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {(overlays as Overlay[]).map((o) => {
        if (t < o.start - 0.1 || t > o.start + o.duration + 0.3) return null;
        return <LogoCard key={o.id} overlay={o} t={t} fps={fps} frame={frame} />;
      })}
    </AbsoluteFill>
  );
};

const LogoCard: React.FC<{ overlay: Overlay; t: number; fps: number; frame: number }> = ({
  overlay,
  t,
  fps,
}) => {
  const age = (t - overlay.start) * fps;
  const inSpr = spring({
    frame: Math.max(0, age),
    fps,
    config: { damping: 10, stiffness: 180, mass: 0.6 },
  });
  const timeLeft = overlay.start + overlay.duration - t;
  const outFade = interpolate(timeLeft, [0, 0.25], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Glitch-y slide-in from the side
  const dirSign = overlay.side === 'left' ? -1 : 1;
  const slide = interpolate(inSpr, [0, 1], [dirSign * 700, 0]);
  const scale = interpolate(inSpr, [0, 0.6, 1], [0.6, 1.12, 1]);
  const opacity = interpolate(inSpr, [0, 0.7], [0, 1], {
    extrapolateRight: 'clamp',
  }) * outFade;

  // Tiny rotation flick
  const rot = interpolate(inSpr, [0, 0.5, 1], [-8 * dirSign, 2 * dirSign, 0]);

  // Continuous subtle bobbing while visible
  const bob = Math.sin((t - overlay.start) * 4) * 6;

  // Glitch RGB-split on entry (first 0.2s)
  const glitchPhase = Math.max(0, 1 - age / (fps * 0.25));
  const glitchOffset = glitchPhase * 8;

  const xBase = overlay.side === 'left' ? 80 : null;
  const xBaseRight = overlay.side === 'right' ? 80 : null;

  return (
    <div
      style={{
        position: 'absolute',
        top: overlay.y + bob,
        left: xBase ?? undefined,
        right: xBaseRight ?? undefined,
        transform: `translateX(${slide}px) rotate(${rot}deg) scale(${scale})`,
        opacity,
      }}
    >
      {/* Glow halo */}
      <div
        style={{
          position: 'absolute',
          inset: -30,
          borderRadius: 40,
          background: `radial-gradient(circle, ${overlay.color}55 0%, transparent 70%)`,
          filter: 'blur(20px)',
        }}
      />
      {/* Card */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          padding: '24px 36px',
          background: 'rgba(15, 15, 20, 0.92)',
          border: `4px solid ${overlay.color}`,
          borderRadius: 28,
          boxShadow: `0 12px 60px ${overlay.color}88, inset 0 0 24px rgba(0,0,0,0.6)`,
          position: 'relative',
          backdropFilter: 'blur(6px)',
        }}
      >
        {/* Glitch copies */}
        {glitchPhase > 0 && (
          <>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 28,
                border: `4px solid #FF1744`,
                transform: `translate(${glitchOffset}px, -${glitchOffset / 2}px)`,
                opacity: glitchPhase * 0.6,
                mixBlendMode: 'screen',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 28,
                border: `4px solid #00E5FF`,
                transform: `translate(-${glitchOffset}px, ${glitchOffset / 2}px)`,
                opacity: glitchPhase * 0.6,
                mixBlendMode: 'screen',
              }}
            />
          </>
        )}

        {/* Logo */}
        <div
          style={{
            width: 110,
            height: 110,
            borderRadius: 22,
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 14,
            boxShadow: `0 0 24px ${overlay.color}aa`,
          }}
        >
          <Img
            src={staticFile(`logos/${overlay.logo}`)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              filter: `drop-shadow(0 0 6px ${overlay.color})`,
            }}
          />
        </div>

        {/* Label */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontWeight: 900,
              fontSize: 72,
              color: '#fff',
              lineHeight: 1,
              textShadow: `0 0 12px ${overlay.color}`,
              letterSpacing: -1,
            }}
          >
            {overlay.brand}
          </span>
          {overlay.subtitle && (
            <span
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontWeight: 700,
                fontSize: 30,
                color: overlay.color,
                marginTop: 6,
                letterSpacing: 1,
              }}
            >
              {overlay.subtitle}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
