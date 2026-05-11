import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

interface Props {
  name: string;
  title?: string;
  appearAtFrame?: number;
  durationFrames?: number;
}

export const LowerThird: React.FC<Props> = ({
  name,
  title,
  appearAtFrame = 30,
  durationFrames = 120,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const relFrame = frame - appearAtFrame;
  if (relFrame < 0 || relFrame > durationFrames + 20) return null;

  const enter = spring({
    frame: relFrame,
    fps,
    config: { damping: 14, stiffness: 160, mass: 0.7 },
    durationInFrames: 20,
  });

  const exit =
    relFrame > durationFrames
      ? spring({
          frame: relFrame - durationFrames,
          fps,
          config: { damping: 18, stiffness: 200 },
          durationInFrames: 18,
        })
      : 0;

  const xOffset = interpolate(enter, [0, 1], [-80, 0]) - interpolate(exit, [0, 1], [0, 80]);
  const opacity = interpolate(enter, [0, 1], [0, 1]) * interpolate(exit, [0, 1], [1, 0]);

  const barWidth = interpolate(enter, [0, 1], [0, 5]);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 160,
        left: 60,
        opacity,
        transform: `translateX(${xOffset}px)`,
        display: "flex",
        flexDirection: "row",
        alignItems: "stretch",
        gap: 12,
        pointerEvents: "none",
        zIndex: 8,
      }}
    >
      {/* Accent bar */}
      <div
        style={{
          width: barWidth,
          background: "linear-gradient(180deg, #6c63ff 0%, #e040fb 100%)",
          borderRadius: 3,
          minHeight: 48,
        }}
      />
      {/* Text block */}
      <div
        style={{
          background: "rgba(0,0,0,0.72)",
          backdropFilter: "blur(12px)",
          borderRadius: 8,
          padding: "10px 18px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <span
          style={{
            color: "#ffffff",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 800,
            fontSize: "1.35rem",
            letterSpacing: "0.02em",
          }}
        >
          {name}
        </span>
        {title && (
          <span
            style={{
              color: "rgba(255,255,255,0.6)",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 500,
              fontSize: "0.95rem",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            {title}
          </span>
        )}
      </div>
    </div>
  );
};
