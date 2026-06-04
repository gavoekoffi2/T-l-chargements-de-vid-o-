#!/usr/bin/env python3
"""Overlays PIL->ProRes 4444 — Prompt Engineering / IA.
Zone corrigee : y=1080-1440 (video gros plan, visage jusqu'a ~y=1000).
Polices fixees : DejaVuSans-Bold.ttf disponible sur le systeme.
"""
from PIL import Image, ImageDraw, ImageFont
import numpy as np, subprocess, math
from pathlib import Path

W, H = 1080, 1920
EDIT = Path(__file__).parent
ODIR = EDIT / "overlays"
ODIR.mkdir(exist_ok=True)
FPS = 30

# Panel zone — shifted down for close-up shot
YT = 1080   # panel top
YB = 1440   # panel bottom  (gap of 60px before subtitles at y=1500)
PH = YB - YT  # = 360px

def load_font(size, bold=False):
    bold_names = ["Montserrat-Bold.ttf","Montserrat-SemiBold.ttf",
                  "DejaVuSans-Bold.ttf","FreeSansBold.ttf","LiberationSans-Bold.ttf"]
    reg_names  = ["Montserrat-Regular.ttf","Montserrat.ttf",
                  "DejaVuSans.ttf","FreeSans.ttf","LiberationSans-Regular.ttf"]
    for name in (bold_names if bold else reg_names):
        for d in [Path.home()/".fonts",
                  Path("/usr/share/fonts/truetype/dejavu"),
                  Path("/usr/share/fonts/truetype/freefont"),
                  Path("/usr/share/fonts/truetype/liberation")]:
            p = d / name
            if p.exists():
                return ImageFont.truetype(str(p), size)
    return ImageFont.load_default()

def render_mov(name, dur, draw_fn):
    frames = int(dur * FPS)
    raw = []
    for i in range(frames):
        img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        draw_fn(img, i / FPS, dur)
        raw.append(np.array(img, dtype=np.uint8).tobytes())
    out = ODIR / f"{name}.mov"
    cmd = ["ffmpeg","-y","-f","rawvideo","-pixel_format","rgba",
           "-video_size",f"{W}x{H}","-framerate",str(FPS),"-i","pipe:0",
           "-c:v","prores_ks","-profile:v","4444","-pix_fmt","yuva444p10le",
           "-vendor","apl0","-bits_per_mb","8000", str(out)]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)
    for r in raw: proc.stdin.write(r)
    proc.stdin.close(); proc.wait()
    print(f"  ok {name}.mov ({dur:.1f}s)")

# Palette
BLUE     = (0,   212, 255)
PURPLE   = (123, 47,  190)
RED_ERR  = (255, 59,  48)
GREEN_OK = (48,  209, 88)

def ease_io(t, dur, rise=0.20, fall=0.12):
    pr = rise * dur; pf = (1 - fall) * dur
    if t < pr:  return (t / pr) ** 2
    if t > pf:  return max(0, 1 - ((t - pf) / (dur - pf)) ** 2)
    return 1.0

def rrect(draw, xy, r=22, fill=(0,0,0,180), outline=None, lw=4):
    draw.rounded_rectangle(list(xy), radius=r, fill=fill, outline=outline, width=lw)

# Helper: draw header tag bar inside panel
def header_tag(d, label, color, a, y_tag=None):
    if y_tag is None: y_tag = YT + 16
    tw = 360; th = 50
    tx = (W - tw) // 2
    rrect(d, (tx, y_tag, tx + tw, y_tag + th), r=14,
          fill=(*color, int(220 * a / 255)))
    d.text((W // 2, y_tag + th // 2), label, font=load_font(34, True),
           fill=(255, 255, 255, a), anchor="mm")

# ─── 1. INTRO ────────────────────────────────────────────────────────────────
def ov_intro(img, t, dur):
    a = int(255 * ease_io(t, dur))
    if a == 0: return
    d = ImageDraw.Draw(img)
    # Panel fond
    rrect(d, (60, YT, 1020, YB), fill=(10, 10, 20, int(200 * a / 255)),
          outline=(*RED_ERR, a), lw=5)
    # Barre clignotante haut
    blink = 0.5 + 0.5 * math.sin(t * 20)
    d.rectangle([60, YT, 1020, YT + 7],
                fill=(*RED_ERR, int(120 * a / 255 * blink)))
    # Tag rouge
    header_tag(d, "ERREUR FREQUENTE", RED_ERR, a, YT + 18)
    # Titre
    fXL = load_font(62, True)
    d.text((W // 2, YT + 108), "TROP VAGUE", font=fXL,
           fill=(*RED_ERR, a), anchor="mm",
           stroke_width=3, stroke_fill=(0, 0, 0, a))
    # Sous-titre
    d.text((W // 2, YT + 178), "avec l'Intelligence Artificielle",
           font=load_font(36), fill=(200, 200, 220, a), anchor="mm")
    # Cercle pulsant
    p = 1 + 0.08 * math.sin(t * 8)
    r = int(46 * p); cx = W // 2; cy = YT + 265
    d.ellipse([cx - r, cy - r, cx + r, cy + r],
              fill=(*RED_ERR, int(180 * a / 255)),
              outline=(255, 255, 255, int(60 * a / 255)), width=3)
    d.text((cx, cy), "X", font=load_font(42, True),
           fill=(255, 255, 255, a), anchor="mm")

# ─── 2. VAGUE ────────────────────────────────────────────────────────────────
def ov_vague(img, t, dur):
    a = int(255 * ease_io(t, dur))
    if a == 0: return
    d = ImageDraw.Draw(img)
    rrect(d, (60, YT, 1020, YB), fill=(30, 5, 5, int(195 * a / 255)),
          outline=(*RED_ERR, int(180 * a / 255)), lw=4)
    header_tag(d, "NE PAS FAIRE :", RED_ERR, a)
    d.line([(100, YT + 78), (980, YT + 78)],
           fill=(*RED_ERR, int(70 * a / 255)), width=2)
    # Bubble texte vague
    rrect(d, (90, YT + 90, 990, YT + 170), r=16,
          fill=(50, 10, 10, int(150 * a / 255)))
    d.text((W // 2, YT + 130), '"Redige-moi une lettre"',
           font=load_font(32), fill=(220, 180, 180, a), anchor="mm")
    d.text((W // 2, YT + 200), "=>",
           font=load_font(40, True), fill=(*RED_ERR, a), anchor="mm")
    d.text((W // 2, YT + 250), "Resultat generique",
           font=load_font(30), fill=(200, 200, 200, a), anchor="mm")
    # Compteur animé 0→9%
    prog = min(1.0, t / (dur * 0.6)); pct = int(prog * 9)
    d.text((W // 2, YT + 320), f"{pct}% efficacite",
           font=load_font(62, True), fill=(*RED_ERR, a), anchor="mm")

# ─── 3. CONTEXTE ─────────────────────────────────────────────────────────────
def ov_contexte(img, t, dur):
    a = int(255 * ease_io(t, dur))
    if a == 0: return
    d = ImageDraw.Draw(img)
    rrect(d, (60, YT, 1020, YB), fill=(5, 20, 40, int(195 * a / 255)),
          outline=(*BLUE, int(200 * a / 255)), lw=4)
    header_tag(d, "IL FAUT DU CONTEXTE", BLUE, a)
    d.line([(100, YT + 78), (980, YT + 78)],
           fill=(*BLUE, int(80 * a / 255)), width=2)
    items = ["Qui es-tu ?", "Ce que tu veux faire", "Le resultat attendu"]
    fM = load_font(32)
    for j, item in enumerate(items):
        ap = min(1.0, max(0.0, (t - j * 0.8) / 0.5))
        if ap <= 0: continue
        a2 = int(a * ap); y = YT + 95 + j * 78; ox = int((1 - ap) * 60)
        rrect(d, (90 + ox, y, 990, y + 62), r=14,
              fill=(0, 50, 90, int(140 * ap * a / 255)))
        d.text((130 + ox, y + 31), f">> {item}", font=fM,
               fill=(220, 240, 255, a2), anchor="lm")
    # Icône info
    p = 1 + 0.06 * math.sin(t * 7); r = int(36 * p)
    cx = W // 2; cy = YT + 330
    d.ellipse([cx - r, cy - r, cx + r, cy + r],
              fill=(*BLUE, int(150 * a / 255)))
    d.text((cx, cy), "i", font=load_font(30, True),
           fill=(255, 255, 255, a), anchor="mm")

# ─── 4. PUISSANCE ────────────────────────────────────────────────────────────
def ov_puissance(img, t, dur):
    a = int(255 * ease_io(t, dur))
    if a == 0: return
    d = ImageDraw.Draw(img)
    # Dégradé bleu→violet
    for dy in range(PH):
        frac = dy / PH
        rv = int(5 + 118 * frac); gv = int(20 + 27 * frac); bv = int(40 + 150 * frac)
        d.rectangle([(60, YT + dy), (1020, YT + dy + 1)],
                    fill=(rv, gv, bv, int(195 * a / 255)))
    d.rounded_rectangle([60, YT, 1020, YB], radius=24,
                        outline=(*BLUE, int(200 * a / 255)), width=4)
    d.text((W // 2, YT + 40), "L'IA A TOUT LE POUVOIR",
           font=load_font(40, True), fill=(255, 255, 255, a), anchor="mm")
    d.line([(100, YT + 72), (980, YT + 72)],
           fill=(*BLUE, int(100 * a / 255)), width=2)
    stats = ["Connaissance illimitee", "Execution instantanee", "N'importe quelle tache"]
    fM = load_font(30)
    for j, txt in enumerate(stats):
        ap = min(1.0, max(0.0, (t - j * 1.0) / 0.6)); a2 = int(a * ap)
        y = YT + 82 + j * 82
        rrect(d, (85, y, 995, y + 66), r=14,
              fill=(0, 80, 130, int(130 * ap * a / 255)))
        d.text((120, y + 33), f">> {txt}", font=fM,
               fill=(210, 240, 255, a2), anchor="lm")
    bl = 0.5 + 0.5 * math.sin(t * 5)
    d.text((W // 2, YT + 328), "... si tu la guides bien !",
           font=load_font(30, True), fill=(*BLUE, int(a * bl)), anchor="mm")

# ─── 5. EXEMPLE ──────────────────────────────────────────────────────────────
def ov_exemple(img, t, dur):
    a = int(255 * ease_io(t, dur))
    if a == 0: return
    d = ImageDraw.Draw(img)
    rrect(d, (60, YT, 1020, YB), fill=(5, 30, 10, int(195 * a / 255)),
          outline=(*GREEN_OK, int(180 * a / 255)), lw=4)
    header_tag(d, "EXEMPLE CONCRET", GREEN_OK, a)
    d.line([(100, YT + 78), (980, YT + 78)],
           fill=(*GREEN_OK, int(80 * a / 255)), width=2)
    d.text((W // 2, YT + 112), "Rediger une lettre de motivation",
           font=load_font(31), fill=(200, 230, 205, a), anchor="mm")
    # Cercle icône
    p = 1 + 0.05 * math.sin(t * 6); r = int(44 * p)
    cx = W // 2; cy = YT + 190
    d.ellipse([cx - r, cy - r, cx + r, cy + r],
              fill=(*GREEN_OK, int(130 * a / 255)))
    d.text((cx, cy), "DOC", font=load_font(28, True),
           fill=(255, 255, 255, a), anchor="mm")
    # Étapes animées
    steps = ["Diplome & domaine", "Poste vise", "Prompt structure"]
    fM = load_font(29)
    for j, s in enumerate(steps):
        ap = min(1.0, max(0.0, (t - j * 0.7) / 0.5)); a2 = int(a * ap)
        d.text((W // 2, YT + 250 + j * 46), f">> {s}",
               font=fM, fill=(200, 235, 210, a2), anchor="mm")

# ─── 6. BON PROMPT ───────────────────────────────────────────────────────────
def ov_bon_prompt(img, t, dur):
    a = int(255 * ease_io(t, dur))
    if a == 0: return
    d = ImageDraw.Draw(img)
    rrect(d, (60, YT, 1020, YB), fill=(5, 30, 10, int(195 * a / 255)),
          outline=(*GREEN_OK, int(200 * a / 255)), lw=5)
    header_tag(d, "BON PROMPT = BON RESULTAT", GREEN_OK, a)
    d.line([(100, YT + 78), (980, YT + 78)],
           fill=(*GREEN_OK, int(80 * a / 255)), width=2)
    # Bulle prompt
    rrect(d, (80, YT + 88, 1000, YT + 240), r=16,
          fill=(10, 50, 15, int(160 * a / 255)))
    fS = load_font(25)
    lines = ['"Je suis diplome en droit des affaires.',
             "J'aimerais postuler a ce poste et",
             "redige-moi une lettre professionnelle",
             'qui va me permettre de gagner ce poste."']
    for j, line in enumerate(lines):
        ap = min(1.0, max(0.0, (t - j * 0.7) / 0.5)); a2 = int(a * ap)
        d.text((W // 2, YT + 108 + j * 36), line,
               font=fS, fill=(180, 230, 185, a2), anchor="mm")
    # Score animé 0→95%
    prog = min(1.0, t / (dur * 0.5)); score = int(prog * 95)
    d.text((W // 2, YT + 295), f"{score}% efficacite",
           font=load_font(56, True), fill=(*GREEN_OK, a), anchor="mm")

# ─── 7. PROMPT ENGINEERING ───────────────────────────────────────────────────
def ov_prompt_eng(img, t, dur):
    a = int(255 * ease_io(t, dur))
    if a == 0: return
    d = ImageDraw.Draw(img)
    # Fond dégradé violet
    for dy in range(PH):
        frac = dy / PH
        rv = int(15 + 108 * frac); gv = int(5 + 10 * frac); bv = int(40 + 150 * frac)
        d.rectangle([(60, YT + dy), (1020, YT + dy + 1)],
                    fill=(rv, gv, bv, int(195 * a / 255)))
    d.rounded_rectangle([60, YT, 1020, YB], radius=24,
                        outline=(*PURPLE, int(200 * a / 255)), width=5)
    fXL = load_font(50, True)
    d.text((W // 2, YT + 45), "PROMPT ENGINEERING", font=fXL,
           fill=(255, 255, 255, a), anchor="mm",
           stroke_width=2, stroke_fill=(*PURPLE, a))
    d.line([(100, YT + 82), (980, YT + 82)],
           fill=(*PURPLE, int(100 * a / 255)), width=3)
    fM = load_font(31)
    d.text((W // 2, YT + 124), "L'art de formuler de bonnes",
           font=fM, fill=(220, 190, 255, a), anchor="mm")
    d.text((W // 2, YT + 164), "requetes a l'IA",
           font=fM, fill=(220, 190, 255, a), anchor="mm")
    # Cercle PE
    p = 1 + 0.07 * math.sin(t * 6); r = int(50 * p)
    cx = W // 2; cy = YT + 250
    d.ellipse([cx - r, cy - r, cx + r, cy + r],
              fill=(*PURPLE, int(140 * a / 255)))
    d.text((cx, cy), "PE", font=load_font(38, True),
           fill=(255, 255, 255, a), anchor="mm")
    bl = 0.7 + 0.3 * math.sin(t * 4)
    d.text((W // 2, YT + 326), "LA CLE DU FUTUR",
           font=load_font(34, True), fill=(*PURPLE, int(a * bl)), anchor="mm")

# ─── 8. CTA ──────────────────────────────────────────────────────────────────
def ov_cta(img, t, dur):
    a = int(255 * ease_io(t, dur))
    if a == 0: return
    d = ImageDraw.Draw(img)
    rrect(d, (60, YT, 1020, YB), fill=(30, 20, 5, int(200 * a / 255)),
          outline=(255, 200, 0, int(220 * a / 255)), lw=5)
    fB = load_font(44, True)
    d.text((W // 2, YT + 48), "ABONNE-TOI !", font=fB,
           fill=(255, 200, 0, a), anchor="mm",
           stroke_width=2, stroke_fill=(0, 0, 0, a))
    d.line([(100, YT + 88), (980, YT + 88)],
           fill=(255, 200, 0, int(80 * a / 255)), width=2)
    d.text((W // 2, YT + 132), "Ne rate pas la prochaine video :",
           font=load_font(31), fill=(220, 200, 150, a), anchor="mm")
    d.text((W // 2, YT + 180), "Le Prompt Engineering complet",
           font=load_font(33, True), fill=(255, 230, 150, a), anchor="mm")
    br = int(44 + 4 * math.sin(t * 4))
    cx = W // 2; cy = YT + 270
    d.ellipse([cx - br, cy - br, cx + br, cy + br],
              fill=(255, 200, 0, int(160 * a / 255)))
    d.text((cx, cy), "BELL", font=load_font(24, True),
           fill=(0, 0, 0, a), anchor="mm")

JOBS = [
    ("intro",      8.0,  ov_intro),
    ("vague",      9.0,  ov_vague),
    ("contexte",   8.0,  ov_contexte),
    ("puissance", 16.0,  ov_puissance),
    ("exemple",   12.0,  ov_exemple),
    ("bon_prompt",16.0,  ov_bon_prompt),
    ("prompt_eng",15.0,  ov_prompt_eng),
    ("cta",        9.0,  ov_cta),
]

print("Generation overlays (zone y=1080-1440, polices corrigees)...")
for name, dur, fn in JOBS:
    render_mov(name, dur, fn)
print("Termine.")
