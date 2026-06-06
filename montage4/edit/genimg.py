#!/usr/bin/env python3
"""Génère des images B-roll via OpenRouter (gemini-2.5-flash-image).
CONTRAINTE ABSOLUE : uniquement des personnes AFRICAINES (peau noire).
14 images pour illustrer Prompt Engineering v2 (video4).
"""
import os, sys, json, base64, time, urllib.request

KEY = None
for p in [os.path.expanduser("~/.claude/skills/video-use/.env")]:
    if os.path.exists(p):
        for line in open(p):
            if line.startswith("OPENROUTER_API_KEY="): KEY = line.strip().split("=",1)[1]

MODEL = "google/gemini-2.5-flash-image"
OUT   = os.path.join(os.path.dirname(__file__), "broll"); os.makedirs(OUT, exist_ok=True)

STYLE = ("Cinematic photorealistic vertical 9:16 portrait photo, shot on 50mm, "
         "shallow depth of field, natural soft lighting, high detail, documentary realism. "
         "IMPORTANT: all people depicted MUST be Black African people with dark skin, "
         "African features, no other ethnicities. ")

def gen(name, prompt, retries=3):
    op = os.path.join(OUT, f"{name}.png")
    if os.path.exists(op) and os.path.getsize(op) > 10000:
        print(f"  = {name}.png (cache)"); return op
    body = json.dumps({"model": MODEL,
                       "messages": [{"role":"user","content": STYLE+prompt}],
                       "modalities": ["image","text"]}).encode()
    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions", data=body,
        headers={"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"})
    for a in range(retries):
        try:
            r = urllib.request.urlopen(req, timeout=120)
            d = json.loads(r.read())
            msg = d["choices"][0]["message"]; imgs = msg.get("images") or []
            if not imgs: print(f"  ! {name}: pas d'image"); time.sleep(3); continue
            b64 = imgs[0]["image_url"]["url"].split(",",1)[1]
            open(op,"wb").write(base64.b64decode(b64))
            print(f"  ✓ {name}.png ({os.path.getsize(op)//1024} KB)"); return op
        except Exception as e:
            print(f"  ... {name} tentative {a+1}: {str(e)[:90]}"); time.sleep(4*(a+1))
    print(f"  ✗ {name}: ÉCHEC"); return None

BROLL = {
    "no_degree":
        "A frustrated Black African young man staring at a diploma certificate, confused expression, "
        "thinking it won't help with AI success, clean white wall background, modern setting.",
    "discipline":
        "A focused Black African professional intensely learning on a laptop, determined expression, "
        "digital AI interface on screen, modern tech desk, concentrated energy.",
    "formuler":
        "A Black African person typing carefully on a laptop keyboard, composing a detailed message, "
        "fingers on keyboard, focused expression, modern home office desk.",
    "ia_answer":
        "Smartphone screen showing a ChatGPT/AI chat interface with a detailed professional AI response, "
        "held by Black African hands, blurred warm background, close-up shot.",
    "ecrire":
        "A Black African student writing organized detailed notes with a pen on a notebook, "
        "structured bullet points, warm desk lamp light, study environment.",
    "exemple_vague":
        "A frustrated Black African person frowning at laptop screen showing a generic unhelpful AI response, "
        "disappointed head tilt, home office, blue screen glow.",
    "contexte_notes":
        "A Black African professional reviewing a detailed organized document on a clipboard, "
        "structured information, bullet points visible, business casual attire, natural light.",
    "tiktok_creator":
        "A Black African young content creator enthusiastically filming a TikTok video with smartphone "
        "on ring light setup, creative studio background, energetic confident pose.",
    "expert_marketing":
        "A confident Black African marketing professional in business casual attire, "
        "pointing at a strategy chart/whiteboard, office background, leadership presence.",
    "bon_resultat":
        "An excited Black African professional celebrating at laptop, fist pump gesture, "
        "screen showing excellent AI-generated results, big joyful smile, modern home office.",
    "role_ia":
        "A Black African person speaking confidently to a computer showing AI interface, "
        "giving clear instructions, pointing at screen, determined authoritative expression.",
    "framework_doc":
        "A Black African professional holding a well-structured checklist/template document, "
        "organized framework clearly visible, clean modern office background, professional.",
    "subscribe_cta":
        "A Black African content creator giving a big enthusiastic thumbs up pointing to camera, "
        "notification bell icon visible, professional studio lighting, bright background.",
    "host_video4":
        "A Black African man wearing glasses and blue t-shirt speaking to camera confidently, "
        "microphone in hand, engaged and passionate expression, explaining something important.",
}

if __name__ == "__main__":
    only = sys.argv[1:] if len(sys.argv)>1 else None
    print(f"Génération B-roll étendue (Africains) -> {OUT}")
    for name, prompt in BROLL.items():
        if only and name not in only: continue
        gen(name, prompt)
    print("Terminé.")
