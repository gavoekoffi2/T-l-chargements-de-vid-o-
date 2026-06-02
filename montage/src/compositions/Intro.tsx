import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
  AbsoluteFill,
} from "remotion";
import { AnimatedTitle } from "../components/AnimatedTitle";
import { ParticleField } from "../components/ParticleField";
import { HexGrid } from "../components/HexGrid";
import { ScanLines } from "../components/ScanLines";
import { Flare } from "../components/Flare";
import { COLORS } from "../constants";

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Fade in global
  const globalOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Fade out sur les dernières frames
  const exitOpacity = interpolate(
    frame,
    [durationInFrames - 20, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp" }
  );

  // Animation du cercle central
  const circleScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 80, mass: 1.2 },
  });

  const circleOpacity = interpolate(frame, [0, 20, 60, 80], [0, 0.6, 0.3, 0], {
    extrapolateRight: "clamp",
  });

  // Logo animé
  const logoProgress = spring({
    frame: frame - 15,
    fps,
    config: { damping: 14, stiffness: 120 },
  });

  // Lignes diagonales
  const line1X = interpolate(frame, [5, 35], [-200, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.exp),
  });
  const line2X = interpolate(frame, [10, 40], [200, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.exp),
  });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 30% 50%, ${COLORS.darkBlue} 0%, ${COLORS.dark} 70%)`,
        opacity: globalOpacity * exitOpacity,
      }}
    >
      {/* Grille hexagonale */}
      <HexGrid opacity={0.25} />

      {/* Particules */}
      <ParticleField opacity={0.7} />

      {/* Scan lines */}
      <ScanLines opacity={0.06} />

      {/* Cercle lumineux central */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%) scale(${circleScale})`,
          width: 500,
          height: 500,
          borderRadius: "50%",
          border: `1px solid ${COLORS.primary}44`,
          opacity: circleOpacity,
          boxShadow: `0 0 80px ${COLORS.primary}44, inset 0 0 80px ${COLORS.primary}22`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%) scale(${circleScale * 0.7})`,
          width: 300,
          height: 300,
          borderRadius: "50%",
          border: `2px solid ${COLORS.secondary}66`,
          opacity: circleOpacity * 1.2,
        }}
      />

      {/* Lignes décoratives latérales */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: "50%",
          width: "35%",
          height: 1,
          background: `linear-gradient(90deg, transparent, ${COLORS.primary}88)`,
          transform: `translateX(${line1X}px)`,
          opacity: interpolate(frame, [5, 35], [0, 1], { extrapolateRight: "clamp" }),
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 0,
          top: "50%",
          width: "35%",
          height: 1,
          background: `linear-gradient(90deg, ${COLORS.primary}88, transparent)`,
          transform: `translateX(${line2X}px)`,
          opacity: interpolate(frame, [10, 40], [0, 1], { extrapolateRight: "clamp" }),
        }}
      />

      {/* Flare gauche */}
      <Flare x={200} y={540} startFrame={5} size={400} color={COLORS.primary} />
      {/* Flare droit */}
      <Flare x={1720} y={540} startFrame={15} size={350} color={COLORS.secondary} />

      {/* Titre principal */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        <AnimatedTitle
          text="MONTAGE"
          subtitle="Motion Design • 2026"
          startFrame={20}
          color={COLORS.white}
          size="large"
        />
      </div>

      {/* Badge coin bas-gauche */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 80,
          opacity: interpolate(frame, [50, 70], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          transform: `translateY(${interpolate(
            spring({ frame: frame - 50, fps, config: { damping: 18, stiffness: 120 } }),
            [0, 1],
            [30, 0]
          )}px)`,
        }}
      >
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 14,
            fontWeight: 600,
            color: COLORS.primary,
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          Produit avec Remotion
        </div>
      </div>
    </AbsoluteFill>
  );
};
