#!/usr/bin/env python3
"""Génère une bibliothèque SFX étendue (numpy) pour montage viral.
Sons captivants pour mouvements brusques, transitions, apparitions.
"""
import numpy as np, wave, math, os

SR = 48000
OUT = os.path.join(os.path.dirname(__file__), "sfx")
os.makedirs(OUT, exist_ok=True)

def save(name, s):
    s = np.asarray(s, dtype=np.float64)
    # normalisation douce + limiteur
    peak = np.max(np.abs(s)) or 1.0
    s = s/peak * 0.92
    d = (np.clip(s,-1,1)*32767).astype(np.int16)
    with wave.open(os.path.join(OUT,f"{name}.wav"),'w') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(d.tobytes())
    print(f"  ✓ {name}.wav ({len(s)/SR:.2f}s)")

def env(t, atk=0.005, dec=8):
    a = np.clip(t/atk, 0, 1)
    return a*np.exp(-t*dec)

def noise(n): return np.random.uniform(-1,1,n)

# ── 1. whoosh : air qui passe (transition) ──
t = np.linspace(0,0.45,int(SR*0.45),False)
nz = noise(len(t))
# bandpass mobile via modulation
sweep = np.sin(2*math.pi*(np.cumsum(300+2500*np.exp(-t*4))/SR))
whoosh = (nz*0.5*np.exp(-t*5) + sweep*0.4*np.exp(-t*4))*np.clip(t/0.03,0,1)
save("whoosh", whoosh)

# ── 2. swoosh_up : montée rapide (zoom in / punch) ──
t = np.linspace(0,0.4,int(SR*0.4),False)
f = 200 + 1800*(t/0.4)**1.5
swup = np.sin(2*math.pi*np.cumsum(f)/SR)*np.exp(-t*3)*np.clip(t/0.01,0,1)
swup += noise(len(t))*0.25*np.exp(-t*6)
save("swoosh_up", swup)

# ── 3. swoosh_down : descente (zoom out) ──
t = np.linspace(0,0.4,int(SR*0.4),False)
f = 2000 - 1700*(t/0.4)**1.2
swdn = np.sin(2*math.pi*np.cumsum(f)/SR)*np.exp(-t*3)*np.clip(t/0.01,0,1)
swdn += noise(len(t))*0.2*np.exp(-t*6)
save("swoosh_down", swdn)

# ── 4. pop : apparition légère ──
t = np.linspace(0,0.18,int(SR*0.18),False)
pop = np.sin(2*math.pi*(900-400*t/0.18)*t)*env(t,0.002,28)
save("pop", pop)

# ── 5. boom : révélation / impact grave ──
t = np.linspace(0,0.7,int(SR*0.7),False)
boom = (np.sin(2*math.pi*55*t)*np.exp(-t*4)
       +np.sin(2*math.pi*110*t)*0.5*np.exp(-t*6)
       +noise(len(t))*0.3*np.exp(-t*30))
save("boom", boom)

# ── 6. impact : coup sec + corps ──
t = np.linspace(0,0.55,int(SR*0.55),False)
impact = (0.95*np.sin(2*math.pi*60*t)*np.exp(-t*5)
         +0.6*np.sin(2*math.pi*180*t)*np.exp(-t*9)
         +0.5*noise(len(t))*np.exp(-t*40))
save("impact", impact)

# ── 7. sub_drop : basse profonde (révélation chiffre choc) ──
t = np.linspace(0,0.9,int(SR*0.9),False)
f = 90*np.exp(-t*2.5)+30
sub = np.sin(2*math.pi*np.cumsum(f)/SR)*np.exp(-t*2.2)
save("sub_drop", sub)

# ── 8. ding : accent clair (chiffre/liste) ──
t = np.linspace(0,0.6,int(SR*0.6),False)
ding = (np.sin(2*math.pi*1320*t)*np.exp(-t*7)
       +np.sin(2*math.pi*1980*t)*0.5*np.exp(-t*9))
save("ding", ding)

# ── 9. sparkle : éclat brillant (apparition premium) ──
t = np.linspace(0,0.5,int(SR*0.5),False)
sp = np.zeros(len(t))
for fr,dl in [(2600,0.0),(3300,0.05),(4100,0.1),(5200,0.16)]:
    e = np.clip((t-dl)/0.004,0,1)*np.exp(-np.clip(t-dl,0,None)*12)
    sp += np.sin(2*math.pi*fr*t)*e*0.4
save("sparkle", sp)

# ── 10. shutter : déclencheur appareil photo (B-roll) ──
t = np.linspace(0,0.16,int(SR*0.16),False)
click1 = np.sin(2*math.pi*7000*t)*np.exp(-t*80)
click2 = np.sin(2*math.pi*3200*t)*np.exp(-t*45)*0.6
mech = noise(len(t))*np.exp(-t*60)*0.5
# deuxième clic (rideau) à ~70ms
t2 = t-0.07; m2 = np.where(t2>0, noise(len(t))*np.exp(-np.clip(t2,0,None)*70)*0.6, 0)
save("shutter", click1+click2+mech+m2)

# ── 11. glitch : numérique saccadé (entrée glitch) ──
t = np.linspace(0,0.35,int(SR*0.35),False)
g = noise(len(t))
# gate haché
gate = (np.sin(2*math.pi*45*t)>0).astype(float)
gl = g*gate*np.exp(-t*4)*0.7 + np.sin(2*math.pi*1500*t)*gate*0.3*np.exp(-t*5)
save("glitch", gl)

# ── 12. riser : montée de tension (build-up) ──
t = np.linspace(0,1.6,int(SR*1.6),False)
nz = noise(len(t))
ramp = (t/1.6)**1.6
# bruit filtré qui monte
ris = nz*ramp*0.5 + np.sin(2*math.pi*(200+600*ramp)*t)*ramp*0.3
ris *= np.clip((1.6-t)/0.05,0,1)  # petit fade out fin
save("riser", ris)

# ── 13. transition : woosh + impact combinés (changement de scène) ──
t = np.linspace(0,0.6,int(SR*0.6),False)
wh = noise(len(t))*np.exp(-((t-0.2)**2)/0.01)*0.6
hit = np.sin(2*math.pi*70*np.clip(t-0.28,0,None))*np.exp(-np.clip(t-0.28,0,None)*8)
save("transition", wh+hit)

# ── 14. click : tape clavier (CTA typing) ──
t = np.linspace(0,0.06,int(SR*0.06),False)
ck = noise(len(t))*np.exp(-t*120)*0.7 + np.sin(2*math.pi*2200*t)*np.exp(-t*90)*0.3
save("click", ck)

print("Bibliothèque SFX générée.")
