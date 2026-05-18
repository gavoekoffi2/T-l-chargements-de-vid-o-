import React from "react";
import { Composition, getInputProps } from "remotion";
import { TikTokClip } from "./compositions/TikTokClip";
import { ClipPropsSchema } from "./types";
import { THEME } from "./utils/theme";

// Default preview props — replaced at render time via inputProps.
const DEMO_PROPS = {
  highlight: {
    id: "demo",
    start: 0,
    end: 8,
    hook: "LE SECRET QU'ILS CACHENT",
    score: 0.95,
    emoji: "🔥",
    words: [
      { text: "Le", start: 0.0, end: 0.25, emphasis: 0 },
      { text: "secret", start: 0.25, end: 0.7, emphasis: 0.9 },
      { text: "que", start: 0.7, end: 0.9, emphasis: 0 },
      { text: "personne", start: 0.9, end: 1.35, emphasis: 0.6 },
      { text: "ne", start: 1.35, end: 1.5, emphasis: 0 },
      { text: "te", start: 1.5, end: 1.7, emphasis: 0 },
      { text: "dit", start: 1.7, end: 2.0, emphasis: 0.5 },
      { text: "c'est", start: 2.2, end: 2.55, emphasis: 0.2 },
      { text: "que", start: 2.55, end: 2.75, emphasis: 0 },
      { text: "tout", start: 2.75, end: 3.1, emphasis: 0.4 },
      { text: "le", start: 3.1, end: 3.25, emphasis: 0 },
      { text: "monde", start: 3.25, end: 3.7, emphasis: 0.5 },
      { text: "ment.", start: 3.7, end: 4.3, emphasis: 1.0 },
      { text: "Ouvre", start: 4.6, end: 5.1, emphasis: 0.7 },
      { text: "les", start: 5.1, end: 5.3, emphasis: 0 },
      { text: "yeux !", start: 5.3, end: 6.0, emphasis: 1.0 },
    ],
  },
  videoSrc: "demo.mp4",
  intensity: 0.95,
  handle: "@yourhandle",
};

export const RemotionRoot: React.FC = () => {
  // Allow the renderer to override durationInFrames via inputProps.
  const input = (getInputProps() as { durationInFrames?: number }) ?? {};
  const fallbackDuration = Math.round(
    THEME.fps *
      (DEMO_PROPS.highlight.words[DEMO_PROPS.highlight.words.length - 1].end +
        1),
  );
  return (
    <>
      <Composition
        id="TikTokClip"
        component={TikTokClip}
        durationInFrames={input.durationInFrames ?? fallbackDuration}
        fps={THEME.fps}
        width={THEME.width}
        height={THEME.height}
        schema={ClipPropsSchema}
        defaultProps={DEMO_PROPS}
      />
    </>
  );
};
