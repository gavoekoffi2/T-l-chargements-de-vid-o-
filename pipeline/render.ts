/**
 * Programmatic Remotion render: bundles src/index.ts, then renders one
 * 9:16 mp4 per highlight by passing inputProps to the same composition.
 */
import { readFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import type { Highlight } from "./lib/heuristic";
import { THEME } from "../src/utils/theme";

const DATA = path.resolve("data");
const OUT = path.resolve("out");

/**
 * Try to locate a Chromium binary already installed on the system. Useful
 * when the network policy blocks Remotion's auto-download of Chrome Headless
 * Shell (cloud sandboxes routinely 403 remotion.media).
 */
const findChromium = (): string | undefined => {
  if (process.env.REMOTION_CHROME_PATH) return process.env.REMOTION_CHROME_PATH;
  // Prefer chrome-headless-shell (Remotion's expected runtime) over full chrome.
  const candidates = [
    "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  ];
  for (const c of candidates) if (existsSync(c)) return c;
  return undefined;
};

export const renderAll = async (opts: {
  highlights: Highlight[];
  clips: { id: string; videoSrc: string }[];
  handle?: string;
  concurrency?: number | null;
}) => {
  mkdirSync(OUT, { recursive: true });

  const browserExecutable = findChromium();
  if (browserExecutable)
    console.log(`• using chromium at ${browserExecutable}`);

  const entry = path.resolve("src", "index.ts");
  console.log("• bundling Remotion project …");
  const serveUrl = await bundle({
    entryPoint: entry,
    webpackOverride: (c) => c,
  });
  console.log(`  bundle ready: ${serveUrl}`);

  const handle = opts.handle ?? "@yourhandle";

  for (const h of opts.highlights) {
    const clip = opts.clips.find((c) => c.id === h.id);
    if (!clip) {
      console.warn(`  skip ${h.id}: no cropped clip`);
      continue;
    }
    const dur = h.end - h.start;
    const durationInFrames = Math.max(1, Math.round(dur * THEME.fps));
    const inputProps = {
      highlight: h,
      videoSrc: clip.videoSrc,
      handle,
      intensity: 0.95,
      durationInFrames,
    };

    const composition = await selectComposition({
      serveUrl,
      id: "TikTokClip",
      inputProps,
      browserExecutable,
    });

    const outFile = path.join(OUT, `${h.id}.mp4`);
    console.log(`• rendering ${h.id} (${dur.toFixed(1)}s → ${outFile})`);
    await renderMedia({
      serveUrl,
      composition: {
        ...composition,
        durationInFrames,
      },
      codec: "h264",
      outputLocation: outFile,
      inputProps,
      concurrency: opts.concurrency ?? null,
      audioBitrate: "192k",
      videoBitrate: "8M",
      x264Preset: "veryfast",
      browserExecutable,
    });
    console.log(`  ✓ ${outFile}`);
  }
};

const main = async () => {
  const highlights: Highlight[] = JSON.parse(
    readFileSync(path.join(DATA, "highlights.json"), "utf8"),
  );
  const clips: { id: string; videoSrc: string }[] = JSON.parse(
    readFileSync(path.join(DATA, "clips.json"), "utf8"),
  );
  const handleArg = process.argv.find((a) => a.startsWith("--handle="));
  await renderAll({
    highlights,
    clips,
    handle: handleArg ? handleArg.split("=")[1] : undefined,
  });
};

const isMain = process.argv[1]?.endsWith("render.ts");
if (isMain) main().catch((e) => {
  console.error(e);
  process.exit(1);
});
