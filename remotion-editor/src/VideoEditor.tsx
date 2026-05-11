import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Video,
  Audio,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  OffthreadVideo,
} from "remotion";
import { EditorData, VideoSegment } from "./types";
import { AnimatedSubtitles } from "./components/AnimatedSubtitles";
import { GradientOverlay } from "./components/GradientOverlay";
import { LowerThird } from "./components/LowerThird";
import { KineticText } from "./components/KineticText";
import { ParticleField } from "./components/ParticleField";
import { ZoomPulse } from "./components/ZoomPulse";
import { ProgressBar } from "./components/ProgressBar";
import { CalloutBubble } from "./components/CalloutBubble";

interface Props {
  data: EditorData;
}

function CutTransition({ fromFrame }: { fromFrame: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const relFrame = frame - fromFrame;
  if (relFrame < 0 || relFrame > 12) return null;

  const flashOpacity = interpolate(relFrame, [0, 3, 12], [0.7, 0.2, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "white",
        opacity: flashOpacity,
        zIndex: 20,
        pointerEvents: "none",
      }}
    />
  );
}

function IntroSlate({ title, durationFrames }: { title: string; durationFrames: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 16, stiffness: 140 }, durationInFrames: 18 });
  const exit =
    frame > durationFrames - 20
      ? spring({
          frame: frame - (durationFrames - 20),
          fps,
          config: { damping: 20, stiffness: 200 },
          durationInFrames: 18,
        })
      : 0;

  const opacity = interpolate(enter, [0, 1], [0, 1]) * interpolate(exit, [0, 1], [1, 0]);
  const translateY = interpolate(enter, [0, 1], [30, 0]);

  const hue = (frame * 1.5) % 360;

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0a1a2e 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ParticleField count={40} intensity={1} />
      <div
        style={{
          opacity,
          transform: `translateY(${translateY}px)`,
          textAlign: "center",
          padding: "0 60px",
        }}
      >
        <div
          style={{
            width: 80,
            height: 4,
            background: `linear-gradient(90deg, hsl(${hue},100%,60%), hsl(${(hue + 60) % 360},100%,60%))`,
            borderRadius: 2,
            margin: "0 auto 20px",
          }}
        />
        <h1
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 900,
            fontSize: "3.4rem",
            color: "#ffffff",
            margin: 0,
            letterSpacing: "-0.03em",
            textShadow: "0 4px 24px rgba(108,99,255,0.6)",
          }}
        >
          {title}
        </h1>
        <div
          style={{
            width: 80,
            height: 4,
            background: `linear-gradient(90deg, hsl(${(hue + 120) % 360},100%,60%), hsl(${(hue + 180) % 360},100%,60%))`,
            borderRadius: 2,
            margin: "20px auto 0",
          }}
        />
      </div>
    </AbsoluteFill>
  );
}

export const VideoEditor: React.FC<Props> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const INTRO_FRAMES = data.title ? 60 : 0;

  const pulseEvents = useMemo(() => {
    return data.subtitles
      .filter((_, i) => i % 4 === 0)
      .map((seg) => ({
        frame: Math.round(seg.start * fps) + INTRO_FRAMES,
        intensity: 0.4,
      }));
  }, [data.subtitles, fps, INTRO_FRAMES]);

  const cutFrames = useMemo(() => {
    return data.segments.slice(1).map((seg) =>
      Math.round(seg.outputStart * fps) + INTRO_FRAMES
    );
  }, [data.segments, fps, INTRO_FRAMES]);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* INTRO */}
      {data.title && INTRO_FRAMES > 0 && (
        <Sequence from={0} durationInFrames={INTRO_FRAMES}>
          <IntroSlate title={data.title} durationFrames={INTRO_FRAMES} />
        </Sequence>
      )}

      {/* VIDEO SEGMENTS */}
      <Sequence from={INTRO_FRAMES}>
        <ZoomPulse events={pulseEvents.map((e) => ({ ...e, frame: e.frame - INTRO_FRAMES }))}>
          <AbsoluteFill>
            {data.segments.map((seg, i) => {
              const outputStartFrame = Math.round(seg.outputStart * fps);
              const outputDuration = Math.round((seg.outputEnd - seg.outputStart) * fps);
              const trimStart = seg.inputStart;

              return (
                <Sequence
                  key={i}
                  from={outputStartFrame}
                  durationInFrames={outputDuration}
                >
                  <OffthreadVideo
                    src={`/public/${data.videoFile}`}
                    startFrom={Math.round(trimStart * fps)}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </Sequence>
              );
            })}
          </AbsoluteFill>
        </ZoomPulse>
      </Sequence>

      {/* OVERLAYS (always on top of video) */}
      <Sequence from={INTRO_FRAMES}>
        {/* Particles */}
        <AbsoluteFill style={{ opacity: 0.25 }}>
          <ParticleField count={20} intensity={0.6} />
        </AbsoluteFill>

        {/* Gradient + cinematic bars */}
        <GradientOverlay />

        {/* Cut flash transitions */}
        {cutFrames.map((cf, i) => (
          <CutTransition key={i} fromFrame={cf - INTRO_FRAMES} />
        ))}

        {/* Subtitles */}
        <AnimatedSubtitles subtitles={data.subtitles} />

        {/* Lower third */}
        {data.speakerName && (
          <LowerThird
            name={data.speakerName}
            title={data.title}
            appearAtFrame={30}
            durationFrames={150}
          />
        )}

        {/* Progress bar */}
        <ProgressBar />
      </Sequence>
    </AbsoluteFill>
  );
};
