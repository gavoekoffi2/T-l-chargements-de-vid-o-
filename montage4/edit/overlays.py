#!/usr/bin/env python3
"""Overlays PIL->ProRes 4444 — Prompt Engineering v2 (video4).
Zone : y=1080-1440 (gros plan, visage jusqu'à ~y=1000).
8 overlays : intro, prompt_eng, definition, instruction, exemple, bon_prompt, role, cta.
"""
from PIL import Image, ImageDraw, ImageFont
import numpy as np, subprocess, math
from pathlib import Path

W, H = 1080, 1920
EDIT = Path(__file__).parent
ODIR = EDIT / "animations"
ODIR.mkdir(exist_ok=True)
FPS = 30

YT = 1080; YB = 1440; PH = YB - YT  # 360px panel

def load_font(size, bold=False):
    for name in (["DejaVuSans-Bold.ttf","FreeSansBold.ttf","LiberationSans-Bold.ttf"] if bold
                 else ["DejaVuSans.ttf","FreeSans.ttf","LiberationSans-Regular.ttf"]):
        for d in [Path.home()/".fonts",
                  Path("/usr/share/fonts/truetype/dejavu"),
                  Path("/usr/share/fonts/truetype/freefont"),
                  Path("/usr/share/fonts/truetype/liberation")]:
            p = d / name
            if p.exists(): return ImageFont.truetype(str(p), size)
    return ImageFont.load_default()

def render_mov(name, dur, draw_fn):
    frames = int(dur * FPS)
    out = ODIR / f"{name}.mov"
    cmd = ["ffmpeg","-y","-f","rawvideo","-pixel_format","rgba",
           "-video_size",f"{W}x{H}","-framerate",str(FPS),"-i","pipe:0",
           "-c:v","prores_ks","-profile:v","4444","-pix_fmt","yuva444p10le",
           "-vendor","apl0","-bits_per_mb","8000", str(out)]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)
    for i in range(frames):
        img = Image.new("RGBA", (W, H), (0,0,0,0))
        draw_fn(img, i / FPS, dur)
        proc.stdin.write(np.array(img, dtype=np.uint8).tobytes())
    proc.stdin.close(); proc.wait()
    print(f"  ok {name}.mov ({dur:.1f}s)")

# Palette tech/IA
CYAN   = (0, 212, 255)
PURPLE = (148, 60, 255)
GOLD   = (255, 200, 50)
RED    = (255, 59, 48)
GREEN  = (50, 215, 100)
WHITE  = (255, 255, 255)

def ease_io(t, dur, rise=0.18, fall=0.12):
    pr = rise * dur; pf = (1-fall) * dur
    if t < pr:   return (t/pr)**2
    if t > pf:   return max(0, 1-((t-pf)/(dur-pf))**2)
    return 1.0

def rrect(d, xy, r=20, fill=(0,0,0,180), outline=None, lw=4):
    d.rounded_rectangle(list(xy), radius=r, fill=fill, outline=outline, width=lw)

def tag_bar(d, label, color, a, y=None):
    if y is None: y = YT + 16
    tw = 380; th = 50; tx = (W-tw)//2
    rrect(d, (tx, y, tx+tw, y+th), r=14, fill=(*color, int(210*a/255)))
    d.text((W//2, y+th//2), label, font=load_font(34, True),
           fill=(255,255,255,a), anchor="mm")

# ─── 1. INTRO : "DIPLÔME ≠ RÉSULTATS" ───────────────────────────────────────
def ov_intro(img, t, dur):
    a = int(255 * ease_io(t, dur))
    if a == 0: return
    d = ImageDraw.Draw(img)
    rrect(d, (60, YT, 1020, YB), fill=(10,5,5, int(200*a/255)),
          outline=(*RED, a), lw=5)
    blink = 0.5+0.5*math.sin(t*18)
    d.rectangle([60,YT,1020,YT+6], fill=(*RED, int(110*a/255*blink)))
    tag_bar(d, "CE QUI COMPTE VRAIMENT", RED, a)
    # Diplôme barré  vs  Discipline check
    fXL = load_font(52, True)
    d.text((W//2-180, YT+115), "DIPLÔME", font=load_font(38, True),
           fill=(*RED, a), anchor="mm")
    d.text((W//2-180, YT+158), "X", font=load_font(56, True),
           fill=(*RED, a), anchor="mm",
           stroke_width=3, stroke_fill=(0,0,0,a))
    d.line([(W//2, YT+90), (W//2, YT+195)],
           fill=(120,120,120, int(160*a/255)), width=3)
    d.text((W//2+180, YT+115), "DISCIPLINE", font=load_font(38, True),
           fill=(*GREEN, a), anchor="mm")
    d.text((W//2+180, YT+158), "✓", font=load_font(52, True),
           fill=(*GREEN, a), anchor="mm")
    # Résultat animé
    prog = min(1.0, t/(dur*0.6)); pct = int(prog*100)
    d.text((W//2, YT+258), f"TU OBTIENS {pct}%", font=load_font(44, True),
           fill=(*GOLD, a), anchor="mm",
           stroke_width=2, stroke_fill=(0,0,0,a))
    d.text((W//2, YT+318), "de meilleurs résultats avec l'IA",
           font=load_font(28), fill=(210,210,230,a), anchor="mm")

# ─── 2. PROMPT ENGINEERING ────────────────────────────────────────────────────
def ov_prompt_eng(img, t, dur):
    a = int(255 * ease_io(t, dur))
    if a == 0: return
    d = ImageDraw.Draw(img)
    for dy in range(PH):
        frac = dy/PH
        rv = int(15+133*frac); gv = int(5+55*frac); bv = int(40+215*frac)
        d.rectangle([(60,YT+dy),(1020,YT+dy+1)],
                    fill=(rv, gv, bv, int(200*a/255)))
    d.rounded_rectangle([60,YT,1020,YB], radius=24,
                        outline=(*PURPLE, int(220*a/255)), width=5)
    d.text((W//2, YT+48), "PROMPT ENGINEERING",
           font=load_font(50, True), fill=(*WHITE, a), anchor="mm",
           stroke_width=2, stroke_fill=(*PURPLE, a))
    d.line([(100,YT+84),(980,YT+84)], fill=(*PURPLE, int(100*a/255)), width=3)
    d.text((W//2, YT+130), "= LA COMPÉTENCE #1 en IA",
           font=load_font(34, True), fill=(*CYAN, a), anchor="mm")
    p = 1+0.08*math.sin(t*6); r = int(52*p)
    cx = W//2; cy = YT+242
    d.ellipse([cx-r,cy-r,cx+r,cy+r], fill=(*PURPLE, int(150*a/255)))
    d.text((cx, cy), "PE", font=load_font(40, True),
           fill=(*WHITE, a), anchor="mm")
    bl = 0.6+0.4*math.sin(t*4)
    d.text((W//2, YT+326), "Maîtrise = Résultats 10x",
           font=load_font(32, True), fill=(*GOLD, int(a*bl)), anchor="mm")

# ─── 3. DÉFINITION : L'ART DE FORMULER ────────────────────────────────────────
def ov_definition(img, t, dur):
    a = int(255 * ease_io(t, dur))
    if a == 0: return
    d = ImageDraw.Draw(img)
    rrect(d, (60,YT,1020,YB), fill=(5,18,38, int(200*a/255)),
          outline=(*CYAN, int(200*a/255)), lw=4)
    tag_bar(d, "PROMPT ENGINEERING =", CYAN, a)
    d.line([(100,YT+78),(980,YT+78)], fill=(*CYAN, int(80*a/255)), width=2)
    d.text((W//2, YT+110), "L'ART DE FORMULER",
           font=load_font(46, True), fill=(*CYAN, a), anchor="mm",
           stroke_width=2, stroke_fill=(0,0,0,a))
    items = ["des requêtes précises", "des demandes efficaces", "pour obtenir le TOP résultat"]
    fM = load_font(30)
    for j, item in enumerate(items):
        ap = min(1.0, max(0.0, (t-j*1.2)/0.7))
        a2 = int(a*ap); ox = int((1-ap)*50)
        y = YT+170+j*58
        rrect(d, (90+ox, y, 990, y+48), r=12,
              fill=(0,50,90, int(130*ap*a/255)))
        d.text((125+ox, y+24), f">> {item}", font=fM,
               fill=(200,240,255,a2), anchor="lm")

# ─── 4. INSTRUCTION : PROMPT = INSTRUCTION ───────────────────────────────────
def ov_instruction(img, t, dur):
    a = int(255 * ease_io(t, dur))
    if a == 0: return
    d = ImageDraw.Draw(img)
    rrect(d, (60,YT,1020,YB), fill=(5,5,25, int(200*a/255)),
          outline=(*CYAN, int(160*a/255)), lw=4)
    tag_bar(d, "COMPRENDRE LE PROMPT", CYAN, a)
    d.line([(100,YT+78),(980,YT+78)], fill=(*CYAN, int(60*a/255)), width=2)
    d.text((W//2, YT+115), "PROMPT", font=load_font(54, True),
           fill=(*GOLD, a), anchor="mm",
           stroke_width=2, stroke_fill=(0,0,0,a))
    d.text((W//2, YT+165), "= L'INSTRUCTION QUE TU ENVOIES",
           font=load_font(28, True), fill=(*CYAN, a), anchor="mm")
    # Boîte animée "Ce que tu écris → IA"
    ap2 = min(1.0, max(0.0, (t-1.2)/0.8))
    if ap2 > 0:
        a2 = int(a*ap2)
        rrect(d, (90, YT+190, 990, YT+268), r=14,
              fill=(10,30,60, int(140*ap2*a/255)))
        d.text((W//2, YT+229), "Ce que tu écris à l'IA = ton PROMPT",
               font=load_font(26), fill=(190,220,255,a2), anchor="mm")
    # Check animé
    ap3 = min(1.0, max(0.0, (t-2.8)/0.8))
    if ap3 > 0:
        a3 = int(a*ap3)
        rrect(d, (90, YT+278, 990, YT+346), r=14,
              fill=(0,50,20, int(130*ap3*a/255)))
        d.text((W//2, YT+312), "Doit être PRÉCIS + CONTEXTE",
               font=load_font(28, True), fill=(*GREEN, a3), anchor="mm")

# ─── 5. EXEMPLE : VAGUE vs BON ────────────────────────────────────────────────
def ov_exemple(img, t, dur):
    a = int(255 * ease_io(t, dur))
    if a == 0: return
    d = ImageDraw.Draw(img)
    rrect(d, (60,YT,1020,YB), fill=(10,8,2, int(200*a/255)),
          outline=(*GOLD, int(180*a/255)), lw=4)
    tag_bar(d, "EXEMPLE : SCRIPT TIKTOK", GOLD, a)
    d.line([(100,YT+78),(980,YT+78)], fill=(*GOLD, int(80*a/255)), width=2)
    # Colonne gauche : VAGUE
    rrect(d, (70,YT+90,520,YT+350), r=16,
          fill=(50,5,5, int(160*a/255)), outline=(*RED, int(120*a/255)), lw=3)
    d.text((295, YT+116), "❌ VAGUE", font=load_font(30, True),
           fill=(*RED, a), anchor="mm")
    fS = load_font(23)
    d.text((295, YT+155), '"Fais-moi un', font=fS,
           fill=(200,160,160,a), anchor="mm")
    d.text((295, YT+180), 'script TikTok"', font=fS,
           fill=(200,160,160,a), anchor="mm")
    d.text((295, YT+228), "=> Résultat générique", font=load_font(22),
           fill=(*RED, a), anchor="mm")
    prog_bad = min(1.0, t/(dur*0.55)); pct_bad = int(prog_bad*8)
    d.text((295, YT+290), f"{pct_bad}%", font=load_font(42, True),
           fill=(*RED, a), anchor="mm")
    # Colonne droite : BON
    ap_r = min(1.0, max(0.0, (t-1.5)/0.8))
    a_r = int(a*ap_r)
    rrect(d, (560,YT+90,1010,YT+350), r=16,
          fill=(5,45,5, int(160*ap_r*a/255)),
          outline=(*GREEN, int(120*ap_r*a/255)), lw=3)
    if ap_r > 0:
        d.text((785, YT+116), "✅ BON PROMPT", font=load_font(28, True),
               fill=(*GREEN, a_r), anchor="mm")
        d.text((785, YT+155), '"Agis comme expert', font=fS,
               fill=(180,230,185,a_r), anchor="mm")
        d.text((785, YT+180), 'en marketing..."', font=fS,
               fill=(180,230,185,a_r), anchor="mm")
        d.text((785, YT+228), "=> Script VIRAL !", font=load_font(22),
               fill=(*GREEN, a_r), anchor="mm")
        prog_good = min(1.0, max(0.0, (t-2.2)/(dur*0.4))); pct_good = int(prog_good*95)
        d.text((785, YT+290), f"{pct_good}%", font=load_font(42, True),
               fill=(*GREEN, a_r), anchor="mm")

# ─── 6. BON PROMPT : 3 INGRÉDIENTS ────────────────────────────────────────────
def ov_bon_prompt(img, t, dur):
    a = int(255 * ease_io(t, dur))
    if a == 0: return
    d = ImageDraw.Draw(img)
    rrect(d, (60,YT,1020,YB), fill=(5,25,10, int(200*a/255)),
          outline=(*GREEN, int(200*a/255)), lw=5)
    tag_bar(d, "RECETTE DU BON PROMPT", GREEN, a)
    d.line([(100,YT+78),(980,YT+78)], fill=(*GREEN, int(80*a/255)), width=2)
    ingr = [("EXPERT",  "Donner un rôle à l'IA", PURPLE),
            ("PRÉCIS",  "Question claire et directe", CYAN),
            ("CONTEXTE","Infos essentielles ajoutées", GOLD)]
    fM = load_font(26); fB = load_font(28, True)
    for j, (label, sub, col) in enumerate(ingr):
        ap = min(1.0, max(0.0, (t-j*1.3)/0.7))
        a2 = int(a*ap)
        y = YT+90+j*84
        rrect(d, (75, y, 1005, y+70), r=14,
              fill=(*col, int(25*ap*a/255)),
              outline=(*col, int(100*ap*a/255)), lw=2)
        d.text((130, y+35), label, font=fB, fill=(*col, a2), anchor="lm")
        d.text((350, y+35), f"→ {sub}", font=fM,
               fill=(200,230,205,a2), anchor="lm")
    # Score animé
    prog = min(1.0, t/(dur*0.55)); score = int(prog*95)
    bl = 0.6+0.4*math.sin(t*3)
    d.text((W//2, YT+348), f"RÉSULTAT : {score}%",
           font=load_font(38, True), fill=(*GOLD, int(a*bl)), anchor="mm")

# ─── 7. RÔLE DONNÉ : "AGIS COMME..." ──────────────────────────────────────────
def ov_role(img, t, dur):
    a = int(255 * ease_io(t, dur))
    if a == 0: return
    d = ImageDraw.Draw(img)
    for dy in range(PH):
        frac = dy/PH
        rv = int(15+133*frac); gv = int(5+55*frac); bv = int(40+215*frac)
        d.rectangle([(60,YT+dy),(1020,YT+dy+1)],
                    fill=(rv, gv, bv, int(195*a/255)))
    d.rounded_rectangle([60,YT,1020,YB], radius=24,
                        outline=(*PURPLE, int(220*a/255)), width=5)
    tag_bar(d, "RÈGLE N°1 DU PROMPT", PURPLE, a)
    d.line([(100,YT+78),(980,YT+78)], fill=(*PURPLE, int(100*a/255)), width=3)
    d.text((W//2, YT+118), "TOUJOURS DONNER UN RÔLE",
           font=load_font(42, True), fill=(*WHITE, a), anchor="mm",
           stroke_width=2, stroke_fill=(*PURPLE, a))
    # Typing animation "Agis comme..."
    full = '"Agis comme un expert en marketing..."'
    shown = int(len(full) * min(1.0, (t-1.2)/3.5))
    shown_txt = full[:shown]
    cursor = "_" if int(t*3) % 2 == 0 else ""
    rrect(d, (80, YT+155, 1000, YT+240), r=14,
          fill=(20,5,50, int(160*a/255)))
    d.text((W//2, YT+197), shown_txt+cursor,
           font=load_font(26), fill=(*CYAN, a), anchor="mm")
    ap2 = min(1.0, max(0.0, (t-4.5)/0.8))
    if ap2 > 0:
        a2 = int(a*ap2)
        rrect(d, (80, YT+250, 1000, YT+346), r=14,
              fill=(0,50,20, int(130*ap2*a/255)))
        d.text((W//2, YT+298), "L'IA joue le rôle = meilleur résultat",
               font=load_font(27, True), fill=(*GREEN, a2), anchor="mm")

# ─── 8. CTA ────────────────────────────────────────────────────────────────────
def ov_cta(img, t, dur):
    a = int(255 * ease_io(t, dur))
    if a == 0: return
    d = ImageDraw.Draw(img)
    rrect(d, (60,YT,1020,YB), fill=(28,18,0, int(205*a/255)),
          outline=(*GOLD, int(230*a/255)), lw=5)
    d.text((W//2, YT+48), "ABONNE-TOI !", font=load_font(50, True),
           fill=(*GOLD, a), anchor="mm",
           stroke_width=2, stroke_fill=(0,0,0,a))
    d.line([(100,YT+90),(980,YT+90)], fill=(*GOLD, int(80*a/255)), width=2)
    d.text((W//2, YT+135), "Le FRAMEWORK complet arrive :",
           font=load_font(30), fill=(225,205,155,a), anchor="mm")
    d.text((W//2, YT+178), "formule TOUJOURS de bons prompts",
           font=load_font(32, True), fill=(*WHITE, a), anchor="mm")
    # Cloche pulsante
    br = int(44+5*math.sin(t*5))
    cx = W//2; cy = YT+268
    d.ellipse([cx-br,cy-br,cx+br,cy+br],
              fill=(*GOLD, int(160*a/255)))
    d.text((cx, cy), "BELL", font=load_font(22, True),
           fill=(0,0,0,a), anchor="mm")
    bl = 0.7+0.3*math.sin(t*4)
    d.text((W//2, YT+326), "Ne rate plus aucune opportunité IA",
           font=load_font(26, True), fill=(*GOLD, int(a*bl)), anchor="mm")

JOBS = [
    ("intro",       8.5,  ov_intro),
    ("prompt_eng",  5.5,  ov_prompt_eng),
    ("definition", 10.0,  ov_definition),
    ("instruction",17.0,  ov_instruction),
    ("exemple",    10.0,  ov_exemple),
    ("bon_prompt", 14.0,  ov_bon_prompt),
    ("role",       12.0,  ov_role),
    ("cta",         8.0,  ov_cta),
]

if __name__ == "__main__":
    import sys
    only = sys.argv[1:] if len(sys.argv)>1 else None
    print("Génération overlays video4 (zone y=1080-1440)...")
    for name, dur, fn in JOBS:
        if only and name not in only: continue
        render_mov(name, dur, fn)
    print("Terminé.")
