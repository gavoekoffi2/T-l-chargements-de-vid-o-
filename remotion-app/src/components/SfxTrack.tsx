import { Audio, Sequence, staticFile, useVideoConfig } from 'remotion';
import React from 'react';

type Cue = { sfx: string; at: number; volume?: number };

// SFX files are already amplified +9dB at source.
// Volumes here are 0.9-1.0 to keep them punchy without clipping the mix.
const CUES: Cue[] = [
  // Opening hook
  { sfx: 'boom.mp3',    at: 0.3,   volume: 1.0  },
  { sfx: 'whoosh.mp3',  at: 5.3,   volume: 1.0  },

  // B-roll cutaway whooshes (in + out)
  { sfx: 'whoosh.mp3',  at: 10.3,  volume: 1.0  }, // ladder in
  { sfx: 'swoosh.mp3',  at: 14.4,  volume: 0.9  }, // ladder out
  { sfx: 'whoosh.mp3',  at: 49.8,  volume: 1.0  }, // chat in
  { sfx: 'swoosh.mp3',  at: 53.4,  volume: 0.9  }, // chat out
  { sfx: 'whoosh.mp3',  at: 72.3,  volume: 1.0  }, // workflow in
  { sfx: 'swoosh.mp3',  at: 76.9,  volume: 0.9  }, // workflow out
  { sfx: 'whoosh.mp3',  at: 95.8,  volume: 1.0  }, // brain in
  { sfx: 'swoosh.mp3',  at: 99.9,  volume: 0.9  }, // brain out
  { sfx: 'whoosh.mp3',  at: 127.8, volume: 1.0  }, // orchestrator in
  { sfx: 'swoosh.mp3',  at: 131.9, volume: 0.9  }, // orchestrator out

  // Level reveals (big impact)
  { sfx: 'impact.mp3',  at: 45.2,  volume: 1.0  },
  { sfx: 'whoosh.mp3',  at: 45.0,  volume: 0.95 },
  { sfx: 'impact.mp3',  at: 65.4,  volume: 1.0  },
  { sfx: 'whoosh.mp3',  at: 65.2,  volume: 0.95 },
  { sfx: 'impact.mp3',  at: 87.3,  volume: 1.0  },
  { sfx: 'whoosh.mp3',  at: 87.1,  volume: 0.95 },
  { sfx: 'impact.mp3',  at: 118.4, volume: 1.0  },
  { sfx: 'riser.mp3',   at: 117.0, volume: 0.95 },

  // Logo pops - level 1
  { sfx: 'pop.mp3',     at: 56.5,  volume: 0.95 },
  { sfx: 'pop.mp3',     at: 58.2,  volume: 0.95 },
  { sfx: 'pop.mp3',     at: 59.5,  volume: 0.95 },

  // Logo pops - level 2
  { sfx: 'pop.mp3',     at: 82.6,  volume: 0.95 },
  { sfx: 'pop.mp3',     at: 84.0,  volume: 0.95 },
  { sfx: 'pop.mp3',     at: 85.4,  volume: 0.95 },

  // Logo pops - level 4 (glitch flavor)
  { sfx: 'glitch.mp3',  at: 141.5, volume: 0.95 },
  { sfx: 'glitch.mp3',  at: 143.2, volume: 0.95 },
  { sfx: 'glitch.mp3',  at: 145.2, volume: 1.0  },

  // Hook moments
  { sfx: 'swoosh.mp3',  at: 33.5,  volume: 0.9  },

  // Mini subscribe CTA pop
  { sfx: 'pop.mp3',     at: 30.5,  volume: 0.95 },

  // Outro CTA — boom + riser + glitch combo for max punch
  { sfx: 'riser.mp3',   at: 158.3, volume: 1.0  },
  { sfx: 'boom.mp3',    at: 159.3, volume: 1.0  },
  { sfx: 'impact.mp3',  at: 159.4, volume: 1.0  },
];

export const SfxTrack: React.FC = () => {
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
