export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
// Source video duration = 166.302s → 4989 frames @ 30fps. Round up safely.
export const VIDEO_DURATION_SEC = 166.302;
export const VIDEO_DURATION_FRAMES = Math.ceil(VIDEO_DURATION_SEC * FPS); // 4990
