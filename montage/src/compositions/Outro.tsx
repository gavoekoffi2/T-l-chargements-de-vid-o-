import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  AbsoluteFill,
  Easing,
} from "remotion";
import { ParticleField } from "../components/ParticleField";
import { AnimatedTitle } from "../components/AnimatedTitle";
import { COLORS } from "../constants";

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  const finalFade = interpolate(
    frame,
    [durationInFrames - 15, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp" }
  );

  // Logo central
  const logoScale = spring({
    frame: frame - 10,
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  // Cercles concentriques
  const circle1 = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 60 },
  });
  const circle2 = spring({
    frame: frame - 8,
    fps,
    config: { damping: 20, stiffness: 60 },
  });
  const circle3 = spring({
    frame: frame - 16,
    fps,
    config: { damping: 20, stiffness: 60 },
  });

  // Rotation lente
  const rotation = frame * 0.3;

  // CTA opacity
  const ctaOpacity = interpolate(frame, [50, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ctaY = interpolate(
    spring({ frame: frame - 50, fps }),
    [0, 1],
    [20, 0]
  );

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 70% 50%, ${COLORS.darkBlue} 0%, ${COLORS.dark} 70%)`,
        opacity: fadeIn * finalFade,
      }}
    >
      {/* Particules */}
      <ParticleField opacity={0.5} />

      {/* Cercles concentriques animés */}
      {[
        { scale: circle1, size: 600, color: COLORS.primary },
        { scale: circle2, size: 450, color: COLORS.secondary },
        { scale: circle3, size: 300, color: COLORS.accent },
      ].map(({ scale, size, color }, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: size * scale,
            height: size * scale,
            transform: `translate(-50%, -50%) rotate(${rotation * (i % 2 === 0 ? 1 : -1)}deg)`,
            borderRadius: "50%",
            border: `1px solid ${color}33`,
            opacity: 0.5,
          }}
        />
      ))}

      {/* Titre */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 40,
        }}
      >
        {/* Logo / Nom */}
        <div
          style={{
            transform: `scale(${logoScale})`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 80,
              fontWeight: 900,
              background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 50%, ${COLORS.accent} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: -3,
              lineHeight: 1,
            }}
          >
            MERCI
          </div>
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 20,
              fontWeight: 300,
              color: COLORS.lightGray,
              letterSpacing: 8,
              textTransform: "uppercase",
              marginTop: 12,
            }}
          >
            d'avoir regardé
          </div>
        </div>

        {/* Séparateur */}
        <div
          style={{
            width: 120,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${COLORS.primary}, transparent)`,
            opacity: interpolate(frame, [30, 50], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        />

        {/* CTA */}
        <div
          style={{
            transform: `translateY(${ctaY}px)`,
            opacity: ctaOpacity,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 18,
              fontWeight: 500,
              color: COLORS.primary,
              letterSpacing: 3,
              textTransform: "uppercase",
            }}
          >
            Abonnez-vous • Likez • Partagez
          </div>
        </div>
      </div>

      {/* Ligne décorative bas */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.secondary}, ${COLORS.accent})`,
          opacity: interpolate(frame, [20, 40], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      />
    </AbsoluteFill>
  );
};
