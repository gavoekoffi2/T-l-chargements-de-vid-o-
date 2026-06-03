#!/usr/bin/env python3
"""Ajoute du ZOOM dynamique sur la vidéo principale (locuteur).
Chaque coupe alterne un lent zoom-in / zoom-out (énergie type montage viral),
avec quelques PUNCH-IN nets sur les segments d'accroche.

Usage: python video_dynamics.py <base_in.mp4> <base_out.mp4> [edl.json]
Le pré-scale x2 + zoompan élimine le jitter.
"""
import json, subprocess, sys
from pathlib import Path

EDIT = Path(__file__).parent
inp  = Path(sys.argv[1]); out = Path(sys.argv[2])
edl  = json.loads(Path(sys.argv[3] if len(sys.argv)>3 else EDIT/"edl.json").read_text())

# fps de la source
fps = subprocess.run(["ffprobe","-v","0","-select_streams","v:0",
        "-show_entries","stream=r_frame_rate","-of","default=nk=1:nw=1",str(inp)],
        capture_output=True,text=True).stdout.strip()
num,den = (fps.split("/")+["1"])[:2]; FPS = float(num)/float(den) if float(den) else 30.0

# bornes des segments sur la timeline de sortie
segs=[]; off=0.0
for r in edl["ranges"]:
    d=float(r["end"])-float(r["start"]); segs.append((off, off+d)); off+=d
TOTAL=off

# z(t) par segment : alternance in/out, amplitude 0.0->0.09 ; punch sur 1 sur 4
ZMIN, ZAMP = 1.0, 0.09
def seg_expr(i, s, e):
    dur=max(0.001, e-s); prog=f"((t-{s:.3f})/{dur:.3f})"
    if i % 4 == 0:        # PUNCH-IN net puis settle
        return f"(1.0+0.11*(1-pow(1-min(1,{prog}*2.2),3)))"
    if i % 2 == 0:        # zoom-in lent
        return f"({ZMIN:.3f}+{ZAMP:.3f}*{prog})"
    return f"({ZMIN+ZAMP:.3f}-{ZAMP:.3f}*{prog})"  # zoom-out lent

z="1.0"
for i,(s,e) in enumerate(segs):
    z=f"if(between(t,{s:.3f},{e:.3f}),{seg_expr(i,s,e)},{z})"

# t = on/FPS dans zoompan
z=z.replace("t)", "(on/%g))" % FPS).replace("t-", "(on/%g)-" % FPS).replace("t,", "(on/%g)," % FPS)

W,H=1080,1920
vf=(f"scale={W*2}:{H*2}:flags=bicubic,"
    f"zoompan=z='{z}':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={W}x{H}:fps={FPS}")

cmd=["ffmpeg","-y","-i",str(inp),"-vf",vf,
     "-c:v","libx264","-preset","fast","-crf","18","-pix_fmt","yuv420p",
     "-c:a","copy","-movflags","+faststart",str(out)]
print(f"Zoom dynamique ({len(segs)} segments, {FPS:.0f}fps) -> {out.name}")
r=subprocess.run(cmd,stderr=subprocess.PIPE)
if r.returncode!=0:
    print("ERREUR:\n",r.stderr.decode()[-1500:]); sys.exit(1)
print("OK")
