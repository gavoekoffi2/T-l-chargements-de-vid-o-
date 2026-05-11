import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

interface Props {
  color?: string;
  height?: number;
}

export const ProgressBar: React.FC<Props> = ({
  color = "linear-gradient(90deg, #6c63ff, #e040fb)",
  height = 4,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width } = useVideoConfig();

  const progress = interpolate(frame, [0, durationInFrames], [0, 100], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 6,
        left: 0,
        right: 0,
        height,
        zIndex: 15,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${progress}%`,
          background: color,
          borderRadius: height,
          boxShadow: "0 0 12px rgba(108,99,255,0.8)",
        }}
      />
    </div>
  );
};
