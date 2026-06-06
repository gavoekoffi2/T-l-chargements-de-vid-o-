#!/usr/bin/env python3
"""Place 8 overlays graphiques + 20 B-roll (ballotage) — video4.
Sujet : Prompt Engineering v2 (96.8s).
Timeline sortie = 96.3s.

SFX VARIÉS & ALTERNÉS (Règle pro audio) : pool tournant pour B-roll & graphiques,
le son d'éclair photo `camera_flash` accompagne plusieurs apparitions d'images.

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

# Graphiques : SFX forts et distincts par pivot de scène
GRAPHICS = [
    (  0.5, "intro",       "impact"),
    (  9.5, "prompt_eng",  "sub_drop"),
    ( 15.0, "definition",  "boom"),
    ( 25.0, "instruction", "bass_hit"),
    ( 46.5, "exemple",     "ding"),
    ( 56.5, "bon_prompt",  "chime"),
    ( 71.0, "role",        "sparkle"),
    ( 88.8, "cta",         "pop"),
]

# B-roll : 20 illustrations (densité ~1 / 5s). Le SFX est attribué par un pool tournant
# (varié, jamais 2x le même d'affilée) ci-dessous — le 3e champ n'est qu'indicatif.
BROLL_NAMES = [
    (  4.0, "br_no_degree"),
    (  7.5, "br_discipline"),
    ( 12.0, "br_brain_ai"),
    ( 16.0, "br_formuler"),
    ( 20.0, "br_ia_answer"),
    ( 24.0, "br_phone_ai_app"),
    ( 27.5, "br_ecrire"),
    ( 31.5, "br_lightbulb_idea"),
    ( 34.5, "br_exemple_vague"),
    ( 40.5, "br_contexte_notes"),
    ( 44.0, "br_target_precision"),
    ( 48.0, "br_tiktok_creator"),
    ( 52.0, "br_team_success"),
    ( 57.0, "br_expert_marketing"),
    ( 63.5, "br_bon_resultat"),
    ( 67.5, "br_growth_chart"),
    ( 73.0, "br_role_ia"),
    ( 79.0, "br_framework_doc"),
    ( 85.5, "br_subscribe_cta"),
    ( 91.0, "br_host_video4"),
]

# Pool de SFX d'apparition d'IMAGE — varié & captivant, alterné en rotation.
# camera_flash (éclair photo) revient régulièrement comme signature "photo".
BROLL_SFX_POOL = [
    "camera_flash", "swoosh_up", "shutter", "glitch",
    "camera_flash", "transition", "reverse_swell", "swoosh_down",
    "camera_flash", "digi_blip", "whoosh", "sparkle",
]

cues = []
for src, name, sfx in GRAPHICS:
    t = max(0.0, s2o(src)-0.2)
    cues.append({"name":name,"file":f"animations/{name}.mov",
                 "start_in_output":round(t,2),"duration":GDUR[name],
                 "sfx":sfx,"kind":"graphic"})
graphics = sorted(cues, key=lambda c: c["start_in_output"])

br = []
LONG = ("br_ia_answer","br_framework_doc","br_host_video4","br_role_ia")
for i,(src, name) in enumerate(BROLL_NAMES):
    t = max(0.0, s2o(src)-0.2)
    dur = 3.2 if name in LONG else 3.0
    sfx = BROLL_SFX_POOL[i % len(BROLL_SFX_POOL)]
    br.append({"name":name,"file":f"broll_clips/{name}.mov",
               "start_in_output":round(t,2),"duration":dur,
               "sfx":sfx,"kind":"broll"})
br.sort(key=lambda c: c["start_in_output"])
GAP = 0.4
for i in range(1, len(br)):
    pe = br[i-1]["start_in_output"]+br[i-1]["duration"]
    if br[i]["start_in_output"] < pe+GAP:
        br[i]["start_in_output"] = round(pe+GAP, 2)
# éviter deux SFX identiques consécutifs après le tri
for i in range(1, len(br)):
    if br[i]["sfx"] == br[i-1]["sfx"]:
        alt = [s for s in BROLL_SFX_POOL if s != br[i-1]["sfx"]]
        br[i]["sfx"] = alt[i % len(alt)]

allc = [c for c in (graphics+br) if c["start_in_output"]+c["duration"] <= TOTAL+0.1]

# Règle PRO #3 : GAP-FILL SFX
GAP_SFX_THRESHOLD = 4.0
SFX_POOL = ["ding","transition","click","swoosh_up","chime","digi_blip"]
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
