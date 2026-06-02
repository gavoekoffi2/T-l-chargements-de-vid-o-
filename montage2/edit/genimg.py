#!/usr/bin/env python3
"""Génère des images B-roll via OpenRouter (gemini-2.5-flash-image).
CONTRAINTE ABSOLUE : uniquement des personnes AFRICAINES (peau noire).
Thème : médecins, dentistes, retraite, famille, succès.
"""
import os, sys, json, base64, time, urllib.request

KEY = None
for p in [os.path.expanduser("~/.claude/skills/video-use/.env")]:
    if os.path.exists(p):
        for line in open(p):
            if line.startswith("OPENROUTER_API_KEY="):
                KEY = line.strip().split("=",1)[1]
MODEL = "google/gemini-2.5-flash-image"
OUT   = os.path.join(os.path.dirname(__file__), "broll")
os.makedirs(OUT, exist_ok=True)

STYLE = ("Cinematic photorealistic vertical 9:16 portrait photo, shot on 50mm, "
         "shallow depth of field, natural soft lighting, high detail, documentary realism. "
         "IMPORTANT: all people depicted MUST be Black African people with dark skin, "
         "African features, no other ethnicities. ")

def gen(name, prompt, retries=3):
    out_path = os.path.join(OUT, f"{name}.png")
    if os.path.exists(out_path) and os.path.getsize(out_path) > 10000:
        print(f"  = {name}.png (cache)"); return out_path
    body = json.dumps({
        "model": MODEL,
        "messages": [{"role":"user","content": STYLE + prompt}],
        "modalities": ["image","text"],
    }).encode()
    req = urllib.request.Request("https://openrouter.ai/api/v1/chat/completions",
        data=body, headers={"Authorization":f"Bearer {KEY}","Content-Type":"application/json"})
    for attempt in range(retries):
        try:
            r = urllib.request.urlopen(req, timeout=120)
            d = json.loads(r.read())
            msg = d["choices"][0]["message"]
            imgs = msg.get("images") or []
            if not imgs:
                print(f"  ! {name}: pas d'image"); time.sleep(3); continue
            url = imgs[0]["image_url"]["url"]
            b64 = url.split(",",1)[1]
            open(out_path,"wb").write(base64.b64decode(b64))
            print(f"  ✓ {name}.png ({os.path.getsize(out_path)//1024} KB)")
            return out_path
        except Exception as e:
            print(f"  ... {name} tentative {attempt+1}: {str(e)[:100]}")
            time.sleep(4*(attempt+1))
    print(f"  ✗ {name}: ÉCHEC"); return None

BROLL = {
    "medecin": "A confident proud Black African male doctor in a white coat with stethoscope, standing in a bright modern hospital corridor, professional, warm smile, achievement.",
    "dentiste": "A focused skilled Black African female dentist in dental office, wearing blue scrubs and gloves, working with dental tools, modern clinic, professional lighting.",
    "surcharge": "An exhausted tired Black African doctor in white coat sitting alone at a desk late at night, surrounded by paperwork and files, head resting on hand, single desk lamp, overworked.",
    "famille": "A happy relaxed Black African family — father, mother, two children — laughing together in a bright sunny living room, quality time, joy, work-life balance.",
    "retraite_pauvre": "A worried elderly Black African man looking at a small pension check or retirement document at a kitchen table, concerned expression, financial stress, modest home.",
    "richesse": "A successful wealthy Black African professional man in a sharp business suit, confident smile, standing in a luxurious modern office with city view, financial success and freedom.",
    "reunion": "Two Black African professionals (a man and a woman) in a friendly productive business meeting in a modern office, laptop open, charts, collaborative atmosphere.",
    "canada_doc": "A Black African doctor in white coat with stethoscope standing confidently on a Canadian city street in winter, professional, proud, modern downtown skyline background.",
}

if __name__ == "__main__":
    only = sys.argv[1:] if len(sys.argv)>1 else None
    print(f"Génération B-roll médecins (Africains) -> {OUT}")
    for name, prompt in BROLL.items():
        if only and name not in only: continue
        gen(name, prompt)
    print("Terminé.")
