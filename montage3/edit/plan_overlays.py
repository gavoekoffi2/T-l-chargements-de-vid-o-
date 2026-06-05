#!/usr/bin/env python3
"""Place 8 overlays graphiques (durée synchro-parole) + 16 B-roll (ballotage).

Règles v4 :
- Overlays graphiques : durée = celle du fichier .mov (déjà calée sur le sujet parlé).
  Restent affichés tant que la personne parle du sujet ; tiennent leur état final.
- B-roll : 16 cutaways 3-3.2s, composités AU-DESSUS du graphique (ballotage).
  Quand le sujet est long, plusieurs B-roll s'enchaînent en alternance avec le locuteur.
- SFX variés : graphiques = impact/boom/whoosh/ding/pop/sparkle/sub_drop selon le type ;
  B-roll = shutter, plus swoosh_up/glitch/transition selon l'effet d'entrée.
- Collision avoidance B-roll/B-roll uniquement (gap 0.5s). Graphiques jamais décalés.
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

# Durées réelles des .mov graphiques (== overlays.py JOBS)
GDUR={"intro":15.0,"heures":8.0,"retraite":16.0,"solution":10.0,
      "rra":16.0,"capital":16.0,"cta":15.0,"endcard":13.0}
# (src_appear, name, sfx)
GRAPHICS=[
 (  2.5,"intro",   "impact"),
 ( 55.0,"heures",  "sub_drop"),
 ( 70.0,"retraite","sub_drop"),
 ( 99.0,"solution","boom"),
 (118.0,"rra",     "sparkle"),
 (140.5,"capital", "ding"),
 (207.0,"cta",     "pop"),
 (234.0,"endcard", "impact"),
]
# B-roll : (src_appear, clip, sfx_entrée)  — shutter de base + variation selon effet
BROLL=[
 (  6.0,"br_medecin",  "shutter"),
 (  9.5,"br_etudes",   "swoosh_up"),
 ( 14.0,"br_diplome",  "sparkle"),
 ( 23.0,"br_dentiste", "shutter"),
 ( 51.0,"br_surcharge","glitch"),
 ( 62.0,"br_famille",  "swoosh_up"),
 ( 70.5,"br_stress",   "glitch"),
 ( 84.0,"br_retraite", "transition"),
 (145.0,"br_argent",   "swoosh_up"),
 (160.0,"br_vieillesse","shutter"),
 (168.0,"br_clinique", "shutter"),
 (177.0,"br_richesse", "sparkle"),
 (188.0,"br_maison",   "sparkle"),
 (200.0,"br_reunion",  "shutter"),
 (235.0,"br_abraham",  "transition"),
 (244.0,"br_canada",   "shutter"),
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
               "duration":3.2 if name.endswith(("medecin","famille","dentiste","canada","abraham","richesse")) else 3.0,
               "sfx":sfx,"kind":"broll"})
br.sort(key=lambda c:c["start_in_output"])
GAP=0.5
for i in range(1,len(br)):
    pe=br[i-1]["start_in_output"]+br[i-1]["duration"]
    if br[i]["start_in_output"]<pe+GAP: br[i]["start_in_output"]=round(pe+GAP,2)

# graphiques d'abord (dessous), puis B-roll (dessus = ballotage)
allc=[c for c in (graphics+br) if c["start_in_output"]+c["duration"]<=TOTAL+0.1]

# Règle PRO #3 : GAP-FILL SFX — relances toutes 3-4s
# Scanner les gaps > 4s sans event visuel, y injecter un SFX audio uniquement
GAP_SFX_THRESHOLD = 4.0
SFX_POOL = ["ding", "transition", "click", "swoosh_up"]
event_windows = sorted([(c["start_in_output"], c["start_in_output"]+c["duration"]) for c in allc])
gap_sfx = []
prev_end = 0.0
pool_idx = 0
for ev_s, ev_e in event_windows:
    gap = ev_s - prev_end
    if gap > GAP_SFX_THRESHOLD:
        t = round(prev_end + gap / 2, 2)
        gap_sfx.append({"time": t, "sfx": SFX_POOL[pool_idx % len(SFX_POOL)], "name": f"gap_fill_{pool_idx}"})
        pool_idx += 1
    prev_end = max(prev_end, ev_e)
if TOTAL - prev_end > GAP_SFX_THRESHOLD:
    t = round(prev_end + (TOTAL - prev_end) / 2, 2)
    gap_sfx.append({"time": t, "sfx": "transition", "name": f"gap_fill_{pool_idx}"})

edl["overlays"]=[{"file":c["file"],"start_in_output":c["start_in_output"],"duration":c["duration"]} for c in allc]
json.dump(edl,open(EDIT/"edl.json","w"),ensure_ascii=False,indent=2)
sfx=[{"time":c["start_in_output"],"sfx":c["sfx"],"name":c["name"]} for c in allc] + gap_sfx
json.dump(sfx,open(EDIT/"sfx_cues.json","w"),ensure_ascii=False,indent=2)

print(f"Timeline {TOTAL:.1f}s | {len(allc)} éléments ({len(graphics)} graphiques + {len(br)} B-roll)")
if gap_sfx:
    print(f"  Gap-fill SFX: {len(gap_sfx)} cues audio injectés (gaps > {GAP_SFX_THRESHOLD}s)")
for c in sorted(allc,key=lambda c:c['start_in_output']):
    e=c['start_in_output']+c['duration']
    print(f"  {c['start_in_output']:6.1f}-{e:6.1f}s [{c['kind']:7s}] {c['name']:14s} sfx={c['sfx']}")
