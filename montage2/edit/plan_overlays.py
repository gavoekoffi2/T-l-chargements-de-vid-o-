#!/usr/bin/env python3
"""Place overlays + B-roll sur la timeline de sortie.

Règles v3 :
- Overlays graphiques : durée = longueur du sujet dans la parole (capped à 16s)
  → restent à l'écran TANT QUE la personne parle du sujet illustré.
- B-roll : durée courte (3-4s), SFX=shutter, composité AU-DESSUS du graphic
  (pas de collision avoidance entre B-roll et graphique).
- Collision avoidance uniquement entre B-roll et B-roll (gap=0.6s).
- Ordre final : graphiques PUIS B-roll (pour que le B-roll couvre le graphique
  lors des cutaways, puis révèle de nouveau le panneau quand il disparaît).
"""
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

# ── Overlays graphiques ─────────────────────────────────────────────────────
# (src_appear, src_topic_end, name, file, sfx)
# Durée = s2o(topic_end) - s2o(src_appear), capped à 16s
GRAPHICS_DEF = [
    (  2.5,  40.5, "intro",    "animations/intro.mov",    "impact"),   # médecins/dentistes
    ( 55.0,  65.0, "heures",   "animations/heures.mov",   "impact"),   # 70h/semaine
    ( 70.0,  97.0, "retraite", "animations/retraite.mov", "ding"),     # retraite 9%
    ( 99.0, 110.0, "solution", "animations/solution.mov", "boom"),     # J'ai une solution
    (118.0, 142.0, "rra",      "animations/rra.mov",       "whoosh"),  # RRA stratégie
    (140.5, 165.0, "capital",  "animations/capital.mov",   "ding"),    # +4M $
    (207.0, 232.0, "cta",      "animations/cta.mov",       "pop"),     # ILLUSTRATION
    (234.0, 248.0, "endcard",  "animations/endcard.mov",   "impact"),  # endcard
]
MAX_DUR = 16.0
MIN_DUR  = 5.0

graphics = []
for src_appear, src_end, name, path, sfx in GRAPHICS_DEF:
    t_start = max(0.0, s2o(src_appear) - 0.2)
    t_end   = min(TOTAL_OUT, s2o(src_end))
    dur = max(MIN_DUR, min(MAX_DUR, t_end - t_start))
    graphics.append({
        "name": name, "file": path,
        "start_in_output": round(t_start, 2),
        "duration": round(dur, 2),
        "sfx": sfx, "kind": "graphic",
    })

# ── B-roll ───────────────────────────────────────────────────────────────────
# (src_appear, name, file, durée)  — SFX = shutter pour tous
BROLL_DEF = [
    (  8.0, "br_medecin",   "broll_clips/br_medecin.mov",   3.5),
    ( 22.5, "br_dentiste",  "broll_clips/br_dentiste.mov",  3.2),
    ( 51.0, "br_surcharge", "broll_clips/br_surcharge.mov", 3.2),
    ( 63.5, "br_famille",   "broll_clips/br_famille.mov",   3.5),
    ( 82.5, "br_retraite",  "broll_clips/br_retraite.mov",  3.2),
    (113.5, "br_canada",    "broll_clips/br_canada.mov",    3.5),
    (163.0, "br_richesse",  "broll_clips/br_richesse.mov",  3.5),
    (195.0, "br_reunion",   "broll_clips/br_reunion.mov",   3.2),
]

broll = []
for src_appear, name, path, dur in BROLL_DEF:
    t_start = max(0.0, s2o(src_appear) - 0.2)
    broll.append({
        "name": name, "file": path,
        "start_in_output": round(t_start, 2),
        "duration": dur,
        "sfx": "shutter",          # son de capture photo pour les images
        "kind": "broll",
    })

# Collision avoidance B-roll only (gap 0.6s entre deux B-roll)
broll.sort(key=lambda c: c["start_in_output"])
GAP_BR = 0.6
for i in range(1, len(broll)):
    prev = broll[i-1]; cur = broll[i]
    prev_end = prev["start_in_output"] + prev["duration"]
    if cur["start_in_output"] < prev_end + GAP_BR:
        cur["start_in_output"] = round(prev_end + GAP_BR, 2)

# Ordre final : graphiques (par temps) + B-roll (par temps)
# Le B-roll est composité APRÈS (donc dessus) les graphiques
# → pendant le cutaway B-roll on voit l'image plein cadre,
#   puis en retour on revoit le locuteur + le panneau graphique encore actif.
all_cues = sorted(graphics, key=lambda c: c["start_in_output"]) + \
           sorted(broll,    key=lambda c: c["start_in_output"])

# Borner à la timeline de sortie
all_cues = [c for c in all_cues if c["start_in_output"] + c["duration"] <= TOTAL_OUT + 0.1]

# Écrire dans edl.json
edl["overlays"] = [{"file": c["file"],
                    "start_in_output": c["start_in_output"],
                    "duration": c["duration"]} for c in all_cues]
json.dump(edl, open(EDIT/"edl.json","w"), ensure_ascii=False, indent=2)

# sfx_cues.json
sfx_cues = [{"time": c["start_in_output"], "sfx": c["sfx"], "name": c["name"]}
            for c in all_cues]
json.dump(sfx_cues, open(EDIT/"sfx_cues.json","w"), ensure_ascii=False, indent=2)

print(f"Timeline : {TOTAL_OUT:.1f}s | {len(all_cues)} éléments")
print(f"  {'Graphiques':>12s} : {len(graphics)}")
print(f"  {'B-roll':>12s} : {len(broll)}")
for c in all_cues:
    kind = c['kind']
    end  = c['start_in_output'] + c['duration']
    print(f"  {c['start_in_output']:6.1f}s-{end:6.1f}s (+{c['duration']:.1f}s)  "
          f"[{kind:7s}] {c['name']:14s} sfx={c['sfx']}")
