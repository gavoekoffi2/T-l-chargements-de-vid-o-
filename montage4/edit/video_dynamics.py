#!/usr/bin/env python3
"""Zoom dynamique — Règle PRO #3 : RELANCES TOUTES 3-4s
  - Ken Burns alterné par segment (zoom-in / zoom-out / punch-in)
  - MICRO-PUNCHES gaussiens toutes les PUNCH_INTERVAL secondes dans les longs segments

Usage: python video_dynamics.py <base_in.mp4> <base_out.mp4> [edl.json]
Le pré-scale x2 + zoompan élimine le jitter.
"""
import json, subprocess, sys
from pathlib import Path

EDIT = Path(__file__).parent
inp  = Path(sys.argv[1]); out = Path(sys.argv[2])
edl  = json.loads(Path(sys.argv[3] if len(sys.argv)>3 else EDIT/"edl.json").read_text())

fps_raw = subprocess.run(
    ["ffprobe","-v","0","-select_streams","v:0",
     "-show_entries","stream=r_frame_rate","-of","default=nk=1:nw=1",str(inp)],
    capture_output=True, text=True).stdout.strip()
num, den = (fps_raw.split("/")+["1"])[:2]
FPS = float(num)/float(den) if float(den) else 30.0

segs = []; off = 0.0
for r in edl["ranges"]:
    d = float(r["end"]) - float(r["start"]); segs.append((off, off+d)); off += d

ZMIN, ZAMP      = 1.0, 0.09
PUNCH_INTERVAL  = 3.5   # secondes entre micro-punches (règle 3-4s)
PUNCH_AMP       = 0.10  # amplitude gaussienne du punch
PUNCH_WIDTH     = 0.30  # largeur temporelle (sigma = WIDTH/2.5)

def ken_burns(i, s, e):
    dur = max(0.001, e-s)
    t   = f"(on/{FPS:.3f})"
    prog = f"(({t}-{s:.3f})/{dur:.3f})"
    if i % 4 == 0:        # PUNCH-IN net puis settle
        return f"(1.0+0.11*(1-pow(1-min(1,{prog}*2.2),3)))"
    if i % 2 == 0:        # zoom-in lent
        return f"({ZMIN:.3f}+{ZAMP:.3f}*{prog})"
    return f"({ZMIN+ZAMP:.3f}-{ZAMP:.3f}*{prog})"  # zoom-out lent

def micro_punch_terms(s, e):
    """Gaussiennes AMP*exp(-(t-tp)²/sigma²) espacées de PUNCH_INTERVAL dans [s,e]."""
    sigma = PUNCH_WIDTH / 2.5
    terms = []
    tp = s + PUNCH_INTERVAL
    while tp < e - 0.5:
        terms.append(
            f"({PUNCH_AMP:.3f}*exp(-pow((on/{FPS:.3f}-{tp:.3f})/{sigma:.3f},2)))"
        )
        tp += PUNCH_INTERVAL
    return terms

z_expr = "1.0"
for i, (s, e) in enumerate(segs):
    kb = ken_burns(i, s, e)
    punches = micro_punch_terms(s, e)
    if punches:
        z_full = f"(max(1.0,{kb}+{'+'.join(punches)}))"
    else:
        z_full = f"(max(1.0,{kb}))"
    z_expr = f"if(between(on/{FPS:.3f},{s:.3f},{e:.3f}),{z_full},{z_expr})"

W, H = 1080, 1920
vf = (f"scale={W*2}:{H*2}:flags=bicubic,"
      f"zoompan=z='{z_expr}':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={W}x{H}:fps={FPS}")

cmd = ["ffmpeg","-y","-i",str(inp),"-vf",vf,
       "-c:v","libx264","-preset","fast","-crf","18","-pix_fmt","yuv420p",
       "-c:a","copy","-movflags","+faststart",str(out)]
n_punches = sum(max(0, int((e-s-0.5)//PUNCH_INTERVAL)) for s,e in segs)
print(f"Zoom dynamique ({len(segs)} segments, ~{n_punches} micro-punches, {FPS:.0f}fps) -> {out.name}")
r = subprocess.run(cmd, stderr=subprocess.PIPE)
if r.returncode != 0:
    print("ERREUR:\n", r.stderr.decode()[-2000:]); sys.exit(1)
print("OK")
