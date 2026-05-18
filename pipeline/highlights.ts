/**
 * Read data/words.json, detect viral moments, write data/highlights.json.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { detectHighlights } from "./lib/heuristic";
import type { Word } from "../src/types";

const DATA = path.resolve("data");

export const buildHighlights = (
  words: Word[],
  opts: { minSec: number; maxSec: number; maxClips?: number },
) => detectHighlights(words, opts);

const main = () => {
  const args = process.argv.slice(2);
  const arg = (name: string, fallback: number) => {
    const f = args.find((a) => a.startsWith(`--${name}=`));
    return f ? Number(f.split("=")[1]) : fallback;
  };
  const minSec = arg("min", 90);
  const maxSec = arg("max", 120);
  const maxClips = args.find((a) => a.startsWith("--clips="))
    ? Number(args.find((a) => a.startsWith("--clips="))!.split("=")[1])
    : undefined;

  const wordsPath = path.join(DATA, "words.json");
  const words: Word[] = JSON.parse(readFileSync(wordsPath, "utf8"));
  const highlights = buildHighlights(words, { minSec, maxSec, maxClips });
  mkdirSync(DATA, { recursive: true });
  const out = path.join(DATA, "highlights.json");
  writeFileSync(out, JSON.stringify(highlights, null, 2));
  console.log(
    `Picked ${highlights.length} highlight(s):\n` +
      highlights
        .map(
          (h) =>
            `  ${h.id}  score=${h.score.toFixed(2)}  ${h.start.toFixed(1)}s → ${h.end.toFixed(1)}s  | ${h.hook.slice(0, 60)}`,
        )
        .join("\n"),
  );
};

const isMain = process.argv[1]?.endsWith("highlights.ts");
if (isMain) {
  try {
    main();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
