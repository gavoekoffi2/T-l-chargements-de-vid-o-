#!/usr/bin/env python3
"""Construit l'EDL depuis la transcription ElevenLabs Scribe (word-level).
Sujet : Prompt Engineering / IA — erreurs courantes.
"""
import json
from pathlib import Path

EDIT    = Path(__file__).parent
TR_PATH = EDIT / "transcripts" / "video3.json"

GAP_CUT = 0.90   # silence >= 0.9s -> coupe
PAD     = 0.30   # padding à chaque bord
DROP_SEGS = []   # index segments à supprimer (bafouillages)

data  = json.load(open(TR_PATH))
WORDS = [w for w in data["words"] if w["type"] == "word"]
DUR   = float(data.get("audio_duration_secs", WORDS[-1]["end"]))

# Convert to video-use format for render.py build_master_srt
vu_words = [{"type":"word","start":w["start"],"end":w["end"],"text":w["text"]}
            for w in WORDS]
vu_tr = {"language": data.get("language_code","fr"), "words": vu_words}
json.dump(vu_tr, open(EDIT/"transcripts"/"video3_vu.json","w"),
          ensure_ascii=False, indent=2)

# Segmenter par silences
segments = []
if WORDS:
    seg_s = WORDS[0]["start"]; seg_e = WORDS[0]["end"]
    for w in WORDS[1:]:
        gap = w["start"] - seg_e
        if gap >= GAP_CUT:
            segments.append((seg_s, seg_e))
            seg_s = w["start"]
        seg_e = w["end"]
    segments.append((seg_s, seg_e))

kept = [s for i,s in enumerate(segments) if i not in DROP_SEGS]

# Padding + fusion
padded = [(max(0.0, a-PAD), min(DUR, b+PAD)) for (a,b) in kept]
merged = [padded[0]]
for a,b in padded[1:]:
    pa,pb = merged[-1]
    if a <= pb: merged[-1] = (pa, max(pb, b))
    else: merged.append((a,b))
padded = merged

edl = {
    "sources": {"video3": "../video3.mp4"},
    "grade": "warm_cinematic",
    "ranges": [{"source":"video3","start":round(a,3),"end":round(b,3)} for (a,b) in padded],
    "overlays": [],
    "subtitles": "master.srt",
}
json.dump(edl, open(EDIT/"edl.json","w"), ensure_ascii=False, indent=2)

total_out = sum(b-a for a,b in padded)
print(f"Source : {DUR:.1f}s  ->  Sortie : {total_out:.1f}s  ({len(padded)} segments)")
print(f"Temps mort supprimé : {DUR-total_out:.1f}s")
for i,(a,b) in enumerate(padded):
    print(f"  [{i:02d}] {a:7.2f} - {b:7.2f}  ({b-a:5.2f}s)")
