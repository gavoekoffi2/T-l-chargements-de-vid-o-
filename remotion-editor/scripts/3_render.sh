#!/usr/bin/env bash
# Render the Remotion VideoEditor composition with the generated data.
# Usage: ./3_render.sh <props_json> [output_file]
#
# props_json format: { "data": { ...EditorData... } }

set -euo pipefail

PROPS_JSON="${1:?Usage: $0 <props_json_file> [output_mp4]}"
OUTPUT="${2:-out/output.mp4}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

if [ ! -d node_modules ]; then
  echo "► Installing dependencies..."
  npm install
fi

echo "► Rendering VideoEditor..."
echo "  Props : $PROPS_JSON"
echo "  Output: $OUTPUT"

npx remotion render VideoEditor "$OUTPUT" \
  --props="$PROPS_JSON" \
  --codec=h264 \
  --jpeg-quality=90 \
  --concurrency=4 \
  --log=progress

echo ""
echo "✓ Render complete → $OUTPUT"
