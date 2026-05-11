import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

interface PulseEvent {
  frame: number;
  intensity?: number; // 0-1, default 0.5
}

interface Props {
  events: PulseEvent[];
  children: React.ReactNode;
}

export const ZoomPulse: React.FC<Props> = ({ events, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  let totalScale = 1;
  let totalBrightness = 1;

  for (const event of events) {
    const relFrame = frame - event.frame;
    if (relFrame < 0 || relFrame > 30) continue;

    const intensity = event.intensity ?? 0.5;

    const pulse = spring({
      frame: relFrame,
      fps,
      config: { damping: 8, stiffness: 300, mass: 0.3 },
      durationInFrames: 20,
    });

    const scaleBoost = interpolate(pulse, [0, 0.5, 1], [1, 1 + 0.04 * intensity, 1]);
    const brightnessBoost = interpolate(pulse, [0, 0.3, 1], [1, 1 + 0.15 * intensity, 1]);

    totalScale *= scaleBoost;
    totalBrightness *= brightnessBoost;
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        transform: `scale(${totalScale})`,
        filter: `brightness(${totalBrightness})`,
        transformOrigin: "center center",
      }}
    >
      {children}
    </div>
  );
};
