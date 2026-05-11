#!/usr/bin/env python3
"""
Transcribe a video/audio file with OpenAI Whisper and output subtitle JSON.
Usage:
    python3 2_transcribe.py <input_video> [output_json] [model_size] [language]

model_size: tiny | base | small | medium | large  (default: small)
language  : fr | en | auto                        (default: fr)

Output JSON structure:
[
  {
    "text": "Bonjour tout le monde.",
    "start": 1.2,
    "end": 3.0,
    "words": [
      {"word": "Bonjour", "start": 1.2, "end": 1.7},
      ...
    ]
  },
  ...
]
"""

import sys
import json
import os
import re

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 2_transcribe.py <input_video> [output_json] [model] [language]")
        sys.exit(1)

    input_file  = sys.argv[1]
    output_json = sys.argv[2] if len(sys.argv) > 2 else "public/subtitles.json"
    model_size  = sys.argv[3] if len(sys.argv) > 3 else "small"
    language    = sys.argv[4] if len(sys.argv) > 4 else "fr"
    if language == "auto":
        language = None

    print(f"► Loading Whisper model: {model_size}")
    import whisper
    model = whisper.load_model(model_size)

    print(f"► Transcribing: {input_file}")
    result = model.transcribe(
        input_file,
        language=language,
        word_timestamps=True,
        verbose=False,
    )

    segments = []
    for seg in result["segments"]:
        words = []
        if "words" in seg:
            for w in seg["words"]:
                word_text = w["word"].strip()
                if not word_text:
                    continue
                words.append({
                    "word":  word_text,
                    "start": round(float(w["start"]), 3),
                    "end":   round(float(w["end"]),   3),
                })
        else:
            # Fallback: distribute words evenly across segment duration
            raw_words = seg["text"].strip().split()
            if raw_words:
                dur = (seg["end"] - seg["start"]) / len(raw_words)
                for i, w in enumerate(raw_words):
                    words.append({
                        "word":  w,
                        "start": round(seg["start"] + i * dur, 3),
                        "end":   round(seg["start"] + (i + 1) * dur, 3),
                    })

        segments.append({
            "text":  seg["text"].strip(),
            "start": round(float(seg["start"]), 3),
            "end":   round(float(seg["end"]),   3),
            "words": words,
        })

    os.makedirs(os.path.dirname(output_json) if os.path.dirname(output_json) else ".", exist_ok=True)
    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(segments, f, ensure_ascii=False, indent=2)

    total_words = sum(len(s["words"]) for s in segments)
    print(f"✓ {len(segments)} segments, {total_words} words → {output_json}")
    print(f"  Detected language: {result.get('language', 'unknown')}")

if __name__ == "__main__":
    main()
