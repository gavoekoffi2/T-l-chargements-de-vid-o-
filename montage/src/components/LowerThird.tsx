import React from "react";
import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { COLORS } from "../constants";

interface LowerThirdProps {
  name: string;
  title?: string;
  startFrame?: number;
  exitFrame?: number;
}

export const LowerThird: React.FC<LowerThirdProps> = ({
  name,
  title,
  startFrame = 0,
  exitFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const exit = exitFrame ?? durationInFrames - 20;
  const f = frame - startFrame;

  const enterProgress = spring({
    frame: f,
    fps,
    config: { damping: 18, stiffness: 150 },
  });

  const exitProgress = exitFrame
    ? spring({
        frame: frame - exit,
        fps,
        config: { damping: 18, stiffness: 150 },
      })
    : 0;

  const xEnter = interpolate(enterProgress, [0, 1], [-400, 0]);
  const xExit = interpolate(exitProgress, [0, 1], [0, -420]);
  const x = xEnter + xExit;

  const opacity = interpolate(f, [0, 8], [0, 1], {
    extrapolateRight: "clamp",
  });

  const barWidth = interpolate(enterProgress, [0, 1], [0, 100]);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 120,
        left: 80,
        transform: `translateX(${x}px)`,
        opacity,
      }}
    >
      {/* Accent bar */}
      <div
        style={{
          width: `${barWidth}%`,
          height: 4,
          background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.secondary})`,
          borderRadius: 2,
          marginBottom: 12,
        }}
      />

      {/* Background */}
      <div
        style={{
          background: "rgba(10, 10, 20, 0.85)",
          backdropFilter: "blur(12px)",
          padding: "16px 24px",
          borderLeft: `4px solid ${COLORS.primary}`,
          borderRadius: "0 8px 8px 0",
        }}
      >
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 700,
            fontSize: 32,
            color: COLORS.white,
            letterSpacing: -0.5,
          }}
        >
          {name}
        </div>
        {title && (
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 400,
              fontSize: 18,
              color: COLORS.primary,
              letterSpacing: 2,
              textTransform: "uppercase",
              marginTop: 4,
            }}
          >
            {title}
          </div>
        )}
      </div>
    </div>
  );
};
