#!/usr/bin/env python3
"""Construit l'EDL depuis la transcription ElevenLabs Scribe (word-level).
Règle PRO #1 — RYTHME : coupes agressives (GAP_CUT 0.65s), détection fillers.
"""
import json, re
from pathlib import Path

EDIT    = Path(__file__).parent
TR_PATH = EDIT / "transcripts" / "video4.json"

GAP_CUT = 0.65   # silence >= 0.65s -> coupe
PAD     = 0.25   # padding à chaque bord
DROP_SEGS = []   # index segments à supprimer manuellement

FILLERS = {"euh","hm","hmm","ah","eh","bon","bah","ben","hein","voilà",
           "donc","alors","en fait","genre","quoi","ouais","ok"}

data  = json.load(open(TR_PATH))
WORDS = [w for w in data["words"] if w["type"] == "word"]
DUR   = float(data.get("audio_duration_secs", WORDS[-1]["end"]))

video_name = TR_PATH.stem
vu_words = [{"type":"word","start":w["start"],"end":w["end"],"text":w["text"]}
            for w in WORDS]
vu_tr = {"language": data.get("language_code","fr"), "words": vu_words}
json.dump(vu_tr, open(EDIT/"transcripts"/f"{video_name}_vu.json","w"),
          ensure_ascii=False, indent=2)

# Segmenter par silences
segments = []
if WORDS:
    seg_words = [WORDS[0]]
    for w in WORDS[1:]:
        gap = w["start"] - seg_words[-1]["end"]
        if gap >= GAP_CUT:
            segments.append(seg_words)
            seg_words = [w]
        else:
            seg_words.append(w)
    segments.append(seg_words)

def is_filler(seg_words):
    txt = " ".join(w["text"].lower().strip(".,!?;:") for w in seg_words)
    dur = seg_words[-1]["end"] - seg_words[0]["start"]
    return txt in FILLERS or (dur < 0.4 and txt in FILLERS)

kept_segs = [(sw[0]["start"], sw[-1]["end"])
             for i, sw in enumerate(segments)
             if i not in DROP_SEGS and not is_filler(sw)]

# Padding + fusion
padded = [(max(0.0, a-PAD), min(DUR, b+PAD)) for (a,b) in kept_segs]
merged = [padded[0]]
for a,b in padded[1:]:
    pa,pb = merged[-1]
    if a <= pb: merged[-1] = (pa, max(pb, b))
    else: merged.append((a,b))
padded = merged

edl = {
    "sources": {video_name: f"../{video_name}.mp4"},
    "grade": "warm_cinematic",
    "ranges": [{"source":video_name,"start":round(a,3),"end":round(b,3)} for (a,b) in padded],
    "overlays": [],
    "subtitles": "master.srt",
}
json.dump(edl, open(EDIT/"edl.json","w"), ensure_ascii=False, indent=2)

total_out = sum(b-a for a,b in padded)
print(f"Source : {DUR:.1f}s  ->  Sortie : {total_out:.1f}s  ({len(padded)} segments)")
print(f"Temps mort supprimé : {DUR-total_out:.1f}s  (GAP_CUT={GAP_CUT}s)")
for i,(a,b) in enumerate(padded):
    print(f"  [{i:02d}] {a:7.2f} - {b:7.2f}  ({b-a:5.2f}s)")
