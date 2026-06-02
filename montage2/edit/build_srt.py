#!/usr/bin/env python3
"""Construit master.srt depuis le transcript video-use (video2_vu.json) + edl.json."""
import sys, json, re
from pathlib import Path

sys.path.insert(0, '/root/.claude/skills/video-use/helpers')
from render import build_master_srt

EDIT = Path(__file__).parent
edl  = json.loads((EDIT/"edl.json").read_text())
# Pointer vers le transcript video-use (format words)
edl_patched = dict(edl)
edl_patched["sources"] = {"video2": "../video2.mp4"}
# La clé transcript = source name = "video2", mais le fichier est video2_vu.json
# On le copie ou renomme temporairement
import shutil
vu_path = EDIT/"transcripts"/"video2.json"
vu_orig = EDIT/"transcripts"/"video2_elevenlabs_orig.json"
if not vu_orig.exists(): shutil.copy(vu_path, vu_orig)
# Remplacer par le format video-use
shutil.copy(EDIT/"transcripts"/"video2_vu.json", vu_path)

build_master_srt(edl_patched, EDIT, EDIT/"master.srt")
print("master.srt généré.")
