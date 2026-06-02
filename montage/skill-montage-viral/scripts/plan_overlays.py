#!/usr/bin/env python3
"""Place overlays graphiques + cutaways B-roll sur la timeline de sortie,
sans collision, et génère les cues SFX. Écrit overlays[] dans edl.json + sfx_cues.json.
"""
import json
from pathlib import Path

EDIT = Path(__file__).parent
edl = json.load(open(EDIT/"edl.json"))
ranges = edl["ranges"]

# mapper source-time -> output-time
maps=[]; off=0.0
for r in ranges:
    maps.append((r["start"], r["end"], off)); off += r["end"]-r["start"]
TOTAL_OUT = off
def s2o(t):
    for a,b,o in maps:
        if a<=t<=b: return o+(t-a)
    # si dans un trou coupé, renvoyer le bord le plus proche
    best=None
    for a,b,o in maps:
        for edge,val in [(a,o),(b,o+(b-a))]:
            if best is None or abs(edge-t)<best[0]: best=(abs(edge-t),val)
    return best[1] if best else 0.0

# Cues : (source_time, kind, asset_path, durée, effet_son)
#   kind: 'graphic' (animations/) ou 'broll' (broll_clips/)
GRAPHICS=[
 (  3.0,"intro",   "animations/intro.mov",   5.0,"boom"),
 ( 17.0,"canada",  "animations/canada.mov",  9.0,"whoosh"),
 ( 71.0,"counter", "animations/counter.mov", 6.0,"ding"),
 ( 86.0,"t4",      "animations/t4.mov",      5.5,"whoosh"),
 ( 95.0,"sixans",  "animations/sixans.mov",  5.5,"boom"),
 (177.0,"liberte", "animations/liberte.mov", 6.5,"ding"),
 (192.5,"cta",     "animations/cta.mov",     6.0,"pop"),
 (233.0,"endcard", "animations/endcard.mov", 7.0,"boom"),
]
BROLL=[
 ( 11.0,"br_immigrants","broll_clips/br_immigrants.mov",3.0,"whoosh"),
 ( 46.0,"br_tired",     "broll_clips/br_tired.mov",     2.8,"whoosh"),
 ( 56.0,"br_bills",     "broll_clips/br_bills.mov",     2.8,"pop"),
 ( 81.0,"br_taxes",     "broll_clips/br_taxes.mov",     2.8,"whoosh"),
 (128.0,"br_freedom",   "broll_clips/br_freedom.mov",   3.0,"boom"),
 (150.0,"br_home",      "broll_clips/br_home.mov",      2.8,"boom"),
 (154.0,"br_university","broll_clips/br_university.mov",2.8,"whoosh"),
 (229.0,"br_advisor",   "broll_clips/br_advisor.mov",   2.8,"boom"),
]

cues=[]
for src,name,path,dur,sfx in GRAPHICS+BROLL:
    start=max(0.0, s2o(src)-0.2)   # léger lead
    cues.append({"name":name,"file":path,"start_in_output":round(start,2),
                 "duration":dur,"sfx":sfx,"kind":"broll" if path.startswith("broll") else "graphic"})

# Tri par temps + dé-collision : si deux éléments se chevauchent, décaler le second
cues.sort(key=lambda c:c["start_in_output"])
GAP=0.3
for i in range(1,len(cues)):
    prev=cues[i-1]; cur=cues[i]
    prev_end=prev["start_in_output"]+prev["duration"]
    if cur["start_in_output"] < prev_end+GAP:
        cur["start_in_output"]=round(prev_end+GAP,2)

# borne finale
cues=[c for c in cues if c["start_in_output"]+c["duration"]<=TOTAL_OUT+0.1]

# overlays pour render.py (file, start_in_output, duration)
edl["overlays"]=[{"file":c["file"],"start_in_output":c["start_in_output"],"duration":c["duration"]} for c in cues]
json.dump(edl, open(EDIT/"edl.json","w"), ensure_ascii=False, indent=2)

# sfx cues
sfx_cues=[{"time":c["start_in_output"],"sfx":c["sfx"],"name":c["name"]} for c in cues]
json.dump(sfx_cues, open(EDIT/"sfx_cues.json","w"), ensure_ascii=False, indent=2)

print(f"Timeline sortie : {TOTAL_OUT:.1f}s | {len(cues)} éléments")
for c in cues:
    print(f"  {c['start_in_output']:6.1f}s +{c['duration']:.1f}s  [{c['kind']:7s}] {c['name']:14s} sfx={c['sfx']}")
