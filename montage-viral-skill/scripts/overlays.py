#!/usr/bin/env python3
"""Overlays motion design pour la vidéo médecins/dentistes — stratégie RRA.
Tous les panneaux sont dans la zone poitrine/ventre (y=1000-1580) — visage dégagé.
"""
import math, subprocess, os
from PIL import Image, ImageDraw, ImageFont

W, H, FPS = 1080, 1920, 30
OUT = os.path.join(os.path.dirname(__file__), "animations")
os.makedirs(OUT, exist_ok=True)

GOLD  = (255, 200, 70)
CYAN  = (0, 212, 255)
WHITE = (255, 255, 255)
DIM   = (155, 165, 185)
GREEN = (45, 222, 135)
RED   = (255, 90, 90)
PANEL = (12, 18, 35)

BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
REG  = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
_fc = {}
def font(sz, bold=True):
    k=(sz,bold)
    if k not in _fc: _fc[k]=ImageFont.truetype(BOLD if bold else REG, sz)
    return _fc[k]

def eo(t):  t=max(0,min(1,t)); return 1-(1-t)**3
def eio(t): t=max(0,min(1,t)); return 4*t**3 if t<0.5 else 1-(-2*t+2)**3/2
def cl(x):  return max(0.0,min(1.0,x))
def lerp(a,b,t): return a+(b-a)*t
def col(c,a): return (c[0],c[1],c[2],int(max(0,min(255,a))))

def text_wh(d,s,f): bb=d.textbbox((0,0),s,font=f); return bb[2]-bb[0],bb[3]-bb[1]
def ctext(d,cx,y,s,f,fill,anchor_mid=True):
    w,h=text_wh(d,s,f); x=cx-w/2 if anchor_mid else cx
    d.text((x,y),s,font=f,fill=fill); return w,h
def rrect(d,box,r,fill): d.rounded_rectangle(box,radius=r,fill=fill)

def panel_glass(img,box,r,alpha=225,border=CYAN,bw=3,border_a=180):
    lay=Image.new("RGBA",img.size,(0,0,0,0)); d=ImageDraw.Draw(lay)
    rrect(d,box,r,col(PANEL,alpha))
    d.rounded_rectangle(box,radius=r,outline=col(border,border_a),width=bw)
    img.alpha_composite(lay)

def glow_text(img,cx,y,s,f,fill,glow,anchor_mid=True,ga=110):
    from PIL import ImageFilter
    g=Image.new("RGBA",img.size,(0,0,0,0)); dg=ImageDraw.Draw(g)
    w,h=text_wh(dg,s,f); x=cx-w/2 if anchor_mid else cx
    dg.text((x,y),s,font=f,fill=col(glow,ga))
    g=g.filter(ImageFilter.GaussianBlur(8)); img.alpha_composite(g)
    d=ImageDraw.Draw(img); d.text((x,y),s,font=f,fill=fill)
    return w,h

def render(name,dur,draw_fn):
    n=int(dur*FPS)
    cmd=["ffmpeg","-y","-f","rawvideo","-pix_fmt","rgba","-s",f"{W}x{H}","-r",str(FPS),
         "-i","pipe:0","-c:v","prores_ks","-profile:v","4444","-pix_fmt","yuva444p10le",
         "-an", os.path.join(OUT,f"{name}.mov")]
    p=subprocess.Popen(cmd,stdin=subprocess.PIPE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    for i in range(n):
        t=i/FPS; img=Image.new("RGBA",(W,H),(0,0,0,0))
        draw_fn(img,t,dur); p.stdin.write(img.tobytes())
    p.stdin.close(); p.wait()
    print(f"  ✓ {name}.mov ({dur:.1f}s)")

def life(t,dur,fin=0.4,fout=0.4):
    a_in=eo(t/fin) if t<fin else 1.0
    a_out=eo((dur-t)/fout) if t>dur-fout else 1.0
    return cl(min(a_in,a_out))

# ====== OVERLAYS (zone poitrine/ventre : y=1000-1580) ======

def ov_intro(img,t,dur):
    A=life(t,dur)*255; d=ImageDraw.Draw(img)
    bw=int(lerp(0,620,eo(t/0.6)))
    rrect(d,(W//2-bw//2,1060,W//2+bw//2,1068),4,col(GOLD,A))
    glow_text(img,W//2,1090,"MÉDECINS &",font(88),col(WHITE,A),CYAN,ga=int(A*0.4))
    glow_text(img,W//2,1195,"DENTISTES",font(88),col(GOLD,A),GOLD,ga=int(A*0.4))
    sub_a=life(t,dur)*cl((t-0.4)/0.4)*255
    ctext(d,W//2,1320,"•  UNE  OPPORTUNITÉ  •",font(38),col(CYAN,sub_a))

def ov_heures(img,t,dur):
    A=life(t,dur)*255; d=ImageDraw.Draw(img)
    panel_glass(img,(80,1040,W-80,1500),28,alpha=int(0.92*A),border=RED,border_a=int(0.7*A))
    d=ImageDraw.Draw(img)
    ctext(d,W//2,1075,"VOUS  TRAVAILLEZ",font(42),col(RED,A))
    hrs=int(cl((t-0.4)/1.2)*70)
    glow_text(img,W//2,1135,f"{hrs}H",font(230),col(WHITE,A),RED,ga=int(A*0.45))
    ctext(d,W//2,1395,"PAR  SEMAINE",font(52),col(GOLD,A))
    ctext(d,W//2,1462,"ET VOTRE FAMILLE ?",font(36),col(DIM,A))

def ov_retraite(img,t,dur):
    A=life(t,dur)*255; d=ImageDraw.Draw(img)
    panel_glass(img,(100,1050,W-100,1510),30,alpha=int(0.93*A),border=RED,border_a=int(0.65*A))
    d=ImageDraw.Draw(img)
    ctext(d,W//2,1085,"VOTRE  RETRAITE",font(44),col(WHITE,A))
    pct=int(cl((t-0.3)/1.2)*9)
    glow_text(img,W//2,1140,f"{pct}%",font(220),col(RED,A),RED,ga=int(A*0.45))
    ctext(d,W//2,1390,"DE  TON  SALAIRE",font(46),col(GOLD,A))
    bx,by,bw,bh=140,1440,W-280,48
    rrect(d,(bx,by,bx+bw,by+bh),10,col((30,40,60),int(A)))
    fill_w=int(bw*0.09*cl((t-0.5)/1.0))
    rrect(d,(bx,by,bx+fill_w,by+bh),10,col(RED,int(A)))
    rrect(d,(bx+fill_w,by,bx+bw,by+bh),10,col((45,60,90),int(A*0.6)))

def ov_solution(img,t,dur):
    A=life(t,dur,0.5,0.5)*255; d=ImageDraw.Draw(img)
    sc=lerp(0.5,1.0,eo(t/0.5))
    glow_text(img,W//2,int(1140-(sc-1)*50),"J'AI",font(int(140*sc)),col(GOLD,A),GOLD,ga=int(A*0.5))
    glow_text(img,W//2,1300,"UNE  SOLUTION",font(72),col(WHITE,A),CYAN,ga=int(A*0.35))
    line=int(lerp(0,500,eo(cl((t-0.4)/0.5))))
    rrect(d,(W//2-line//2,1435,W//2+line//2,1441),3,col(CYAN,A))

def ov_rra(img,t,dur):
    A=life(t,dur,0.5,0.5)*255; d=ImageDraw.Draw(img)
    panel_glass(img,(70,1010,W-70,1490),30,alpha=int(0.93*A),border=CYAN,border_a=int(0.7*A))
    d=ImageDraw.Draw(img)
    ctext(d,W//2,1045,"STRATÉGIE",font(44),col(CYAN,A))
    glow_text(img,W//2,1100,"RRA",font(200),col(WHITE,A),CYAN,ga=int(A*0.4))
    ctext(d,W//2,1355,"RÉGIME  DE  RETRAITE  ASSURÉE",font(32),col(GOLD,A))
    s2=cl((t-0.5)/0.5)*A
    ctext(d,W//2,1415,"À  partir  de  1 000 $  /  mois",font(34),col(DIM,s2))

def ov_capital(img,t,dur):
    A=life(t,dur)*255; d=ImageDraw.Draw(img)
    panel_glass(img,(80,1020,W-80,1520),30,alpha=int(0.93*A),border=GREEN,border_a=int(0.65*A))
    d=ImageDraw.Draw(img)
    ctext(d,W//2,1055,"TON  CAPITAL",font(44),col(WHITE,A))
    cap=cl((t-0.3)/1.2)*4
    glow_text(img,W//2,1110,f"+{cap:.1f}M $",font(160),col(GREEN,A),GREEN,ga=int(A*0.4))
    ctext(d,W//2,1320,"D'HÉRITAGE  POUR  TES  ENFANTS",font(34),col(DIM,A))
    her=cl((t-0.6)/1.2)*11
    glow_text(img,W//2,1380,f"+{her:.0f}M $",font(100),col(GOLD,A),GOLD,ga=int(A*0.4))
    ctext(d,W//2,1490,"en capital  si tu t'en vas",font(32),col(DIM,int(cl((t-0.7)/0.5)*A)))

def ov_cta(img,t,dur):
    A=life(t,dur)*255; d=ImageDraw.Draw(img)
    panel_glass(img,(80,1055,W-80,1470),34,alpha=int(0.95*A),border=GOLD,border_a=int(0.8*A))
    d=ImageDraw.Draw(img)
    ctext(d,W//2,1090,"ÉCRIS  EN  COMMENTAIRE",font(40),col(WHITE,A))
    bx,by,bww,bh=150,1175,W-300,120
    rrect(d,(bx,by,bx+bww,by+bh),18,col((8,12,24),int(A)))
    d.rounded_rectangle((bx,by,bx+bww,by+bh),radius=18,outline=col(GOLD,int(A)),width=3)
    full="ILLUSTRATION"
    nch=int(cl((t-0.5)/1.2)*len(full))
    typed=full[:nch]; cur="|" if int(t*2)%2==0 else " "
    glow_text(img,W//2,by+28,typed+cur,font(62),col(GOLD,A),GOLD,ga=int(A*0.35))
    ctext(d,W//2,1370,"12 à 15 minutes avec Abraham",font(36),col(CYAN,A))

def ov_endcard(img,t,dur):
    A=life(t,dur,0.5,0.6)*255; d=ImageDraw.Draw(img)
    panel_glass(img,(70,1045,W-70,1550),30,alpha=int(0.95*A),border=CYAN,border_a=int(0.7*A))
    d=ImageDraw.Draw(img)
    bww=int(lerp(0,560,eo(t/0.6)))
    rrect(d,(W//2-bww//2,1095,W//2+bww//2,1103),4,col(GOLD,A))
    glow_text(img,W//2,1125,"ABRAHAM KOFFI AKPOBI",font(54),col(WHITE,A),CYAN,ga=int(A*0.3))
    ctext(d,W//2,1230,"Conseiller en sécurité financière",font(38),col(GOLD,A))
    s2=cl((t-0.5)/0.5)*A
    ctext(d,W//2,1305,"Directeur — Finab la Solution",font(32),col(DIM,s2))
    ctext(d,W//2,1355,"Great Way Financial",font(30),col(DIM,s2))
    ctext(d,W//2,1440,"Commente  «  ILLUSTRATION  »",font(36),col(CYAN,int(cl((t-0.7)/0.4)*A)))

JOBS=[
 ("intro",    5.0, ov_intro),
 ("heures",   7.0, ov_heures),
 ("retraite", 7.0, ov_retraite),
 ("solution", 5.5, ov_solution),
 ("rra",      8.0, ov_rra),
 ("capital",  8.0, ov_capital),
 ("cta",      7.0, ov_cta),
 ("endcard",  7.5, ov_endcard),
]

if __name__=="__main__":
    import sys
    only=sys.argv[1:] if len(sys.argv)>1 else None
    print("Génération overlays médecins/dentistes...")
    for name,dur,fn in JOBS:
        if only and name not in only: continue
        render(name,dur,fn)
    print("Terminé.")
