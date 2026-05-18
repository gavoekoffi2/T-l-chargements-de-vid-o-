import React from "react";
import { spring, useCurrentFrame, useVideoConfig, AbsoluteFill } from "remotion";
import type { Word } from "../types";
import { groupIntoPages } from "../utils/words";
import { THEME } from "../utils/theme";

type Props = {
  words: Word[];
  wordsPerPage?: number;
};

/**
 * TikTok / Hormozi-style captions: words pop in one by one with a snappy
 * spring, the active word is highlighted in yellow + scaled, thick black
 * stroke around white text for readability over any background.
 */
export const WordCaptions: React.FC<Props> = ({ words, wordsPerPage = 4 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tMs = (frame / fps) * 1000;
  const pages = React.useMemo(
    () => groupIntoPages(words, wordsPerPage),
    [words, wordsPerPage],
  );

  // Find current page = the one whose [first.start, last.end] contains tMs.
  const page =
    pages.find(
      (p) => tMs >= p[0].start * 1000 && tMs <= p[p.length - 1].end * 1000,
    ) ?? null;

  if (!page) return null;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: THEME.captions.bottomMargin,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          maxWidth: `${THEME.captions.maxWidth * 100}%`,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "baseline",
          gap: "0 28px",
          rowGap: 14,
          fontFamily: THEME.font.family,
          fontWeight: 900,
          fontSize: THEME.captions.fontSize,
          lineHeight: THEME.captions.lineHeight,
          textAlign: "center",
        }}
      >
        {page.map((w, idx) => (
          <WordToken key={idx} word={w} tMs={tMs} fps={fps} frame={frame} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

const WordToken: React.FC<{
  word: Word;
  tMs: number;
  fps: number;
  frame: number;
}> = ({ word, tMs, fps, frame }) => {
  const startMs = word.start * 1000;
  const endMs = word.end * 1000;
  const active = tMs >= startMs && tMs < endMs;
  const past = tMs >= endMs;

  // Pop-in spring tied to the word's first-visible frame.
  const popInFrame = Math.round((startMs / 1000) * fps);
  const pop = spring({
    frame: frame - popInFrame,
    fps,
    config: { damping: 10, mass: 0.5, stiffness: 180 },
  });

  // Active scale punch driven by emphasis (bigger pop for emphatic words).
  const punchScale = active ? 1.1 + word.emphasis * 0.15 : past ? 1.0 : 0.0;
  const scale = pop * (active ? punchScale : past ? 1.0 : 1.0);

  const color = active
    ? word.emphasis > 0.4
      ? THEME.colors.hot
      : THEME.colors.accent
    : THEME.colors.primary;

  return (
    <span
      style={{
        display: "inline-block",
        color,
        WebkitTextStroke: `${THEME.captions.stroke}px ${THEME.colors.bg}`,
        paintOrder: "stroke fill",
        transform: `translateY(${(1 - pop) * 24}px) scale(${scale})`,
        opacity: pop,
        textShadow: active
          ? `0 0 28px ${THEME.colors.accent}99`
          : "0 4px 14px rgba(0,0,0,0.6)",
        transformOrigin: "center bottom",
        transition: "color 60ms linear",
      }}
    >
      {word.text}
    </span>
  );
};
