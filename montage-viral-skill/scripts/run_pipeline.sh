#!/usr/bin/env bash
# Pipeline complet montage viral v4
set -e
cd "$(dirname "$0")"
RENDER=/root/.claude/skills/video-use/helpers/render.py
TEMPLATE="${1:-tiktok_yellow}"

echo "=== 1. EDL (coupes) ==="
python3 build_edl.py

echo "=== 2. Plan timeline (overlays + B-roll + SFX) ==="
python3 plan_overlays.py

echo "=== 2b. Keyword popups (hiérarchie visuelle — Règle PRO #2) ==="
python3 keyword_popup.py

echo "=== 3. Base cut+grade (sans overlays) ==="
# edl temporaire sans overlays -> base seule
python3 - << 'PY'
import json,shutil
e=json.load(open("edl.json")); ov=e.get("overlays",[])
e2=dict(e); e2["overlays"]=[]
json.dump(e2,open("_edl_base.json","w"),ensure_ascii=False,indent=2)
PY
python3 $RENDER _edl_base.json -o base_only.mp4 --no-subtitles --no-loudnorm

echo "=== 4. Zoom dynamique sur le locuteur ==="
python3 video_dynamics.py base_only.mp4 base_dyn.mp4 edl.json

echo "=== 5. Compositing overlays (ballotage) ==="
python3 composite.py base_dyn.mp4 composite_nosfx.mp4 edl.json

echo "=== 6. Mixage SFX + loudnorm ==="
python3 mix_sfx.py composite_nosfx.mp4 composite_withsfx.mp4

echo "=== 7. Sous-titres ASS animés (template: $TEMPLATE) ==="
python3 subs_ass.py "$TEMPLATE" master.ass
ASS_ABS=$(realpath master.ass | sed "s/:/\\\\:/g")
ffmpeg -y -i composite_withsfx.mp4 -vf "ass='${ASS_ABS}'" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -c:a copy -movflags +faststart final_montage.mp4

echo "=== 8. Compression web ==="
ffmpeg -y -i final_montage.mp4 -c:v libx264 -crf 26 -preset fast \
  -c:a aac -b:a 128k -movflags +faststart ../final_montage2_web.mp4
echo "=== TERMINÉ -> montage2/final_montage2_web.mp4 ==="
