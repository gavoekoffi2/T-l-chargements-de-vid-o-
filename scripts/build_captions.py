#!/usr/bin/env python3
"""
Transforme transcript.json (whisper word-timestamps) en captions.json
adapté au style TikTok : groupes de 2-3 mots qui s'affichent rapidement.

Aussi corrige les transcriptions phonétiques évidentes (4-GPT → ChatGPT, etc.)
et exporte une liste d'overlays "logos IA" avec timestamps.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "downloads" / "transcript.json"
OUT_CAPS = ROOT / "remotion-app" / "src" / "captions.json"
OUT_OVERLAYS = ROOT / "remotion-app" / "src" / "overlays.json"

# Phonetic corrections - what whisper heard → what was actually said
CORRECTIONS = [
    (r"4-GPT", "ChatGPT"),
    (r"4-bot", "chatbot"),
    (r"10-Psych", "DeepSeek"),
    (r"OpenClose", "OpenCode"),
    (r"Hermès", "Hermes"),
]

def correct(text: str) -> str:
    for pat, repl in CORRECTIONS:
        text = re.sub(pat, repl, text, flags=re.IGNORECASE)
    return text

# Words to highlight in colored variants
HIGHLIGHT_WORDS = {
    "niveau", "intelligence", "artificielle", "ChatGPT", "Claude",
    "DeepSeek", "N8N", "Make", "Zapier", "OpenCode", "Hermes",
    "Antigravity", "Google", "agents", "orchestrateurs", "automatisations",
    "chatbot", "abonne-toi", "abonnez-vous", "jamais", "transformer",
    "maîtrise", "4", "1", "2", "3",
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

# Group into "phrases" of 2-3 words (TikTok style: short bursts)
GROUP_SIZE = 3
groups = []
i = 0
while i < len(all_words):
    chunk = all_words[i:i + GROUP_SIZE]
    # Break early on long pause inside a chunk
    j = 1
    while j < len(chunk):
        if chunk[j]["start"] - chunk[j - 1]["end"] > 0.6:
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

# Build logo overlays from word timing
# Find first occurrence of each brand in word stream
def find_word_time(needle: str) -> float | None:
    for w in all_words:
        if needle.lower() in w["text"].lower():
            return w["start"]
    return None

overlays = []

# Level 1 brands: ChatGPT, DeepSeek, Claude (around 56-60s)
# "Nous avons des exemples comme ChatGPT, DeepSeek, Claude."
overlays.append({
    "id": "chatgpt", "brand": "ChatGPT", "logo": "chatgpt.svg",
    "color": "#10A37F", "start": 57.0, "duration": 2.6,
    "side": "left", "y": 350,
})
overlays.append({
    "id": "deepseek", "brand": "DeepSeek", "logo": "deepseek.svg",
    "color": "#4D6BFE", "start": 57.9, "duration": 2.6,
    "side": "right", "y": 600,
})
overlays.append({
    "id": "claude", "brand": "Claude", "logo": "claude.svg",
    "color": "#D97757", "start": 58.8, "duration": 2.6,
    "side": "left", "y": 850,
})

# Level 2 brands: N8N, Make, Zapier (around 82-87s)
overlays.append({
    "id": "n8n", "brand": "n8n", "logo": "n8n.svg",
    "color": "#EA4B71", "start": 83.0, "duration": 2.8,
    "side": "left", "y": 350,
})
overlays.append({
    "id": "make", "brand": "Make", "logo": "make.svg",
    "color": "#6D00CC", "start": 83.9, "duration": 2.8,
    "side": "right", "y": 600,
})
overlays.append({
    "id": "zapier", "brand": "Zapier", "logo": "zapier.svg",
    "color": "#FF4F00", "start": 84.8, "duration": 2.8,
    "side": "left", "y": 850,
})

# Level 4: OpenCode, Hermes, Google Antigravity (around 142-148s)
overlays.append({
    "id": "opencode", "brand": "OpenCode", "logo": "chatgpt.svg",
    "color": "#10A37F", "start": 142.0, "duration": 2.8,
    "side": "left", "y": 350,
})
overlays.append({
    "id": "hermes", "brand": "Hermes", "logo": "claude.svg",
    "color": "#9B59B6", "start": 143.2, "duration": 2.8,
    "side": "right", "y": 600,
})
overlays.append({
    "id": "antigravity", "brand": "Antigravity", "logo": "google.svg",
    "color": "#4285F4", "start": 145.5, "duration": 3.2,
    "side": "left", "y": 850,
    "subtitle": "by Google",
})

OUT_OVERLAYS.write_text(json.dumps(overlays, ensure_ascii=False, indent=2))
print(f"Wrote {len(overlays)} overlays → {OUT_OVERLAYS.relative_to(ROOT)}")
