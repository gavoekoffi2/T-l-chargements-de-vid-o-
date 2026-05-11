import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

interface Props {
  from: number;
  to: number;
  suffix?: string;
  prefix?: string;
  appearAtFrame: number;
  durationFrames?: number;
  label?: string;
  accentColor?: string;
}

export const CounterAnimation: React.FC<Props> = ({
  from,
  to,
  suffix = "",
  prefix = "",
  appearAtFrame,
  durationFrames = 60,
  label,
  accentColor = "#6c63ff",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const relFrame = frame - appearAtFrame;
  if (relFrame < 0 || relFrame > durationFrames + 30) return null;

  const enter = spring({
    frame: relFrame,
    fps,
    config: { damping: 14, stiffness: 160 },
    durationInFrames: 20,
  });

  const countProgress = spring({
    frame: relFrame,
    fps,
    config: { damping: 20, stiffness: 80, mass: 1.2 },
    durationInFrames: durationFrames,
  });

  const value = Math.round(interpolate(countProgress, [0, 1], [from, to]));

  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        opacity: enter,
        transform: `scale(${interpolate(enter, [0, 1], [0.6, 1])})`,
      }}
    >
      <span
        style={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 900,
          fontSize: "4rem",
          background: `linear-gradient(135deg, ${accentColor}, #e040fb)`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          letterSpacing: "-0.03em",
          lineHeight: 1,
        }}
      >
        {prefix}
        {value.toLocaleString()}
        {suffix}
      </span>
      {label && (
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            fontSize: "1rem",
            color: "rgba(255,255,255,0.7)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginTop: 4,
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
};
