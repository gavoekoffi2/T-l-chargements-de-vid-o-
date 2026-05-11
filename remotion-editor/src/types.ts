export interface WordToken {
  word: string;
  start: number; // seconds
  end: number;   // seconds
}

export interface SubtitleSegment {
  text: string;
  start: number; // seconds
  end: number;
  words: WordToken[];
}

export interface VideoSegment {
  inputStart: number;  // seconds in original video
  inputEnd: number;
  outputStart: number; // seconds in output timeline
  outputEnd: number;
}

export interface EditorData {
  videoFile: string;
  audioFile?: string;
  durationSec: number;
  fps: number;
  width: number;
  height: number;
  segments: VideoSegment[];
  subtitles: SubtitleSegment[];
  title?: string;
  speakerName?: string;
}
