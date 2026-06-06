#!/usr/bin/env python3
"""Composite les overlays (.mov ProRes alpha) PTS-shiftés sur une base vidéo.
Les B-roll passent AU-DESSUS des graphiques (ballotage).
Multi-pass par batch de BATCH_SIZE pour éviter OOM.

Usage: python composite.py <base.mp4> <out.mp4> [edl.json]
"""
import json, subprocess, sys, tempfile, os
from pathlib import Path

EDIT=Path(__file__).parent
base=Path(sys.argv[1]); out=Path(sys.argv[2])
edl=json.loads(Path(sys.argv[3] if len(sys.argv)>3 else EDIT/"edl.json").read_text())
ovs=edl.get("overlays") or []

BATCH_SIZE = 12

def rp(p):
    p=Path(p); return p if p.is_absolute() else (EDIT/p).resolve()

def composite_pass(in_path, out_path, batch):
    inputs=["-i", str(in_path)]
    for ov in batch: inputs+=["-i", str(rp(ov["file"]))]
    fp=[]
    for idx,ov in enumerate(batch,start=1):
        t=float(ov["start_in_output"]); fp.append(f"[{idx}:v]setpts=PTS-STARTPTS+{t}/TB[a{idx}]")
    cur="[0:v]"
    for idx,ov in enumerate(batch,start=1):
        t=float(ov["start_in_output"]); d=float(ov["duration"]); e=t+d
        nl=f"[v{idx}]"; fp.append(f"{cur}[a{idx}]overlay=enable='between(t,{t:.3f},{e:.3f})'{nl}"); cur=nl
    fp.append(f"{cur}null[outv]")
    fc=";".join(fp)
    cmd=["ffmpeg","-y",*inputs,"-filter_complex",fc,"-map","[outv]","-map","0:a",
         "-c:v","libx264","-preset","fast","-crf","18","-pix_fmt","yuv420p",
         "-c:a","copy","-movflags","+faststart",str(out_path)]
    r=subprocess.run(cmd, stderr=subprocess.PIPE)
    if r.returncode != 0:
        print("ERREUR pass:\n", r.stderr.decode()[-2000:])
        sys.exit(1)

print(f"Compositing {len(ovs)} overlays ({BATCH_SIZE}/pass) -> {out.name}")
batches=[ovs[i:i+BATCH_SIZE] for i in range(0, len(ovs), BATCH_SIZE)]
tmp_files=[]
cur_input=base

for i, batch in enumerate(batches):
    if i < len(batches)-1:
        tmp=Path(tempfile.mktemp(suffix=f"_pass{i}.mp4", dir=str(EDIT)))
        tmp_files.append(tmp)
        print(f"  pass {i+1}/{len(batches)}: {len(batch)} overlays -> {tmp.name}")
        composite_pass(cur_input, tmp, batch)
        cur_input=tmp
    else:
        print(f"  pass {i+1}/{len(batches)}: {len(batch)} overlays -> {out.name}")
        composite_pass(cur_input, out, batch)

for t in tmp_files:
    try: os.unlink(t)
    except: pass

print("OK")
