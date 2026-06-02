import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { COLORS } from "../constants";

interface AnimatedTitleProps {
  text: string;
  subtitle?: string;
  startFrame?: number;
  color?: string;
  size?: "small" | "medium" | "large";
}

export const AnimatedTitle: React.FC<AnimatedTitleProps> = ({
  text,
  subtitle,
  startFrame = 0,
  color = COLORS.white,
  size = "large",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = frame - startFrame;

  const titleScale = spring({
    frame: f,
    fps,
    config: { damping: 14, stiffness: 120, mass: 0.8 },
  });

  const titleOpacity = interpolate(f, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  const subtitleProgress = spring({
    frame: f - 20,
    fps,
    config: { damping: 18, stiffness: 100 },
  });

  const subtitleY = interpolate(subtitleProgress, [0, 1], [30, 0]);
  const subtitleOpacity = interpolate(f, [20, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const lineWidth = interpolate(f, [10, 50], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const fontSize =
    size === "large" ? 96 : size === "medium" ? 64 : 42;

  // Découpe le titre lettre par lettre
  const letters = text.split("");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
      }}
    >
      {/* Ligne décorative animée */}
      <div
        style={{
          width: `${lineWidth}%`,
          height: 3,
          background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.secondary})`,
          borderRadius: 2,
          marginBottom: 8,
        }}
      />

      {/* Titre principal avec animation par lettres */}
      <div
        style={{
          display: "flex",
          gap: 2,
          overflow: "hidden",
        }}
      >
        {letters.map((letter, i) => {
          const letterDelay = i * 2;
          const letterProgress = spring({
            frame: f - letterDelay,
            fps,
            config: { damping: 12, stiffness: 200, mass: 0.5 },
          });
          const letterY = interpolate(letterProgress, [0, 1], [80, 0]);
          const letterOpacity = interpolate(
            f - letterDelay,
            [0, 10],
            [0, 1],
            { extrapolateRight: "clamp" }
          );
          return (
            <span
              key={i}
              style={{
                fontSize,
                fontWeight: 900,
                color,
                letterSpacing: -2,
                transform: `translateY(${letterY}px)`,
                opacity: letterOpacity,
                display: "inline-block",
                textShadow: `0 0 40px ${COLORS.primary}66`,
                lineHeight: 1.1,
              }}
            >
              {letter === " " ? " " : letter}
            </span>
          );
        })}
      </div>

      {/* Sous-titre */}
      {subtitle && (
        <p
          style={{
            fontSize: 24,
            fontWeight: 300,
            color: COLORS.lightGray,
            letterSpacing: 6,
            textTransform: "uppercase",
            margin: 0,
            transform: `translateY(${subtitleY}px)`,
            opacity: subtitleOpacity,
          }}
        >
          {subtitle}
        </p>
      )}

      {/* Ligne décorative bas */}
      <div
        style={{
          width: `${lineWidth * 0.5}%`,
          height: 1,
          background: `${COLORS.primary}55`,
          borderRadius: 2,
          marginTop: 4,
        }}
      />
    </div>
  );
};
