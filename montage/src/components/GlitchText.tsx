import React from "react";
import { useCurrentFrame, interpolate, random } from "remotion";
import { COLORS } from "../constants";

interface GlitchTextProps {
  text: string;
  fontSize?: number;
  color?: string;
  glitchIntensity?: number;
}

export const GlitchText: React.FC<GlitchTextProps> = ({
  text,
  fontSize = 72,
  color = COLORS.white,
  glitchIntensity = 1,
}) => {
  const frame = useCurrentFrame();

  // Glitch sur certaines frames
  const isGlitch = frame % 47 < 3 || frame % 73 < 2;
  const glitchX = isGlitch ? (random(`gx${frame}`) - 0.5) * 12 * glitchIntensity : 0;
  const glitchY = isGlitch ? (random(`gy${frame}`) - 0.5) * 4 * glitchIntensity : 0;
  const clip1Y = isGlitch ? random(`c1${frame}`) * 80 : 30;
  const clip2Y = isGlitch ? random(`c2${frame}`) * 80 + 20 : 60;

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {/* Couche principale */}
      <span
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize,
          fontWeight: 900,
          color,
          letterSpacing: -2,
          position: "relative",
          display: "block",
        }}
      >
        {text}
      </span>

      {/* Couche glitch cyan */}
      {isGlitch && (
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize,
            fontWeight: 900,
            color: COLORS.primary,
            letterSpacing: -2,
            position: "absolute",
            top: glitchY,
            left: glitchX * 1.5,
            opacity: 0.7,
            clipPath: `inset(${clip1Y}% 0 ${100 - clip1Y - 15}% 0)`,
            mixBlendMode: "screen",
          }}
        >
          {text}
        </span>
      )}

      {/* Couche glitch magenta */}
      {isGlitch && (
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize,
            fontWeight: 900,
            color: COLORS.secondary,
            letterSpacing: -2,
            position: "absolute",
            top: -glitchY,
            left: -glitchX,
            opacity: 0.7,
            clipPath: `inset(${clip2Y}% 0 ${100 - clip2Y - 10}% 0)`,
            mixBlendMode: "screen",
          }}
        >
          {text}
        </span>
      )}
    </div>
  );
};
