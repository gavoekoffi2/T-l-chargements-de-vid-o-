#!/usr/bin/env python3
"""Génère des images B-roll via OpenRouter (gemini-2.5-flash-image).
CONTRAINTE ABSOLUE : uniquement des personnes AFRICAINES (peau noire).
14 images pour illustrer TOUTES les parties importantes (dynamisme).
"""
import os, sys, json, base64, time, urllib.request

KEY=None
for p in [os.path.expanduser("~/.claude/skills/video-use/.env")]:
    if os.path.exists(p):
        for line in open(p):
            if line.startswith("OPENROUTER_API_KEY="): KEY=line.strip().split("=",1)[1]
MODEL="google/gemini-2.5-flash-image"
OUT=os.path.join(os.path.dirname(__file__),"broll"); os.makedirs(OUT,exist_ok=True)

STYLE=("Cinematic photorealistic vertical 9:16 portrait photo, shot on 50mm, "
       "shallow depth of field, natural soft lighting, high detail, documentary realism. "
       "IMPORTANT: all people depicted MUST be Black African people with dark skin, "
       "African features, no other ethnicities. ")

def gen(name,prompt,retries=3):
    op=os.path.join(OUT,f"{name}.png")
    if os.path.exists(op) and os.path.getsize(op)>10000: print(f"  = {name}.png (cache)"); return op
    body=json.dumps({"model":MODEL,"messages":[{"role":"user","content":STYLE+prompt}],
                     "modalities":["image","text"]}).encode()
    req=urllib.request.Request("https://openrouter.ai/api/v1/chat/completions",data=body,
        headers={"Authorization":f"Bearer {KEY}","Content-Type":"application/json"})
    for a in range(retries):
        try:
            r=urllib.request.urlopen(req,timeout=120); d=json.loads(r.read())
            msg=d["choices"][0]["message"]; imgs=msg.get("images") or []
            if not imgs: print(f"  ! {name}: pas d'image"); time.sleep(3); continue
            b64=imgs[0]["image_url"]["url"].split(",",1)[1]
            open(op,"wb").write(base64.b64decode(b64))
            print(f"  ✓ {name}.png ({os.path.getsize(op)//1024} KB)"); return op
        except Exception as e:
            print(f"  ... {name} tentative {a+1}: {str(e)[:90]}"); time.sleep(4*(a+1))
    print(f"  ✗ {name}: ÉCHEC"); return None

BROLL={
 # parties existantes
 "medecin":"A confident proud Black African male doctor in a white coat with stethoscope, standing in a bright modern hospital corridor, professional, warm smile.",
 "dentiste":"A focused skilled Black African female dentist in dental office, wearing blue scrubs and gloves, working with dental tools, modern clinic.",
 "surcharge":"An exhausted tired Black African doctor in white coat sitting alone at a desk late at night, surrounded by paperwork, head resting on hand, single desk lamp.",
 "famille":"A happy relaxed Black African family — father, mother, two children — laughing together in a bright sunny living room, quality time, joy.",
 "retraite_pauvre":"A worried elderly Black African man looking at a small pension check at a kitchen table, concerned expression, financial stress, modest home.",
 "richesse":"A successful wealthy Black African professional man in a sharp business suit, confident smile, luxurious modern office with city view, financial freedom.",
 "reunion":"Two Black African professionals (a man and a woman) in a friendly productive business meeting in a modern office, laptop open, charts.",
 "canada_doc":"A Black African doctor in white coat with stethoscope standing confidently on a Canadian city street in winter, professional, modern downtown skyline.",
 # NOUVELLES parties illustrées
 "etudes":"A determined young Black African medical student studying hard with thick books and notes late at night, anatomy posters on wall, lamp light, dedication.",
 "diplome":"A proud Black African graduate in cap and gown holding a university diploma, smiling, graduation ceremony background, achievement and success.",
 "stress_argent":"A stressed Black African professional man looking worried at bills and a calculator on a desk, hand on forehead, financial pressure, dim lighting.",
 "maison":"A proud Black African couple standing in front of a beautiful modern luxury house with keys in hand, sunny day, homeownership dream achieved.",
 "vieillesse":"An elderly dignified Black African man relaxing peacefully in a comfortable armchair in a warm home, content retirement, serene expression.",
 "clinique":"A Black African doctor entrepreneur standing proudly in front of his own modern private medical clinic, name sign visible, business ownership, confident.",
 "argent_croissance":"Hands of a Black African person stacking growing coins with a rising graph in background, financial growth, investment success, bright.",
 "abraham_pro":"A confident professional Black African financial advisor in a suit smiling warmly in a modern bright office, laptop and charts, trustworthy mentor.",
}

if __name__=="__main__":
    only=sys.argv[1:] if len(sys.argv)>1 else None
    print(f"Génération B-roll étendue (Africains) -> {OUT}")
    for name,prompt in BROLL.items():
        if only and name not in only: continue
        gen(name,prompt)
    print("Terminé.")
