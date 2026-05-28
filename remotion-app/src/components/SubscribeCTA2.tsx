import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, random } from 'remotion';
import React from 'react';
import { FULL_CTA2_START, FULL_CTA2_END } from '../brolls2';

export const SubscribeCTA2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  if (t < FULL_CTA2_START - 0.2 || t > FULL_CTA2_END + 0.3) return null;

  const start = FULL_CTA2_START;
  const duration = FULL_CTA2_END - FULL_CTA2_START;
  const age = (t - start) * fps;
  const sp = spring({ frame: Math.max(0, age), fps, config: { damping: 11, stiffness: 130, mass: 0.7 } });
  const scale = interpolate(sp, [0, 0.7, 1], [0.5, 1.1, 1]);
  const opacity = interpolate(sp, [0, 0.5], [0, 1], { extrapolateRight: 'clamp' });

  const localT = t - start;
  const pulse = 1 + Math.sin(localT * 5) * 0.06;
  const tapPhase = localT % 1.0;
  const tapScale = tapPhase < 0.2 ? 0.78 : 1.0;
  const hue = (localT * 30) % 60;

  const particles = Array.from({ length: 24 });

  return (
    <AbsoluteFill style={{
      pointerEvents: 'none',
      background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.85) 60%, rgba(0,0,0,0.95) 100%)',
    }}>
      <div style={{
        position: 'absolute', top: 280, left: 0, right: 0, textAlign: 'center',
        opacity, transform: `scale(${scale})`,
      }}>
        <div style={{
          fontFamily: 'Inter, sans-serif', fontSize: 96, fontWeight: 900, color: '#FFEB3B',
          WebkitTextStroke: '5px #000', paintOrder: 'stroke fill', letterSpacing: -2,
          textShadow: '0 0 40px #FFEB3B, 0 8px 0 rgba(0,0,0,0.4)', lineHeight: 1,
        }}>
          ABONNE-TOI
        </div>
        <div style={{
          marginTop: 18,
          fontFamily: 'Inter, sans-serif', fontSize: 48, fontWeight: 800, color: '#fff',
          letterSpacing: 1, textShadow: '0 4px 0 rgba(0,0,0,0.6)',
        }}>
          pour ne rien rater sur l'IA
        </div>
      </div>

      {particles.map((_, i) => {
        const angle = random(`p-${i}`) * Math.PI * 2;
        const speed = 600 + random(`s-${i}`) * 400;
        const dist = speed * Math.min(localT * 0.4, 1);
        const x = 540 + Math.cos(angle) * dist;
        const y = 1100 + Math.sin(angle) * dist;
        const sz = 14 + random(`sz-${i}`) * 18;
        const hueP = random(`h-${i}`) * 360;
        const o = Math.max(0, 1 - localT * 0.35);
        return (
          <div key={i} style={{
            position: 'absolute', left: x, top: y,
            width: sz, height: sz, borderRadius: '50%',
            background: `hsl(${hueP}, 95%, 65%)`,
            boxShadow: `0 0 ${sz * 2}px hsl(${hueP}, 95%, 70%)`,
            opacity: o, transform: 'translate(-50%, -50%)',
          }} />
        );
      })}

      <div style={{
        position: 'absolute', left: '50%', top: 1050,
        transform: `translate(-50%, 0) scale(${scale * pulse * tapScale})`,
        opacity,
        background: `hsl(${hue}, 90%, 50%)`,
        padding: '36px 70px', borderRadius: 80, border: '8px solid #fff',
        boxShadow: '0 16px 50px rgba(255,0,0,0.7), 0 0 120px rgba(255,0,0,0.5), inset 0 -8px 0 rgba(0,0,0,0.25)',
        fontFamily: 'Inter, sans-serif', fontSize: 76, fontWeight: 900, color: '#fff',
        textTransform: 'uppercase', letterSpacing: 2,
        textShadow: '0 4px 0 rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', gap: 22,
      }}>
        <span style={{ fontSize: 86 }}>🔔</span>
        S'ABONNER
      </div>

      <div style={{
        position: 'absolute', left: '63%', top: 1250,
        transform: `translateY(${tapPhase < 0.2 ? 30 : 0}px) scale(${tapPhase < 0.2 ? 0.85 : 1})`,
        fontSize: 130, opacity,
        filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.7))',
      }}>👆</div>

      <div style={{
        position: 'absolute', left: 140, top: 1450,
        transform: `translateY(${Math.sin(localT * 3) * 16}px) scale(${scale})`,
        opacity,
        background: '#fff', padding: '20px 30px', borderRadius: 50,
        display: 'flex', alignItems: 'center', gap: 14,
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)', border: '4px solid #FF1744',
      }}>
        <span style={{ fontSize: 56 }}>❤️</span>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 38, fontWeight: 900, color: '#111' }}>LIKE</span>
      </div>

      <div style={{
        position: 'absolute', right: 140, top: 1450,
        transform: `translateY(${Math.cos(localT * 3) * 16}px) scale(${scale})`,
        opacity,
        background: '#fff', padding: '20px 30px', borderRadius: 50,
        display: 'flex', alignItems: 'center', gap: 14,
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)', border: '4px solid #2196F3',
      }}>
        <span style={{ fontSize: 56 }}>💬</span>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 38, fontWeight: 900, color: '#111' }}>PARTAGE</span>
      </div>
    </AbsoluteFill>
  );
};
