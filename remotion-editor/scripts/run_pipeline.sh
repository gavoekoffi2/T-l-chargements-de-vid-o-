#!/usr/bin/env bash
# Full pipeline: video → silence removal → transcription → Remotion render
#
# Usage:
#   ./run_pipeline.sh <input_video> [options]
#
# Options:
#   --title "My Video"          Title shown in intro slate
#   --speaker "Name"            Speaker name for lower-third
#   --lang fr                   Transcription language (default: fr)
#   --model small               Whisper model (tiny|base|small|medium|large)
#   --silence-db -35            Silence threshold in dB (default: -35)
#   --silence-sec 0.4           Min silence duration to cut (default: 0.4s)
#   --output out/final.mp4      Output file path
#   --skip-silence              Skip silence removal (use full video)
#   --skip-transcribe           Skip transcription (use existing subtitles.json)
#   --width 1920                Output width  (default: 1920)
#   --height 1080               Output height (default: 1080)
#   --fps 30                    Frames per second (default: 30)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# --- Defaults ---
INPUT_VIDEO=""
TITLE=""
SPEAKER=""
LANG="fr"
MODEL="small"
SILENCE_DB="-35"
SILENCE_SEC="0.4"
OUTPUT="out/final.mp4"
SKIP_SILENCE=false
SKIP_TRANSCRIBE=false
WIDTH=1920
HEIGHT=1080
FPS=30

# --- Parse arguments ---
while [[ $# -gt 0 ]]; do
  case "$1" in
    --title)       TITLE="$2";         shift 2 ;;
    --speaker)     SPEAKER="$2";       shift 2 ;;
    --lang)        LANG="$2";          shift 2 ;;
    --model)       MODEL="$2";         shift 2 ;;
    --silence-db)  SILENCE_DB="$2";    shift 2 ;;
    --silence-sec) SILENCE_SEC="$2";   shift 2 ;;
    --output)      OUTPUT="$2";        shift 2 ;;
    --width)       WIDTH="$2";         shift 2 ;;
    --height)      HEIGHT="$2";        shift 2 ;;
    --fps)         FPS="$2";           shift 2 ;;
    --skip-silence)    SKIP_SILENCE=true;    shift ;;
    --skip-transcribe) SKIP_TRANSCRIBE=true; shift ;;
    *)
      if [ -z "$INPUT_VIDEO" ]; then
        INPUT_VIDEO="$1"
      else
        echo "Unknown argument: $1" >&2
        exit 1
      fi
      shift
      ;;
  esac
done

if [ -z "$INPUT_VIDEO" ]; then
  echo "Usage: $0 <input_video> [options]" >&2
  exit 1
fi

if [ ! -f "$INPUT_VIDEO" ]; then
  echo "Error: file not found: $INPUT_VIDEO" >&2
  exit 1
fi

PUBLIC_DIR="$PROJECT_DIR/public"
mkdir -p "$PUBLIC_DIR" "$PROJECT_DIR/out"

# Copy input video into public/
VIDEO_BASENAME="$(basename "$INPUT_VIDEO")"
cp "$INPUT_VIDEO" "$PUBLIC_DIR/$VIDEO_BASENAME"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║        Remotion Motion Design Pipeline           ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "  Input  : $INPUT_VIDEO"
echo "  Output : $OUTPUT"
echo "  Title  : ${TITLE:-<none>}"
echo "  Speaker: ${SPEAKER:-<none>}"
echo ""

# --- Step 1: Get video duration & metadata ---
echo "► [1/4] Reading video metadata..."
DURATION=$(ffprobe -v error -show_entries format=duration \
  -of default=noprint_wrappers=1:nokey=1 "$INPUT_VIDEO")
echo "  Duration: ${DURATION}s"

# Get actual dimensions
VID_WIDTH=$(ffprobe -v error -select_streams v:0 \
  -show_entries stream=width -of csv=p=0 "$INPUT_VIDEO" | head -1)
VID_HEIGHT=$(ffprobe -v error -select_streams v:0 \
  -show_entries stream=height -of csv=p=0 "$INPUT_VIDEO" | head -1)
VID_FPS=$(ffprobe -v error -select_streams v:0 \
  -show_entries stream=r_frame_rate -of csv=p=0 "$INPUT_VIDEO" | head -1)

# Compute FPS as fraction
FPS_COMPUTED=$(python3 -c "
import sys
parts = '${VID_FPS}'.split('/')
if len(parts) == 2:
    v = float(parts[0]) / float(parts[1])
else:
    v = float(parts[0])
print(round(v))
")
FPS="${FPS_COMPUTED}"

echo "  Resolution: ${VID_WIDTH}x${VID_HEIGHT} @ ${FPS}fps"

# --- Step 2: Silence removal ---
SEGMENTS_JSON="$PUBLIC_DIR/segments.json"

if $SKIP_SILENCE; then
  echo "► [2/4] Skipping silence removal (using full video)..."
  python3 -c "
import json
d = float('$DURATION')
segs = [{'inputStart':0,'inputEnd':d,'outputStart':0,'outputEnd':d}]
print(json.dumps(segs, indent=2))
" > "$SEGMENTS_JSON"
else
  echo "► [2/4] Removing silences..."
  bash "$SCRIPT_DIR/1_remove_silence.sh" "$INPUT_VIDEO" "$SILENCE_DB" "$SILENCE_SEC" \
    > "$SEGMENTS_JSON"

  SEG_COUNT=$(python3 -c "import json; d=json.load(open('$SEGMENTS_JSON')); print(len(d))")
  OUTPUT_DUR=$(python3 -c "import json; d=json.load(open('$SEGMENTS_JSON')); print(round(d[-1]['outputEnd'],1)) if d else print(0)")
  SAVED=$(python3 -c "print(round(float('$DURATION') - $OUTPUT_DUR, 1))")
  echo "  ✓ ${SEG_COUNT} segments kept | ${OUTPUT_DUR}s (saved ${SAVED}s of silence)"
fi

# --- Step 3: Transcription ---
SUBTITLES_JSON="$PUBLIC_DIR/subtitles.json"

if $SKIP_TRANSCRIBE && [ -f "$SUBTITLES_JSON" ]; then
  echo "► [3/4] Skipping transcription (using existing $SUBTITLES_JSON)..."
else
  echo "► [3/4] Transcribing with Whisper ($MODEL, lang=$LANG)..."
  python3 "$SCRIPT_DIR/2_transcribe.py" \
    "$INPUT_VIDEO" "$SUBTITLES_JSON" "$MODEL" "$LANG"
fi

# --- Step 4: Build Remotion props JSON & render ---
echo "► [4/4] Building render props..."

OUTPUT_DURATION=$(python3 -c "
import json
segs = json.load(open('$SEGMENTS_JSON'))
print(segs[-1]['outputEnd'] if segs else 0)
")

PROPS_FILE="$PUBLIC_DIR/props.json"
python3 - <<PYEOF
import json, math

segments  = json.load(open("$SEGMENTS_JSON"))
subtitles = json.load(open("$SUBTITLES_JSON"))
fps       = int("$FPS")
width     = int("$VID_WIDTH")
height    = int("$VID_HEIGHT")
title     = "$TITLE"
speaker   = "$SPEAKER"
output_dur = float("$OUTPUT_DURATION")

# Remap subtitle timestamps to output timeline
def remap_time(t_in, segments):
    """Map an input timestamp to the output timeline."""
    for seg in segments:
        if seg['inputStart'] <= t_in <= seg['inputEnd']:
            offset = t_in - seg['inputStart']
            return seg['outputStart'] + offset
    return None

remapped_subs = []
for sub in subtitles:
    t_start = remap_time(sub['start'], segments)
    t_end   = remap_time(sub['end'],   segments)
    if t_start is None or t_end is None:
        continue  # this segment was cut

    remapped_words = []
    for w in sub.get('words', []):
        wt_start = remap_time(w['start'], segments)
        wt_end   = remap_time(w['end'],   segments)
        if wt_start is not None and wt_end is not None:
            remapped_words.append({
                'word':  w['word'],
                'start': round(wt_start, 3),
                'end':   round(wt_end,   3),
            })

    remapped_subs.append({
        'text':  sub['text'],
        'start': round(t_start, 3),
        'end':   round(t_end,   3),
        'words': remapped_words,
    })

props = {
    "data": {
        "videoFile":    "$VIDEO_BASENAME",
        "durationSec":  round(output_dur, 3),
        "fps":          fps,
        "width":        width,
        "height":       height,
        "segments":     segments,
        "subtitles":    remapped_subs,
        "title":        title if title else None,
        "speakerName":  speaker if speaker else None,
    }
}

with open("$PROPS_FILE", "w", encoding="utf-8") as f:
    json.dump(props, f, ensure_ascii=False, indent=2)

print(f"  Props written: {len(remapped_subs)} subtitle segments")
PYEOF

echo "► Rendering..."
bash "$SCRIPT_DIR/3_render.sh" "$PROPS_FILE" "$OUTPUT"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  Pipeline complete!                              ║"
echo "╚══════════════════════════════════════════════════╝"
echo "  Output: $OUTPUT"
echo ""
