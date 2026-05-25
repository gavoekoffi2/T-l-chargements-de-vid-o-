import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, random } from 'remotion';
import React from 'react';

// Two CTAs synchronized with speech:
// 1) Early subscribe reminder at ~30.5s ("abonne-toi. On y va.")
// 2) Final outro CTA from ~159s ("abonnez-vous") to end (166.3s)
type CTA = {
  start: number;
  duration: number;
  variant: 'mini' | 'full';
};

const CTAS: CTA[] = [
  { start: 30.5, duration: 2.6, variant: 'mini' },
  { start: 159.3, duration: 6.9, variant: 'full' },
];

export const SubscribeCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const active = CTAS.find((c) => t >= c.start - 0.2 && t <= c.start + c.duration + 0.3);
  if (!active) return null;
  if (active.variant === 'mini') return <MiniSubscribe t={t} cta={active} fps={fps} />;
  return <FullSubscribe t={t} cta={active} fps={fps} />;
};

// ===== MINI: corner badge ("abonne-toi") =====
const MiniSubscribe: React.FC<{ t: number; cta: CTA; fps: number }> = ({ t, cta, fps }) => {
  const age = (t - cta.start) * fps;
  const sp = spring({ frame: Math.max(0, age), fps, config: { damping: 10, stiffness: 200, mass: 0.5 } });
  const scale = interpolate(sp, [0, 0.6, 1], [0.4, 1.18, 1]);
  const opacity = interpolate(sp, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' });
  const timeLeft = cta.start + cta.duration - t;
  const outFade = interpolate(timeLeft, [0, 0.3], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const pulse = 1 + Math.sin(t * 8) * 0.05;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute',
        top: 280,
        right: 60,
        transform: `scale(${scale * pulse})`,
        opacity: opacity * outFade,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
      }}>
        <div style={{
          background: '#FF0000',
          padding: '20px 36px',
          borderRadius: 50,
          border: '5px solid #fff',
          boxShadow: '0 12px 30px rgba(255,0,0,0.6), 0 0 60px rgba(255,0,0,0.4)',
          fontFamily: 'Inter, sans-serif', fontSize: 52, fontWeight: 900, color: '#fff',
          textTransform: 'uppercase', letterSpacing: 1,
          textShadow: '0 3px 0 rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 56 }}>🔔</span>
          ABONNE-TOI
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ===== FULL: end-screen subscribe with finger tap animation =====
const FullSubscribe: React.FC<{ t: number; cta: CTA; fps: number }> = ({ t, cta, fps }) => {
  const age = (t - cta.start) * fps;
  const sp = spring({ frame: Math.max(0, age), fps, config: { damping: 11, stiffness: 130, mass: 0.7 } });
  const scale = interpolate(sp, [0, 0.7, 1], [0.5, 1.1, 1]);
  const opacity = interpolate(sp, [0, 0.5], [0, 1], { extrapolateRight: 'clamp' });

  // Big breathing pulse on button
  const localT = t - cta.start;
  const pulse = 1 + Math.sin(localT * 5) * 0.06;
  // Finger tap cycles every ~1.0s
  const tapPhase = localT % 1.0;
  const tapScale = tapPhase < 0.2 ? 0.78 : 1.0;
  // Color cycling on the button
  const hue = (localT * 30) % 60; // small hue shift

  // Many particles emanating from button
  const particles = Array.from({ length: 24 });

  return (
    <AbsoluteFill style={{
      pointerEvents: 'none',
      background: `linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.85) 60%, rgba(0,0,0,0.95) 100%)`,
    }}>
      {/* Massive title */}
      <div style={{
        position: 'absolute', top: 300, left: 0, right: 0,
        textAlign: 'center', opacity, transform: `scale(${scale})`,
      }}>
        <div style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 92,
          fontWeight: 900,
          color: '#FFEB3B',
          WebkitTextStroke: '5px #000',
          paintOrder: 'stroke fill',
          letterSpacing: -2,
          textShadow: '0 0 40px #FFEB3B, 0 8px 0 rgba(0,0,0,0.4)',
          lineHeight: 1,
        }}>
          ABONNE-TOI
        </div>
        <div style={{
          marginTop: 18,
          fontFamily: 'Inter, sans-serif',
          fontSize: 54,
          fontWeight: 800,
          color: '#fff',
          letterSpacing: 1,
          textShadow: '0 4px 0 rgba(0,0,0,0.6)',
        }}>
          pour ne rien rater
        </div>
      </div>

      {/* Particles burst */}
      {particles.map((_, i) => {
        const angle = random(`p-${i}`) * Math.PI * 2;
        const speed = 600 + random(`s-${i}`) * 400;
        const dist = speed * Math.min(localT * 0.5, 1);
        const x = 540 + Math.cos(angle) * dist;
        const y = 1100 + Math.sin(angle) * dist;
        const sz = 14 + random(`sz-${i}`) * 18;
        const hueP = random(`h-${i}`) * 360;
        const o = Math.max(0, 1 - localT * 0.5);
        return (
          <div key={i} style={{
            position: 'absolute', left: x, top: y,
            width: sz, height: sz, borderRadius: '50%',
            background: `hsl(${hueP}, 95%, 65%)`,
            boxShadow: `0 0 ${sz * 2}px hsl(${hueP}, 95%, 70%)`,
            opacity: o,
            transform: 'translate(-50%, -50%)',
          }} />
        );
      })}

      {/* Big red button */}
      <div style={{
        position: 'absolute',
        left: '50%',
        top: 1050,
        transform: `translate(-50%, 0) scale(${scale * pulse * tapScale})`,
        opacity,
        background: `hsl(${hue}, 90%, 50%)`,
        padding: '36px 70px',
        borderRadius: 80,
        border: '8px solid #fff',
        boxShadow: '0 16px 50px rgba(255,0,0,0.7), 0 0 120px rgba(255,0,0,0.5), inset 0 -8px 0 rgba(0,0,0,0.25)',
        fontFamily: 'Inter, sans-serif',
        fontSize: 76,
        fontWeight: 900,
        color: '#fff',
        textTransform: 'uppercase',
        letterSpacing: 2,
        textShadow: '0 4px 0 rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        gap: 22,
      }}>
        <span style={{ fontSize: 86 }}>🔔</span>
        S'ABONNER
      </div>

      {/* Animated finger pointer */}
      <div style={{
        position: 'absolute',
        left: '63%', top: 1250,
        transform: `translateY(${tapPhase < 0.2 ? 30 : 0}px) scale(${tapPhase < 0.2 ? 0.85 : 1})`,
        fontSize: 130,
        opacity,
        filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.7))',
      }}>👆</div>

      {/* Bell + Heart small floating */}
      <div style={{
        position: 'absolute',
        left: 140, top: 1450,
        transform: `translateY(${Math.sin(localT * 3) * 16}px) scale(${scale})`,
        opacity,
        background: '#fff',
        padding: '20px 30px',
        borderRadius: 50,
        display: 'flex', alignItems: 'center', gap: 14,
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        border: '4px solid #FF1744',
      }}>
        <span style={{ fontSize: 56 }}>❤️</span>
        <span style={{
          fontFamily: 'Inter, sans-serif', fontSize: 38, fontWeight: 900, color: '#111',
        }}>LIKE</span>
      </div>

      <div style={{
        position: 'absolute',
        right: 140, top: 1450,
        transform: `translateY(${Math.cos(localT * 3) * 16}px) scale(${scale})`,
        opacity,
        background: '#fff',
        padding: '20px 30px',
        borderRadius: 50,
        display: 'flex', alignItems: 'center', gap: 14,
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        border: '4px solid #2196F3',
      }}>
        <span style={{ fontSize: 56 }}>💬</span>
        <span style={{
          fontFamily: 'Inter, sans-serif', fontSize: 38, fontWeight: 900, color: '#111',
        }}>COMMENTE</span>
      </div>
    </AbsoluteFill>
  );
};
