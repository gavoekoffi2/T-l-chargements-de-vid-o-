#!/usr/bin/env python3
"""Mixe les effets sonores aux instants des cues sur l'audio du composite,
puis normalise à -14 LUFS / -1 dBTP. Sortie: final.mp4.

Usage: python mix_sfx.py <composite.mp4> <out final.mp4>
"""
import json, subprocess, sys
from pathlib import Path

EDIT = Path(__file__).parent
SFX = EDIT/"sfx"
comp = Path(sys.argv[1])
out  = Path(sys.argv[2])

cues = json.load(open(EDIT/"sfx_cues.json"))

# Construire un filtre : chaque SFX retardé (adelay) puis amix avec l'audio principal.
inputs = ["-i", str(comp)]
filters = []
amix_labels = ["[0:a]"]
gain = {"whoosh":0.80,"pop":0.80,"boom":0.95,"ding":0.75,"riser":0.70,
        "shutter":0.90,"impact":0.95}
idx = 1
for c in cues:
    f = SFX/f"{c['sfx']}.wav"
    if not f.exists(): continue
    inputs += ["-i", str(f)]
    delay_ms = int(c["time"]*1000)
    g = gain.get(c["sfx"],0.5)
    # léger lead de 60ms avant l'apparition pour l'attaque
    delay_ms = max(0, delay_ms-60)
    filters.append(f"[{idx}:a]adelay={delay_ms}|{delay_ms},volume={g}[s{idx}]")
    amix_labels.append(f"[s{idx}]")
    idx += 1

n = idx  # nombre total d'entrées audio (1 principal + SFX)
mix = "".join(amix_labels) + f"amix=inputs={n}:duration=first:normalize=0:dropout_transition=0[mixed]"
# loudnorm one-pass sur le mix
filt = ";".join(filters + [mix, "[mixed]loudnorm=I=-14:TP=-1:LRA=11[outa]"])

cmd = ["ffmpeg","-y", *inputs,
       "-filter_complex", filt,
       "-map","0:v","-map","[outa]",
       "-c:v","copy","-c:a","aac","-b:a","192k","-ar","48000",
       "-movflags","+faststart", str(out)]
print(f"Mixage {len(cues)} SFX + loudnorm -> {out.name}")
r = subprocess.run(cmd, stderr=subprocess.PIPE)
if r.returncode!=0:
    print("ERREUR ffmpeg:\n", r.stderr.decode()[-1500:])
    sys.exit(1)
print("OK")
