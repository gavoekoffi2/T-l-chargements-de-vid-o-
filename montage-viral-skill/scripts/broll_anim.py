#!/usr/bin/env python3
"""Anime les images B-roll avec entrées spectaculaires. ProRes 4444 alpha."""
import math, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance, ImageFont, ImageChops

W, H, FPS = 1080, 1920, 30
HERE  = os.path.dirname(__file__)
BROLL = os.path.join(HERE, "broll")
OUT   = os.path.join(HERE, "broll_clips")
os.makedirs(OUT, exist_ok=True)

GOLD=(255,200,70); CYAN=(0,212,255); WHITE=(255,255,255)
BOLD="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
_fc={}
def font(s):
    if s not in _fc: _fc[s]=ImageFont.truetype(BOLD,s)
    return _fc[s]

def eo(t): t=max(0,min(1,t)); return 1-(1-t)**3
def cl(x,a=0,b=1): return max(a,min(b,x))
def lerp(a,b,t): return a+(b-a)*t

def bg_blur(im):
    b=im.copy().resize((W,H)); b=b.filter(ImageFilter.GaussianBlur(40))
    b=ImageEnhance.Brightness(b).enhance(0.45); return b.convert("RGBA")

def rgb_split(im,dx):
    r,g,b=im.split()
    r=r.transform(r.size,Image.AFFINE,(1,0,-dx,0,1,0))
    b=b.transform(b.size,Image.AFFINE,(1,0,dx,0,1,0))
    return Image.merge("RGB",(r,g,b))

def corner_brackets(draw,box,a,c=CYAN,L=60,wdt=5):
    x0,y0,x1,y1=box; A=int(a)
    for cx,cy,sx,sy in [(x0,y0,1,1),(x1,y0,-1,1),(x0,y1,1,-1),(x1,y1,-1,-1)]:
        draw.line([(cx,cy),(cx+sx*L,cy)],fill=(*c,A),width=wdt)
        draw.line([(cx,cy),(cx,cy+sy*L)],fill=(*c,A),width=wdt)

def light_sweep(size,prog):
    w,h=size; lay=Image.new("RGBA",(w,h),(0,0,0,0)); d=ImageDraw.Draw(lay)
    x=int(lerp(-w*0.5,w*1.5,prog)); bw=int(w*0.18)
    for i in range(-bw,bw):
        aa=int(120*(1-abs(i)/bw))
        d.line([(x+i,0),(x+i-int(h*0.3),h)],fill=(255,255,255,max(0,aa)),width=2)
    return lay

def ENTER(kind,p,im_w,im_h):
    e=eo(p)
    if kind=="punch":  return lerp(1.6,1.0,e),0,0
    if kind=="slide_r":return 1.05,int(lerp(W*0.7,0,e)),0
    if kind=="slide_l":return 1.05,int(lerp(-W*0.7,0,e)),0
    if kind=="rise":   return lerp(1.15,1.0,e),0,int(lerp(H*0.5,0,e))
    if kind=="glitch": return lerp(1.12,1.0,e),0,0
    if kind=="flash":  return lerp(0.7,1.0,e),0,0
    return 1.0,0,0

def render_clip(name,img_name,dur,enter,label=None,kb=0.10):
    src=Image.open(os.path.join(BROLL,f"{img_name}.png")).convert("RGB")
    bg=bg_blur(src); n=int(dur*FPS)
    fin_a,fout_a=0.13,0.20
    cmd=["ffmpeg","-y","-f","rawvideo","-pix_fmt","rgba","-s",f"{W}x{H}","-r",str(FPS),
         "-i","pipe:0","-c:v","prores_ks","-profile:v","4444","-pix_fmt","yuva444p10le",
         "-an",os.path.join(OUT,f"{name}.mov")]
    p=subprocess.Popen(cmd,stdin=subprocess.PIPE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    enter_dur=0.55; base_w=int(W*1.02)
    for i in range(n):
        t=i/FPS; frame=Image.new("RGBA",(W,H),(0,0,0,0))
        frame.alpha_composite(bg)
        kbz=1.0+kb*(t/dur); p_enter=cl(t/enter_dur)
        sc,dx,dy=ENTER(enter,p_enter,base_w,base_w); scale=sc*kbz
        fw=int(base_w*scale); im=src.resize((fw,fw))
        if enter=="glitch" and p_enter<1.0:
            shift=int(lerp(28,0,eo(p_enter)))
            if shift>0: im=rgb_split(im,shift)
        imr=im.convert("RGBA")
        px=(W-fw)//2+int(dx); py=(H-fw)//2+int(dy)
        frame.alpha_composite(imr,(px,py))
        d=ImageDraw.Draw(frame)
        m=70; box=(m,int(H*0.16),W-m,int(H*0.84))
        br_a=eo(cl((t-0.2)/0.4))*230
        corner_brackets(d,box,br_a)
        if enter in ("punch","flash","slide_r","slide_l") and 0.1<t<0.7:
            sw=light_sweep((W,H),cl((t-0.1)/0.6)); frame.alpha_composite(sw)
        if enter in ("flash","punch") and t<0.18:
            fa=int(lerp(180,0,t/0.18))
            fl=Image.new("RGBA",(W,H),(255,255,255,fa)); frame.alpha_composite(fl)
        if label:
            la=eo(cl((t-0.25)/0.4))*255
            chip_w=20+d.textlength(label,font=font(40))+40
            cx=W//2
            d.rounded_rectangle((cx-chip_w/2,250,cx+chip_w/2,322),radius=36,fill=(10,15,30,int(0.85*la)))
            d.rounded_rectangle((cx-chip_w/2,250,cx+chip_w/2,322),radius=36,outline=(*GOLD,int(la)),width=3)
            tw=d.textlength(label,font=font(40))
            d.text((cx-tw/2,262),label,font=font(40),fill=(*WHITE,int(la)))
        a_in=eo(t/fin_a) if t<fin_a else 1.0
        a_out=eo((dur-t)/fout_a) if t>dur-fout_a else 1.0
        ga=cl(min(a_in,a_out))
        if ga<1.0:
            alpha=frame.split()[3].point(lambda v:int(v*ga)); frame.putalpha(alpha)
        p.stdin.write(frame.tobytes())
    p.stdin.close(); p.wait()
    print(f"  ✓ {name}.mov ({dur:.1f}s)")

CLIPS=[
 ("br_medecin",    "medecin",        3.2,"slide_r", "MÉDECIN"),
 ("br_etudes",     "etudes",         3.0,"rise",    "10 ANS D'ÉTUDES"),
 ("br_diplome",    "diplome",        3.0,"flash",   "DIPLÔMÉ"),
 ("br_dentiste",   "dentiste",       3.0,"punch",   "DENTISTE"),
 ("br_surcharge",  "surcharge",      3.0,"glitch",  "ÉPUISÉ ?"),
 ("br_famille",    "famille",        3.2,"rise",    "TA FAMILLE"),
 ("br_stress",     "stress_argent",  3.0,"glitch",  "LES FACTURES"),
 ("br_retraite",   "retraite_pauvre",3.0,"slide_l", "9%  RETRAITE"),
 ("br_canada",     "canada_doc",     3.2,"punch",   "AU CANADA"),
 ("br_argent",     "argent_croissance",3.0,"rise",  "+4 MILLIONS"),
 ("br_maison",     "maison",         3.0,"flash",   "TA MAISON"),
 ("br_clinique",   "clinique",       3.0,"slide_r", "TA CLINIQUE"),
 ("br_richesse",   "richesse",       3.2,"flash",   "LIBRE"),
 ("br_vieillesse", "vieillesse",     3.0,"slide_l", "RETRAITE SEREINE"),
 ("br_reunion",    "reunion",        3.0,"slide_r", "TON PLAN"),
 ("br_abraham",    "abraham_pro",    3.2,"punch",   "TON CONTACT"),
]

if __name__=="__main__":
    only=sys.argv[1:] if len(sys.argv)>1 else None
    print("Animation B-roll médecins/dentistes...")
    for name,img,dur,enter,label in CLIPS:
        if only and name not in only: continue
        render_clip(name,img,float(dur),enter,label)
    print("Terminé.")
