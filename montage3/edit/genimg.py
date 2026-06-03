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
 # Thème : Prompt Engineering / Intelligence Artificielle
 "confused_ia":"A frustrated Black African young man staring at a laptop screen in confusion, overwhelmed, multiple chat bubbles around him showing generic AI responses, modern apartment, blue screen glow.",
 "typing_vague":"A Black African woman lazily typing on laptop keyboard, phone in hand, casual posture, screen showing a very short one-line message to an AI chatbot, unimpressed expression.",
 "no_results":"A Black African professional man frowning at laptop screen showing 'generic results', hand on forehead, disappointed, home office, warm lighting.",
 "ia_power":"A Black African tech professional in awe, looking at a glowing holographic AI brain interface in dark futuristic room, blue and purple light, powerful energy.",
 "context_notes":"A focused Black African student writing detailed notes and mind maps on paper at a desk, organized structured thinking, warm lamp light, books around.",
 "lightbulb_moment":"A Black African entrepreneur having a eureka moment, big smile, looking at laptop screen, bright idea, modern bright coworking space, inspiration.",
 "job_posting":"A Black African professional woman browsing job listings on laptop, professional attire, hopeful expression, home office background.",
 "lettre_motivation":"A Black African man carefully writing a professional cover letter at a desk, focused concentration, formal shirt, documents around, natural window light.",
 "good_prompt_typing":"A Black African professional typing a long detailed structured message on laptop, very focused, multiple paragraphs visible on screen, blue glow.",
 "ia_great_result":"A Black African professional woman smiling broadly at her laptop screen showing excellent AI-generated content, celebrating, thumbs up, modern office.",
 "prompt_engineer":"A young Black African tech professional in hoodie working on code and prompt scripts on dual monitors, focused, futuristic workspace, neon lights.",
 "futur_machine":"A Black African professional shaking hands with a holographic AI robot figure, partnership concept, modern laboratory, blue light, future of work.",
 "discipline_learn":"Black African university students learning about AI and technology in a modern classroom with screens and tablets, engaged, studying together.",
 "success_career":"A successful Black African professional man standing confidently in a modern glass office building lobby, sharp suit, laptop under arm, achievement.",
 "subscribe_content":"A Black African content creator filming himself with a phone on tripod in a bright home studio, recording an educational video, ring light, engaged.",
 "host_presenter":"A confident professional Black African man presenting to camera in a clean modern setup, friendly smile, educational presenter style, good lighting.",
}

if __name__=="__main__":
    only=sys.argv[1:] if len(sys.argv)>1 else None
    print(f"Génération B-roll étendue (Africains) -> {OUT}")
    for name,prompt in BROLL.items():
        if only and name not in only: continue
        gen(name,prompt)
    print("Terminé.")
