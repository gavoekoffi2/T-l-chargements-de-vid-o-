#!/usr/bin/env python3
"""Génère les overlays motion design (PIL -> WebM transparent VP9/yuva420p).

Chaque overlay = une fonction qui dessine la frame à l'instant local t.
Rendu : frames RGBA pipées vers ffmpeg -> webm alpha.
Palette premium financière, easing pro, fond transparent (n'obscurcit pas le visage).
"""
import math, subprocess, os
from PIL import Image, ImageDraw, ImageFont

W, H, FPS = 1080, 1920, 30
OUT = os.path.join(os.path.dirname(__file__), "animations")
os.makedirs(OUT, exist_ok=True)

# ---- Palette ----
GOLD   = (255, 200, 70)
CYAN   = (0, 212, 255)
WHITE  = (255, 255, 255)
DIM    = (155, 165, 185)
GREEN  = (45, 222, 135)
RED    = (255, 90, 90)
PANEL  = (12, 18, 35)      # dark glass (alpha appliqué au dessin)

BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
REG  = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
_fc = {}
def font(sz, bold=True):
    k=(sz,bold)
    if k not in _fc: _fc[k]=ImageFont.truetype(BOLD if bold else REG, sz)
    return _fc[k]

# ---- Easing ----
def eo(t): t=max(0,min(1,t)); return 1-(1-t)**3            # ease_out_cubic
def eio(t):
    t=max(0,min(1,t))
    return 4*t**3 if t<0.5 else 1-(-2*t+2)**3/2            # ease_in_out_cubic
def clamp01(x): return max(0.0,min(1.0,x))

def lerp(a,b,t): return a+(b-a)*t
def col(c, a): return (c[0],c[1],c[2],int(max(0,min(255,a))))

def text_wh(d, s, f):
    bb=d.textbbox((0,0),s,font=f); return bb[2]-bb[0], bb[3]-bb[1]

def ctext(d, cx, y, s, f, fill, anchor_mid=True):
    w,h=text_wh(d,s,f)
    x=cx-w/2 if anchor_mid else cx
    d.text((x,y),s,font=f,fill=fill)
    return w,h

def rrect(d, box, r, fill):
    d.rounded_rectangle(box, radius=r, fill=fill)

def panel_glass(img, box, r, alpha=225, border=CYAN, bw=3, border_a=180):
    """Dessine un panneau verre dépoli avec bordure néon."""
    lay=Image.new("RGBA",img.size,(0,0,0,0)); d=ImageDraw.Draw(lay)
    rrect(d, box, r, col(PANEL, alpha))
    d.rounded_rectangle(box, radius=r, outline=col(border,border_a), width=bw)
    img.alpha_composite(lay)

def glow_text(img, cx, y, s, f, fill, glow, anchor_mid=True, ga=110):
    """Texte avec halo."""
    g=Image.new("RGBA",img.size,(0,0,0,0)); dg=ImageDraw.Draw(g)
    w,h=text_wh(dg,s,f); x=cx-w/2 if anchor_mid else cx
    from PIL import ImageFilter
    dg.text((x,y),s,font=f,fill=col(glow,ga))
    g=g.filter(ImageFilter.GaussianBlur(8)); img.alpha_composite(g)
    d=ImageDraw.Draw(img); d.text((x,y),s,font=f,fill=fill)
    return w,h

# ============ Moteur de rendu ============
def render(name, dur, draw_fn):
    n=int(dur*FPS)
    cmd=["ffmpeg","-y","-f","rawvideo","-pix_fmt","rgba","-s",f"{W}x{H}","-r",str(FPS),
         "-i","pipe:0","-c:v","prores_ks","-profile:v","4444","-pix_fmt","yuva444p10le",
         "-an", os.path.join(OUT,f"{name}.mov")]
    p=subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for i in range(n):
        t=i/FPS
        img=Image.new("RGBA",(W,H),(0,0,0,0))
        draw_fn(img, t, dur)
        p.stdin.write(img.tobytes())
    p.stdin.close(); p.wait()
    print(f"  ✓ {name}.mov ({dur:.1f}s, {n} frames)")

# fade global d'entrée/sortie
def life(t, dur, fin=0.4, fout=0.4):
    a_in = eo(t/fin) if t<fin else 1.0
    a_out = eo((dur-t)/fout) if t>dur-fout else 1.0
    return clamp01(min(a_in,a_out))

# ============ OVERLAYS ============

def ov_intro(img, t, dur):
    A=life(t,dur)*255
    d=ImageDraw.Draw(img)
    bw=int(lerp(0, 620, eo(t/0.6)))
    rrect(d,(W//2-bw//2, 1070, W//2+bw//2, 1078), 4, col(GOLD, A))
    glow_text(img, W//2, 1100, "IMMIGRANTS", font(96), col(WHITE,A), CYAN, ga=int(A*0.4))
    glow_text(img, W//2, 1210, "FRANCOPHONES", font(96), col(GOLD,A), GOLD, ga=int(A*0.4))
    sub_a=life(t,dur)*clamp01((t-0.4)/0.4)*255
    ctext(d, W//2, 1340, "•  AU  CANADA  •", font(40), col(CYAN,sub_a))

def ov_canada(img, t, dur):
    A=life(t,dur,0.5,0.5)*255
    d=ImageDraw.Draw(img)
    panel_glass(img,(70,1000,W-70,1460),28,alpha=int(0.92*A),border=CYAN,border_a=int(0.7*A))
    d=ImageDraw.Draw(img)
    ctext(d, W//2, 1035, "PARTOUT  AU  CANADA", font(44), col(CYAN,A))
    provinces=["QUÉBEC","ONTARIO","ALBERTA","SASKATCHEWAN",
               "MONTRÉAL","OTTAWA","VANCOUVER","NOUVEAU-BRUNSWICK"]
    x0,y0=130,1120; cw=(W-260)//2; rh=78
    for i,pv in enumerate(provinces):
        appear=clamp01((t-0.5-i*0.28)/0.3)
        if appear<=0: continue
        col_i=i%2; row=i//2
        cx=x0+cw*col_i+cw//2; cy=y0+row*rh
        a=eo(appear)*A
        d.ellipse((cx-cw//2+10,cy+14,cx-cw//2+30,cy+34), fill=col(GOLD,a))
        d.text((cx-cw//2+45, cy+8), pv, font=font(33), fill=col(WHITE,a))

def ov_counter(img, t, dur):
    A=life(t,dur)*255
    d=ImageDraw.Draw(img)
    panel_glass(img,(120,1050,W-120,1490),30,alpha=int(0.93*A),border=RED,border_a=int(0.6*A))
    d=ImageDraw.Draw(img)
    ctext(d, W//2, 1090, "LE  PIÈGE", font(40), col(RED,A))
    jobs = 1 + int(clamp01((t-0.3)/1.2)*2 + 0.5)
    jobs=min(3,jobs)
    glow_text(img, W//2-180, 1160, f"{jobs}", font(180), col(WHITE,A), RED, ga=int(A*0.4))
    ctext(d, W//2-180, 1360, "JOBS", font(48), col(DIM,A))
    ctext(d, W//2+30, 1230, "→", font(120), col(GOLD,A))
    hrs=int(clamp01((t-0.6)/1.4)*80)
    glow_text(img, W//2+230, 1160, f"{hrs}", font(150), col(GOLD,A), GOLD, ga=int(A*0.4))
    ctext(d, W//2+230, 1360, "H / SEMAINE", font(40), col(DIM,A))

def ov_t4(img, t, dur):
    A=life(t,dur)*255
    d=ImageDraw.Draw(img)
    panel_glass(img,(110,1050,W-110,1510),30,alpha=int(0.93*A),border=RED,border_a=int(0.6*A))
    d=ImageDraw.Draw(img)
    ctext(d, W//2, 1090, "TON  SALAIRE  ( T4 )", font(44), col(WHITE,A))
    bx,by,bw,bh=170,1200,W-340,90
    rrect(d,(bx,by,bx+bw,by+bh),16,col((40,50,75),int(A)))
    take=clamp01((t-0.5)/1.3)
    cut=int(bw*0.45*take)
    rrect(d,(bx,by,bx+cut,by+bh),16,col(RED,int(A)))
    rrect(d,(bx+cut,by,bx+bw,by+bh),16,col(GREEN,int(A*0.85)))
    pct=int(45*take)
    ctext(d, bx+cut//2 if cut>120 else bx+90, by+bh+20, f"−{pct}%", font(40), col(RED,A))
    ctext(d, W//2, 1390, "PRÉLEVÉ  CHAQUE  MOIS", font(36), col(DIM,A))

def ov_sixans(img, t, dur):
    A=life(t,dur)*255
    d=ImageDraw.Draw(img)
    sc=lerp(0.4,1.0,eo(t/0.5))
    glow_text(img, W//2, int(1150-(sc-1)*60), "6", font(int(300*sc)), col(GOLD,A), GOLD, ga=int(A*0.5))
    ctext(d, W//2, 1480, "ANS  DE  LIBERTÉ", font(64), col(WHITE,A))
    line=int(lerp(0,520,eo(clamp01((t-0.4)/0.6))))
    rrect(d,(W//2-line//2,1560,W//2+line//2,1566),3,col(CYAN,A))

def ov_liberte(img, t, dur):
    A=life(t,dur,0.5,0.5)*255
    d=ImageDraw.Draw(img)
    panel_glass(img,(90,1000,W-90,1510),30,alpha=int(0.92*A),border=GREEN,border_a=int(0.6*A))
    d=ImageDraw.Draw(img)
    glow_text(img, W//2, 1050, "LIBERTÉ", font(90), col(GREEN,A), GREEN, ga=int(A*0.4))
    items=["✓  Ta maison","✓  Du temps en famille","✓  Voyager","✓  Définir ton temps"]
    for i,it in enumerate(items):
        ap=clamp01((t-0.6-i*0.3)/0.3)
        if ap<=0: continue
        a=eo(ap)*A; x=int(lerp(160-40,160,eo(ap)))
        d.text((x, 1200+i*72), it, font=font(44), fill=col(WHITE,a))

def ov_cta(img, t, dur):
    A=life(t,dur)*255
    d=ImageDraw.Draw(img)
    panel_glass(img,(90,1060,W-90,1460),34,alpha=int(0.95*A),border=GOLD,border_a=int(0.8*A))
    d=ImageDraw.Draw(img)
    ctext(d, W//2, 1100, "ÉCRIS  EN  COMMENTAIRE", font(42), col(WHITE,A))
    bx,by,bw,bh=160,1190,W-320,120
    rrect(d,(bx,by,bx+bw,by+bh),18,col((8,12,24),int(A)))
    d.rounded_rectangle((bx,by,bx+bw,by+bh),radius=18,outline=col(GOLD,int(A)),width=3)
    full="ABRAHAM VALEUR"
    nch=int(clamp01((t-0.5)/1.4)*len(full))
    typed=full[:nch]
    cur = "|" if int(t*2)%2==0 else " "
    glow_text(img, W//2, by+30, typed+cur, font(56), col(GOLD,A), GOLD, ga=int(A*0.35))
    ctext(d, W//2, 1380, "envoie-moi  «  ABRAHAM VALEUR  »", font(34), col(CYAN,A))

def ov_endcard(img, t, dur):
    A=life(t,dur,0.5,0.6)*255
    d=ImageDraw.Draw(img)
    panel_glass(img,(70,1050,W-70,1540),30,alpha=int(0.95*A),border=CYAN,border_a=int(0.7*A))
    d=ImageDraw.Draw(img)
    bw=int(lerp(0,560,eo(t/0.6)))
    rrect(d,(W//2-bw//2,1100,W//2+bw//2,1108),4,col(GOLD,A))
    glow_text(img, W//2, 1130, "ABRAHAM KOFFI AKPOBI", font(58), col(WHITE,A), CYAN, ga=int(A*0.3))
    ctext(d, W//2, 1240, "Conseiller en sécurité financière", font(40), col(GOLD,A))
    s2=clamp01((t-0.5)/0.5)*A
    ctext(d, W//2, 1320, "Directeur — Finup  ×  Great Way Financial", font(31), col(DIM,s2))
    ctext(d, W//2, 1400, "Objectif : 800 conseillers formés d'ici 2030", font(30), col(CYAN,s2))

JOBS=[
 ("intro",    5.0, ov_intro),
 ("canada",   9.5, ov_canada),
 ("counter",  6.0, ov_counter),
 ("t4",       6.0, ov_t4),
 ("sixans",   5.5, ov_sixans),
 ("liberte",  7.0, ov_liberte),
 ("cta",      6.5, ov_cta),
 ("endcard",  7.0, ov_endcard),
]

if __name__=="__main__":
    import sys
    only=sys.argv[1:] if len(sys.argv)>1 else None
    print("Génération overlays...")
    for name,dur,fn in JOBS:
        if only and name not in only: continue
        render(name,dur,fn)
    print("Terminé.")
