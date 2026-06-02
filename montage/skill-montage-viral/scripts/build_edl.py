#!/usr/bin/env python3
"""Construit l'EDL (clean cut) + transcript video-use depuis la sortie whisper.

Règles :
- Fusionne les segments consécutifs séparés par un silence < GAP_CUT (rythme naturel conservé).
- Coupe et supprime tout silence >= GAP_CUT (temps mort éliminé).
- Supprime les segments listés dans DROP (bafouillages / passages confus).
- Padding word-boundary 0.12s à chaque bord.
"""
import json
from pathlib import Path

EDIT = Path(__file__).parent
TRANSCRIPT = Path("/tmp/transcript.json")
SOURCE_NAME = "video"

GAP_CUT = 0.6      # silence >= 0.6s -> on coupe (supprime le temps mort)
PAD = 0.12         # padding à chaque bord de coupe
DROP_SEGMENTS = [5]  # index 0-based : segment bafouillé/confus 60-69s

data = json.load(open(TRANSCRIPT))
segs = data["segments"]

# 1) transcript au format video-use : {"words":[{"type":"word","start","end","text"}]}
words = []
for s in segs:
    for w in s.get("words", []):
        words.append({"type": "word", "start": w["start"], "end": w["end"], "text": w["word"].strip()})
vu_transcript = {"language": "fr", "words": words}
(EDIT / "transcripts").mkdir(exist_ok=True)
json.dump(vu_transcript, open(EDIT / "transcripts" / f"{SOURCE_NAME}.json", "w"),
          ensure_ascii=False, indent=2)

# 2) Construire les ranges en fusionnant les petits gaps, coupant les grands
kept = [s for i, s in enumerate(segs) if i not in DROP_SEGMENTS]

ranges = []
cur_start = kept[0]["start"]
cur_end = kept[0]["end"]
for s in kept[1:]:
    gap = s["start"] - cur_end
    if gap >= GAP_CUT:
        # fermer la range courante, en démarrer une nouvelle
        ranges.append((cur_start, cur_end))
        cur_start = s["start"]
        cur_end = s["end"]
    else:
        # fusionner (on garde le petit silence naturel)
        cur_end = s["end"]
ranges.append((cur_start, cur_end))

# Appliquer le padding (borné aux limites de la vidéo)
DUR = data["duration"]
padded = []
for (a, b) in ranges:
    a2 = max(0.0, a - PAD)
    b2 = min(DUR, b + PAD)
    padded.append((round(a2, 3), round(b2, 3)))

edl = {
    "sources": {SOURCE_NAME: "../public/video.mp4"},
    "grade": "warm_cinematic",
    "ranges": [{"source": SOURCE_NAME, "start": a, "end": b} for (a, b) in padded],
    "overlays": [],
    "subtitles": "master.srt",
}
json.dump(edl, open(EDIT / "edl.json", "w"), ensure_ascii=False, indent=2)

total_out = sum(b - a for a, b in padded)
total_src = DUR
print(f"Source : {total_src:.1f}s  ->  Sortie : {total_out:.1f}s  ({len(padded)} segments)")
print(f"Temps mort supprimé : {total_src - total_out:.1f}s")
print("Ranges :")
for i, (a, b) in enumerate(padded):
    print(f"  [{i:02d}] {a:7.2f} - {b:7.2f}  ({b-a:5.2f}s)")
