#!/usr/bin/env python3
"""Transcription locale avec faster-whisper (sans clé API)."""
import json, sys, time
from faster_whisper import WhisperModel

AUDIO = "/tmp/audio16k.wav"
OUT = "/tmp/transcript.json"

t0 = time.time()
print("Chargement du modèle small (int8)...", flush=True)
model = WhisperModel("small", device="cpu", compute_type="int8")

print("Transcription en cours...", flush=True)
segments, info = model.transcribe(
    AUDIO,
    language="fr",
    word_timestamps=True,
    vad_filter=True,
    vad_parameters=dict(min_silence_duration_ms=500),
)

data = {"language": info.language, "duration": info.duration, "segments": []}
for seg in segments:
    words = []
    if seg.words:
        for w in seg.words:
            words.append({"start": round(w.start, 3), "end": round(w.end, 3), "word": w.word})
    data["segments"].append({
        "id": seg.id,
        "start": round(seg.start, 3),
        "end": round(seg.end, 3),
        "text": seg.text.strip(),
        "words": words,
    })
    print(f"[{seg.start:6.1f}-{seg.end:6.1f}] {seg.text.strip()}", flush=True)

with open(OUT, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"\n=== TRANSCRIPTION TERMINÉE en {time.time()-t0:.0f}s — {len(data['segments'])} segments ===", flush=True)
print(f"Sortie: {OUT}", flush=True)
