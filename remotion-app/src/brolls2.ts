// B-roll windows for the second video (Gemini Harmony reveal).

export type BRoll2Kind =
  | 'videogen'      // multi-source → video output
  | 'voiceedit'     // microphone editing timeline
  | 'gemini_ui'     // mock Gemini chat interface
  | 'ai_search'     // AI-powered browser search results
  | 'ai_worker';    // AI agent doing tasks

export type BRoll2 = {
  kind: BRoll2Kind;
  start: number;
  duration: number;
};

export const BROLLS2: BRoll2[] = [
  { kind: 'videogen',  start: 3.0,  duration: 4.2 },  // "créer vidéo à partir de n'importe quoi"
  { kind: 'voiceedit', start: 24.0, duration: 4.5 },  // "modifier vidéo juste en parlant"
  { kind: 'gemini_ui', start: 43.5, duration: 3.5 },  // "nouvelle interface pour Gemini"
  { kind: 'ai_search', start: 57.0, duration: 3.8 },  // "IA dans la navigation, recherches boostées"
  { kind: 'ai_worker', start: 62.5, duration: 3.8 },  // "IA qui travaille à ta place"
];

export const BROLL2_TRANSITION = 0.35;

export const isInBRoll2 = (t: number): boolean =>
  BROLLS2.some(
    (b) => t >= b.start - BROLL2_TRANSITION && t <= b.start + b.duration + BROLL2_TRANSITION,
  );

// Outro subscribe CTA window (after "abonne-toi à ce compte")
export const FULL_CTA2_START = 76.0;
export const FULL_CTA2_END = 87.5;

export const isInFullCTA2 = (t: number): boolean =>
  t >= FULL_CTA2_START - 0.2 && t <= FULL_CTA2_END + 0.2;
