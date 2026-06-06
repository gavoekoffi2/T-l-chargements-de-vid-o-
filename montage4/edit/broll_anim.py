#!/usr/bin/env python3
"""Anime les images B-roll avec des entrées spectaculaires variées (style viral).
Sortie: ProRes 4444 RGBA (fade alpha aux bords) -> composité en cutaway plein cadre.
Effets: punch-zoom, slide+motion blur, glitch RGB, flash-scale, light-sweep, Ken Burns.
"""
import math, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance, ImageFont

W, H, FPS = 1080, 1920, 30
HERE = os.path.dirname(__file__)
BROLL = os.path.join(HERE, "broll")
OUT = os.path.join(HERE, "broll_clips")
os.makedirs(OUT, exist_ok=True)

GOLD=(255,200,70); CYAN=(0,212,255); WHITE=(255,255,255)
BOLD="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
_fc={}
def font(s):
    if s not in _fc: _fc[s]=ImageFont.truetype(BOLD,s)
    return _fc[s]

def eo(t): t=max(0,min(1,t)); return 1-(1-t)**3
def eio(t):
    t=max(0,min(1,t)); return 4*t**3 if t<0.5 else 1-(-2*t+2)**3/2
def cl(x,a=0,b=1): return max(a,min(b,x))
def lerp(a,b,t): return a+(b-a)*t

def load_cover(path, scale=1.0):
    """Charge l'image, recadre en carré centré, retourne RGB."""
    im=Image.open(path).convert("RGB")
    return im

def bg_blur(im):
    """Fond flou plein cadre 1080x1920 à partir de l'image."""
    b=im.copy().resize((W,H))
    b=b.filter(ImageFilter.GaussianBlur(40))
    b=ImageEnhance.Brightness(b).enhance(0.45)
    return b.convert("RGBA")

def fit_center(im, target_w):
    """Redimensionne l'image (carrée) à target_w de large."""
    w,h=im.size; s=target_w/w
    return im.resize((int(w*s), int(h*s)))

def rgb_split(im, dx):
    """Décalage RGB pour effet glitch."""
    r,g,b=im.split()
    r=ImageChops_offset(r,dx,0); b=ImageChops_offset(b,-dx,0)
    return Image.merge("RGB",(r,g,b))

from PIL import ImageChops
def ImageChops_offset(ch,dx,dy): return ImageChops.offset(ch,dx,dy)
def ImageChops_offset(ch,dx,dy): return ch.transform(ch.size, Image.AFFINE,(1,0,-dx,0,1,-dy))

def corner_brackets(draw, box, a, c=CYAN, L=60, wdt=5):
    x0,y0,x1,y1=box
    A=int(a)
    for (cx,cy,sx,sy) in [(x0,y0,1,1),(x1,y0,-1,1),(x0,y1,1,-1),(x1,y1,-1,-1)]:
        draw.line([(cx,cy),(cx+sx*L,cy)],fill=(*c,A),width=wdt)
        draw.line([(cx,cy),(cx,cy+sy*L)],fill=(*c,A),width=wdt)

def light_sweep(size, prog):
    """Bande lumineuse diagonale traversant l'image."""
    w,h=size; lay=Image.new("RGBA",(w,h),(0,0,0,0)); d=ImageDraw.Draw(lay)
    x=int(lerp(-w*0.5, w*1.5, prog))
    bw=int(w*0.18)
    for i in range(-bw,bw):
        aa=int(120*(1-abs(i)/bw))
        d.line([(x+i,0),(x+i-int(h*0.3),h)],fill=(255,255,255,max(0,aa)),width=2)
    return lay

# Transitions d'entrée (retourne (scale, dx, dy, extra_fn))
def ENTER(kind, p, im_w, im_h):
    """p in [0,1] progression de l'entrée. Retourne transform + callables."""
    e=eo(p)
    if kind=="punch":      # zoom avant violent + settle
        return lerp(1.6,1.0,e), 0, 0
    if kind=="slide_r":    # depuis la droite
        return 1.05, int(lerp(W*0.7,0,e)), 0
    if kind=="slide_l":
        return 1.05, int(lerp(-W*0.7,0,e)), 0
    if kind=="rise":       # depuis le bas + zoom léger
        return lerp(1.15,1.0,e), 0, int(lerp(H*0.5,0,e))
    if kind=="glitch":     # arrive net, glitch traité ailleurs
        return lerp(1.12,1.0,e), 0, 0
    if kind=="flash":      # scale up rapide
        return lerp(0.7,1.0,e), 0, 0
    return 1.0,0,0

def render_clip(name, img_name, dur, enter, label=None, kb=0.10):
    src=load_cover(os.path.join(BROLL,f"{img_name}.png"))
    bg=bg_blur(src)
    n=int(dur*FPS)
    fin_a, fout_a = 0.13, 0.20   # fade alpha bords (s)
    cmd=["ffmpeg","-y","-f","rawvideo","-pix_fmt","rgba","-s",f"{W}x{H}","-r",str(FPS),
         "-i","pipe:0","-c:v","prores_ks","-profile:v","4444","-pix_fmt","yuva444p10le",
         "-an", os.path.join(OUT,f"{name}.mov")]
    p=subprocess.Popen(cmd,stdin=subprocess.PIPE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    enter_dur=0.55
    base_w=int(W*1.02)  # image occupe ~pleine largeur
    for i in range(n):
        t=i/FPS
        frame=Image.new("RGBA",(W,H),(0,0,0,0))
        frame.alpha_composite(bg)
        # Ken Burns continu (zoom lent)
        kbz=1.0+kb*(t/dur)
        p_enter=cl(t/enter_dur)
        sc,dx,dy=ENTER(enter,p_enter,base_w,base_w)
        scale=sc*kbz
        fw=int(base_w*scale)
        im=src.resize((fw,fw))
        # glitch RGB pendant l'entrée
        if enter=="glitch" and p_enter<1.0:
            shift=int(lerp(28,0,eo(p_enter)))
            if shift>0: im=rgb_split(im,shift)
        imr=im.convert("RGBA")
        # position centrée + offsets d'entrée
        px=(W-fw)//2+int(dx); py=(H-fw)//2+int(dy)
        frame.alpha_composite(imr,(px,py))
        # cadre + brackets cinématiques
        d=ImageDraw.Draw(frame)
        m=70; box=(m,int(H*0.16),W-m,int(H*0.84))
        br_a=eo(cl((t-0.2)/0.4))*230
        corner_brackets(d,box,br_a)
        # light sweep sur l'entrée (punch/flash/slide)
        if enter in ("punch","flash","slide_r","slide_l") and 0.1<t<0.7:
            sw=light_sweep((W,H), cl((t-0.1)/0.6))
            frame.alpha_composite(sw)
        # flash blanc bref à l'apparition
        if enter in ("flash","punch") and t<0.18:
            fa=int(lerp(180,0,t/0.18))
            fl=Image.new("RGBA",(W,H),(255,255,255,fa)); frame.alpha_composite(fl)
        # label kinétique (chip en haut)
        if label:
            la=eo(cl((t-0.25)/0.4))*255
            chip_w=20+ d.textlength(label,font=font(40))+40
            cx=W//2
            d.rounded_rectangle((cx-chip_w/2, 250, cx+chip_w/2, 322), radius=36, fill=(10,15,30,int(0.85*la)))
            d.rounded_rectangle((cx-chip_w/2, 250, cx+chip_w/2, 322), radius=36, outline=(*GOLD,int(la)), width=3)
            tw=d.textlength(label,font=font(40))
            d.text((cx-tw/2, 262), label, font=font(40), fill=(*WHITE,int(la)))
        # fade alpha aux bords (in/out) pour transition douce
        a_in=eo(t/fin_a) if t<fin_a else 1.0
        a_out=eo((dur-t)/fout_a) if t>dur-fout_a else 1.0
        ga=cl(min(a_in,a_out))
        if ga<1.0:
            alpha=frame.split()[3].point(lambda v:int(v*ga))
            frame.putalpha(alpha)
        p.stdin.write(frame.tobytes())
    p.stdin.close(); p.wait()
    print(f"  ✓ {name}.mov ({dur:.1f}s)")

# (nom_clip, image, durée, effet d'entrée, label)
CLIPS=[
 ("br_no_degree",       "no_degree",       3.0, "glitch",  "DIPLÔME ≠ SUCCÈS"),
 ("br_discipline",      "discipline",      3.0, "slide_r", "LA DISCIPLINE"),
 ("br_formuler",        "formuler",        3.0, "slide_l", "BIEN FORMULER"),
 ("br_ia_answer",       "ia_answer",       3.2, "rise",    "L'IA RÉPOND"),
 ("br_ecrire",          "ecrire",          3.0, "punch",   "TON PROMPT"),
 ("br_exemple_vague",   "exemple_vague",   3.0, "glitch",  "TROP VAGUE"),
 ("br_contexte_notes",  "contexte_notes",  3.0, "swoosh_up","DU CONTEXTE"),
 ("br_tiktok_creator",  "tiktok_creator",  3.0, "flash",   "SCRIPT TIKTOK"),
 ("br_expert_marketing","expert_marketing",3.0, "slide_r", "AGIS COMME..."),
 ("br_bon_resultat",    "bon_resultat",    3.0, "punch",   "TOP RÉSULTAT"),
 ("br_role_ia",         "role_ia",         3.2, "transition","DONNE UN RÔLE"),
 ("br_framework_doc",   "framework_doc",   3.2, "rise",    "FRAMEWORK"),
 ("br_subscribe_cta",   "subscribe_cta",   3.0, "flash",   "ABONNE-TOI"),
 ("br_host_video4",     "host_video4",     3.2, "punch",   "TON FORMATEUR"),
 ("br_brain_ai",        "brain_ai",        3.0, "glitch",  "TON CERVEAU + IA"),
 ("br_phone_ai_app",    "phone_ai_app",    3.0, "rise",    "DANS TA POCHE"),
 ("br_lightbulb_idea",  "lightbulb_idea",  3.0, "flash",   "LA BONNE IDÉE"),
 ("br_target_precision","target_precision",3.0, "punch",   "SOIS PRÉCIS"),
 ("br_team_success",    "team_success",    3.0, "slide_l", "EN ÉQUIPE"),
 ("br_growth_chart",    "growth_chart",    3.0, "rise",    "TES RÉSULTATS"),
]

if __name__=="__main__":
    only=sys.argv[1:] if len(sys.argv)>1 else None
    print("Animation B-roll spectaculaire...")
    for name,img,dur,enter,label in CLIPS:
        if only and name not in only: continue
        render_clip(name,img,float(dur),enter,label)
    print("Terminé.")
