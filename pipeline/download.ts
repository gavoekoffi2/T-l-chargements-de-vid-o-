/**
 * Download a YouTube (or compatible) source video + best subtitles available.
 * Writes `source.mp4` and (when possible) `source.<lang>.srt` to ./downloads.
 *
 * If yt-dlp returns 403 (cloud IPs are often blocked by YouTube), pass cookies:
 *   COOKIES_FROM_BROWSER=firefox npm run download -- "<url>"
 *   COOKIES=./cookies.txt npm run download -- "<url>"
 */
import { spawn } from "node:child_process";
import { mkdirSync, existsSync, readdirSync, renameSync } from "node:fs";
import path from "node:path";

const DOWNLOADS = path.resolve("downloads");

const run = (cmd: string, args: string[]): Promise<void> =>
  new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: "inherit" });
    proc.on("error", reject);
    proc.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`${cmd} exited with ${code}`)),
    );
  });

export const downloadSource = async (
  url: string,
  langs: string[] = ["fr", "en", "fr-orig", "fr-auto", "en-auto"],
): Promise<{ video: string; subtitle?: string }> => {
  mkdirSync(DOWNLOADS, { recursive: true });

  const args = [
    "--no-check-certificates",
    "--no-warnings",
    "--concurrent-fragments",
    "4",
    "--retries",
    "5",
    "--fragment-retries",
    "5",
    "--user-agent",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
    "--write-subs",
    "--write-auto-subs",
    "--sub-langs",
    langs.join(","),
    "--convert-subs",
    "srt",
    "--sub-format",
    "srt/best",
    "-f",
    "bv*[height<=1080]+ba/b[height<=1080]",
    "--merge-output-format",
    "mp4",
    "-o",
    path.join(DOWNLOADS, "source.%(ext)s"),
  ];
  if (process.env.COOKIES) args.push("--cookies", process.env.COOKIES);
  if (process.env.COOKIES_FROM_BROWSER)
    args.push("--cookies-from-browser", process.env.COOKIES_FROM_BROWSER);

  await run("yt-dlp", [...args, url]);

  const video = path.join(DOWNLOADS, "source.mp4");
  if (!existsSync(video))
    throw new Error(`yt-dlp finished but ${video} is missing`);

  // Pick the first .srt sidecar.
  const srt = readdirSync(DOWNLOADS).find(
    (f) => f.startsWith("source.") && f.endsWith(".srt"),
  );
  let subtitle: string | undefined;
  if (srt) {
    subtitle = path.join(DOWNLOADS, "source.srt");
    if (srt !== "source.srt") renameSync(path.join(DOWNLOADS, srt), subtitle);
  }
  return { video, subtitle };
};

const main = async () => {
  const url = process.argv[2];
  if (!url) {
    console.error("Usage: npm run download -- <youtube_url>");
    process.exit(1);
  }
  const r = await downloadSource(url);
  console.log(JSON.stringify(r, null, 2));
};

const isMain =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith("download.ts");
if (isMain) main().catch((e) => {
  console.error(e);
  process.exit(1);
});
