// Single source of truth for B-roll windows. Used by BRollTrack to render,
// and by CaptionTrack/badges to know when to hide themselves.

export type BRollKind = 'ladder' | 'chat' | 'workflow' | 'brain' | 'orchestrator';

export type BRoll = {
  kind: BRollKind;
  start: number;
  duration: number;
};

export const BROLLS: BRoll[] = [
  { kind: 'ladder',       start: 10.5,  duration: 4.0 },
  { kind: 'chat',         start: 50.0,  duration: 3.5 },
  { kind: 'workflow',     start: 72.5,  duration: 4.5 },
  { kind: 'brain',        start: 96.0,  duration: 4.0 },
  { kind: 'orchestrator', start: 128.0, duration: 4.0 },
];

export const BROLL_TRANSITION = 0.35;

export const isInBRoll = (t: number): boolean => {
  return BROLLS.some(
    (b) => t >= b.start - BROLL_TRANSITION && t <= b.start + b.duration + BROLL_TRANSITION,
  );
};

// Full-screen subscribe CTA window: hide captions to keep button readable
export const FULL_CTA_START = 159.3;
export const FULL_CTA_END = 166.2;

export const isInFullCTA = (t: number): boolean => {
  return t >= FULL_CTA_START - 0.2 && t <= FULL_CTA_END + 0.2;
};
