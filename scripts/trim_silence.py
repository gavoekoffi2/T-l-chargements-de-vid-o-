#!/usr/bin/env python3
"""
Detect non-silent segments in source2.mp4, build an ffmpeg select-based
trim that drops silence, then re-encodes to 1080x1920 vertical for TikTok.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "downloads" / "source2.mp4"
OUT = ROOT / "downloads" / "source2_trimmed.mp4"
SEG_LOG = ROOT / "downloads" / "segments.json"

# 1. Run silencedetect
print("Running silencedetect…", flush=True)
proc = subprocess.run(
    ["ffmpeg", "-i", str(SRC), "-af", "silencedetect=noise=-28dB:d=0.4", "-f", "null", "-"],
    capture_output=True, text=True
)
output = proc.stderr

starts = [float(m) for m in re.findall(r"silence_start: ([\d.]+)", output)]
ends = [float(m) for m in re.findall(r"silence_end: ([\d.]+) ", output)]

dur_match = re.search(r"Duration: (\d+):(\d+):([\d.]+)", output)
h, m, s = dur_match.groups()
duration = int(h) * 3600 + int(m) * 60 + float(s)
print(f"Source duration: {duration:.2f}s", flush=True)

# 2. Build silence list (merge overlaps)
silences = []
for i, s_start in enumerate(starts):
    s_end = ends[i] if i < len(ends) else duration
    silences.append([s_start, s_end])
silences.sort()
merged = []
for s_start, s_end in silences:
    if merged and s_start <= merged[-1][1] + 0.05:
        merged[-1][1] = max(merged[-1][1], s_end)
    else:
        merged.append([s_start, s_end])

# 3. Compute kept segments
PAD = 0.08
kept = []
cursor = 0.0
for s_start, s_end in merged:
    seg_start = cursor
    seg_end = max(cursor, s_start + PAD)
    if seg_end - seg_start > 0.15:
        kept.append([seg_start, seg_end])
    cursor = max(cursor, s_end - PAD)
if duration - cursor > 0.15:
    kept.append([cursor, duration])

print(f"Found {len(merged)} silences, keeping {len(kept)} speech segments", flush=True)
for s, e in kept:
    print(f"  [{s:6.2f} → {e:6.2f}] ({e-s:.2f}s)")
total_kept = sum(e - s for s, e in kept)
print(f"\nTotal kept: {total_kept:.2f}s (saved {duration - total_kept:.2f}s)")

SEG_LOG.write_text(json.dumps({
    "source": str(SRC.name),
    "original_duration": duration,
    "kept_duration": total_kept,
    "segments": kept,
}, indent=2))

# 4. Build select expression: union of all "between(t, s, e)" terms
v_expr = "+".join(f"between(t,{s:.3f},{e:.3f})" for s, e in kept)
a_expr = v_expr  # same condition for audio

# 5. Run ffmpeg with select + setpts to remove gaps
#    Source has rotation=-90 metadata so ffmpeg auto-rotates it portrait.
#    The decoded frame is already in portrait orientation (2160x3840).
#    We scale to height 1920 keeping aspect, then crop to 1080 width.
cmd = [
    "ffmpeg", "-y", "-i", str(SRC),
    "-vf", (
        f"select='{v_expr}',setpts=N/FRAME_RATE/TB,"
        f"scale=-2:1920:flags=lanczos,crop=1080:1920:(in_w-1080)/2:0"
    ),
    "-af", f"aselect='{a_expr}',asetpts=N/SR/TB",
    "-c:v", "libx264", "-preset", "medium", "-crf", "20",
    "-c:a", "aac", "-b:a", "192k",
    "-movflags", "+faststart",
    str(OUT),
]

print("\nRunning ffmpeg select-based trim…", flush=True)
r = subprocess.run(cmd, capture_output=True, text=True)
if r.returncode != 0:
    print("STDERR (tail):", r.stderr[-2500:])
    sys.exit(1)

probe = subprocess.run(
    ["ffprobe", "-v", "error", "-show_entries",
     "format=duration,size:stream=width,height,codec_name",
     "-of", "default=nw=1", str(OUT)],
    capture_output=True, text=True
)
print("\nOutput info:")
print(probe.stdout)
