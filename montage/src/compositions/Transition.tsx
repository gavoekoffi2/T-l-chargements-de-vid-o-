import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  AbsoluteFill,
  Easing,
} from "remotion";
import { COLORS } from "../constants";

type TransitionType = "sweep" | "zoom" | "glitch" | "flash";

interface TransitionProps {
  type?: TransitionType;
  duration?: number;
  color?: string;
}

export const Transition: React.FC<TransitionProps> = ({
  type = "sweep",
  color = COLORS.primary,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const mid = Math.floor(durationInFrames / 2);

  if (type === "sweep") {
    // Sweep de gauche à droite puis droite à gauche
    const progress1 = interpolate(frame, [0, mid], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    });
    const progress2 = interpolate(frame, [mid, durationInFrames], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    });

    const x1 = interpolate(progress1, [0, 1], [-1920, 0]);
    const x2 = interpolate(progress2, [0, 1], [0, 1920]);

    return (
      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(90deg, ${color}, ${COLORS.secondary})`,
            transform: `translateX(${x1 + x2}px)`,
          }}
        />
      </AbsoluteFill>
    );
  }

  if (type === "flash") {
    const opacity = interpolate(
      frame,
      [0, 3, mid - 3, mid, mid + 3, durationInFrames - 3, durationInFrames],
      [0, 1, 1, 0, 1, 1, 0],
      { extrapolateRight: "clamp" }
    );
    return (
      <AbsoluteFill
        style={{
          background: "white",
          opacity,
          pointerEvents: "none",
        }}
      />
    );
  }

  if (type === "glitch") {
    const bars = Array.from({ length: 12 }, (_, i) => {
      const offset = (i / 12) * durationInFrames;
      const barOpacity = interpolate(
        frame,
        [offset * 0.5, offset * 0.5 + 5, offset * 0.5 + 8],
        [0, 1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      );
      return { opacity: barOpacity, y: (i / 12) * 100 };
    });

    return (
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        {bars.map((bar, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: `${bar.y}%`,
              height: `${100 / 12}%`,
              background: i % 2 === 0 ? COLORS.primary : COLORS.secondary,
              opacity: bar.opacity * 0.8,
              transform: `translateX(${i % 3 === 0 ? -20 : 20}px)`,
            }}
          />
        ))}
      </AbsoluteFill>
    );
  }

  // zoom par défaut
  const scale = interpolate(
    frame,
    [0, mid / 2, mid, durationInFrames],
    [1, 3, 1, 1],
    { extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) }
  );
  const opacity = interpolate(frame, [0, mid / 2, mid, durationInFrames], [0, 1, 1, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: color,
        transform: `scale(${scale})`,
        opacity,
        pointerEvents: "none",
      }}
    />
  );
};
