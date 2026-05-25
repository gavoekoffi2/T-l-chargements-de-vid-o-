import { Audio, Sequence, staticFile, useVideoConfig } from 'remotion';
import React from 'react';

type Cue = { sfx: string; at: number; volume?: number };

// SFX cues synchronized with major visual events
const CUES: Cue[] = [
  // Opening hook
  { sfx: 'boom.mp3', at: 0.3, volume: 0.8 },
  { sfx: 'whoosh.mp3', at: 5.3, volume: 0.7 },
  // Level reveals
  { sfx: 'impact.mp3', at: 45.2, volume: 0.7 },
  { sfx: 'whoosh.mp3', at: 45.0, volume: 0.55 },
  { sfx: 'impact.mp3', at: 65.4, volume: 0.7 },
  { sfx: 'whoosh.mp3', at: 65.2, volume: 0.55 },
  { sfx: 'impact.mp3', at: 87.3, volume: 0.7 },
  { sfx: 'whoosh.mp3', at: 87.1, volume: 0.55 },
  { sfx: 'impact.mp3', at: 118.4, volume: 0.85 },
  { sfx: 'riser.mp3', at: 117.4, volume: 0.55 },
  // Logo pops - level 1
  { sfx: 'pop.mp3', at: 57.0, volume: 0.6 },
  { sfx: 'pop.mp3', at: 57.9, volume: 0.6 },
  { sfx: 'pop.mp3', at: 58.8, volume: 0.6 },
  // Logo pops - level 2
  { sfx: 'pop.mp3', at: 83.0, volume: 0.6 },
  { sfx: 'pop.mp3', at: 83.9, volume: 0.6 },
  { sfx: 'pop.mp3', at: 84.8, volume: 0.6 },
  // Logo pops - level 4
  { sfx: 'glitch.mp3', at: 142.0, volume: 0.6 },
  { sfx: 'glitch.mp3', at: 143.2, volume: 0.6 },
  { sfx: 'glitch.mp3', at: 145.5, volume: 0.7 },
  // Hook moments
  { sfx: 'swoosh.mp3', at: 33.5, volume: 0.5 },
  // Outro flourish
  { sfx: 'boom.mp3', at: 159.4, volume: 0.6 },
];

export const SfxTrack: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <>
      {CUES.map((c, i) => (
        <Sequence key={i} from={Math.round(c.at * fps)}>
          <Audio src={staticFile(`sfx/${c.sfx}`)} volume={c.volume ?? 0.6} />
        </Sequence>
      ))}
    </>
  );
};
