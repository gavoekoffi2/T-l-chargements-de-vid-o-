#!/usr/bin/env python3
"""Place 8 overlays graphiques (duree synchro-parole) + 16 B-roll (ballotage).
Sujet : Prompt Engineering / IA.
Timeline source = sortie (pas de coupes, video continue).
"""
import json
from pathlib import Path

EDIT=Path(__file__).parent
edl=json.load(open(EDIT/"edl.json")); ranges=edl["ranges"]
maps=[]; off=0.0
for r in ranges: maps.append((r["start"],r["end"],off)); off+=r["end"]-r["start"]
TOTAL=off
def s2o(t):
    for a,b,o in maps:
        if a<=t<=b: return o+(t-a)
    best=None
    for a,b,o in maps:
        for edge,val in [(a,o),(b,o+(b-a))]:
            if best is None or abs(edge-t)<best[0]: best=(abs(edge-t),val)
    return best[1] if best else 0.0

# Durees reelles .mov graphiques (== overlays.py JOBS)
# Source timecodes : intro=0s, vague=12.3s, contexte=21.8s, puissance=30.8s,
#                   exemple=52.1s, bon_prompt=64.0s, prompt_eng=91.7s, cta=132.1s
GDUR={"intro":8.0,"vague":9.0,"contexte":8.0,"puissance":16.0,
      "exemple":12.0,"bon_prompt":16.0,"prompt_eng":15.0,"cta":9.0}
# (src_appear, name, sfx)
GRAPHICS=[
 (  0.5,"intro",      "impact"),
 ( 12.3,"vague",      "sub_drop"),
 ( 21.8,"contexte",   "boom"),
 ( 30.8,"puissance",  "sparkle"),
 ( 52.1,"exemple",    "ding"),
 ( 64.0,"bon_prompt", "swoosh_up"),
 ( 91.7,"prompt_eng", "sparkle"),
 (132.1,"cta",        "pop"),
]
# B-roll : (src_appear, clip, sfx)
BROLL=[
 (  4.0,"br_confused",   "glitch"),
 (  9.0,"br_vague_type", "shutter"),
 ( 14.0,"br_no_result",  "transition"),
 ( 22.5,"br_context",    "swoosh_up"),
 ( 27.5,"br_lightbulb",  "sparkle"),
 ( 33.0,"br_ia_power",   "shutter"),
 ( 44.0,"br_no_result",  "glitch"),
 ( 53.0,"br_job",        "transition"),
 ( 59.0,"br_lettre",     "shutter"),
 ( 65.5,"br_good_prompt","swoosh_up"),
 ( 72.5,"br_ia_result",  "sparkle"),
 ( 84.0,"br_success",    "shutter"),
 ( 93.0,"br_eng",        "glitch"),
 (100.5,"br_discipline", "transition"),
 (110.0,"br_futur",      "swoosh_up"),
 (120.0,"br_eng",        "shutter"),
 (133.5,"br_creator",    "shutter"),
 (138.0,"br_host",       "transition"),
]

cues=[]
for src,name,sfx in GRAPHICS:
    t=max(0.0,s2o(src)-0.2)
    cues.append({"name":name,"file":f"animations/{name}.mov","start_in_output":round(t,2),
                 "duration":GDUR[name],"sfx":sfx,"kind":"graphic"})
graphics=sorted(cues,key=lambda c:c["start_in_output"])

br=[]
for src,name,sfx in BROLL:
    t=max(0.0,s2o(src)-0.2)
    br.append({"name":name,"file":f"broll_clips/{name}.mov","start_in_output":round(t,2),
               "duration":3.2 if name in ("br_ia_power","br_lettre","br_eng","br_futur","br_host","br_creator") else 3.0,
               "sfx":sfx,"kind":"broll"})
br.sort(key=lambda c:c["start_in_output"])
GAP=0.5
for i in range(1,len(br)):
    pe=br[i-1]["start_in_output"]+br[i-1]["duration"]
    if br[i]["start_in_output"]<pe+GAP: br[i]["start_in_output"]=round(pe+GAP,2)

# graphiques d'abord (dessous), puis B-roll (dessus = ballotage)
allc=[c for c in (graphics+br) if c["start_in_output"]+c["duration"]<=TOTAL+0.1]

edl["overlays"]=[{"file":c["file"],"start_in_output":c["start_in_output"],"duration":c["duration"]} for c in allc]
json.dump(edl,open(EDIT/"edl.json","w"),ensure_ascii=False,indent=2)
sfx=[{"time":c["start_in_output"],"sfx":c["sfx"],"name":c["name"]} for c in allc]
json.dump(sfx,open(EDIT/"sfx_cues.json","w"),ensure_ascii=False,indent=2)

print(f"Timeline {TOTAL:.1f}s | {len(allc)} éléments ({len(graphics)} graphiques + {len(br)} B-roll)")
for c in sorted(allc,key=lambda c:c['start_in_output']):
    e=c['start_in_output']+c['duration']
    print(f"  {c['start_in_output']:6.1f}-{e:6.1f}s [{c['kind']:7s}] {c['name']:14s} sfx={c['sfx']}")
