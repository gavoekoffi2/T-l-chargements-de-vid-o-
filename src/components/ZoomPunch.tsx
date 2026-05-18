import React from "react";
import {
  AbsoluteFill,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { Word } from "../types";

/**
 * Wraps children and applies a subtle scale punch on every emphasized word.
 * Creates the "camera zooms in on the punchline" effect TikTok edits abuse.
 */
export const ZoomPunch: React.FC<{
  words: Word[];
  children: React.ReactNode;
}> = ({ words, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Find the closest emphasized word that already started.
  const punches = words.filter((w) => w.emphasis >= 0.4);
  let scale = 1.0;
  for (const w of punches) {
    const f = Math.round(w.start * fps);
    const local = frame - f;
    if (local < 0) continue;
    const pop = spring({
      frame: local,
      fps,
      config: { damping: 12, mass: 0.6, stiffness: 220 },
    });
    const decay = Math.max(0, 1 - local / (fps * 0.6));
    scale = Math.max(scale, 1 + pop * 0.06 * decay * (0.6 + w.emphasis));
  }

  return (
    <AbsoluteFill style={{ transform: `scale(${scale})` }}>
      {children}
    </AbsoluteFill>
  );
};
