import type { Word } from "../types";
import { splitPhraseToWords } from "./words";

type Cue = { startMs: number; endMs: number; text: string };

const parseTimestamp = (s: string): number => {
  // 00:00:01,234 or 00:00:01.234
  const m = s.trim().match(/(\d+):(\d+):(\d+)[,.](\d+)/);
  if (!m) return 0;
  const [, h, mi, se, ms] = m;
  return (
    Number(h) * 3600000 +
    Number(mi) * 60000 +
    Number(se) * 1000 +
    Number(ms.padEnd(3, "0").slice(0, 3))
  );
};

const stripTags = (s: string): string =>
  s.replace(/<[^>]+>/g, "").replace(/\{[^}]+\}/g, "").trim();

/**
 * Parse SRT or WebVTT into raw cues (phrase-level).
 */
export const parseSubtitles = (raw: string): Cue[] => {
  const text = raw.replace(/\r\n/g, "\n").replace(/^WEBVTT.*\n+/, "");
  const blocks = text.split(/\n\n+/);
  const cues: Cue[] = [];
  for (const block of blocks) {
    const lines = block.split("\n").filter(Boolean);
    const tsLine = lines.find((l) => /-->/.test(l));
    if (!tsLine) continue;
    const [a, b] = tsLine.split("-->").map((x) => x.trim().split(" ")[0]);
    const startMs = parseTimestamp(a);
    const endMs = parseTimestamp(b);
    const body = lines
      .filter((l) => !/-->/.test(l) && !/^\d+$/.test(l.trim()))
      .map(stripTags)
      .join(" ")
      .trim();
    if (body && endMs > startMs) cues.push({ startMs, endMs, text: body });
  }
  // YouTube auto-captions emit a lot of duplicate rolling cues — dedupe.
  return dedupeRolling(cues);
};

const dedupeRolling = (cues: Cue[]): Cue[] => {
  const out: Cue[] = [];
  let lastText = "";
  for (const c of cues) {
    if (c.text === lastText) continue;
    // Skip cues that are pure prefixes of the previous (rolling captions).
    if (out.length && c.text.startsWith(out[out.length - 1].text)) {
      out[out.length - 1] = c;
    } else {
      out.push(c);
    }
    lastText = c.text;
  }
  return out;
};

/**
 * Convert subtitle file content into word-level timestamps.
 * If the file contains per-word timestamps (whisper JSON-style SRT),
 * those would be parsed differently — see transcribe.ts.
 */
export const subtitlesToWords = (raw: string): Word[] => {
  const cues = parseSubtitles(raw);
  return cues.flatMap((c) => splitPhraseToWords(c.text, c.startMs, c.endMs));
};
