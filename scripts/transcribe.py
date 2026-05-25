#!/usr/bin/env python3
"""Transcrit l'audio mot-à-mot avec timestamps via faster-whisper."""
import json
import sys
from pathlib import Path
from faster_whisper import WhisperModel

AUDIO = Path("downloads/audio.wav")
OUT = Path("downloads/transcript.json")

print("Loading model (medium, CPU int8)…", flush=True)
model = WhisperModel("medium", device="cpu", compute_type="int8")

print("Transcribing…", flush=True)
segments, info = model.transcribe(
    str(AUDIO),
    language="fr",
    word_timestamps=True,
    beam_size=5,
    vad_filter=True,
)

print(f"Detected language: {info.language} (prob {info.language_probability:.2f})", flush=True)

out_segments = []
for seg in segments:
    words = []
    if seg.words:
        for w in seg.words:
            words.append({
                "word": w.word,
                "start": round(w.start, 3),
                "end": round(w.end, 3),
                "prob": round(w.probability, 3),
            })
    out_segments.append({
        "id": seg.id,
        "start": round(seg.start, 3),
        "end": round(seg.end, 3),
        "text": seg.text,
        "words": words,
    })
    print(f"[{seg.start:6.2f} → {seg.end:6.2f}] {seg.text}", flush=True)

OUT.write_text(json.dumps({
    "language": info.language,
    "duration": info.duration,
    "segments": out_segments,
}, ensure_ascii=False, indent=2))
print(f"\nWrote {OUT} with {len(out_segments)} segments")
