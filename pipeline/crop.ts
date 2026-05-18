/**
 * Cut each highlight from the source video and crop to 1080x1920 (9:16).
 * Writes one .mp4 per highlight into public/clips/ so Remotion can load it
 * via staticFile().
 */
import { readFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { cropTo9by16 } from "./lib/ffmpeg";
import type { Highlight } from "./lib/heuristic";

const PUBLIC_CLIPS = path.resolve("public", "clips");
const DATA = path.resolve("data");

export const cropAllHighlights = async (
  sourceVideo: string,
  highlights: Highlight[],
  xOffset = 0,
): Promise<{ id: string; videoSrc: string }[]> => {
  mkdirSync(PUBLIC_CLIPS, { recursive: true });
  const results: { id: string; videoSrc: string }[] = [];
  for (const h of highlights) {
    const file = `${h.id}.mp4`;
    const out = path.join(PUBLIC_CLIPS, file);
    process.stdout.write(
      `  cropping ${h.id}  [${h.start.toFixed(1)}s → ${h.end.toFixed(1)}s] … `,
    );
    const t0 = Date.now();
    await cropTo9by16(sourceVideo, out, h.start, h.end, xOffset);
    process.stdout.write(`${((Date.now() - t0) / 1000).toFixed(1)}s\n`);
    results.push({ id: h.id, videoSrc: `clips/${file}` });
  }
  return results;
};

const main = async () => {
  const sourceArg = process.argv.find((a) => a.startsWith("--source="));
  const source = sourceArg
    ? sourceArg.split("=")[1]
    : path.join("downloads", "source.mp4");
  const offsetArg = process.argv.find((a) => a.startsWith("--x="));
  const xOffset = offsetArg ? Number(offsetArg.split("=")[1]) : 0;

  const highlights: Highlight[] = JSON.parse(
    readFileSync(path.join(DATA, "highlights.json"), "utf8"),
  );
  const out = await cropAllHighlights(source, highlights, xOffset);
  console.log(`Cropped ${out.length} clip(s) → public/clips/`);
};

const isMain = process.argv[1]?.endsWith("crop.ts");
if (isMain) main().catch((e) => {
  console.error(e);
  process.exit(1);
});
