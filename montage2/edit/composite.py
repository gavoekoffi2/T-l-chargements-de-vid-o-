#!/usr/bin/env python3
"""Composite les overlays (.mov ProRes alpha) PTS-shiftés sur une base vidéo.
Les B-roll passent AU-DESSUS des graphiques (ballotage).

Usage: python composite.py <base.mp4> <out.mp4> [edl.json]
"""
import json, subprocess, sys
from pathlib import Path

EDIT=Path(__file__).parent
base=Path(sys.argv[1]); out=Path(sys.argv[2])
edl=json.loads(Path(sys.argv[3] if len(sys.argv)>3 else EDIT/"edl.json").read_text())
ovs=edl.get("overlays") or []

def rp(p):
    p=Path(p); return p if p.is_absolute() else (EDIT/p).resolve()

inputs=["-i",str(base)]
for ov in ovs: inputs+=["-i",str(rp(ov["file"]))]

fp=[]
for idx,ov in enumerate(ovs,start=1):
    t=float(ov["start_in_output"]); fp.append(f"[{idx}:v]setpts=PTS-STARTPTS+{t}/TB[a{idx}]")
cur="[0:v]"
for idx,ov in enumerate(ovs,start=1):
    t=float(ov["start_in_output"]); d=float(ov["duration"]); e=t+d
    nl=f"[v{idx}]"; fp.append(f"{cur}[a{idx}]overlay=enable='between(t,{t:.3f},{e:.3f})'{nl}"); cur=nl
fp.append(f"{cur}null[outv]")
fc=";".join(fp)

cmd=["ffmpeg","-y",*inputs,"-filter_complex",fc,"-map","[outv]","-map","0:a",
     "-c:v","libx264","-preset","fast","-crf","18","-pix_fmt","yuv420p",
     "-c:a","copy","-movflags","+faststart",str(out)]
print(f"Compositing {len(ovs)} overlays -> {out.name}")
r=subprocess.run(cmd,stderr=subprocess.PIPE)
if r.returncode!=0:
    print("ERREUR:\n",r.stderr.decode()[-1500:]); sys.exit(1)
print("OK")
