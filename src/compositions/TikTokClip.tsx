import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import type { ClipProps } from "../types";
import { BackgroundVideo } from "../components/BackgroundVideo";
import { WordCaptions } from "../components/WordCaptions";
import { HookTitle } from "../components/HookTitle";
import { EmojiBurst } from "../components/EmojiBurst";
import { ProgressBar } from "../components/ProgressBar";
import { ZoomPunch } from "../components/ZoomPunch";
import { BrandingBadge } from "../components/BrandingBadge";
import { NeonFrame } from "../components/NeonFrame";

// Google Fonts are loaded by the theme (src/utils/theme.ts) — if you have
// internet access at render time, uncomment the next two lines for the
// real "Inter Black" look; otherwise the system sans-serif fallback kicks in.
// import { loadFont } from "@remotion/google-fonts/Inter";
// loadFont("normal", { weights: ["400", "700", "800", "900"] });

/**
 * Main 9:16 composition that layers everything:
 *   ZoomPunch( BackgroundVideo )
 *   + NeonFrame
 *   + WordCaptions
 *   + EmojiBurst per emphasized word
 *   + HookTitle (first ~2.5s)
 *   + ProgressBar
 *   + BrandingBadge
 */
export const TikTokClip: React.FC<ClipProps> = ({
  highlight,
  videoSrc,
  handle,
}) => {
  const { fps } = useVideoConfig();
  const punchWords = highlight.words.filter((w) => w.emphasis >= 0.5);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <ZoomPunch words={highlight.words}>
        <BackgroundVideo src={videoSrc} />
      </ZoomPunch>

      <NeonFrame />

      <WordCaptions words={highlight.words} />

      {punchWords.map((w, i) => (
        <EmojiBurst
          key={i}
          emoji={highlight.emoji}
          triggerFrame={Math.round(w.start * fps)}
          x={0.5}
          y={0.42}
        />
      ))}

      <Sequence from={0} durationInFrames={Math.round(fps * 2.5)}>
        <HookTitle text={highlight.hook} />
      </Sequence>

      <ProgressBar />
      <BrandingBadge handle={handle} />
    </AbsoluteFill>
  );
};
