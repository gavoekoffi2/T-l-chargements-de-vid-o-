import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { COLORS } from "../constants";

interface HexProps {
  cx: number;
  cy: number;
  size: number;
  delay: number;
  color: string;
}

const Hexagon: React.FC<HexProps> = ({ cx, cy, size, delay, color }) => {
  const frame = useCurrentFrame();
  const f = Math.max(0, frame - delay);

  const opacity = interpolate(f, [0, 20, 60, 80], [0, 0.3, 0.15, 0], {
    extrapolateRight: "clamp",
  });

  const scale = interpolate(f, [0, 20], [0.3, 1], {
    extrapolateRight: "clamp",
  });

  const points = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    return `${cx + size * scale * Math.cos(angle)},${cy + size * scale * Math.sin(angle)}`;
  }).join(" ");

  return (
    <polygon
      points={points}
      fill="none"
      stroke={color}
      strokeWidth={1}
      opacity={opacity}
    />
  );
};

export const HexGrid: React.FC<{ opacity?: number }> = ({ opacity = 0.4 }) => {
  const cols = 18;
  const rows = 10;
  const size = 60;
  const w = size * Math.sqrt(3);
  const h = size * 2;
  const colors = [COLORS.primary, COLORS.secondary, COLORS.accent];

  const hexes: { cx: number; cy: number; delay: number; color: string }[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cx = col * w + (row % 2 === 0 ? 0 : w / 2);
      const cy = row * (h * 0.75);
      const delay = (col + row * 2) * 2;
      const color = colors[(col + row) % colors.length];
      hexes.push({ cx, cy, delay, color });
    }
  }

  return (
    <svg
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        opacity,
        pointerEvents: "none",
      }}
      viewBox="0 0 1920 1080"
    >
      {hexes.map((h, i) => (
        <Hexagon key={i} cx={h.cx} cy={h.cy} size={size} delay={h.delay} color={h.color} />
      ))}
    </svg>
  );
};
