export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
// Trimmed source = 84.50 s → 2536 frames @ 30 fps. Pad slightly for the outro CTA tail.
export const VIDEO_DURATION_SEC = 88.0;
export const VIDEO_DURATION_FRAMES = Math.ceil(VIDEO_DURATION_SEC * FPS);
