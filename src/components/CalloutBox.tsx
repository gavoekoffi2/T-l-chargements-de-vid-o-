import React from "react";
import {
  AbsoluteFill,
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { THEME } from "../utils/theme";

/**
 * Slide-in callout box anchored to the top-left. Drives "fact card" or
 * "stat reveal" overlays that pop on at a precise frame and slide off.
 */
export const CalloutBox: React.FC<{
  fromFrame: number;
  durationFrames: number;
  title: string;
  value: string;
}> = ({ fromFrame, durationFrames, title, value }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - fromFrame;
  if (local < 0 || local > durationFrames) return null;

  const enter = spring({
    frame: local,
    fps,
    config: { damping: 11, mass: 0.6, stiffness: 160 },
  });
  const exit = interpolate(
    local,
    [durationFrames - 10, durationFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-start",
        alignItems: "flex-start",
        paddingTop: 480,
        paddingLeft: 60,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          transform: `translateX(${(1 - enter) * -600}px)`,
          opacity: exit,
          background: "linear-gradient(135deg, #111, #1c1c1f)",
          padding: "22px 30px",
          borderRadius: 22,
          border: `3px solid ${THEME.colors.accent}`,
          boxShadow: `0 0 50px ${THEME.colors.accent}66, 0 20px 40px rgba(0,0,0,0.6)`,
          minWidth: 360,
          maxWidth: 720,
        }}
      >
        <div
          style={{
            fontFamily: THEME.font.family,
            fontWeight: 700,
            fontSize: 26,
            letterSpacing: 2,
            color: THEME.colors.accent,
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: THEME.font.family,
            fontWeight: 900,
            fontSize: 78,
            color: "#fff",
            lineHeight: 1.0,
            WebkitTextStroke: `2px ${THEME.colors.bg}`,
          }}
        >
          {value}
        </div>
      </div>
    </AbsoluteFill>
  );
};
