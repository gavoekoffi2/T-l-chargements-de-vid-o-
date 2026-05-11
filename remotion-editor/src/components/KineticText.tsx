import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

interface KineticWord {
  text: string;
  delay?: number;
}

interface Props {
  words: KineticWord[];
  appearAtFrame: number;
  durationFrames: number;
  x?: number;
  y?: number;
  align?: "left" | "center" | "right";
  accentColor?: string;
}

export const KineticText: React.FC<Props> = ({
  words,
  appearAtFrame,
  durationFrames,
  x = 50,
  y = 50,
  align = "center",
  accentColor = "#6c63ff",
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const relFrame = frame - appearAtFrame;
  if (relFrame < 0 || relFrame > durationFrames + 25) return null;

  const exit =
    relFrame > durationFrames
      ? spring({
          frame: relFrame - durationFrames,
          fps,
          config: { damping: 20, stiffness: 200 },
          durationInFrames: 20,
        })
      : 0;

  const globalOpacity = interpolate(exit, [0, 1], [1, 0]);

  return (
    <div
      style={{
        position: "absolute",
        left: `${x}%`,
        top: `${y}%`,
        transform: "translate(-50%, -50%)",
        textAlign: align,
        pointerEvents: "none",
        zIndex: 9,
        opacity: globalOpacity,
        display: "flex",
        flexWrap: "wrap",
        gap: "8px 6px",
        justifyContent: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start",
        maxWidth: "60%",
      }}
    >
      {words.map((w, i) => {
        const wordDelay = (w.delay ?? i * 4);
        const wordFrame = relFrame - wordDelay;

        const enter = spring({
          frame: wordFrame,
          fps,
          config: { damping: 12, stiffness: 280, mass: 0.4 },
          durationInFrames: 12,
        });

        const scale = interpolate(enter, [0, 1], [0.4, 1]);
        const opacity = interpolate(enter, [0, 1], [0, 1]);
        const rotate = interpolate(enter, [0, 1], [-8, 0]);

        const isAccent = w.text.startsWith("*") && w.text.endsWith("*");
        const displayText = isAccent ? w.text.slice(1, -1) : w.text;

        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              transform: `scale(${scale}) rotate(${rotate}deg)`,
              opacity,
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontWeight: isAccent ? 900 : 700,
              fontSize: isAccent ? "3.2rem" : "2.6rem",
              color: isAccent ? accentColor : "#ffffff",
              textShadow: isAccent
                ? `0 0 30px ${accentColor}88, 0 2px 12px rgba(0,0,0,0.6)`
                : "0 2px 12px rgba(0,0,0,0.7)",
              background: isAccent
                ? `linear-gradient(135deg, ${accentColor}, #e040fb)`
                : "none",
              WebkitBackgroundClip: isAccent ? "text" : "initial",
              WebkitTextFillColor: isAccent ? "transparent" : "initial",
              letterSpacing: "-0.02em",
            }}
          >
            {displayText}
          </span>
        );
      })}
    </div>
  );
};
