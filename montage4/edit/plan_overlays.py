#!/usr/bin/env python3
"""Place 8 overlays graphiques + 14 B-roll (ballotage) — video4.
Sujet : Prompt Engineering v2 (96.8s).
Timeline sortie = 96.3s.

Timecodes source → output (3 segments) :
  [00] src 0.03 → 60.87  = out 0.0 → 60.84
  [01] src 61.19 → 83.29 = out 60.84 → 82.94
  [02] src 83.47 → 96.80 = out 82.94 → 96.27
"""
import json
from pathlib import Path

EDIT = Path(__file__).parent
edl  = json.load(open(EDIT/"edl.json")); ranges = edl["ranges"]
maps = []; off = 0.0
for r in ranges:
    maps.append((r["start"], r["end"], off)); off += r["end"] - r["start"]
TOTAL = off

def s2o(t):
    for a,b,o in maps:
        if a <= t <= b: return o+(t-a)
    best = None
    for a,b,o in maps:
        for edge,val in [(a,o),(b,o+(b-a))]:
            if best is None or abs(edge-t)<best[0]: best=(abs(edge-t),val)
    return best[1] if best else 0.0

# Durées réelles .mov graphiques (== overlays.py JOBS)
GDUR = {"intro":8.5,"prompt_eng":5.5,"definition":10.0,"instruction":17.0,
        "exemple":10.0,"bon_prompt":14.0,"role":12.0,"cta":8.0}

# (src_appear, name, sfx)
GRAPHICS = [
    (  0.5, "intro",       "impact"),
    (  9.5, "prompt_eng",  "sub_drop"),
    ( 15.0, "definition",  "boom"),
    ( 25.0, "instruction", "sparkle"),
    ( 46.5, "exemple",     "ding"),
    ( 56.5, "bon_prompt",  "swoosh_up"),
    ( 71.0, "role",        "sparkle"),
    ( 88.8, "cta",         "pop"),
]

# B-roll : (src_appear, clip, sfx)
BROLL = [
    (  4.0, "br_no_degree",      "glitch"),
    (  7.5, "br_discipline",     "shutter"),
    ( 16.0, "br_formuler",       "transition"),
    ( 20.0, "br_ia_answer",      "shutter"),
    ( 27.5, "br_ecrire",         "swoosh_up"),
    ( 34.5, "br_exemple_vague",  "glitch"),
    ( 40.5, "br_contexte_notes", "sparkle"),
    ( 48.0, "br_tiktok_creator", "shutter"),
    ( 57.0, "br_expert_marketing","swoosh_up"),
    ( 63.5, "br_bon_resultat",   "sparkle"),
    ( 73.0, "br_role_ia",        "transition"),
    ( 79.0, "br_framework_doc",  "shutter"),
    ( 85.5, "br_subscribe_cta",  "swoosh_up"),
    ( 91.0, "br_host_video4",    "shutter"),
]

cues = []
for src, name, sfx in GRAPHICS:
    t = max(0.0, s2o(src)-0.2)
    cues.append({"name":name,"file":f"animations/{name}.mov",
                 "start_in_output":round(t,2),"duration":GDUR[name],
                 "sfx":sfx,"kind":"graphic"})
graphics = sorted(cues, key=lambda c: c["start_in_output"])

br = []
for src, name, sfx in BROLL:
    t = max(0.0, s2o(src)-0.2)
    dur = 3.2 if name in ("br_ia_answer","br_framework_doc","br_host_video4","br_role_ia") else 3.0
    br.append({"name":name,"file":f"broll_clips/{name}.mov",
               "start_in_output":round(t,2),"duration":dur,
               "sfx":sfx,"kind":"broll"})
br.sort(key=lambda c: c["start_in_output"])
GAP = 0.5
for i in range(1, len(br)):
    pe = br[i-1]["start_in_output"]+br[i-1]["duration"]
    if br[i]["start_in_output"] < pe+GAP:
        br[i]["start_in_output"] = round(pe+GAP, 2)

allc = [c for c in (graphics+br) if c["start_in_output"]+c["duration"] <= TOTAL+0.1]

# Règle PRO #3 : GAP-FILL SFX
GAP_SFX_THRESHOLD = 4.0
SFX_POOL = ["ding","transition","click","swoosh_up"]
event_windows = sorted([(c["start_in_output"],c["start_in_output"]+c["duration"]) for c in allc])
gap_sfx = []; prev_end = 0.0; pool_idx = 0
for ev_s, ev_e in event_windows:
    gap = ev_s - prev_end
    if gap > GAP_SFX_THRESHOLD:
        t = round(prev_end+gap/2, 2)
        gap_sfx.append({"time":t,"sfx":SFX_POOL[pool_idx%len(SFX_POOL)],"name":f"gap_fill_{pool_idx}"})
        pool_idx += 1
    prev_end = max(prev_end, ev_e)
if TOTAL - prev_end > GAP_SFX_THRESHOLD:
    gap_sfx.append({"time":round(prev_end+(TOTAL-prev_end)/2,2),"sfx":"transition",
                    "name":f"gap_fill_{pool_idx}"})

edl["overlays"] = [{"file":c["file"],"start_in_output":c["start_in_output"],"duration":c["duration"]}
                   for c in allc]
json.dump(edl, open(EDIT/"edl.json","w"), ensure_ascii=False, indent=2)
sfx = [{"time":c["start_in_output"],"sfx":c["sfx"],"name":c["name"]} for c in allc]+gap_sfx
json.dump(sfx, open(EDIT/"sfx_cues.json","w"), ensure_ascii=False, indent=2)

print(f"Timeline {TOTAL:.1f}s | {len(allc)} éléments ({len(graphics)} graphiques + {len(br)} B-roll)")
if gap_sfx: print(f"  Gap-fill SFX: {len(gap_sfx)} cues")
for c in sorted(allc, key=lambda c:c["start_in_output"]):
    e = c["start_in_output"]+c["duration"]
    print(f"  {c['start_in_output']:6.1f}-{e:6.1f}s [{c['kind']:7s}] {c['name']:22s} sfx={c['sfx']}")
