import React from "react";
import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { COLORS } from "../constants";

interface FlareProps {
  x: number;
  y: number;
  startFrame?: number;
  size?: number;
  color?: string;
}

export const Flare: React.FC<FlareProps> = ({
  x,
  y,
  startFrame = 0,
  size = 300,
  color = COLORS.primary,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = frame - startFrame;

  const progress = spring({
    frame: f,
    fps,
    config: { damping: 20, stiffness: 80 },
  });

  const opacity = interpolate(f, [0, 10, 40, 60], [0, 0.6, 0.4, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scale = interpolate(progress, [0, 1], [0.2, 1]);

  return (
    <div
      style={{
        position: "absolute",
        left: x - (size * scale) / 2,
        top: y - (size * scale) / 2,
        width: size * scale,
        height: size * scale,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color}88 0%, ${color}22 40%, transparent 70%)`,
        opacity,
        pointerEvents: "none",
        mixBlendMode: "screen",
      }}
    />
  );
};
