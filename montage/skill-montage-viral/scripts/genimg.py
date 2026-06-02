#!/usr/bin/env python3
"""Génère des images B-roll via OpenRouter / nano-banana (gemini-2.5-flash-image).
CONTRAINTE: uniquement des personnes AFRICAINES (peau noire africaine).
"""
import os, sys, json, base64, time, urllib.request

KEY = None
for p in [os.path.expanduser("~/.claude/skills/video-use/.env")]:
    if os.path.exists(p):
        for line in open(p):
            if line.startswith("OPENROUTER_API_KEY="):
                KEY = line.strip().split("=",1)[1]
MODEL = "google/gemini-2.5-flash-image"
OUT = os.path.join(os.path.dirname(__file__), "broll")
os.makedirs(OUT, exist_ok=True)

# Style commun: cinématique, vertical 9:16, personnes africaines noires uniquement
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
        data=body, headers={"Authorization": f"Bearer {KEY}","Content-Type":"application/json"})
    for attempt in range(retries):
        try:
            r = urllib.request.urlopen(req, timeout=120)
            d = json.loads(r.read())
            msg = d["choices"][0]["message"]
            imgs = msg.get("images") or []
            if not imgs:
                print(f"  ! {name}: pas d'image (texte: {str(msg.get('content'))[:80]})")
                time.sleep(3); continue
            url = imgs[0]["image_url"]["url"]
            b64 = url.split(",",1)[1]
            open(out_path,"wb").write(base64.b64decode(b64))
            print(f"  ✓ {name}.png ({os.path.getsize(out_path)//1024} KB)")
            return out_path
        except Exception as e:
            print(f"  ... {name} tentative {attempt+1} échec: {str(e)[:120]}")
            time.sleep(4*(attempt+1))
    print(f"  ✗ {name}: ÉCHEC après {retries} essais")
    return None

# Plan B-roll: (nom, prompt) illustrant les moments clés — Africains uniquement
BROLL = {
 "immigrants": "A Black African immigrant family (father, mother, child) walking in a snowy Canadian city street in winter, warm coats, hopeful expressions, Canadian flag visible on a building, modern downtown.",
 "tired_work": "A tired Black African man in work uniform sitting alone on a bus at night after a long shift, exhausted, looking out the window, city lights, melancholic mood.",
 "bills": "Close up of a worried Black African man at a kitchen table at night reviewing a stack of unpaid bills and invoices, calculator, head in hand, single lamp light.",
 "two_jobs": "A Black African man in two different work uniforms split, rushing between jobs, motion, urban Canada, busy, overworked, determined face.",
 "taxes": "A Black African office worker looking at a payslip with deductions, concerned expression, modern office, documents showing reduced salary.",
 "success_home": "A proud successful Black African man in a smart casual outfit standing in front of a beautiful modern suburban Canadian house, confident smile, sunny day, ownership and pride.",
 "university": "Two happy Black African young students (a young man and a young woman) with backpacks on a Canadian university campus, modern buildings, bright future, smiling.",
 "freedom_family": "A relaxed wealthy Black African family enjoying free time together in a bright living room, laughing, financial freedom, warm and joyful atmosphere.",
 "advisor": "A confident professional Black African financial advisor in a suit smiling in a modern bright office, laptop and charts, trustworthy, successful businessman.",
}

if __name__ == "__main__":
    only = sys.argv[1:] if len(sys.argv)>1 else None
    print(f"Génération B-roll (nano-banana, Africains uniquement) -> {OUT}")
    for name, prompt in BROLL.items():
        if only and name not in only: continue
        gen(name, prompt)
    print("Terminé.")
