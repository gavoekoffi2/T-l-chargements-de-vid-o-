#!/usr/bin/env bash
# Detect and remove silences from a video, output trimmed segments as a JSON list.
# Usage: ./1_remove_silence.sh <input_video> [silence_threshold_dB] [min_silence_sec]
# Output: writes segments.json and merged_video.mp4 to public/

set -euo pipefail

INPUT="${1:?Usage: $0 <input_video> [threshold_dB] [min_silence_sec]}"
THRESHOLD="${2:--35}"        # dB below which is considered silence
MIN_SILENCE="${3:-0.4}"      # seconds of silence needed to trigger a cut
MIN_SPEECH="0.8"             # minimum speech segment to keep (sec)
PADDING="0.08"               # seconds to keep around each speech segment

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PUBLIC_DIR="$PROJECT_DIR/public"

mkdir -p "$PUBLIC_DIR"

echo "► Analysing silences in: $INPUT"
echo "  threshold=${THRESHOLD}dB  min_silence=${MIN_SILENCE}s  padding=${PADDING}s"

# --- Step 1: detect silence with FFmpeg silencedetect ---
SILENCE_LOG=$(mktemp /tmp/silence_XXXXXX.txt)
ffmpeg -i "$INPUT" \
  -af "silencedetect=noise=${THRESHOLD}dB:d=${MIN_SILENCE}" \
  -f null - 2>&1 | grep "silence_" > "$SILENCE_LOG" || true

echo "  Raw silence events:"
cat "$SILENCE_LOG"

# --- Step 2: parse silence events → speech intervals (Python) ---
DURATION=$(ffprobe -v error -show_entries format=duration \
  -of default=noprint_wrappers=1:nokey=1 "$INPUT")

python3 - "$SILENCE_LOG" "$DURATION" "$MIN_SPEECH" "$PADDING" <<'PYEOF'
import sys, json, re, math

silence_log  = sys.argv[1]
total_dur    = float(sys.argv[2])
min_speech   = float(sys.argv[3])
padding      = float(sys.argv[4])

silences = []
starts = {}
with open(silence_log) as f:
    for line in f:
        ms = re.search(r'silence_start: ([\d.]+)', line)
        me = re.search(r'silence_end: ([\d.]+)', line)
        if ms:
            starts['start'] = float(ms.group(1))
        if me and 'start' in starts:
            silences.append((starts.pop('start'), float(me.group(1))))

# Handle trailing silence
if 'start' in starts:
    silences.append((starts['start'], total_dur))

# Build speech segments = gaps between silences
speech = []
cursor = 0.0
for (s_start, s_end) in silences:
    seg_start = max(0.0, cursor - padding)
    seg_end   = min(total_dur, s_start + padding)
    if seg_end - seg_start >= min_speech:
        speech.append({'start': round(seg_start, 3), 'end': round(seg_end, 3)})
    cursor = s_end

# Tail segment
seg_start = max(0.0, cursor - padding)
if total_dur - seg_start >= min_speech:
    speech.append({'start': round(seg_start, 3), 'end': round(total_dur, 3)})

# Build output timeline
output_cursor = 0.0
segments = []
for seg in speech:
    dur = seg['end'] - seg['start']
    segments.append({
        'inputStart':  seg['start'],
        'inputEnd':    seg['end'],
        'outputStart': round(output_cursor, 3),
        'outputEnd':   round(output_cursor + dur, 3),
    })
    output_cursor += dur

print(json.dumps(segments, indent=2))
PYEOF
