import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

export const GradientOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const hueShift = (frame * 0.3) % 360;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 2,
      }}
    >
      {/* Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.65) 100%)",
        }}
      />
      {/* Bottom fade for subtitles readability */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 220,
          background:
            "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)",
        }}
      />
      {/* Top subtle cinematic bar */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: 6,
          background: `linear-gradient(90deg, hsl(${hueShift},100%,60%), hsl(${(hueShift + 60) % 360},100%,60%), hsl(${(hueShift + 120) % 360},100%,60%))`,
          opacity: 0.9,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 6,
          background: `linear-gradient(90deg, hsl(${hueShift},100%,60%), hsl(${(hueShift + 60) % 360},100%,60%), hsl(${(hueShift + 120) % 360},100%,60%))`,
          opacity: 0.9,
        }}
      />
    </div>
  );
};
