import React from "react";
import {
  Composition,
  Series,
  AbsoluteFill,
  Sequence,
} from "remotion";
import { Intro } from "./compositions/Intro";
import { VideoWithOverlays } from "./compositions/VideoWithOverlays";
import { Outro } from "./compositions/Outro";
import { Transition } from "./compositions/Transition";
import {
  VIDEO_FPS,
  VIDEO_WIDTH,
  VIDEO_HEIGHT,
  INTRO_DURATION,
  MAIN_DURATION,
  OUTRO_DURATION,
} from "./constants";

// Durée de chaque transition (en frames)
const TRANS_DURATION = 24;

// Durée totale avec transitions
const TOTAL =
  INTRO_DURATION +
  TRANS_DURATION +
  MAIN_DURATION +
  TRANS_DURATION +
  OUTRO_DURATION;

// Composition principale — assemble intro + vidéo + outro
const MainComposition: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Series>
        {/* ── Intro ── */}
        <Series.Sequence durationInFrames={INTRO_DURATION}>
          <Intro />
        </Series.Sequence>

        {/* ── Transition Sweep ── */}
        <Series.Sequence durationInFrames={TRANS_DURATION}>
          <Transition type="sweep" />
        </Series.Sequence>

        {/* ── Vidéo avec overlays ── */}
        <Series.Sequence durationInFrames={MAIN_DURATION}>
          <VideoWithOverlays />
        </Series.Sequence>

        {/* ── Transition Glitch ── */}
        <Series.Sequence durationInFrames={TRANS_DURATION}>
          <Transition type="glitch" />
        </Series.Sequence>

        {/* ── Outro ── */}
        <Series.Sequence durationInFrames={OUTRO_DURATION}>
          <Outro />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};

// Prévisualisation Intro seule
const IntroPreview: React.FC = () => <Intro />;

// Prévisualisation Outro seule
const OutroPreview: React.FC = () => <Outro />;

// Prévisualisation Vidéo seule
const VideoPreview: React.FC = () => <VideoWithOverlays />;

export const Root: React.FC = () => {
  return (
    <>
      {/* Composition finale complète */}
      <Composition
        id="MainComposition"
        component={MainComposition}
        durationInFrames={TOTAL}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        defaultProps={{}}
      />

      {/* Prévisualisations individuelles */}
      <Composition
        id="IntroPreview"
        component={IntroPreview}
        durationInFrames={INTRO_DURATION}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        defaultProps={{}}
      />

      <Composition
        id="VideoPreview"
        component={VideoPreview}
        durationInFrames={MAIN_DURATION}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        defaultProps={{}}
      />

      <Composition
        id="OutroPreview"
        component={OutroPreview}
        durationInFrames={OUTRO_DURATION}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        defaultProps={{}}
      />
    </>
  );
};
