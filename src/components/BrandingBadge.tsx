import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { THEME } from "../utils/theme";

export const BrandingBadge: React.FC<{ handle: string }> = ({ handle }) => {
  const frame = useCurrentFrame();
  const pulse = 1 + Math.sin(frame * 0.12) * 0.04;
  const opacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-start",
        alignItems: "flex-end",
        paddingTop: 70,
        paddingRight: 50,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          opacity,
          transform: `scale(${pulse})`,
          background: "rgba(0,0,0,0.55)",
          border: `2px solid ${THEME.colors.accent}`,
          padding: "14px 24px",
          borderRadius: 999,
          color: "#fff",
          fontFamily: THEME.font.family,
          fontWeight: 800,
          fontSize: 32,
          letterSpacing: 0.5,
          backdropFilter: "blur(6px)",
          boxShadow: `0 0 30px ${THEME.colors.accent}55`,
        }}
      >
        {handle}
      </div>
    </AbsoluteFill>
  );
};
