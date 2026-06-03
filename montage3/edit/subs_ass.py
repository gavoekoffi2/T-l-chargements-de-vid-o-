#!/usr/bin/env python3
"""Génère des sous-titres ASS DYNAMIQUES (karaoké mot-par-mot, couleurs, pop).
Plusieurs TEMPLATES sélectionnables — varier d'une vidéo à l'autre.

Usage: python subs_ass.py <template> [out.ass]
  templates: tiktok_yellow | neon_pop | bold_box | gold_lux | bangers_fun

Positionnement : sous-titres centrés à y≈1545 (PlayResY=1920),
au-dessus de la zone UI TikTok (bas ~15%) et SOUS les overlays (qui finissent à y≈1470).
"""
import json, sys, re
from pathlib import Path

EDIT = Path(__file__).parent
VU   = EDIT/"transcripts"/"video3_vu.json"
EDL  = EDIT/"edl.json"

# ── Templates (couleurs en &HAABBGGRR) ──────────────────────────────────────
# primary = couleur de base ; highlight = couleur du mot actif (karaoké)
TEMPLATES = {
 "tiktok_yellow": dict(font="Montserrat", size=78, bold=-1,
     primary="&H00FFFFFF", highlight="&H0000E5FF", outline="&H00000000",
     ow=6, shadow=2, pos_y=1500, upper=True, hl_scale=118),
 "neon_pop": dict(font="Anton", size=92, bold=0,
     primary="&H00FFFFFF", highlight="&H00FF2BC8", outline="&H00400030",
     ow=5, shadow=0, pos_y=1500, upper=True, hl_scale=122),
 "bold_box": dict(font="Montserrat", size=74, bold=-1,
     primary="&H00FFFFFF", highlight="&H0000D2FF", outline="&H00000000",
     ow=4, shadow=0, pos_y=1500, upper=True, hl_scale=115, box=True),
 "gold_lux": dict(font="Bebas Neue", size=96, bold=0,
     primary="&H00FFFFFF", highlight="&H0046C8FF", outline="&H00102030",
     ow=5, shadow=2, pos_y=1500, upper=True, hl_scale=120),
 "bangers_fun": dict(font="Bangers", size=98, bold=0,
     primary="&H00FFFFFF", highlight="&H002BE5FF", outline="&H00202020",
     ow=6, shadow=2, pos_y=1500, upper=True, hl_scale=125),
}

def fmt_t(s):
    cs = int(round(s*100)); h,rem = divmod(cs,360000); m,rem = divmod(rem,6000); sec,c = divmod(rem,100)
    return f"{h:d}:{m:02d}:{sec:02d}.{c:02d}"

def load_chunks():
    """Charge les mots video-use, mappe source->sortie via EDL, groupe en chunks de 2-3 mots."""
    edl = json.loads(EDL.read_text())
    tr  = json.loads(VU.read_text())
    words = [w for w in tr["words"] if w.get("type")=="word" and w.get("start") is not None]

    # map source->output
    maps=[]; off=0.0
    for r in edl["ranges"]:
        a,b=float(r["start"]),float(r["end"]); maps.append((a,b,off)); off+=b-a
    def s2o(t):
        for a,b,o in maps:
            if a<=t<=b: return o+(t-a)
        return None

    # garder mots dans les ranges, convertir en temps sortie
    seq=[]
    for w in words:
        os_=s2o(w["start"]); oe=s2o(w["end"])
        if os_ is None or oe is None: continue
        txt=(w["text"] or "").strip()
        if not txt: continue
        seq.append((os_,oe,txt))
    seq.sort()

    # grouper 2-3 mots, casser sur ponctuation
    chunks=[]; cur=[]
    for os_,oe,txt in seq:
        cur.append((os_,oe,txt))
        ends_p = txt[-1] in ".,!?;:"
        if len(cur)>=3 or ends_p:
            chunks.append(cur); cur=[]
    if cur: chunks.append(cur)
    return chunks

def build(template):
    cfg = TEMPLATES[template]
    chunks = load_chunks()
    py = cfg["pos_y"]; hl = cfg["highlight"]; pr=cfg["primary"]
    hsc = cfg.get("hl_scale",118)
    box = cfg.get("box",False)

    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Main,{cfg['font']},{cfg['size']},{pr},{hl},{cfg['outline']},&H64000000,{cfg['bold']},0,0,0,100,100,1,0,{3 if box else 1},{cfg['ow']},{cfg['shadow']},5,60,60,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    lines=[]
    for chunk in chunks:
        c_s = chunk[0][0]; c_e = chunk[-1][1]
        if c_e<=c_s: c_e=c_s+0.3
        # fade + pop-in (scale) au début du chunk
        parts=[]
        # \an5 centre, \pos centre x, y
        intro = (f"{{\\an5\\pos(540,{py})\\fad(80,60)"
                 f"\\fscx40\\fscy40\\t(0,140,\\fscx100\\fscy100)}}")
        # mots avec karaoké : mot actif passe en highlight + léger zoom
        for i,(ws,we,txt) in enumerate(chunk):
            disp = txt.upper() if cfg.get("upper") else txt
            disp = disp.rstrip(",;:")
            dur_cs = max(1,int(round((we-ws)*100)))
            # \kf = highlight progressif ; on colore le mot actif
            # technique : chaque mot a sa transition de couleur au moment où il est prononcé
            rel_s = max(0.0, ws - c_s)
            # surbrillance via \t timing relatif au chunk
            w_in  = int(rel_s*1000)
            w_out = int((we - c_s)*1000)
            seg = (f"{{\\c{pr}\\t({w_in},{w_in+90},\\c{hl}\\fscx{hsc}\\fscy{hsc})"
                   f"\\t({w_out},{w_out+120},\\c{pr}\\fscx100\\fscy100)}}{disp}")
            parts.append(seg)
        text = intro + " ".join(parts)
        lines.append(f"Dialogue: 0,{fmt_t(c_s)},{fmt_t(c_e)},Main,,0,0,0,,{text}")

    out = EDIT/"master.ass"
    if len(sys.argv)>2: out = Path(sys.argv[2])
    out.write_text(header+"\n".join(lines)+"\n")
    print(f"master.ass généré ({len(chunks)} chunks, template={template}) -> {out.name}")

if __name__=="__main__":
    tmpl = sys.argv[1] if len(sys.argv)>1 else "tiktok_yellow"
    if tmpl not in TEMPLATES:
        print(f"Templates: {', '.join(TEMPLATES)}"); sys.exit(1)
    build(tmpl)
