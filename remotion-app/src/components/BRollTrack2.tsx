import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Easing, random } from 'remotion';
import React from 'react';
import { BROLLS2, BROLL2_TRANSITION as TRANSITION } from '../brolls2';

const GFPS = 30;

export const BRollTrack2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const active = BROLLS2.find(
    (b) => t >= b.start - TRANSITION && t <= b.start + b.duration + TRANSITION,
  );
  if (!active) return null;

  const enter = interpolate(t, [active.start - TRANSITION, active.start], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
  });
  const exit = interpolate(
    t, [active.start + active.duration, active.start + active.duration + TRANSITION], [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic) },
  );
  const translateX = interpolate(enter, [0, 1], [1080, 0]) + interpolate(exit, [0, 1], [0, -1080]);

  const localT = t - active.start;

  return (
    <AbsoluteFill style={{ transform: `translateX(${translateX}px)`, pointerEvents: 'none' }}>
      {active.kind === 'videogen' && <VideoGenBRoll t={localT} />}
      {active.kind === 'voiceedit' && <VoiceEditBRoll t={localT} />}
      {active.kind === 'gemini_ui' && <GeminiUIBRoll t={localT} />}
      {active.kind === 'ai_search' && <AISearchBRoll t={localT} />}
      {active.kind === 'ai_worker' && <AIWorkerBRoll t={localT} />}
    </AbsoluteFill>
  );
};

// ============== VIDEO GEN (multi-source → video) ==============
const VideoGenBRoll: React.FC<{ t: number }> = ({ t }) => {
  const sources = [
    { icon: '📝', label: 'TEXTE', color: '#4285F4', x: 200, y: 700, appearAt: 0.1 },
    { icon: '🖼️', label: 'IMAGE', color: '#EA4335', x: 880, y: 700, appearAt: 0.4 },
    { icon: '🎥', label: 'VIDÉO', color: '#34A853', x: 200, y: 1100, appearAt: 0.7 },
    { icon: '💡', label: 'IDÉE',  color: '#FBBC04', x: 880, y: 1100, appearAt: 1.0 },
  ];

  const outputAt = 1.6;
  const outputAge = (t - outputAt) * GFPS;
  const outSp = spring({ frame: Math.max(0, outputAge), fps: GFPS, config: { damping: 11, stiffness: 160, mass: 0.6 } });

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, #0a0a1f 0%, #1a103d 100%)' }}>
      {/* Title */}
      <div style={{
        position: 'absolute', top: 100, left: 0, right: 0, textAlign: 'center',
        fontFamily: 'Inter, sans-serif', fontSize: 56, fontWeight: 900, color: '#fff',
        textTransform: 'uppercase', letterSpacing: 1,
        textShadow: '0 0 24px #4285F4',
      }}>
        TOUT → VIDÉO
      </div>

      {/* Connecting lines to center */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        {sources.map((s) => {
          const visible = interpolate(t, [s.appearAt + 0.25, s.appearAt + 0.65], [0, 1], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          });
          const flowPhase = (t * 1.5) % 1;
          return (
            <React.Fragment key={s.label}>
              <line x1={s.x} y1={s.y} x2={540} y2={900}
                stroke={s.color} strokeWidth={4} opacity={visible * 0.7}
                strokeDasharray="12 8" />
              {visible > 0.4 && (
                <circle
                  cx={s.x + (540 - s.x) * flowPhase}
                  cy={s.y + (900 - s.y) * flowPhase}
                  r={9} fill={s.color} opacity={visible}
                />
              )}
            </React.Fragment>
          );
        })}
      </svg>

      {/* Source boxes */}
      {sources.map((s) => {
        const age = (t - s.appearAt) * GFPS;
        const sp = spring({ frame: Math.max(0, age), fps: GFPS, config: { damping: 11, stiffness: 200, mass: 0.5 } });
        const scale = interpolate(sp, [0, 0.6, 1], [0, 1.2, 1]);
        const opacity = interpolate(sp, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' });
        return (
          <div key={s.label} style={{
            position: 'absolute', left: s.x, top: s.y,
            transform: `translate(-50%, -50%) scale(${scale})`,
            opacity,
            background: '#fff', borderRadius: 20,
            padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 14,
            border: `5px solid ${s.color}`,
            boxShadow: `0 10px 28px ${s.color}aa`,
          }}>
            <span style={{ fontSize: 56 }}>{s.icon}</span>
            <span style={{
              fontFamily: 'Inter, sans-serif', fontSize: 32, fontWeight: 900, color: '#111',
              letterSpacing: 1,
            }}>{s.label}</span>
          </div>
        );
      })}

      {/* Output: a styled video frame */}
      <div style={{
        position: 'absolute', left: 540, top: 900,
        transform: `translate(-50%, -50%) scale(${interpolate(outSp, [0, 0.6, 1], [0, 1.25, 1])})`,
        opacity: interpolate(outSp, [0, 0.5], [0, 1], { extrapolateRight: 'clamp' }),
      }}>
        <div style={{
          width: 360, height: 200,
          borderRadius: 22, background: 'linear-gradient(135deg, #1E88E5, #8E54E9, #FF6B9D)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '6px solid #fff',
          boxShadow: '0 20px 60px rgba(142,84,233,0.6), 0 0 100px rgba(30,136,229,0.4)',
        }}>
          <span style={{ fontSize: 110, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))' }}>🎬</span>
        </div>
        <div style={{
          textAlign: 'center', marginTop: 16,
          fontFamily: 'Inter, sans-serif', fontSize: 44, fontWeight: 900, color: '#fff',
          textShadow: '0 0 20px #fff', letterSpacing: 2, textTransform: 'uppercase',
        }}>
          Vidéo IA
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ============== VOICE EDIT (mic → timeline modifications) ==============
const VoiceEditBRoll: React.FC<{ t: number }> = ({ t }) => {
  // Mic with pulsing audio waves
  const wavePhase = t * 3;
  const waves = [0, 1, 2].map((i) => ({
    r: 120 + i * 80 + Math.sin(wavePhase + i) * 12,
    o: 0.5 - i * 0.15,
  }));

  // Commands (spoken voice prompts)
  const commands = [
    { text: '"Coupe le silence"',     appearAt: 0.4, color: '#FF6B9D' },
    { text: '"Ajoute des sous-titres"', appearAt: 1.3, color: '#FFB400' },
    { text: '"Mets de la musique"',   appearAt: 2.2, color: '#00E5FF' },
  ];

  return (
    <AbsoluteFill style={{ background: 'radial-gradient(circle at center, #1a0d3e 0%, #06091e 70%)' }}>
      {/* Title */}
      <div style={{
        position: 'absolute', top: 100, left: 0, right: 0, textAlign: 'center',
        fontFamily: 'Inter, sans-serif', fontSize: 52, fontWeight: 900, color: '#fff',
        textTransform: 'uppercase', letterSpacing: 2,
        textShadow: '0 0 24px #FF6B9D',
      }}>
        MONTAGE À LA VOIX
      </div>

      {/* Animated voice waves */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        {waves.map((w, i) => (
          <circle key={i} cx={540} cy={550} r={w.r} fill="none"
            stroke="#FF6B9D" strokeWidth={4} opacity={w.o} />
        ))}
      </svg>

      {/* Mic at center */}
      <div style={{
        position: 'absolute', left: 540, top: 550, transform: 'translate(-50%, -50%)',
        width: 180, height: 180, borderRadius: '50%',
        background: 'radial-gradient(circle, #FF6B9D 0%, #C2185B 70%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 60px #FF6B9D, inset 0 -8px 0 rgba(0,0,0,0.2)',
        border: '5px solid #fff',
      }}>
        <span style={{ fontSize: 110 }}>🎙️</span>
      </div>

      {/* Spoken commands as floating chat-style bubbles */}
      {commands.map((c, i) => {
        const age = (t - c.appearAt) * GFPS;
        const sp = spring({ frame: Math.max(0, age), fps: GFPS, config: { damping: 11, stiffness: 200, mass: 0.5 } });
        const opacity = interpolate(sp, [0, 0.5], [0, 1], { extrapolateRight: 'clamp' });
        const slide = interpolate(sp, [0, 1], [60, 0]);
        const y = 950 + i * 130;
        return (
          <div key={i} style={{
            position: 'absolute', left: 80, top: y,
            transform: `translateX(${slide}px)`, opacity,
            background: '#fff', padding: '20px 32px', borderRadius: 50,
            display: 'flex', alignItems: 'center', gap: 18,
            border: `4px solid ${c.color}`,
            boxShadow: `0 10px 30px ${c.color}aa`,
            maxWidth: 920,
          }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32, flexShrink: 0,
            }}>🗣️</div>
            <span style={{
              fontFamily: 'Inter, sans-serif', fontSize: 38, fontWeight: 800, color: '#111',
              fontStyle: 'italic',
            }}>{c.text}</span>
          </div>
        );
      })}

      {/* Result indicator */}
      {t > 3.2 && (
        <div style={{
          position: 'absolute', left: 540, top: 1500, transform: 'translate(-50%, -50%)',
          opacity: interpolate(t, [3.2, 3.7], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
          background: '#00E676', padding: '18px 36px', borderRadius: 60,
          display: 'flex', alignItems: 'center', gap: 14,
          boxShadow: '0 12px 30px rgba(0,230,118,0.7)',
          border: '4px solid #fff',
        }}>
          <span style={{ fontSize: 48 }}>✨</span>
          <span style={{
            fontFamily: 'Inter, sans-serif', fontSize: 40, fontWeight: 900, color: '#fff',
            textTransform: 'uppercase', letterSpacing: 1,
            textShadow: '0 2px 0 rgba(0,0,0,0.3)',
          }}>VIDÉO MODIFIÉE</span>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ============== GEMINI UI MOCK ==============
const GeminiUIBRoll: React.FC<{ t: number }> = ({ t }) => {
  // Animated sparkle dots around the prompt box
  const sparkles = Array.from({ length: 8 }).map((_, i) => {
    const angle = (i / 8) * Math.PI * 2 + t;
    return {
      x: 540 + Math.cos(angle) * 380,
      y: 800 + Math.sin(angle) * 220,
      hue: (i * 45 + t * 30) % 360,
    };
  });

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, #1a0033 0%, #06091e 70%)' }}>
      {/* Top bar with logo */}
      <div style={{
        position: 'absolute', top: 100, left: 0, right: 0,
        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20,
      }}>
        <div style={{
          width: 70, height: 70,
          background: 'conic-gradient(from 0deg, #4285F4, #8E54E9, #FF6B9D, #FBBC04, #4285F4)',
          borderRadius: '50%',
          boxShadow: '0 0 28px #8E54E9',
        }} />
        <span style={{
          fontFamily: 'Inter, sans-serif', fontSize: 64, fontWeight: 900, color: '#fff',
          letterSpacing: -1,
          background: 'linear-gradient(90deg, #4285F4, #8E54E9, #FF6B9D)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>Gemini</span>
      </div>

      {/* Floating sparkles */}
      {sparkles.map((s, i) => (
        <div key={i} style={{
          position: 'absolute', left: s.x, top: s.y,
          width: 20, height: 20, borderRadius: '50%',
          background: `hsl(${s.hue}, 95%, 65%)`,
          boxShadow: `0 0 28px hsl(${s.hue}, 95%, 70%)`,
          transform: 'translate(-50%, -50%)',
          opacity: 0.85,
        }} />
      ))}

      {/* Big prompt input mock */}
      {(() => {
        const sp = spring({ frame: Math.max(0, t * GFPS), fps: GFPS, config: { damping: 11, stiffness: 140, mass: 0.6 } });
        const scale = interpolate(sp, [0, 0.6, 1], [0.5, 1.05, 1]);
        const opacity = interpolate(sp, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' });
        return (
          <div style={{
            position: 'absolute', left: 60, right: 60, top: 720,
            transform: `scale(${scale})`, opacity,
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(10px)',
            border: '4px solid rgba(142,84,233,0.6)',
            borderRadius: 32,
            padding: 36,
            boxShadow: '0 16px 60px rgba(142,84,233,0.4), 0 0 100px rgba(66,133,244,0.2)',
          }}>
            <div style={{
              fontFamily: 'Inter, sans-serif', fontSize: 32, fontWeight: 600,
              color: 'rgba(255,255,255,0.6)', marginBottom: 18,
            }}>Demande à Gemini…</div>
            {t > 0.6 && (
              <div style={{
                fontFamily: 'Inter, sans-serif', fontSize: 44, fontWeight: 700,
                color: '#fff', lineHeight: 1.3,
                opacity: interpolate(t, [0.6, 1.2], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }),
              }}>
                "Crée-moi une vidéo sur l'IA"
                <span style={{
                  display: 'inline-block', width: 4, height: 44, background: '#8E54E9',
                  marginLeft: 6, verticalAlign: 'middle',
                  opacity: Math.sin(t * 8) > 0 ? 1 : 0,
                }} />
              </div>
            )}
          </div>
        );
      })()}

      {/* Sparkle "Generate" button */}
      {(() => {
        const sp = spring({ frame: Math.max(0, (t - 1.4) * GFPS), fps: GFPS, config: { damping: 11, stiffness: 200 } });
        const scale = interpolate(sp, [0, 0.6, 1], [0, 1.2, 1]);
        const opacity = interpolate(sp, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' });
        const pulse = 1 + Math.sin(t * 5) * 0.05;
        return (
          <div style={{
            position: 'absolute', left: '50%', top: 1280,
            transform: `translate(-50%, 0) scale(${scale * pulse})`,
            opacity,
            background: 'linear-gradient(90deg, #4285F4, #8E54E9, #FF6B9D)',
            padding: '24px 60px', borderRadius: 50,
            display: 'flex', alignItems: 'center', gap: 18,
            boxShadow: '0 16px 50px rgba(142,84,233,0.7)',
          }}>
            <span style={{ fontSize: 52 }}>✨</span>
            <span style={{
              fontFamily: 'Inter, sans-serif', fontSize: 50, fontWeight: 900, color: '#fff',
              letterSpacing: 1, textTransform: 'uppercase',
              textShadow: '0 3px 0 rgba(0,0,0,0.25)',
            }}>Générer</span>
          </div>
        );
      })()}
    </AbsoluteFill>
  );
};

// ============== AI SEARCH (browser with AI results) ==============
const AISearchBRoll: React.FC<{ t: number }> = ({ t }) => {
  const results = [
    { title: 'Réponse IA générée',  color: '#34A853', appearAt: 0.4 },
    { title: 'Synthèse intelligente', color: '#4285F4', appearAt: 0.9 },
    { title: 'Sources vérifiées',    color: '#FBBC04', appearAt: 1.4 },
  ];

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f0f4f8 100%)' }}>
      {/* Browser top bar */}
      <div style={{
        position: 'absolute', top: 100, left: 60, right: 60,
        background: '#fff', borderRadius: 24, padding: 24,
        boxShadow: '0 14px 38px rgba(0,0,0,0.18)',
        border: '3px solid #e0e0e0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#FF6259' }} />
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#FFBD2D' }} />
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#28C940' }} />
          </div>
          <div style={{
            flex: 1, background: '#f5f5f7', borderRadius: 16,
            padding: '14px 22px', fontFamily: 'Inter, sans-serif', fontSize: 28, color: '#333',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <span style={{ color: '#34A853', fontSize: 32 }}>✨</span>
            comment fonctionne l'IA ?
          </div>
        </div>
      </div>

      {/* AI banner */}
      {(() => {
        const sp = spring({ frame: Math.max(0, t * GFPS), fps: GFPS, config: { damping: 12, stiffness: 180, mass: 0.5 } });
        const opacity = interpolate(sp, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' });
        const slide = interpolate(sp, [0, 1], [-60, 0]);
        return (
          <div style={{
            position: 'absolute', top: 360, left: 60, right: 60,
            transform: `translateX(${slide}px)`, opacity,
            background: 'linear-gradient(90deg, #4285F4, #34A853, #FBBC04, #EA4335)',
            padding: '4px', borderRadius: 22,
          }}>
            <div style={{
              background: '#fff', borderRadius: 18, padding: '24px 30px',
              display: 'flex', alignItems: 'center', gap: 18,
            }}>
              <span style={{ fontSize: 56 }}>✨</span>
              <span style={{
                fontFamily: 'Inter, sans-serif', fontSize: 36, fontWeight: 900, color: '#111',
                letterSpacing: -0.5,
              }}>
                Boosté par l'IA
              </span>
            </div>
          </div>
        );
      })()}

      {/* Results list */}
      {results.map((r, i) => {
        const age = (t - r.appearAt) * GFPS;
        const sp = spring({ frame: Math.max(0, age), fps: GFPS, config: { damping: 11, stiffness: 200, mass: 0.5 } });
        const opacity = interpolate(sp, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' });
        const slide = interpolate(sp, [0, 1], [80, 0]);
        return (
          <div key={i} style={{
            position: 'absolute', top: 580 + i * 250, left: 60, right: 60,
            transform: `translateX(${slide}px)`, opacity,
            background: '#fff', padding: 36, borderRadius: 22,
            borderLeft: `10px solid ${r.color}`,
            boxShadow: '0 10px 28px rgba(0,0,0,0.12)',
          }}>
            <div style={{
              fontFamily: 'Inter, sans-serif', fontSize: 36, fontWeight: 900, color: '#1a73e8',
              marginBottom: 10,
            }}>{r.title}</div>
            <div style={{ height: 12, background: '#e0e0e0', borderRadius: 6, marginBottom: 10, width: '95%' }} />
            <div style={{ height: 12, background: '#e0e0e0', borderRadius: 6, marginBottom: 10, width: '85%' }} />
            <div style={{ height: 12, background: '#e0e0e0', borderRadius: 6, width: '70%' }} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ============== AI WORKER (agent doing tasks) ==============
const AIWorkerBRoll: React.FC<{ t: number }> = ({ t }) => {
  const tasks = [
    { icon: '📊', label: 'Analyse données',   appearAt: 0.3, color: '#4285F4' },
    { icon: '✉️',  label: 'Répond aux mails', appearAt: 0.9, color: '#EA4335' },
    { icon: '📝', label: 'Rédige documents',  appearAt: 1.5, color: '#FBBC04' },
    { icon: '⚙️',  label: 'Automatise tâches', appearAt: 2.1, color: '#34A853' },
  ];

  // Spinning gears in bg
  const gear = (t * 60) % 360;

  return (
    <AbsoluteFill style={{ background: 'radial-gradient(circle at top, #1f0d3a 0%, #06091e 70%)' }}>
      {/* Title */}
      <div style={{
        position: 'absolute', top: 100, left: 0, right: 0, textAlign: 'center',
        fontFamily: 'Inter, sans-serif', fontSize: 52, fontWeight: 900, color: '#fff',
        textTransform: 'uppercase', letterSpacing: 2,
        textShadow: '0 0 28px #00E5FF',
      }}>
        L'IA TRAVAILLE POUR TOI
      </div>

      {/* Robot worker */}
      {(() => {
        const sp = spring({ frame: Math.max(0, t * GFPS), fps: GFPS, config: { damping: 11, stiffness: 160, mass: 0.6 } });
        const scale = interpolate(sp, [0, 0.6, 1], [0.5, 1.1, 1]);
        const opacity = interpolate(sp, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' });
        const bob = Math.sin(t * 2) * 12;
        return (
          <div style={{
            position: 'absolute', left: 540, top: 480 + bob,
            transform: `translate(-50%, -50%) scale(${scale})`,
            opacity,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 220, height: 220, borderRadius: 40,
              background: 'linear-gradient(135deg, #00E5FF, #4D6BFE)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 140,
              boxShadow: '0 0 60px #00E5FF',
              border: '6px solid #fff',
            }}>🤖</div>
            <div style={{
              fontFamily: 'Inter, sans-serif', fontSize: 32, fontWeight: 900, color: '#00E5FF',
              textShadow: '0 0 14px #00E5FF', letterSpacing: 2, textTransform: 'uppercase',
            }}>Agent IA</div>
          </div>
        );
      })()}

      {/* Spinning gears (decorative) */}
      <div style={{
        position: 'absolute', right: 80, top: 380, fontSize: 100,
        opacity: 0.25, transform: `rotate(${gear}deg)`,
      }}>⚙️</div>
      <div style={{
        position: 'absolute', left: 80, top: 410, fontSize: 70,
        opacity: 0.25, transform: `rotate(${-gear * 1.5}deg)`,
      }}>⚙️</div>

      {/* Task list */}
      <div style={{
        position: 'absolute', bottom: 200, left: 60, right: 60,
        display: 'flex', flexDirection: 'column', gap: 18,
      }}>
        {tasks.map((task, i) => {
          const age = (t - task.appearAt) * GFPS;
          const sp = spring({ frame: Math.max(0, age), fps: GFPS, config: { damping: 12, stiffness: 220, mass: 0.5 } });
          const slide = interpolate(sp, [0, 1], [-200, 0]);
          const opacity = interpolate(sp, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' });
          // Check mark appears 0.4s after task appears
          const checkAge = (t - task.appearAt - 0.4) * GFPS;
          const checkSp = spring({ frame: Math.max(0, checkAge), fps: GFPS, config: { damping: 10, stiffness: 240 } });
          const checkScale = interpolate(checkSp, [0, 0.6, 1], [0, 1.4, 1]);
          const checkOpacity = interpolate(checkSp, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' });
          return (
            <div key={i} style={{
              transform: `translateX(${slide}px)`, opacity,
              background: '#fff', padding: '18px 28px', borderRadius: 22,
              display: 'flex', alignItems: 'center', gap: 20,
              border: `4px solid ${task.color}`,
              boxShadow: `0 10px 28px ${task.color}aa`,
            }}>
              <span style={{ fontSize: 52 }}>{task.icon}</span>
              <span style={{
                fontFamily: 'Inter, sans-serif', fontSize: 36, fontWeight: 900, color: '#111',
                letterSpacing: -0.3, flex: 1,
              }}>{task.label}</span>
              <span style={{
                fontSize: 56, opacity: checkOpacity,
                transform: `scale(${checkScale})`,
                color: '#00E676', filter: 'drop-shadow(0 0 14px #00E676)',
              }}>✓</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
