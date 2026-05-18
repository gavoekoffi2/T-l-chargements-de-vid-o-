import type { Word } from "../types";

const EMPHATIC = /^(secret|imagine|never|always|incredible|amazing|insane|crazy|mind|blowing|the|key|truth|trick|hack|jamais|toujours|fou|dingue|secret|incroyable|vrai|truc|astuce)$/i;
const PUNCTUATION_PUNCH = /[!?]$/;

/**
 * Compute an emphasis score (0..1) for a word from its text + context.
 * Used to drive scale/color animations on the active word.
 */
export const emphasisFor = (word: string, durationMs: number): number => {
  const cleaned = word.replace(/[.,]/g, "").trim();
  let score = 0;
  if (PUNCTUATION_PUNCH.test(word)) score += 0.5;
  if (cleaned.length >= 7) score += 0.2;
  if (cleaned === cleaned.toUpperCase() && cleaned.length > 2) score += 0.3;
  if (EMPHATIC.test(cleaned)) score += 0.4;
  if (durationMs > 350) score += 0.2;
  return Math.min(1, score);
};

/**
 * Split a phrase into per-word timestamps by dividing duration evenly.
 * Used as a fallback when only phrase-level captions are available.
 */
export const splitPhraseToWords = (
  text: string,
  startMs: number,
  endMs: number,
): Word[] => {
  const tokens = text
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
  if (tokens.length === 0) return [];
  const total = endMs - startMs;
  const per = total / tokens.length;
  return tokens.map((t, i) => {
    const s = startMs + i * per;
    const e = startMs + (i + 1) * per;
    return {
      text: t,
      start: s / 1000,
      end: e / 1000,
      emphasis: emphasisFor(t, per),
    };
  });
};

/**
 * Group words into "pages" of N words for TikTok-style reveal.
 * Each page is displayed while any of its words is active.
 */
export const groupIntoPages = (words: Word[], maxPerPage = 4): Word[][] => {
  const pages: Word[][] = [];
  let buf: Word[] = [];
  for (const w of words) {
    buf.push(w);
    const hasPunch = /[.!?]$/.test(w.text);
    if (buf.length >= maxPerPage || hasPunch) {
      pages.push(buf);
      buf = [];
    }
  }
  if (buf.length) pages.push(buf);
  return pages;
};
