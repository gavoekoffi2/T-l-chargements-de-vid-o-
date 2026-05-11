import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

interface Props {
  text: string;
  icon?: string;
  appearAtFrame: number;
  durationFrames?: number;
  x?: number;
  y?: number;
  accentColor?: string;
}

export const CalloutBubble: React.FC<Props> = ({
  text,
  icon = "💡",
  appearAtFrame,
  durationFrames = 90,
  x = 75,
  y = 30,
  accentColor = "#6c63ff",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const relFrame = frame - appearAtFrame;
  if (relFrame < 0 || relFrame > durationFrames + 20) return null;

  const enter = spring({
    frame: relFrame,
    fps,
    config: { damping: 10, stiffness: 280, mass: 0.5 },
    durationInFrames: 15,
  });

  const exit =
    relFrame > durationFrames
      ? spring({
          frame: relFrame - durationFrames,
          fps,
          config: { damping: 18, stiffness: 200 },
          durationInFrames: 15,
        })
      : 0;

  const scale = interpolate(enter, [0, 1], [0.5, 1]);
  const opacity = interpolate(enter, [0, 1], [0, 1]) * interpolate(exit, [0, 1], [1, 0]);

  const wobble = Math.sin(relFrame * 0.08) * 2;

  return (
    <div
      style={{
        position: "absolute",
        left: `${x}%`,
        top: `${y}%`,
        transform: `translate(-50%, -50%) scale(${scale}) rotate(${wobble}deg)`,
        opacity,
        pointerEvents: "none",
        zIndex: 9,
        background: "rgba(0,0,0,0.82)",
        backdropFilter: "blur(16px)",
        borderRadius: 16,
        border: `2px solid ${accentColor}66`,
        padding: "14px 20px",
        maxWidth: 260,
        boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${accentColor}44`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
        }}
      >
        <span style={{ fontSize: "1.6rem", lineHeight: 1 }}>{icon}</span>
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600,
            fontSize: "1.05rem",
            color: "#ffffff",
            lineHeight: 1.4,
          }}
        >
          {text}
        </span>
      </div>
      {/* Tail */}
      <div
        style={{
          position: "absolute",
          bottom: -12,
          left: 24,
          width: 0,
          height: 0,
          borderLeft: "12px solid transparent",
          borderRight: "0px solid transparent",
          borderTop: `12px solid ${accentColor}66`,
        }}
      />
    </div>
  );
};
