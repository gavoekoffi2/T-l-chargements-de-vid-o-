#!/usr/bin/env python3
"""Place overlays + B-roll sur la timeline de sortie, génère sfx_cues.json."""
import json
from pathlib import Path

EDIT = Path(__file__).parent
edl  = json.load(open(EDIT/"edl.json"))
ranges = edl["ranges"]

maps=[]; off=0.0
for r in ranges:
    maps.append((r["start"],r["end"],off)); off+=r["end"]-r["start"]
TOTAL_OUT=off

def s2o(t):
    for a,b,o in maps:
        if a<=t<=b: return o+(t-a)
    best=None
    for a,b,o in maps:
        for edge,val in [(a,o),(b,o+(b-a))]:
            if best is None or abs(edge-t)<best[0]: best=(abs(edge-t),val)
    return best[1] if best else 0.0

# (source_time, name, file, durée, sfx)
GRAPHICS=[
 (  2.5,"intro",    "animations/intro.mov",    5.0,"boom"),
 ( 57.0,"heures",   "animations/heures.mov",   7.0,"whoosh"),
 ( 73.5,"retraite", "animations/retraite.mov", 7.0,"ding"),
 ( 98.5,"solution", "animations/solution.mov", 5.5,"boom"),
 (124.0,"rra",      "animations/rra.mov",       8.0,"whoosh"),
 (140.5,"capital",  "animations/capital.mov",   8.0,"ding"),
 (207.5,"cta",      "animations/cta.mov",       7.0,"pop"),
 (234.0,"endcard",  "animations/endcard.mov",   7.5,"boom"),
]
BROLL=[
 (  8.0,"br_medecin",   "broll_clips/br_medecin.mov",  3.0,"whoosh"),
 ( 22.5,"br_dentiste",  "broll_clips/br_dentiste.mov", 2.8,"punch" if False else "whoosh"),
 ( 51.0,"br_surcharge", "broll_clips/br_surcharge.mov",2.8,"pop"),
 ( 63.5,"br_famille",   "broll_clips/br_famille.mov",  3.0,"boom"),
 ( 82.5,"br_retraite",  "broll_clips/br_retraite.mov", 2.8,"whoosh"),
 (113.5,"br_canada",    "broll_clips/br_canada.mov",   3.0,"whoosh"),
 (163.0,"br_richesse",  "broll_clips/br_richesse.mov", 3.0,"boom"),
 (195.0,"br_reunion",   "broll_clips/br_reunion.mov",  2.8,"whoosh"),
]

cues=[]
for src,name,path,dur,sfx in GRAPHICS+BROLL:
    start=max(0.0,s2o(src)-0.2)
    cues.append({"name":name,"file":path,"start_in_output":round(start,2),
                 "duration":dur,"sfx":sfx,
                 "kind":"broll" if path.startswith("broll") else "graphic"})

cues.sort(key=lambda c:c["start_in_output"])
GAP=0.3
for i in range(1,len(cues)):
    prev=cues[i-1]; cur=cues[i]
    prev_end=prev["start_in_output"]+prev["duration"]
    if cur["start_in_output"] < prev_end+GAP:
        cur["start_in_output"]=round(prev_end+GAP,2)

cues=[c for c in cues if c["start_in_output"]+c["duration"]<=TOTAL_OUT+0.1]

edl["overlays"]=[{"file":c["file"],"start_in_output":c["start_in_output"],"duration":c["duration"]} for c in cues]
json.dump(edl,open(EDIT/"edl.json","w"),ensure_ascii=False,indent=2)

sfx_cues=[{"time":c["start_in_output"],"sfx":c["sfx"],"name":c["name"]} for c in cues]
json.dump(sfx_cues,open(EDIT/"sfx_cues.json","w"),ensure_ascii=False,indent=2)

print(f"Timeline : {TOTAL_OUT:.1f}s | {len(cues)} éléments")
for c in cues:
    print(f"  {c['start_in_output']:6.1f}s +{c['duration']:.1f}s  [{c['kind']:7s}] {c['name']:14s} sfx={c['sfx']}")
