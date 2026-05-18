import type { Word } from "../../src/types";

export type Highlight = {
  id: string;
  start: number;
  end: number;
  hook: string;
  score: number;
  words: Word[];
  emoji: string;
};

const VIRAL_REGEXES_FR = [
  /\b(le secret|imagine|jamais|toujours|la v[ée]rit[ée]|le truc|l'astuce|attention|incroyable|fou|dingue|personne ne|tout le monde|en fait|en r[ée]alit[ée]|le pire|le meilleur)\b/i,
];
const VIRAL_REGEXES_EN = [
  /\b(the secret|imagine|never|always|the truth|the trick|listen|incredible|insane|nobody|everyone|actually|in reality|the worst|the best|here'?s why)\b/i,
];

const EMOJI_POOL = ["🔥", "💥", "🤯", "👀", "💯", "⚡", "🚀", "💸", "🎯", "✨"];

const reconstructText = (words: Word[]): string =>
  words.map((w) => w.text).join(" ");

const scoreWindow = (words: Word[]): number => {
  if (words.length === 0) return 0;
  const text = reconstructText(words).toLowerCase();
  let score = 0;
  score += (text.match(/[?!]/g)?.length ?? 0) * 0.15;
  score += (text.match(/\byou|votre|tu|ton|ta\b/gi)?.length ?? 0) * 0.04;
  const punchHits = [...VIRAL_REGEXES_FR, ...VIRAL_REGEXES_EN].reduce(
    (s, re) => s + (re.test(text) ? 1 : 0),
    0,
  );
  score += punchHits * 0.35;
  // Word density (words per second).
  const dur = words[words.length - 1].end - words[0].start;
  if (dur > 0) {
    const wps = words.length / dur;
    if (wps > 3.2) score += 0.15;
    if (wps > 4.2) score += 0.15;
  }
  // Emphatic-word ratio.
  const eRatio = words.filter((w) => w.emphasis > 0.4).length / words.length;
  score += eRatio * 0.5;
  return Math.min(1, score);
};

const pickHook = (words: Word[]): string => {
  // The first 6-8 words, uppercased, trimmed.
  const head = words
    .slice(0, 8)
    .map((w) => w.text)
    .join(" ")
    .replace(/[.!?,]+$/g, "")
    .trim();
  return head.toUpperCase();
};

/**
 * Find non-overlapping highlight windows of at least `minSec` seconds,
 * snapped to natural sentence boundaries (full-stop or 350ms+ silence).
 * Returns highlights ranked by descending score.
 */
export const detectHighlights = (
  allWords: Word[],
  opts: { minSec: number; maxSec: number; maxClips?: number },
): Highlight[] => {
  if (allWords.length === 0) return [];

  // Mark sentence boundaries.
  const boundaries: number[] = [0];
  for (let i = 0; i < allWords.length - 1; i++) {
    const w = allWords[i];
    const next = allWords[i + 1];
    const gap = next.start - w.end;
    if (/[.!?]$/.test(w.text) || gap > 0.5) boundaries.push(i + 1);
  }
  boundaries.push(allWords.length);

  const candidates: Highlight[] = [];
  // Slide windows along boundary indices, grow until minSec is met.
  for (let bi = 0; bi < boundaries.length - 1; bi++) {
    const startIdx = boundaries[bi];
    let endIdx = startIdx;
    for (let bj = bi + 1; bj < boundaries.length; bj++) {
      endIdx = boundaries[bj];
      const slice = allWords.slice(startIdx, endIdx);
      if (slice.length < 4) continue;
      const dur = slice[slice.length - 1].end - slice[0].start;
      if (dur < opts.minSec) continue;
      if (dur > opts.maxSec) break;
      const score = scoreWindow(slice);
      const rebased = slice.map((w) => ({
        ...w,
        start: +(w.start - slice[0].start).toFixed(3),
        end: +(w.end - slice[0].start).toFixed(3),
      }));
      const emoji =
        EMOJI_POOL[
          Math.floor(score * 10) % EMOJI_POOL.length
        ];
      candidates.push({
        id: `clip-${bi}-${bj}`,
        start: slice[0].start,
        end: slice[slice.length - 1].end,
        hook: pickHook(slice),
        score,
        words: rebased,
        emoji,
      });
      break; // one window per starting boundary keeps things sparse
    }
  }

  // Sort by score, then greedily pick non-overlapping clips.
  candidates.sort((a, b) => b.score - a.score);
  const picked: Highlight[] = [];
  const overlaps = (h: Highlight) =>
    picked.some((p) => h.start < p.end && p.start < h.end);
  for (const c of candidates) {
    if (overlaps(c)) continue;
    picked.push(c);
    if (opts.maxClips && picked.length >= opts.maxClips) break;
  }
  // Final order: chronological.
  picked.sort((a, b) => a.start - b.start);
  return picked.map((p, i) => ({ ...p, id: `clip-${String(i + 1).padStart(2, "0")}` }));
};
