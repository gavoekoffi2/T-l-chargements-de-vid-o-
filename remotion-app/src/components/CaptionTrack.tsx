import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import React from 'react';
import captions from '../captions.json';
import { isInBRoll, isInFullCTA } from '../brolls';

type Word = { text: string; start: number; end: number; highlight: boolean };
type Group = { text: string; start: number; end: number; words: Word[]; hasHighlight: boolean };

const HIGHLIGHT_COLORS = ['#FFEB3B', '#FF3CAC', '#00E5FF', '#A8FF35'];

const pickColor = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return HIGHLIGHT_COLORS[h % HIGHLIGHT_COLORS.length];
};

export const CaptionTrack: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const groups = captions as Group[];

  // Show only the group currently active (with a tiny lead-in / hold-out)
  const LEAD = 0.05;
  const TAIL = 0.05;
  const active = groups.find(
    (g) => t >= g.start - LEAD && t <= g.end + TAIL,
  );

  if (!active) return null;

  // Hide captions during B-roll cutaways or full subscribe CTA
  if (isInBRoll(t) || isInFullCTA(t)) return null;

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 380,
        pointerEvents: 'none',
      }}
    >
      <CaptionGroup group={active} t={t} fps={fps} frame={frame} />
    </AbsoluteFill>
  );
};

const CaptionGroup: React.FC<{ group: Group; t: number; fps: number; frame: number }> = ({
  group,
  t,
  fps,
  frame,
}) => {
  // Group enter spring (very snappy)
  const groupAge = (t - group.start) * fps; // frames since start
  const inSpring = spring({
    frame: Math.max(0, groupAge),
    fps,
    config: { damping: 12, stiffness: 220, mass: 0.5 },
  });
  const groupScale = interpolate(inSpring, [0, 1], [0.75, 1]);
  const groupOpacity = interpolate(inSpring, [0, 1], [0, 1]);

  // Fade out near the end
  const timeLeft = group.end - t;
  const fadeOut = interpolate(timeLeft, [0, 0.12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        transform: `scale(${groupScale})`,
        opacity: groupOpacity * fadeOut,
        maxWidth: 980,
        display: 'flex',
        flexWrap: 'wrap',
        gap: '14px 22px',
        justifyContent: 'center',
      }}
    >
      {group.words.map((w, i) => (
        <WordPill key={`${group.start}-${i}`} word={w} t={t} fps={fps} frame={frame} />
      ))}
    </div>
  );
};

const WordPill: React.FC<{ word: Word; t: number; fps: number; frame: number }> = ({
  word,
  t,
  fps,
}) => {
  // Per-word reveal: scale & opacity spring once we reach its start
  const wordAge = (t - word.start) * fps;
  const reveal = spring({
    frame: Math.max(0, wordAge),
    fps,
    config: { damping: 10, stiffness: 240, mass: 0.45 },
  });
  const scale = interpolate(reveal, [0, 1], [0.4, 1]);
  const opacity = interpolate(reveal, [0, 1], [0, 1]);

  // Highlight currently-spoken word with a glow
  const isSpoken = t >= word.start && t <= word.end + 0.08;
  const isHighlight = word.highlight;
  const color = isHighlight ? pickColor(word.text) : '#FFFFFF';

  return (
    <span
      style={{
        display: 'inline-block',
        fontFamily: 'Inter, "SF Pro Display", system-ui, sans-serif',
        fontWeight: 900,
        fontSize: isHighlight ? 96 : 88,
        lineHeight: 1,
        color,
        textTransform: 'uppercase',
        letterSpacing: -1,
        WebkitTextStroke: '4px #000',
        paintOrder: 'stroke fill',
        textShadow: isSpoken
          ? `0 0 24px ${color}, 0 6px 0 #000`
          : '0 6px 0 #000',
        transform: `scale(${scale}) translateY(${isSpoken ? -6 : 0}px)`,
        transformOrigin: '50% 100%',
        opacity,
        transition: 'transform 80ms ease-out',
      }}
    >
      {word.text}
    </span>
  );
};
