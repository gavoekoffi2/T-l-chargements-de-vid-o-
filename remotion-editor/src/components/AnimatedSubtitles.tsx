import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { SubtitleSegment, WordToken } from "../types";

interface Props {
  subtitles: SubtitleSegment[];
}

function WordChip({
  token,
  segmentStart,
  segmentEnd,
}: {
  token: WordToken;
  segmentStart: number;
  segmentEnd: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const wordStartFrame = Math.round(token.start * fps);
  const wordEndFrame = Math.round(token.end * fps);
  const isActive = frame >= wordStartFrame && frame <= wordEndFrame;
  const hasPassed = frame > wordEndFrame;

  const appear = spring({
    frame: frame - Math.round(segmentStart * fps),
    fps,
    config: { damping: 14, stiffness: 200, mass: 0.5 },
    durationInFrames: 12,
  });

  const glow = spring({
    frame: frame - wordStartFrame,
    fps,
    config: { damping: 10, stiffness: 300, mass: 0.3 },
    durationInFrames: 8,
  });

  const scale = isActive
    ? interpolate(glow, [0, 1], [1, 1.12], { extrapolateRight: "clamp" })
    : 1;

  const bgOpacity = isActive ? 1 : 0;
  const textColor = isActive ? "#ffffff" : hasPassed ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.75)";

  return (
    <span
      style={{
        display: "inline-block",
        margin: "0 4px",
        padding: "2px 10px",
        borderRadius: 8,
        transform: `scale(${scale}) translateY(${interpolate(appear, [0, 1], [20, 0])}px)`,
        opacity: appear,
        transition: "color 0.1s",
        position: "relative",
        color: textColor,
        fontWeight: isActive ? 800 : 600,
        fontSize: isActive ? "2.1rem" : "2rem",
        background: isActive
          ? "linear-gradient(135deg, #6c63ff 0%, #e040fb 100%)"
          : "transparent",
        boxShadow: isActive
          ? "0 0 24px rgba(108,99,255,0.7), 0 2px 12px rgba(0,0,0,0.4)"
          : "none",
        letterSpacing: "0.01em",
        textShadow: isActive
          ? "none"
          : "0 2px 8px rgba(0,0,0,0.8)",
      }}
    >
      {token.word}
    </span>
  );
}

function SubtitleLine({ segment }: { segment: SubtitleSegment }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const startFrame = Math.round(segment.start * fps);
  const endFrame = Math.round(segment.end * fps);

  if (frame < startFrame || frame > endFrame) return null;

  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 18, stiffness: 180, mass: 0.6 },
    durationInFrames: 15,
  });

  const exitProgress =
    frame > endFrame - 12
      ? spring({
          frame: frame - (endFrame - 12),
          fps,
          config: { damping: 20, stiffness: 200 },
          durationInFrames: 12,
        })
      : 0;

  const opacity = interpolate(exitProgress, [0, 1], [1, 0], {
    extrapolateRight: "clamp",
  });

  const translateY = interpolate(progress, [0, 1], [40, 0]);

  return (
    <div
      style={{
        opacity: progress * opacity,
        transform: `translateY(${translateY}px)`,
        textAlign: "center",
        lineHeight: 1.5,
        maxWidth: "85%",
        margin: "0 auto",
      }}
    >
      {segment.words.map((w, i) => (
        <WordChip
          key={i}
          token={w}
          segmentStart={segment.start}
          segmentEnd={segment.end}
        />
      ))}
    </div>
  );
}

export const AnimatedSubtitles: React.FC<Props> = ({ subtitles }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const active = subtitles.find(
    (s) =>
      frame >= Math.round(s.start * fps) && frame <= Math.round(s.end * fps)
  );

  return (
    <div
      style={{
        position: "absolute",
        bottom: 80,
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        pointerEvents: "none",
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
        zIndex: 10,
      }}
    >
      {active && <SubtitleLine key={active.start} segment={active} />}
    </div>
  );
};
