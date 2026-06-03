#!/usr/bin/env python3
"""Overlays PIL->ProRes 4444 pour la vidéo Prompt Engineering / IA.
Zone : y=880-1430. Theme : Tech / AI -- bleu electrique, cyan, violet.
"""
from PIL import Image, ImageDraw, ImageFont
import numpy as np, subprocess, os, math
from pathlib import Path

W, H = 1080, 1920
EDIT = Path(__file__).parent
ODIR = EDIT / "overlays"
ODIR.mkdir(exist_ok=True)

FPS = 30

def load_font(size, bold=False):
    for name in (["Montserrat-Bold.ttf","Montserrat-SemiBold.ttf"] if bold
                 else ["Montserrat-Regular.ttf","Montserrat.ttf","DejaVuSans.ttf"]):
        for d in [Path.home()/".fonts", Path("/usr/share/fonts/truetype/dejavu"),
                  Path("/usr/share/fonts/truetype/liberation")]:
            p = d/name
            if p.exists(): return ImageFont.truetype(str(p), size)
    return ImageFont.load_default()

def render_mov(name, dur, draw_fn):
    frames = int(dur * FPS)
    raw = []
    for i in range(frames):
        t = i / FPS
        img = Image.new("RGBA", (W, H), (0,0,0,0))
        draw_fn(img, t, dur)
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
RED_ERR  = (255, 59,  48 )
GREEN_OK = (48,  209, 88 )

def ease_io(t, dur, rise=0.20, fall=0.12):
    pr = rise*dur; pf = (1-fall)*dur
    if t < pr: return (t/pr)**2
    if t > pf: return max(0, 1-((t-pf)/(dur-pf))**2)
    return 1.0

def rrect(draw, xy, r=24, fill=(0,0,0,180), outline=None, lw=4):
    draw.rounded_rectangle(list(xy), radius=r, fill=fill,
                            outline=outline, width=lw)

# 1. INTRO
def ov_intro(img, t, dur):
    a = int(255*ease_io(t, dur))
    if a == 0: return
    d = ImageDraw.Draw(img)
    rrect(d,(60,900,1020,1230),fill=(10,10,20,int(200*a/255)),
          outline=(*RED_ERR,a),lw=5)
    d.rectangle([60,900,1020,907],fill=(*RED_ERR,int(120*a/255*(0.5+0.5*math.sin(t*20)))))
    fB=load_font(38,True); fXL=load_font(66,True); fM=load_font(38)
    tw=340; ty=915
    rrect(d,((W-tw)//2,ty,(W+tw)//2,ty+54),r=14,fill=(*RED_ERR,int(220*a/255)))
    d.text((W//2,ty+27),"ERREUR FREQUENTE",font=fB,fill=(255,255,255,a),anchor="mm")
    d.text((W//2,1022),"TROP VAGUE",font=fXL,fill=(*RED_ERR,a),anchor="mm",
           stroke_width=3,stroke_fill=(0,0,0,a))
    d.text((W//2,1098),"avec l'Intelligence Artificielle",font=fM,
           fill=(200,200,220,a),anchor="mm")
    p=1+0.08*math.sin(t*8); r=int(50*p); cx=W//2; cy=1175
    d.ellipse([cx-r,cy-r,cx+r,cy+r],fill=(*RED_ERR,int(180*a/255)),
              outline=(255,255,255,int(60*a/255)),width=3)
    d.text((cx,cy),"X",font=load_font(46,True),fill=(255,255,255,a),anchor="mm")

# 2. VAGUE
def ov_vague(img, t, dur):
    a = int(255*ease_io(t, dur))
    if a == 0: return
    d = ImageDraw.Draw(img)
    rrect(d,(60,895,1020,1320),fill=(30,5,5,int(195*a/255)),
          outline=(*RED_ERR,int(180*a/255)),lw=4)
    fB=load_font(40,True); fM=load_font(34); fS=load_font(32)
    d.text((W//2,930),"NE PAS FAIRE :",font=fB,fill=(*RED_ERR,a),anchor="mm")
    d.line([(100,962),(980,962)],fill=(*RED_ERR,int(70*a/255)),width=2)
    rrect(d,(90,975,990,1065),r=16,fill=(50,10,10,int(150*a/255)))
    d.text((W//2,1020),'"Redige-moi une lettre"',font=fM,
           fill=(220,180,180,a),anchor="mm")
    d.text((W//2,1100),"=>",font=load_font(42,True),fill=(*RED_ERR,a),anchor="mm")
    d.text((W//2,1150),"Resultat generique",font=fS,fill=(200,200,200,a),anchor="mm")
    prog=min(1.0,t/(dur*0.6)); pct=int(prog*9)
    fXL=load_font(70,True)
    d.text((W//2,1258),f"{pct}% efficacite",font=fXL,fill=(*RED_ERR,a),anchor="mm")

# 3. CONTEXTE
def ov_contexte(img, t, dur):
    a = int(255*ease_io(t, dur))
    if a == 0: return
    d = ImageDraw.Draw(img)
    rrect(d,(60,895,1020,1300),fill=(5,20,40,int(195*a/255)),
          outline=(*BLUE,int(200*a/255)),lw=4)
    fB=load_font(42,True)
    d.text((W//2,930),"IL FAUT DU CONTEXTE",font=fB,fill=(*BLUE,a),anchor="mm")
    d.line([(100,965),(980,965)],fill=(*BLUE,int(80*a/255)),width=2)
    items=["Qui es-tu ?","Ce que tu veux faire","Le resultat attendu"]
    fM=load_font(33)
    for j,item in enumerate(items):
        ap=min(1.0,max(0.0,(t-j*0.8)/0.5))
        if ap<=0: continue
        a2=int(a*ap); y=995+j*90; ox=int((1-ap)*60)
        rrect(d,(90+ox,y,990,y+68),r=14,fill=(0,50,90,int(140*ap*a/255)))
        d.text((130+ox,y+34),f"• {item}",font=fM,fill=(220,240,255,a2),anchor="lm")
    p=1+0.06*math.sin(t*7); r=int(38*p); cx=W//2; cy=1262
    d.ellipse([cx-r,cy-r,cx+r,cy+r],fill=(*BLUE,int(150*a/255)))
    d.text((cx,cy),"i",font=load_font(34,True),fill=(255,255,255,a),anchor="mm")

# 4. PUISSANCE
def ov_puissance(img, t, dur):
    a = int(255*ease_io(t, dur))
    if a == 0: return
    d = ImageDraw.Draw(img)
    for dy in range(430):
        frac=dy/430
        r=int(5+118*frac); g=int(20+27*frac); b=int(40+150*frac)
        d.rectangle([(60,895+dy),(1020,896+dy)],fill=(r,g,b,int(195*a/255)))
    d.rounded_rectangle([60,895,1020,1325],radius=24,
                         outline=(*BLUE,int(200*a/255)),width=4)
    fB=load_font(42,True)
    d.text((W//2,932),"L'IA A TOUT LE POUVOIR",font=fB,
           fill=(255,255,255,a),anchor="mm")
    d.line([(100,968),(980,968)],fill=(*BLUE,int(100*a/255)),width=2)
    stats=[("Connaissance illimitee"),("Execution instantanee"),("N'importe quelle tache")]
    fM=load_font(32)
    for j,txt in enumerate(stats):
        ap=min(1.0,max(0.0,(t-j*1.0)/0.6)); a2=int(a*ap)
        y=985+j*95
        rrect(d,(85,y,995,y+73),r=14,fill=(0,80,130,int(130*ap*a/255)))
        d.text((120,y+36),f">> {txt}",font=fM,fill=(210,240,255,a2),anchor="lm")
    bl=0.5+0.5*math.sin(t*5)
    d.text((W//2,1292),"... si tu la guides bien !",
           font=load_font(32,True),fill=(*BLUE,int(a*bl)),anchor="mm")

# 5. EXEMPLE
def ov_exemple(img, t, dur):
    a = int(255*ease_io(t, dur))
    if a == 0: return
    d = ImageDraw.Draw(img)
    rrect(d,(60,895,1020,1300),fill=(5,30,10,int(195*a/255)),
          outline=(*GREEN_OK,int(180*a/255)),lw=4)
    fB=load_font(40,True)
    d.text((W//2,930),"EXEMPLE CONCRET",font=fB,fill=(*GREEN_OK,a),anchor="mm")
    d.line([(100,965),(980,965)],fill=(*GREEN_OK,int(80*a/255)),width=2)
    d.text((W//2,1008),"Rediger une lettre de motivation",
           font=load_font(33),fill=(200,230,205,a),anchor="mm")
    p=1+0.05*math.sin(t*6); r=int(48*p); cx=W//2; cy=1098
    d.ellipse([cx-r,cy-r,cx+r,cy+r],fill=(*GREEN_OK,int(130*a/255)))
    d.text((cx,cy),"DOC",font=load_font(30,True),fill=(255,255,255,a),anchor="mm")
    steps=["Diplome & domaine","Poste vise","Prompt structure"]
    fM=load_font(31)
    for j,s in enumerate(steps):
        ap=min(1.0,max(0.0,(t-j*0.7)/0.5)); a2=int(a*ap)
        d.text((W//2,1165+j*52),f"=> {s}",font=fM,
               fill=(200,235,210,a2),anchor="mm")

# 6. BON PROMPT
def ov_bon_prompt(img, t, dur):
    a = int(255*ease_io(t, dur))
    if a == 0: return
    d = ImageDraw.Draw(img)
    rrect(d,(60,885,1020,1340),fill=(5,30,10,int(195*a/255)),
          outline=(*GREEN_OK,int(200*a/255)),lw=5)
    fB=load_font(42,True)
    d.text((W//2,920),"BON PROMPT = BON RESULTAT",font=fB,
           fill=(*GREEN_OK,a),anchor="mm")
    d.line([(100,958),(980,958)],fill=(*GREEN_OK,int(80*a/255)),width=2)
    rrect(d,(80,970,1000,1155),r=16,fill=(10,50,15,int(160*a/255)))
    fS=load_font(27)
    lines=["\"Je suis diplome en droit des affaires.",
           "J'aimerais postuler a ce poste et",
           "redige-moi une lettre professionnelle",
           "qui va me permettre de gagner ce poste.\""]
    for j,line in enumerate(lines):
        ap=min(1.0,max(0.0,(t-j*0.7)/0.5)); a2=int(a*ap)
        d.text((W//2,1000+j*44),line,font=fS,fill=(180,230,185,a2),anchor="mm")
    prog=min(1.0,t/(dur*0.5)); score=int(prog*95)
    fXL=load_font(60,True)
    d.text((W//2,1260),f"{score}% efficacite",font=fXL,
           fill=(*GREEN_OK,a),anchor="mm")

# 7. PROMPT ENGINEERING
def ov_prompt_eng(img, t, dur):
    a = int(255*ease_io(t, dur))
    if a == 0: return
    d = ImageDraw.Draw(img)
    for dy in range(440):
        frac=dy/440
        r=int(15+108*frac); g=int(5+10*frac); b=int(40+150*frac)
        d.rectangle([(60,890+dy),(1020,891+dy)],fill=(r,g,b,int(195*a/255)))
    d.rounded_rectangle([60,890,1020,1330],radius=24,
                         outline=(*PURPLE,int(200*a/255)),width=5)
    fXL=load_font(54,True)
    d.text((W//2,930),"PROMPT ENGINEERING",font=fXL,
           fill=(255,255,255,a),anchor="mm",stroke_width=2,stroke_fill=(*PURPLE,a))
    d.line([(100,970),(980,970)],fill=(*PURPLE,int(100*a/255)),width=3)
    fM=load_font(33)
    d.text((W//2,1015),"L'art de formuler de bonnes",font=fM,
           fill=(220,190,255,a),anchor="mm")
    d.text((W//2,1058),"requetes a l'IA",font=fM,fill=(220,190,255,a),anchor="mm")
    p=1+0.07*math.sin(t*6); r=int(53*p); cx=W//2; cy=1160
    d.ellipse([cx-r,cy-r,cx+r,cy+r],fill=(*PURPLE,int(140*a/255)))
    d.text((cx,cy),"PE",font=load_font(40,True),fill=(255,255,255,a),anchor="mm")
    bl=0.7+0.3*math.sin(t*4)
    fB2=load_font(36,True)
    d.text((W//2,1265),"LA CLE DU FUTUR",font=fB2,
           fill=(*PURPLE,int(a*bl)),anchor="mm")

# 8. CTA
def ov_cta(img, t, dur):
    a = int(255*ease_io(t, dur))
    if a == 0: return
    d = ImageDraw.Draw(img)
    rrect(d,(60,900,1020,1260),fill=(30,20,5,int(200*a/255)),
          outline=(255,200,0,int(220*a/255)),lw=5)
    fB=load_font(46,True); fM=load_font(33); fB2=load_font(35,True)
    d.text((W//2,938),"ABONNE-TOI !",font=fB,fill=(255,200,0,a),anchor="mm",
           stroke_width=2,stroke_fill=(0,0,0,a))
    d.line([(100,976),(980,976)],fill=(255,200,0,int(80*a/255)),width=2)
    d.text((W//2,1020),"Ne rate pas la prochaine video :",font=fM,
           fill=(220,200,150,a),anchor="mm")
    d.text((W//2,1070),"Le Prompt Engineering complet",font=fB2,
           fill=(255,230,150,a),anchor="mm")
    br=int(46+4*math.sin(t*4)); cx=W//2; cy=1178
    d.ellipse([cx-br,cy-br,cx+br,cy+br],fill=(255,200,0,int(160*a/255)))
    d.text((cx,cy),"BELL",font=load_font(26,True),fill=(0,0,0,a),anchor="mm")

JOBS=[
    ("intro",       8.0,  ov_intro),
    ("vague",       9.0,  ov_vague),
    ("contexte",    8.0,  ov_contexte),
    ("puissance",  16.0,  ov_puissance),
    ("exemple",    12.0,  ov_exemple),
    ("bon_prompt", 16.0,  ov_bon_prompt),
    ("prompt_eng", 15.0,  ov_prompt_eng),
    ("cta",         9.0,  ov_cta),
]

print("Generation overlays (theme IA/Prompt Engineering)...")
for name,dur,fn in JOBS:
    render_mov(name, dur, fn)
print("Termine.")
