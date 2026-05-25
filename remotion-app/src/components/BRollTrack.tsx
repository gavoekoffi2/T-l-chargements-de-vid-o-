import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Easing, random } from 'remotion';
import React from 'react';
import { FPS } from '../constants';
import { BROLLS, BROLL_TRANSITION as TRANSITION } from '../brolls';

export const BRollTrack: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const active = BROLLS.find((b) => t >= b.start - TRANSITION && t <= b.start + b.duration + TRANSITION);
  if (!active) return null;

  // slide-in from right, slide-out to left
  const enterProgress = interpolate(t, [active.start - TRANSITION, active.start], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
  });
  const exitProgress = interpolate(t, [active.start + active.duration, active.start + active.duration + TRANSITION], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic),
  });
  const translateX = interpolate(enterProgress, [0, 1], [1080, 0]) + interpolate(exitProgress, [0, 1], [0, -1080]);

  const localT = t - active.start; // seconds since b-roll start

  return (
    <AbsoluteFill style={{ transform: `translateX(${translateX}px)`, pointerEvents: 'none' }}>
      {active.kind === 'ladder' && <LadderBRoll t={localT} duration={active.duration} />}
      {active.kind === 'chat' && <ChatBubblesBRoll t={localT} duration={active.duration} />}
      {active.kind === 'workflow' && <WorkflowBRoll t={localT} duration={active.duration} />}
      {active.kind === 'brain' && <BrainBRoll t={localT} duration={active.duration} />}
      {active.kind === 'orchestrator' && <OrchestratorBRoll t={localT} duration={active.duration} />}
    </AbsoluteFill>
  );
};

// ============== LADDER (4 levels of AI) ==============
const LadderBRoll: React.FC<{ t: number; duration: number }> = ({ t }) => {
  const steps = [
    { level: 1, label: 'CHATBOTS',         color: '#FF3CAC', appearAt: 0.2 },
    { level: 2, label: 'AUTOMATISATIONS',  color: '#FFB400', appearAt: 0.7 },
    { level: 3, label: 'AGENTS IA',        color: '#00E5FF', appearAt: 1.2 },
    { level: 4, label: 'ORCHESTRATEURS',   color: '#A8FF35', appearAt: 1.7 },
  ];

  return (
    <AbsoluteFill style={{
      background: 'linear-gradient(180deg, #0a0a1f 0%, #1a0a2e 100%)',
      justifyContent: 'flex-end',
      paddingBottom: 200,
    }}>
      {/* Title */}
      <div style={{
        position: 'absolute',
        top: 160,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 70,
        fontWeight: 900,
        color: '#fff',
        textTransform: 'uppercase',
        letterSpacing: -1,
        WebkitTextStroke: '3px #000',
        paintOrder: 'stroke fill',
        textShadow: '0 0 40px #ff3cac',
      }}>
        Les 4 niveaux de l'IA
      </div>

      {/* Ascending steps */}
      <div style={{
        display: 'flex',
        flexDirection: 'column-reverse',
        alignItems: 'flex-start',
        gap: 22,
        paddingLeft: 80,
      }}>
        {steps.map((s, i) => {
          const visible = t >= s.appearAt ? 1 : 0;
          const age = (t - s.appearAt) * FPS;
          const sp = spring({ frame: Math.max(0, age), fps: FPS, config: { damping: 10, stiffness: 180, mass: 0.6 } });
          const slide = interpolate(sp, [0, 1], [-600, 0]);
          const scale = interpolate(sp, [0, 0.6, 1], [0.4, 1.1, 1]);
          const opacity = interpolate(sp, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' }) * visible;

          // Width grows with level (staircase)
          const w = 380 + i * 120;

          return (
            <div key={s.level}
              style={{
                transform: `translateX(${slide}px) scale(${scale})`,
                opacity,
                width: w,
                height: 120,
                background: s.color,
                borderRadius: 18,
                display: 'flex',
                alignItems: 'center',
                gap: 22,
                paddingLeft: 28,
                boxShadow: `0 14px 40px ${s.color}cc, inset 0 -8px 0 rgba(0,0,0,0.18)`,
                border: '4px solid #000',
              }}>
              <div style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 96,
                fontWeight: 900,
                color: '#000',
                lineHeight: 0.85,
              }}>{s.level}</div>
              <div style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 36,
                fontWeight: 900,
                color: '#000',
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}>{s.label}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ============== CHAT BUBBLES ==============
const ChatBubblesBRoll: React.FC<{ t: number; duration: number }> = ({ t }) => {
  const bubbles = [
    { side: 'right' as const, text: 'Salut, comment ça va ?', appearAt: 0.15, color: '#10A37F' },
    { side: 'left' as const,  text: 'Très bien ! En quoi puis-je t\'aider ?', appearAt: 0.9, color: '#1a1a2e' },
    { side: 'right' as const, text: 'Explique-moi l\'IA en 1 phrase', appearAt: 1.7, color: '#10A37F' },
    { side: 'left' as const,  text: 'L\'IA simule l\'intelligence humaine pour résoudre des problèmes.', appearAt: 2.4, color: '#1a1a2e' },
  ];

  return (
    <AbsoluteFill style={{
      background: 'linear-gradient(180deg, #ffffff 0%, #f0f4f8 100%)',
      padding: '180px 60px 80px',
    }}>
      {/* Chat header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        marginBottom: 36,
        paddingBottom: 22,
        borderBottom: '3px solid #10A37F',
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: 20,
          background: '#10A37F',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Inter, sans-serif', fontSize: 44, fontWeight: 900, color: '#fff',
        }}>AI</div>
        <div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 42, fontWeight: 800, color: '#111' }}>Chatbot IA</div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 24, color: '#10A37F', fontWeight: 700 }}>● En ligne</div>
        </div>
      </div>

      {bubbles.map((b, i) => {
        const age = (t - b.appearAt) * FPS;
        const sp = spring({ frame: Math.max(0, age), fps: FPS, config: { damping: 12, stiffness: 200, mass: 0.5 } });
        const scale = interpolate(sp, [0, 1], [0.6, 1]);
        const opacity = interpolate(sp, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' });
        const translateY = interpolate(sp, [0, 1], [40, 0]);
        return (
          <div key={i} style={{
            display: 'flex',
            justifyContent: b.side === 'right' ? 'flex-end' : 'flex-start',
            marginBottom: 24,
            opacity,
            transform: `translateY(${translateY}px) scale(${scale})`,
            transformOrigin: b.side === 'right' ? 'bottom right' : 'bottom left',
          }}>
            <div style={{
              maxWidth: 760,
              background: b.color,
              color: '#fff',
              padding: '24px 32px',
              borderRadius: 28,
              borderBottomRightRadius: b.side === 'right' ? 6 : 28,
              borderBottomLeftRadius: b.side === 'left' ? 6 : 28,
              fontFamily: 'Inter, sans-serif',
              fontSize: 38,
              fontWeight: 600,
              lineHeight: 1.3,
              boxShadow: '0 10px 32px rgba(0,0,0,0.18)',
            }}>{b.text}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ============== WORKFLOW NODES (n8n-like) ==============
const WorkflowBRoll: React.FC<{ t: number; duration: number }> = ({ t }) => {
  const nodes = [
    { id: 'mail',  icon: '✉️', label: 'Email reçu',     x: 540, y: 460,  color: '#EA4B71', appearAt: 0.15 },
    { id: 'check', icon: '🔍', label: 'Pièce jointe ?', x: 540, y: 800,  color: '#FFB400', appearAt: 0.9 },
    { id: 'drive', icon: '📁', label: 'Google Drive',   x: 540, y: 1140, color: '#4285F4', appearAt: 1.7 },
    { id: 'ok',    icon: '✅', label: 'Classé',         x: 540, y: 1480, color: '#00E676', appearAt: 2.5 },
  ];

  return (
    <AbsoluteFill style={{
      background: 'linear-gradient(180deg, #06091e 0%, #1a103d 100%)',
    }}>
      {/* Title */}
      <div style={{
        position: 'absolute', top: 110, left: 0, right: 0,
        textAlign: 'center',
        fontFamily: 'Inter, sans-serif', fontSize: 56, fontWeight: 900,
        color: '#fff', textTransform: 'uppercase', letterSpacing: 1,
        textShadow: '0 0 24px #ea4b71',
      }}>
        AUTOMATISATION
      </div>

      {/* Connecting lines */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        {nodes.slice(0, -1).map((n, i) => {
          const next = nodes[i + 1];
          const lineAge = (t - (n.appearAt + 0.35)) * FPS;
          const lineProgress = interpolate(spring({ frame: Math.max(0, lineAge), fps: FPS, config: { damping: 15, stiffness: 100 } }), [0, 1], [0, 1]);
          const length = next.y - n.y;
          const drawn = length * lineProgress;
          return (
            <line key={n.id}
              x1={n.x} y1={n.y + 90}
              x2={n.x} y2={n.y + 90 + drawn}
              stroke="#fff" strokeWidth={6} strokeDasharray="14 10"
              opacity={lineProgress > 0 ? 0.85 : 0}
            />
          );
        })}
      </svg>

      {nodes.map((n) => {
        const age = (t - n.appearAt) * FPS;
        const sp = spring({ frame: Math.max(0, age), fps: FPS, config: { damping: 11, stiffness: 200, mass: 0.5 } });
        const scale = interpolate(sp, [0, 0.6, 1], [0.3, 1.15, 1]);
        const opacity = interpolate(sp, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' });
        return (
          <div key={n.id} style={{
            position: 'absolute',
            left: n.x, top: n.y,
            transform: `translate(-50%, -50%) scale(${scale})`,
            opacity,
            display: 'flex', alignItems: 'center', gap: 20,
            background: '#fff',
            padding: '20px 30px',
            borderRadius: 24,
            border: `5px solid ${n.color}`,
            boxShadow: `0 12px 32px ${n.color}aa, 0 0 60px ${n.color}55`,
          }}>
            <div style={{ fontSize: 76 }}>{n.icon}</div>
            <div style={{
              fontFamily: 'Inter, sans-serif', fontSize: 38, fontWeight: 800,
              color: '#111', letterSpacing: -0.3,
            }}>{n.label}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ============== BRAIN + ACTIONS (Agent IA) ==============
const BrainBRoll: React.FC<{ t: number; duration: number }> = ({ t }) => {
  const actions = [
    { icon: '🧠', label: 'RÉFLÉCHIT',  appearAt: 0.2,  angle: -90 },
    { icon: '💾', label: 'MÉMOIRE',    appearAt: 0.9,  angle: 30 },
    { icon: '⚡', label: 'EXÉCUTE',    appearAt: 1.6,  angle: 150 },
    { icon: '🎯', label: 'RÉSULTAT',   appearAt: 2.3,  angle: -30 },
  ];

  return (
    <AbsoluteFill style={{
      background: 'radial-gradient(circle at center, #1a0a3e 0%, #06091e 70%)',
    }}>
      {/* Title */}
      <div style={{
        position: 'absolute', top: 110, left: 0, right: 0,
        textAlign: 'center',
        fontFamily: 'Inter, sans-serif', fontSize: 56, fontWeight: 900,
        color: '#fff', textTransform: 'uppercase', letterSpacing: 1,
        textShadow: '0 0 30px #00e5ff',
      }}>
        AGENT IA
      </div>

      {/* Pulsing core brain */}
      {(() => {
        const pulse = 1 + Math.sin(t * 4) * 0.08;
        return (
          <div style={{
            position: 'absolute',
            left: 540, top: 960,
            transform: `translate(-50%, -50%) scale(${pulse})`,
            width: 280, height: 280,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #00e5ff 0%, #4d6bfe 60%, transparent 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 180,
            filter: 'drop-shadow(0 0 60px #00e5ff)',
          }}>🧠</div>
        );
      })()}

      {/* Orbiting action chips */}
      {actions.map((a) => {
        const age = (t - a.appearAt) * FPS;
        const sp = spring({ frame: Math.max(0, age), fps: FPS, config: { damping: 11, stiffness: 180, mass: 0.6 } });
        const radius = 420;
        const rad = (a.angle * Math.PI) / 180;
        const baseX = 540 + Math.cos(rad) * radius;
        const baseY = 960 + Math.sin(rad) * radius;
        const scale = interpolate(sp, [0, 0.6, 1], [0, 1.2, 1]);
        const opacity = interpolate(sp, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' });

        return (
          <React.Fragment key={a.label}>
            {/* Connecting line */}
            {sp > 0.3 && (
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                <line x1={540} y1={960} x2={baseX} y2={baseY}
                  stroke="#00e5ff" strokeWidth={4} opacity={opacity * 0.7}
                  strokeDasharray="10 6" />
              </svg>
            )}
            <div style={{
              position: 'absolute',
              left: baseX, top: baseY,
              transform: `translate(-50%, -50%) scale(${scale})`,
              opacity,
              background: '#fff',
              padding: '14px 22px',
              borderRadius: 50,
              display: 'flex', alignItems: 'center', gap: 12,
              border: '4px solid #00e5ff',
              boxShadow: '0 6px 24px rgba(0,229,255,0.6)',
            }}>
              <span style={{ fontSize: 42 }}>{a.icon}</span>
              <span style={{
                fontFamily: 'Inter, sans-serif', fontSize: 28, fontWeight: 900, color: '#111',
                letterSpacing: 1, textTransform: 'uppercase',
              }}>{a.label}</span>
            </div>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

// ============== ORCHESTRATOR (multi-agent coordination) ==============
const OrchestratorBRoll: React.FC<{ t: number; duration: number }> = ({ t }) => {
  const subAgents = [
    { x: 220,  y: 1100, color: '#FF3CAC', icon: '✍️',  label: 'Rédacteur' },
    { x: 540,  y: 1280, color: '#FFB400', icon: '🎨',  label: 'Designer' },
    { x: 860,  y: 1100, color: '#00E5FF', icon: '🧮',  label: 'Analyste' },
    { x: 380,  y: 1500, color: '#A8FF35', icon: '🤖',  label: 'Codeur' },
    { x: 700,  y: 1500, color: '#FF6B6B', icon: '🔍',  label: 'Vérif' },
  ];

  return (
    <AbsoluteFill style={{
      background: 'radial-gradient(ellipse at center top, #2a0d4d 0%, #06091e 70%)',
    }}>
      {/* Title */}
      <div style={{
        position: 'absolute', top: 100, left: 0, right: 0,
        textAlign: 'center',
        fontFamily: 'Inter, sans-serif', fontSize: 48, fontWeight: 900,
        color: '#fff', textTransform: 'uppercase', letterSpacing: 2,
        textShadow: '0 0 30px #a8ff35',
      }}>
        ORCHESTRATEUR
      </div>

      {/* Master agent */}
      {(() => {
        const pulse = 1 + Math.sin(t * 3) * 0.06;
        return (
          <div style={{
            position: 'absolute', left: 540, top: 600,
            transform: `translate(-50%, -50%) scale(${pulse})`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 240, height: 240, borderRadius: '50%',
              background: 'radial-gradient(circle, #a8ff35 0%, #5fbb00 70%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 130,
              boxShadow: '0 0 80px #a8ff35, inset 0 0 24px rgba(0,0,0,0.3)',
              border: '6px solid #fff',
            }}>👑</div>
            <div style={{
              fontFamily: 'Inter, sans-serif', fontSize: 36, fontWeight: 900, color: '#a8ff35',
              textShadow: '0 0 14px #a8ff35', letterSpacing: 2, textTransform: 'uppercase',
              marginTop: 8,
            }}>Master IA</div>
          </div>
        );
      })()}

      {/* Connection lines from master to sub-agents */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        {subAgents.map((a, i) => {
          const appearAt = 0.4 + i * 0.25;
          const visible = interpolate(t, [appearAt, appearAt + 0.4], [0, 1], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          });
          // Animate data flow along the line
          const flowPhase = (t * 2) % 1;
          return (
            <React.Fragment key={i}>
              <line x1={540} y1={620} x2={a.x} y2={a.y}
                stroke={a.color} strokeWidth={5} opacity={visible * 0.65}
                strokeDasharray="14 10" />
              {visible > 0.4 && (
                <circle
                  cx={540 + (a.x - 540) * flowPhase}
                  cy={620 + (a.y - 620) * flowPhase}
                  r={10}
                  fill={a.color}
                  opacity={visible}
                />
              )}
            </React.Fragment>
          );
        })}
      </svg>

      {/* Sub-agents */}
      {subAgents.map((a, i) => {
        const appearAt = 0.4 + i * 0.25;
        const age = (t - appearAt) * FPS;
        const sp = spring({ frame: Math.max(0, age), fps: FPS, config: { damping: 12, stiffness: 200, mass: 0.5 } });
        const scale = interpolate(sp, [0, 0.6, 1], [0, 1.2, 1]);
        const opacity = interpolate(sp, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' });
        return (
          <div key={i} style={{
            position: 'absolute',
            left: a.x, top: a.y,
            transform: `translate(-50%, -50%) scale(${scale})`,
            opacity,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          }}>
            <div style={{
              width: 130, height: 130, borderRadius: '50%',
              background: a.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 72,
              border: '5px solid #fff',
              boxShadow: `0 8px 28px ${a.color}cc`,
            }}>{a.icon}</div>
            <div style={{
              fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 800, color: '#fff',
              background: 'rgba(0,0,0,0.65)', padding: '4px 12px', borderRadius: 10,
              letterSpacing: 0.5,
            }}>{a.label}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
