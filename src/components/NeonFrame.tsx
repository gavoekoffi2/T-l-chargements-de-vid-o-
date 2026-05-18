import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { THEME } from "../utils/theme";

/**
 * Subtle animated neon outline around the canvas — flickers gently.
 * Adds the "premium streaming overlay" vibe without being too loud.
 */
export const NeonFrame: React.FC = () => {
  const frame = useCurrentFrame();
  const flicker = 0.7 + Math.abs(Math.sin(frame * 0.18)) * 0.3;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          inset: 22,
          borderRadius: 38,
          border: `4px solid ${THEME.colors.neon}`,
          boxShadow: `0 0 ${24 * flicker}px ${THEME.colors.neon}, inset 0 0 ${36 * flicker}px ${THEME.colors.neon}40`,
          opacity: 0.55 * flicker,
        }}
      />
    </AbsoluteFill>
  );
};
