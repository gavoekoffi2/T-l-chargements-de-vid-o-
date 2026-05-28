import { Audio, Sequence, staticFile, useVideoConfig } from 'remotion';
import React from 'react';

type Cue = { sfx: string; at: number; volume?: number };

// Synced with v2 content (Gemini Harmony reveal)
const CUES: Cue[] = [
  // Opening hook
  { sfx: 'boom.mp3',   at: 0.2,  volume: 1.0 },

  // B-roll transitions (in + out)
  { sfx: 'whoosh.mp3', at: 2.7,  volume: 1.0 }, // videogen in
  { sfx: 'swoosh.mp3', at: 7.1,  volume: 0.9 }, // videogen out
  { sfx: 'whoosh.mp3', at: 23.7, volume: 1.0 }, // voiceedit in
  { sfx: 'swoosh.mp3', at: 28.4, volume: 0.9 }, // voiceedit out
  { sfx: 'whoosh.mp3', at: 43.2, volume: 1.0 }, // gemini_ui in
  { sfx: 'swoosh.mp3', at: 46.9, volume: 0.9 }, // gemini_ui out
  { sfx: 'whoosh.mp3', at: 56.7, volume: 1.0 }, // ai_search in
  { sfx: 'swoosh.mp3', at: 60.7, volume: 0.9 }, // ai_search out
  { sfx: 'whoosh.mp3', at: 62.2, volume: 1.0 }, // ai_worker in
  { sfx: 'swoosh.mp3', at: 66.2, volume: 0.9 }, // ai_worker out

  // Logo pops (one per overlay reveal)
  { sfx: 'pop.mp3',    at: 0.3,  volume: 0.95 },  // Google intro
  { sfx: 'glitch.mp3', at: 22.0, volume: 0.95 },  // Gemini Harmony
  { sfx: 'glitch.mp3', at: 41.5, volume: 0.95 },  // Gemini 3.0
  { sfx: 'pop.mp3',    at: 55.0, volume: 0.95 },  // AI Search

  // Big punchline impact ("Wow, c'est extraordinaire")
  { sfx: 'impact.mp3', at: 65.4, volume: 1.0 },

  // Outro CTA combo
  { sfx: 'riser.mp3',  at: 74.8, volume: 1.0 },
  { sfx: 'boom.mp3',   at: 76.0, volume: 1.0 },
  { sfx: 'impact.mp3', at: 76.1, volume: 1.0 },
];

export const SfxTrack2: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <>
      {CUES.map((c, i) => (
        <Sequence key={i} from={Math.round(c.at * fps)}>
          <Audio src={staticFile(`sfx/${c.sfx}`)} volume={c.volume ?? 0.9} />
        </Sequence>
      ))}
    </>
  );
};
