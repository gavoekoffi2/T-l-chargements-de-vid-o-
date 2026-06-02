#!/usr/bin/env bash
# Génère la banque d'effets sonores dans le dossier sfx/ passé en argument.
set -e
OUT="${1:-sfx}"; mkdir -p "$OUT"; SR=48000
ffmpeg -y -f lavfi -i "anoisesrc=d=0.5:c=pink:a=0.5:r=$SR" -af "afade=t=in:st=0:d=0.05,afade=t=out:st=0.25:d=0.25,highpass=f=300,lowpass=f=6000,volume=0.6" -ac 2 "$OUT/whoosh.wav"
ffmpeg -y -f lavfi -i "sine=frequency=900:duration=0.12:r=$SR" -af "afade=t=out:st=0:d=0.12,volume=0.5" -ac 2 "$OUT/pop.wav"
ffmpeg -y -f lavfi -i "anoisesrc=d=1.2:c=white:a=0.4:r=$SR" -af "highpass=f=500,volume='min(1,t/1.2)':eval=frame,afade=t=out:st=1.1:d=0.1,volume=0.5" -ac 2 "$OUT/riser.wav"
ffmpeg -y -f lavfi -i "sine=frequency=1200:duration=0.5:r=$SR" -af "afade=t=out:st=0.05:d=0.45,volume=0.4" -ac 2 "$OUT/ding.wav"
ffmpeg -y -f lavfi -i "sine=frequency=70:duration=0.7:r=$SR" -af "afade=t=out:st=0:d=0.7,volume=0.7" -ac 2 "$OUT/boom.wav"
echo "SFX générés dans $OUT/"
