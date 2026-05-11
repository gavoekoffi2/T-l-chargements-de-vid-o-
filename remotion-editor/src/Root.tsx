import React from "react";
import { Composition } from "remotion";
import { VideoEditor } from "./VideoEditor";
import { EditorData } from "./types";

// Default demo data — replaced at render time by --props
const defaultData: EditorData = {
  videoFile: "input.mp4",
  durationSec: 60,
  fps: 30,
  width: 1920,
  height: 1080,
  segments: [
    { inputStart: 0, inputEnd: 60, outputStart: 0, outputEnd: 60 },
  ],
  subtitles: [
    {
      text: "Bienvenue dans cette vidéo.",
      start: 1,
      end: 3.5,
      words: [
        { word: "Bienvenue", start: 1, end: 1.6 },
        { word: "dans", start: 1.65, end: 1.9 },
        { word: "cette", start: 1.95, end: 2.25 },
        { word: "vidéo.", start: 2.3, end: 3.5 },
      ],
    },
    {
      text: "Aujourd'hui on parle de motion design.",
      start: 4,
      end: 7,
      words: [
        { word: "Aujourd'hui", start: 4, end: 4.7 },
        { word: "on", start: 4.8, end: 5.0 },
        { word: "parle", start: 5.1, end: 5.5 },
        { word: "de", start: 5.6, end: 5.8 },
        { word: "motion", start: 5.9, end: 6.3 },
        { word: "design.", start: 6.4, end: 7.0 },
      ],
    },
  ],
  title: "Ma Vidéo",
  speakerName: "Présentateur",
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="VideoEditor"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      component={VideoEditor as any}
      durationInFrames={defaultData.durationSec * defaultData.fps}
      fps={defaultData.fps}
      width={defaultData.width}
      height={defaultData.height}
      defaultProps={{ data: defaultData }}
      calculateMetadata={({ props }: { props: { data: EditorData } }) => ({
        durationInFrames: Math.round(props.data.durationSec * props.data.fps),
        fps: props.data.fps,
        width: props.data.width,
        height: props.data.height,
      })}
    />
  );
};
