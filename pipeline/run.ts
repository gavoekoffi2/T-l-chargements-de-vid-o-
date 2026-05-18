/**
 * End-to-end orchestrator.
 *
 *   tsx pipeline/run.ts <youtube_url> [--handle=@me] [--whisper] [--min=90] [--max=120]
 *   tsx pipeline/run.ts --demo    # synthetic source + fake transcript, used to
 *                                  # validate the whole render path without YouTube.
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { downloadSource } from "./download";
import {
  transcribeFromSrt,
  transcribeWithWhisper,
} from "./transcribe";
import { buildHighlights } from "./highlights";
import { cropAllHighlights } from "./crop";
import { renderAll } from "./render";
import { makeDemoSource } from "./lib/ffmpeg";
import type { Word } from "../src/types";
import { emphasisFor } from "../src/utils/words";

const DATA = path.resolve("data");
const DOWNLOADS = path.resolve("downloads");

const ensureDirs = () =>
  [DATA, DOWNLOADS, path.resolve("out"), path.resolve("public", "clips")].forEach(
    (d) => mkdirSync(d, { recursive: true }),
  );

const argFlag = (name: string) => process.argv.includes(`--${name}`);
const argValue = (name: string, fallback?: string): string | undefined => {
  const a = process.argv.find((a) => a.startsWith(`--${name}=`));
  return a ? a.split("=")[1] : fallback;
};

const buildFakeWords = (): Word[] => {
  const lines = [
    "Le secret que personne ne te dit",
    "c'est que tout le monde ment",
    "Ouvre les yeux maintenant",
    "Imagine ta vie dans cinq ans",
    "si tu ne changes rien aujourd'hui",
    "La vérité c'est que la peur te bloque",
    "et la peur c'est un mensonge",
    "Attaque le truc qui te terrifie",
    "Tu vas découvrir que c'est facile",
    "Le pire c'est de ne pas essayer",
  ];
  const words: Word[] = [];
  let t = 0;
  for (const line of lines) {
    const toks = line.split(" ");
    for (const tok of toks) {
      const dur = 0.18 + Math.random() * 0.25;
      words.push({
        text: tok,
        start: +t.toFixed(3),
        end: +(t + dur).toFixed(3),
        emphasis: emphasisFor(tok, dur * 1000),
      });
      t += dur + 0.04;
    }
    t += 0.25; // mini pause between sentences
  }
  return words;
};

const writeJson = (file: string, data: unknown) =>
  writeFileSync(file, JSON.stringify(data, null, 2));

const main = async () => {
  ensureDirs();
  const demo = argFlag("demo");
  const handle = argValue("handle", "@yourhandle")!;
  const minSec = Number(argValue("min", "90"));
  const maxSec = Number(argValue("max", "120"));
  const maxClipsRaw = argValue("clips");
  const maxClips = maxClipsRaw ? Number(maxClipsRaw) : undefined;
  const useWhisper = argFlag("whisper");

  let sourceVideo: string;
  let words: Word[];

  if (demo) {
    console.log("• DEMO MODE — generating synthetic 1920x1080 source + fake transcript");
    sourceVideo = path.join(DOWNLOADS, "demo-source.mp4");
    if (!existsSync(sourceVideo)) await makeDemoSource(sourceVideo, 60);
    words = buildFakeWords();
  } else {
    const url = process.argv.find((a) => /^https?:\/\//.test(a));
    if (!url) {
      console.error(
        "Usage:\n  tsx pipeline/run.ts <url> [--handle=@me] [--whisper] [--min=90] [--max=120] [--clips=N]\n  tsx pipeline/run.ts --demo",
      );
      process.exit(1);
    }
    console.log(`• downloading ${url}`);
    const dl = await downloadSource(url);
    sourceVideo = dl.video;
    if (useWhisper) {
      console.log("• transcribing with whisper/whisperx (this can take a while)");
      words = await transcribeWithWhisper(sourceVideo);
    } else if (dl.subtitle) {
      console.log(`• reusing YouTube auto-captions: ${dl.subtitle}`);
      words = transcribeFromSrt(dl.subtitle);
    } else {
      console.log("• no SRT available → falling back to whisper");
      words = await transcribeWithWhisper(sourceVideo);
    }
  }

  writeJson(path.join(DATA, "words.json"), words);
  console.log(`  ${words.length} words on the timeline`);

  console.log(`• detecting highlights (min=${minSec}s, max=${maxSec}s)`);
  let highlights = buildHighlights(words, { minSec, maxSec, maxClips });
  if (highlights.length === 0 && demo) {
    // For demo: relax to whatever we can grab.
    console.log("  no >=90s window in demo transcript — relaxing constraints");
    highlights = buildHighlights(words, { minSec: 6, maxSec: 60, maxClips: 1 });
  }
  if (highlights.length === 0) {
    console.error("No highlight matched the criteria. Try --min=60 --max=180.");
    process.exit(2);
  }
  writeJson(path.join(DATA, "highlights.json"), highlights);
  for (const h of highlights) {
    console.log(
      `  ${h.id}  score=${h.score.toFixed(2)}  ${h.start.toFixed(1)}s → ${h.end.toFixed(1)}s  | ${h.hook.slice(0, 60)}`,
    );
  }

  console.log("• cropping clips to 1080x1920");
  const clips = await cropAllHighlights(sourceVideo, highlights);
  writeJson(path.join(DATA, "clips.json"), clips);

  console.log("• rendering with Remotion");
  await renderAll({ highlights, clips, handle });

  console.log("\n✓ Done. Final files:");
  for (const h of highlights) console.log(`   out/${h.id}.mp4`);
};

const isMain = process.argv[1]?.endsWith("run.ts");
if (isMain) main().catch((e) => {
  console.error(e);
  process.exit(1);
});
