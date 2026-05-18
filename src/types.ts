import { z } from "zod";

export const WordSchema = z.object({
  text: z.string(),
  start: z.number(),
  end: z.number(),
  /** 0..1 — used to drive emphasis animations (zoom, color punch). */
  emphasis: z.number().min(0).max(1).default(0),
});
export type Word = z.infer<typeof WordSchema>;

export const HighlightSchema = z.object({
  id: z.string(),
  /** seconds in the source video */
  start: z.number(),
  end: z.number(),
  /** short hook line shown at the very start of the clip */
  hook: z.string(),
  /** ranked virality score 0..1 */
  score: z.number().min(0).max(1),
  /** words that fall inside this clip, with timestamps re-based to 0 */
  words: z.array(WordSchema),
  /** punchy emoji to flash near key moments */
  emoji: z.string().default("🔥"),
});
export type Highlight = z.infer<typeof HighlightSchema>;

export const ClipPropsSchema = z.object({
  highlight: HighlightSchema,
  /** path to the 9:16 cropped clip video, relative to the public/ folder */
  videoSrc: z.string(),
  /** 0..1 — global theme intensity */
  intensity: z.number().min(0).max(1).default(0.9),
  /** optional branding handle shown bottom */
  handle: z.string().default("@yourhandle"),
});
export type ClipProps = z.infer<typeof ClipPropsSchema>;
