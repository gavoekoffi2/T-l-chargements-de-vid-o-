#!/usr/bin/env python3
"""Overlays motion design — vidéo médecins/dentistes (stratégie RRA).
Zone REMONTÉE : panneaux y=880-1430 (poitrine), visage dégagé en haut,
sous-titres karaoké en dessous (y~1500). Aucun chevauchement.
"""
import math, subprocess, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H, FPS = 1080, 1920, 30
OUT = os.path.join(os.path.dirname(__file__), "animations")
os.makedirs(OUT, exist_ok=True)

GOLD=(255,200,70); CYAN=(0,212,255); WHITE=(255,255,255)
DIM=(155,165,185); GREEN=(45,222,135); RED=(255,90,90); PANEL=(12,18,35)

BOLD="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
REG ="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
_fc={}
def font(sz,bold=True):
    k=(sz,bold)
    if k not in _fc: _fc[k]=ImageFont.truetype(BOLD if bold else REG, sz)
    return _fc[k]

def eo(t): t=max(0,min(1,t)); return 1-(1-t)**3
def cl(x): return max(0.0,min(1.0,x))
def lerp(a,b,t): return a+(b-a)*t
def col(c,a): return (c[0],c[1],c[2],int(max(0,min(255,a))))
def text_wh(d,s,f): bb=d.textbbox((0,0),s,font=f); return bb[2]-bb[0],bb[3]-bb[1]
def ctext(d,cx,y,s,f,fill,mid=True):
    w,h=text_wh(d,s,f); x=cx-w/2 if mid else cx; d.text((x,y),s,font=f,fill=fill); return w,h
def rrect(d,box,r,fill): d.rounded_rectangle(box,radius=r,fill=fill)
def panel(img,box,r,alpha=225,border=CYAN,bw=3,ba=180):
    lay=Image.new("RGBA",img.size,(0,0,0,0)); d=ImageDraw.Draw(lay)
    rrect(d,box,r,col(PANEL,alpha)); d.rounded_rectangle(box,radius=r,outline=col(border,ba),width=bw)
    img.alpha_composite(lay)
def glow(img,cx,y,s,f,fill,gl,ga=110,mid=True):
    g=Image.new("RGBA",img.size,(0,0,0,0)); dg=ImageDraw.Draw(g)
    w,h=text_wh(dg,s,f); x=cx-w/2 if mid else cx
    dg.text((x,y),s,font=f,fill=col(gl,ga)); g=g.filter(ImageFilter.GaussianBlur(8)); img.alpha_composite(g)
    d=ImageDraw.Draw(img); d.text((x,y),s,font=f,fill=fill); return w,h

def render(name,dur,fn):
    n=int(dur*FPS)
    cmd=["ffmpeg","-y","-f","rawvideo","-pix_fmt","rgba","-s",f"{W}x{H}","-r",str(FPS),
         "-i","pipe:0","-c:v","prores_ks","-profile:v","4444","-pix_fmt","yuva444p10le",
         "-an",os.path.join(OUT,f"{name}.mov")]
    p=subprocess.Popen(cmd,stdin=subprocess.PIPE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    for i in range(n):
        t=i/FPS; img=Image.new("RGBA",(W,H),(0,0,0,0)); fn(img,t,dur); p.stdin.write(img.tobytes())
    p.stdin.close(); p.wait(); print(f"  ✓ {name}.mov ({dur:.1f}s)")

def life(t,dur,fin=0.4,fout=0.4):
    ai=eo(t/fin) if t<fin else 1.0; ao=eo((dur-t)/fout) if t>dur-fout else 1.0
    return cl(min(ai,ao))

# ── zone y=880-1430 ──
def ov_intro(img,t,dur):
    A=life(t,dur)*255; d=ImageDraw.Draw(img)
    bw=int(lerp(0,620,eo(t/0.6))); rrect(d,(W//2-bw//2,950,W//2+bw//2,958),4,col(GOLD,A))
    glow(img,W//2,980,"MÉDECINS &",font(84),col(WHITE,A),CYAN,int(A*0.4))
    glow(img,W//2,1080,"DENTISTES",font(84),col(GOLD,A),GOLD,int(A*0.4))
    sa=life(t,dur)*cl((t-0.4)/0.4)*255; ctext(d,W//2,1200,"•  UNE  OPPORTUNITÉ  •",font(36),col(CYAN,sa))

def ov_heures(img,t,dur):
    A=life(t,dur)*255; panel(img,(80,930,W-80,1400),28,int(0.92*A),RED,3,int(0.7*A)); d=ImageDraw.Draw(img)
    ctext(d,W//2,965,"VOUS  TRAVAILLEZ",font(42),col(RED,A))
    hrs=int(cl((t-0.4)/1.2)*70); glow(img,W//2,1020,f"{hrs}H",font(210),col(WHITE,A),RED,int(A*0.45))
    ctext(d,W//2,1290,"PAR  SEMAINE",font(50),col(GOLD,A)); ctext(d,W//2,1352,"ET VOTRE FAMILLE ?",font(34),col(DIM,A))

def ov_retraite(img,t,dur):
    A=life(t,dur)*255; panel(img,(100,940,W-100,1400),30,int(0.93*A),RED,3,int(0.65*A)); d=ImageDraw.Draw(img)
    ctext(d,W//2,975,"VOTRE  RETRAITE",font(44),col(WHITE,A))
    pct=int(cl((t-0.3)/1.2)*9); glow(img,W//2,1025,f"{pct}%",font(200),col(RED,A),RED,int(A*0.45))
    ctext(d,W//2,1280,"DE  TON  SALAIRE",font(44),col(GOLD,A))
    bx,by,bw,bh=140,1330,W-280,44; rrect(d,(bx,by,bx+bw,by+bh),10,col((30,40,60),int(A)))
    fw=int(bw*0.09*cl((t-0.5)/1.0)); rrect(d,(bx,by,bx+fw,by+bh),10,col(RED,int(A)))
    rrect(d,(bx+fw,by,bx+bw,by+bh),10,col((45,60,90),int(A*0.6)))

def ov_solution(img,t,dur):
    A=life(t,dur,0.5,0.5)*255; d=ImageDraw.Draw(img); sc=lerp(0.5,1.0,eo(t/0.5))
    glow(img,W//2,int(1030-(sc-1)*50),"J'AI",font(int(130*sc)),col(GOLD,A),GOLD,int(A*0.5))
    glow(img,W//2,1190,"UNE  SOLUTION",font(68),col(WHITE,A),CYAN,int(A*0.35))
    line=int(lerp(0,500,eo(cl((t-0.4)/0.5)))); rrect(d,(W//2-line//2,1325,W//2+line//2,1331),3,col(CYAN,A))

def ov_rra(img,t,dur):
    A=life(t,dur,0.5,0.5)*255; panel(img,(70,900,W-70,1380),30,int(0.93*A),CYAN,3,int(0.7*A)); d=ImageDraw.Draw(img)
    ctext(d,W//2,935,"STRATÉGIE",font(44),col(CYAN,A)); glow(img,W//2,990,"RRA",font(190),col(WHITE,A),CYAN,int(A*0.4))
    ctext(d,W//2,1245,"RÉGIME  DE  RETRAITE  ASSURÉE",font(32),col(GOLD,A))
    s2=cl((t-0.5)/0.5)*A; ctext(d,W//2,1305,"À  partir  de  1 000 $  /  mois",font(34),col(DIM,s2))

def ov_capital(img,t,dur):
    A=life(t,dur)*255; panel(img,(80,910,W-80,1410),30,int(0.93*A),GREEN,3,int(0.65*A)); d=ImageDraw.Draw(img)
    ctext(d,W//2,945,"TON  CAPITAL",font(44),col(WHITE,A))
    cap=cl((t-0.3)/1.2)*4; glow(img,W//2,1000,f"+{cap:.1f}M $",font(150),col(GREEN,A),GREEN,int(A*0.4))
    ctext(d,W//2,1210,"D'HÉRITAGE  POUR  TES  ENFANTS",font(34),col(DIM,A))
    her=cl((t-0.6)/1.2)*11; glow(img,W//2,1270,f"+{her:.0f}M $",font(96),col(GOLD,A),GOLD,int(A*0.4))
    ctext(d,W//2,1380,"en capital  si tu t'en vas",font(30),col(DIM,int(cl((t-0.7)/0.5)*A)))

def ov_cta(img,t,dur):
    A=life(t,dur)*255; panel(img,(80,945,W-80,1360),34,int(0.95*A),GOLD,3,int(0.8*A)); d=ImageDraw.Draw(img)
    ctext(d,W//2,980,"ÉCRIS  EN  COMMENTAIRE",font(40),col(WHITE,A))
    bx,by,bw,bh=150,1065,W-300,116; rrect(d,(bx,by,bx+bw,by+bh),18,col((8,12,24),int(A)))
    d.rounded_rectangle((bx,by,bx+bw,by+bh),radius=18,outline=col(GOLD,int(A)),width=3)
    full="ILLUSTRATION"; nch=int(cl((t-0.5)/1.2)*len(full)); typed=full[:nch]; cur="|" if int(t*2)%2==0 else " "
    glow(img,W//2,by+26,typed+cur,font(60),col(GOLD,A),GOLD,int(A*0.35))
    ctext(d,W//2,1260,"12 à 15 minutes avec Abraham",font(36),col(CYAN,A))

def ov_endcard(img,t,dur):
    A=life(t,dur,0.5,0.6)*255; panel(img,(70,935,W-70,1440),30,int(0.95*A),CYAN,3,int(0.7*A)); d=ImageDraw.Draw(img)
    bw=int(lerp(0,560,eo(t/0.6))); rrect(d,(W//2-bw//2,985,W//2+bw//2,993),4,col(GOLD,A))
    glow(img,W//2,1015,"ABRAHAM KOFFI AKPOBI",font(54),col(WHITE,A),CYAN,int(A*0.3))
    ctext(d,W//2,1120,"Conseiller en sécurité financière",font(38),col(GOLD,A))
    s2=cl((t-0.5)/0.5)*A; ctext(d,W//2,1195,"Directeur — Finab la Solution",font(32),col(DIM,s2))
    ctext(d,W//2,1245,"Great Way Financial",font(30),col(DIM,s2))
    ctext(d,W//2,1330,"Commente  «  ILLUSTRATION  »",font(36),col(CYAN,int(cl((t-0.7)/0.4)*A)))

# durées = longueur du sujet parlé (l'overlay tient son état final puis fade out)
JOBS=[("intro",15.0,ov_intro),("heures",8.0,ov_heures),("retraite",16.0,ov_retraite),
      ("solution",10.0,ov_solution),("rra",16.0,ov_rra),("capital",16.0,ov_capital),
      ("cta",15.0,ov_cta),("endcard",13.0,ov_endcard)]

if __name__=="__main__":
    import sys
    only=sys.argv[1:] if len(sys.argv)>1 else None
    print("Génération overlays (zone remontée)...")
    for name,dur,fn in JOBS:
        if only and name not in only: continue
        render(name,dur,fn)
    print("Terminé.")
