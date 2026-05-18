import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { THEME } from "../utils/theme";

/**
 * Slim animated progress bar at the bottom — visual rhythm cue.
 */
export const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const pct = interpolate(frame, [0, durationInFrames], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        paddingBottom: 80,
        paddingLeft: 60,
        paddingRight: 60,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          height: 12,
          width: "100%",
          background: "rgba(255,255,255,0.18)",
          borderRadius: 999,
          overflow: "hidden",
          boxShadow: "0 4px 18px rgba(0,0,0,0.45)",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${THEME.colors.neon}, ${THEME.colors.accent}, ${THEME.colors.hot})`,
            boxShadow: `0 0 24px ${THEME.colors.accent}`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
