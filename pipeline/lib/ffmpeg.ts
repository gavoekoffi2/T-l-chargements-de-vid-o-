import { spawn } from "node:child_process";

export type FfArgs = string[];

export const runFfmpeg = (args: FfArgs): Promise<void> =>
  new Promise((resolve, reject) => {
    const proc = spawn("ffmpeg", ["-y", ...args], { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (d) => {
      stderr += d.toString();
    });
    proc.on("error", reject);
    proc.on("close", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`ffmpeg exited with code ${code}\n${stderr.slice(-1500)}`)),
    );
  });

export const probeDurationSeconds = (file: string): Promise<number> =>
  new Promise((resolve, reject) => {
    const proc = spawn("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      file,
    ]);
    let out = "";
    let err = "";
    proc.stdout.on("data", (d) => (out += d.toString()));
    proc.stderr.on("data", (d) => (err += d.toString()));
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code !== 0) return reject(new Error(`ffprobe failed: ${err}`));
      const v = parseFloat(out.trim());
      Number.isFinite(v) ? resolve(v) : reject(new Error(`bad duration: ${out}`));
    });
  });

/**
 * Cut [startSec, endSec] from `input` and crop to 1080x1920 with smart scale.
 * Strategy: scale so the larger of (target-height, source-aspect) fills, then
 * crop centered. Falls back gracefully on portrait sources.
 */
export const cropTo9by16 = async (
  input: string,
  output: string,
  startSec: number,
  endSec: number,
  xOffset = 0,
): Promise<void> => {
  // The vf chain: scale to fit height to 1920 keeping aspect, then crop a
  // centered 1080-wide strip (offset by xOffset px for subject framing).
  const vf = [
    `scale=-2:1920:flags=lanczos`,
    `crop=1080:1920:(in_w-1080)/2+${xOffset}:0`,
    `format=yuv420p`,
  ].join(",");

  await runFfmpeg([
    "-ss",
    String(startSec),
    "-to",
    String(endSec),
    "-i",
    input,
    "-vf",
    vf,
    "-r",
    "30",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "18",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-movflags",
    "+faststart",
    output,
  ]);
};

/**
 * Generate a synthetic 1920x1080 demo video with color bars + tone.
 * Used by `npm run build:demo` so the whole pipeline can be exercised
 * without a real download.
 */
export const makeDemoSource = async (
  output: string,
  durationSec = 12,
): Promise<void> => {
  await runFfmpeg([
    "-f",
    "lavfi",
    "-i",
    `testsrc2=size=1920x1080:rate=30:duration=${durationSec}`,
    "-f",
    "lavfi",
    "-i",
    `sine=frequency=440:duration=${durationSec}`,
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "22",
    "-c:a",
    "aac",
    "-pix_fmt",
    "yuv420p",
    output,
  ]);
};
