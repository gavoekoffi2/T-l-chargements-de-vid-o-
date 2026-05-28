#!/usr/bin/env python3
"""Build captions2.json and overlays2.json from transcript2.json."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "downloads" / "transcript2.json"
OUT_CAPS = ROOT / "remotion-app" / "src" / "captions2.json"
OUT_OVERLAYS = ROOT / "remotion-app" / "src" / "overlays2.json"

# Phonetic / spelling corrections from whisper output
CORRECTIONS = [
    (r"\btest\b", "texte"),       # "donnes test" → "donnes texte"
    (r"\bろう\b", "Oui"),         # Japanese chars from misrecognition
    (r"\bquand vous\b", "quand vous"),
    (r"\bPrendons\b", "Prennent"),
]

def correct(text: str) -> str:
    for pat, repl in CORRECTIONS:
        text = re.sub(pat, repl, text)
    return text

HIGHLIGHT_WORDS = {
    "Google", "Gemini", "Harmony", "vidéo", "vidéos", "intelligence", "artificielle",
    "révolution", "IA", "nouvelle", "technologie", "littéralement", "extraordinaire",
    "puissante", "boostées", "navigation", "abonner", "abonne-toi", "maîtrisent",
    "avance", "interface", "automatiquement", "test", "texte", "images", "idée",
    "Wow",
}

def normalize_highlight(word: str) -> bool:
    cleaned = re.sub(r"[^\wÀ-ÿ-]", "", word).strip()
    return cleaned in HIGHLIGHT_WORDS or cleaned.lower() in {w.lower() for w in HIGHLIGHT_WORDS}

data = json.loads(SRC.read_text())
all_words = []
for seg in data["segments"]:
    for w in seg["words"]:
        raw = w["word"].strip()
        if not raw:
            continue
        all_words.append({
            "text": correct(raw),
            "start": w["start"],
            "end": w["end"],
            "highlight": normalize_highlight(correct(raw)),
        })

GROUP_SIZE = 3
groups = []
i = 0
while i < len(all_words):
    chunk = all_words[i:i + GROUP_SIZE]
    j = 1
    while j < len(chunk):
        if chunk[j]["start"] - chunk[j - 1]["end"] > 0.5:
            chunk = chunk[:j]
            break
        j += 1
    text = " ".join(w["text"] for w in chunk).strip()
    groups.append({
        "text": text,
        "start": chunk[0]["start"],
        "end": chunk[-1]["end"],
        "words": chunk,
        "hasHighlight": any(w["highlight"] for w in chunk),
    })
    i += len(chunk)

OUT_CAPS.write_text(json.dumps(groups, ensure_ascii=False, indent=2))
print(f"Wrote {len(groups)} caption groups → {OUT_CAPS.relative_to(ROOT)}")

# Overlays for brands mentioned in this video
overlays = [
    # "Google vient de faire sortir une nouvelle technologie" (0.2-2s)
    {
        "id": "google-intro", "brand": "Google", "logo": "google.svg",
        "color": "#4285F4", "start": 0.3, "duration": 2.0,
        "side": "left", "y": 130,
    },
    # "Gemini Harmony" mentioned ~22s
    {
        "id": "gemini-harmony", "brand": "Gemini Harmony", "logo": "google.svg",
        "color": "#8E54E9", "start": 22.0, "duration": 3.0,
        "side": "right", "y": 130,
        "subtitle": "by Google",
    },
    # "nouvelle interface pour Gemini" ~42s
    {
        "id": "gemini", "brand": "Gemini 3.0", "logo": "google.svg",
        "color": "#1E88E5", "start": 41.5, "duration": 3.0,
        "side": "left", "y": 130,
    },
    # "intelligence artificielle dans la navigation" ~55s
    {
        "id": "ai-search", "brand": "AI Search", "logo": "google.svg",
        "color": "#34A853", "start": 55.0, "duration": 2.5,
        "side": "right", "y": 130,
    },
]

OUT_OVERLAYS.write_text(json.dumps(overlays, ensure_ascii=False, indent=2))
print(f"Wrote {len(overlays)} overlays → {OUT_OVERLAYS.relative_to(ROOT)}")
