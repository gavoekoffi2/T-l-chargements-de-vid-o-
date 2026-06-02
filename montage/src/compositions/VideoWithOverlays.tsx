import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  AbsoluteFill,
  Video,
  Sequence,
} from "remotion";
import { LowerThird } from "../components/LowerThird";
import { ScanLines } from "../components/ScanLines";
import { CircularTimer } from "../components/CircularTimer";
import { GlitchText } from "../components/GlitchText";
import { Flare } from "../components/Flare";
import { COLORS } from "../constants";

// Chemin vers la vidéo source — place le fichier dans public/
const VIDEO_SRC = "video.mp4";

interface VideoOverlayProps {
  videoSrc?: string;
}

export const VideoWithOverlays: React.FC<VideoOverlayProps> = ({
  videoSrc = VIDEO_SRC,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Fade in/out
  const fadeIn = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 20, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp" }
  );

  // Légère animation de scale pour dynamisme
  const breathe = 1 + Math.sin(frame * 0.02) * 0.005;

  // Vignette pulsante sur les bords
  const vignetteIntensity = 0.6 + Math.sin(frame * 0.03) * 0.1;

  // Beat simulé (pour effet rythme)
  const beatFrame = frame % 30;
  const beat = interpolate(beatFrame, [0, 3, 30], [1.02, 1, 1], {
    extrapolateRight: "clamp",
  });

  // Overlay de couleur — teinte cinématique
  const colorGradeOpacity = 0.12;

  return (
    <AbsoluteFill style={{ opacity: fadeIn * fadeOut, background: "#000" }}>

      {/* ── Vidéo source ── */}
      <AbsoluteFill style={{ transform: `scale(${breathe * beat})` }}>
        <Video
          src={videoSrc}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          volume={1}
        />
      </AbsoluteFill>

      {/* ── Color grading cinématique (teal & orange) ── */}
      <AbsoluteFill
        style={{
          background: `
            radial-gradient(ellipse at 80% 20%, rgba(255,150,50,0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 20% 80%, rgba(0,200,255,0.10) 0%, transparent 50%)
          `,
          mixBlendMode: "screen",
          opacity: colorGradeOpacity * 8,
          pointerEvents: "none",
        }}
      />

      {/* ── Vignette ── */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,${vignetteIntensity}) 100%)`,
          pointerEvents: "none",
        }}
      />

      {/* ── Scan lines subtiles ── */}
      <ScanLines opacity={0.04} />

      {/* ── Barre du haut ── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.secondary}, ${COLORS.accent})`,
          opacity: interpolate(frame, [0, 15], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      />

      {/* ── Compteur circulaire ── */}
      <CircularTimer size={70} strokeWidth={3} color={COLORS.primary} />

      {/* ── Timecode discret ── */}
      <Sequence from={10}>
        <div
          style={{
            position: "absolute",
            bottom: 40,
            left: 60,
            fontFamily: "monospace",
            fontSize: 14,
            color: `${COLORS.primary}99`,
            letterSpacing: 2,
            opacity: interpolate(frame, [10, 25], [0, 1], {
              extrapolateRight: "clamp",
            }),
          }}
        >
          {String(Math.floor(frame / fps / 60)).padStart(2, "0")}:
          {String(Math.floor((frame / fps) % 60)).padStart(2, "0")}:
          {String(Math.floor((frame % fps) * (100 / fps))).padStart(2, "0")}
        </div>
      </Sequence>

      {/* ── Lower Third principal (frame 30–120) ── */}
      <Sequence from={30} durationInFrames={90}>
        <LowerThird
          name="Titre de la vidéo"
          title="Sous-titre • Description"
          startFrame={0}
          exitFrame={70}
        />
      </Sequence>

      {/* ── Texte glitch mi-vidéo ── */}
      <Sequence from={180} durationInFrames={60}>
        <AbsoluteFill
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            paddingRight: 120,
          }}
        >
          <div
            style={{
              opacity: interpolate(frame - 180, [0, 15, 45, 60], [0, 1, 1, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            <GlitchText text="2026" fontSize={160} color={COLORS.white} />
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* ── Second Lower Third (frame 270–360) ── */}
      <Sequence from={270} durationInFrames={90}>
        <LowerThird
          name="Moment clé"
          title="Événement • Lieu"
          startFrame={0}
          exitFrame={70}
        />
      </Sequence>

      {/* ── Flare dramatique ── */}
      <Sequence from={150} durationInFrames={60}>
        <Flare x={1800} y={100} startFrame={0} size={600} color={COLORS.gold} />
      </Sequence>

      {/* ── Lignes de cadre animées ── */}
      <FrameLines />

    </AbsoluteFill>
  );
};

// Lignes de cadre cinématographiques
const FrameLines: React.FC = () => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 20], [0, 0.6], {
    extrapolateRight: "clamp",
  });

  const barH = 60; // hauteur des bandes ciné

  return (
    <>
      {/* Bande cinéma haut */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: barH,
          background: "rgba(0,0,0,0.75)",
          opacity,
          pointerEvents: "none",
        }}
      />
      {/* Bande cinéma bas */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: barH,
          background: "rgba(0,0,0,0.75)",
          opacity,
          pointerEvents: "none",
        }}
      />
    </>
  );
};
