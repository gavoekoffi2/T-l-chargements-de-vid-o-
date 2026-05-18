import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { THEME } from "../utils/theme";

/**
 * Big animated hook title shown during the first ~2.5 seconds of the clip.
 * Drops in from above with a spring, shake settle, neon glow, then fades.
 */
export const HookTitle: React.FC<{ text: string; durationFrames?: number }> = ({
  text,
  durationFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = durationFrames ?? Math.round(fps * 2.5);

  const enter = spring({
    frame,
    fps,
    config: { damping: 9, mass: 0.6, stiffness: 160 },
  });
  const exit = interpolate(
    frame,
    [dur - 12, dur],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  if (frame > dur) return null;

  const shakeX = Math.sin(frame * 0.6) * (1 - enter) * 14;
  const scale = 0.85 + enter * 0.15;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-start",
        alignItems: "center",
        paddingTop: 220,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          transform: `translate(${shakeX}px, ${(1 - enter) * -180}px) scale(${scale})`,
          opacity: exit,
          background: `linear-gradient(135deg, ${THEME.colors.hot}, ${THEME.colors.accent})`,
          padding: "26px 44px",
          borderRadius: 26,
          boxShadow: `0 0 60px ${THEME.colors.hot}88, 0 0 120px ${THEME.colors.accent}55`,
          rotate: `${-2 + enter * 2}deg`,
        }}
      >
        <div
          style={{
            fontFamily: THEME.font.family,
            fontWeight: 900,
            fontSize: 96,
            color: "#fff",
            WebkitTextStroke: `8px ${THEME.colors.bg}`,
            paintOrder: "stroke fill",
            textAlign: "center",
            maxWidth: 920,
            lineHeight: 1.0,
            letterSpacing: -1,
            textTransform: "uppercase",
          }}
        >
          {text}
        </div>
      </div>
    </AbsoluteFill>
  );
};
