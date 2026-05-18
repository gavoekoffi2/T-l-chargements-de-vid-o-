/**
 * Produce word-level timestamps for the source video.
 *
 * Strategy:
 *   1. If an SRT sidecar (from YouTube auto-subs) is provided, parse it
 *      and split phrase-level cues into approximate per-word timestamps.
 *      Fast, no GPU, no extra deps. ~Good enough~ for the heuristic stage.
 *   2. If `--whisper` is passed, shell out to `whisperx` (preferred) or
 *      `whisper` CLI with --word_timestamps to get true per-word timing.
 *      Requires a local install of one of these tools.
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { subtitlesToWords } from "../src/utils/srt";
import { emphasisFor } from "../src/utils/words";
import type { Word } from "../src/types";

const DATA = path.resolve("data");

const run = (cmd: string, args: string[]): Promise<string> =>
  new Promise((resolve, reject) => {
    let out = "";
    let err = "";
    const proc = spawn(cmd, args);
    proc.stdout.on("data", (d) => (out += d.toString()));
    proc.stderr.on("data", (d) => (err += d.toString()));
    proc.on("error", reject);
    proc.on("close", (code) =>
      code === 0 ? resolve(out) : reject(new Error(`${cmd} failed: ${err}`)),
    );
  });

const which = async (bin: string): Promise<boolean> => {
  try {
    await run("which", [bin]);
    return true;
  } catch {
    return false;
  }
};

const recomputeEmphasis = (words: Word[]): Word[] =>
  words.map((w) => ({
    ...w,
    emphasis: emphasisFor(w.text, (w.end - w.start) * 1000),
  }));

export const transcribeFromSrt = (srtPath: string): Word[] => {
  const raw = readFileSync(srtPath, "utf8");
  return recomputeEmphasis(subtitlesToWords(raw));
};

/**
 * Run whisperx (or whisper) on the audio and return word-level timestamps.
 * whisperx produces JSON with word_timestamps natively.
 */
export const transcribeWithWhisper = async (
  videoPath: string,
  outDir = DATA,
): Promise<Word[]> => {
  mkdirSync(outDir, { recursive: true });
  if (await which("whisperx")) {
    await run("whisperx", [
      videoPath,
      "--output_dir",
      outDir,
      "--output_format",
      "json",
      "--compute_type",
      "int8",
      "--model",
      process.env.WHISPER_MODEL ?? "medium",
    ]);
    const base = path.basename(videoPath).replace(/\.[^.]+$/, "");
    const jsonPath = path.join(outDir, `${base}.json`);
    return parseWhisperxJson(jsonPath);
  }
  if (await which("whisper")) {
    await run("whisper", [
      videoPath,
      "--output_dir",
      outDir,
      "--output_format",
      "json",
      "--word_timestamps",
      "True",
      "--model",
      process.env.WHISPER_MODEL ?? "small",
    ]);
    const base = path.basename(videoPath).replace(/\.[^.]+$/, "");
    const jsonPath = path.join(outDir, `${base}.json`);
    return parseOpenAiWhisperJson(jsonPath);
  }
  throw new Error(
    "No whisperx/whisper found. Install with: pip install whisperx (or: pip install openai-whisper)",
  );
};

const parseWhisperxJson = (file: string): Word[] => {
  const j = JSON.parse(readFileSync(file, "utf8"));
  const words: Word[] = [];
  for (const seg of j.segments ?? []) {
    for (const w of seg.words ?? []) {
      if (typeof w.start !== "number" || typeof w.end !== "number") continue;
      words.push({
        text: String(w.word ?? "").trim(),
        start: w.start,
        end: w.end,
        emphasis: 0,
      });
    }
  }
  return recomputeEmphasis(words);
};

const parseOpenAiWhisperJson = (file: string): Word[] => {
  const j = JSON.parse(readFileSync(file, "utf8"));
  const words: Word[] = [];
  for (const seg of j.segments ?? []) {
    for (const w of seg.words ?? []) {
      words.push({
        text: String(w.word ?? "").trim(),
        start: w.start,
        end: w.end,
        emphasis: 0,
      });
    }
  }
  return recomputeEmphasis(words);
};

const main = async () => {
  const args = process.argv.slice(2);
  const flag = args.find((a) => a === "--whisper");
  const file = args.find((a) => !a.startsWith("--"));
  if (!file) {
    console.error(
      "Usage: tsx pipeline/transcribe.ts <source.srt | source.mp4> [--whisper]",
    );
    process.exit(1);
  }
  if (!existsSync(file)) {
    console.error(`File not found: ${file}`);
    process.exit(1);
  }
  const words = flag
    ? await transcribeWithWhisper(file)
    : transcribeFromSrt(file);
  mkdirSync(DATA, { recursive: true });
  const out = path.join(DATA, "words.json");
  writeFileSync(out, JSON.stringify(words, null, 2));
  console.log(`Wrote ${words.length} words → ${out}`);
};

const isMain = process.argv[1]?.endsWith("transcribe.ts");
if (isMain) main().catch((e) => {
  console.error(e);
  process.exit(1);
});
