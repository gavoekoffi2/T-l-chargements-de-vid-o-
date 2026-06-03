---
name: montage-viral
description: Monte une vidéo (talking-head, témoignage, pitch) en format vertical ultra-professionnel et viral. Transcrit, coupe les silences/répétitions/bafouillages, ajoute des overlays motion design synchronisés à la parole, génère des images B-roll IA (nano-banana) pour illustrer les propos, anime ces images avec des entrées spectaculaires, ajoute des effets sonores aux apparitions (shutter pour B-roll, impact/boom pour overlays), incruste des sous-titres dynamiques en bas du cadre (ne chevauchent jamais les overlays), applique un color grading cinématique et normalise l'audio. Utilise quand l'utilisateur demande un "montage", "monter une vidéo", "rendre une vidéo professionnelle/virale", "ajouter du motion design / des overlays / du B-roll / des sous-titres".
---

# Montage Viral — pipeline complet v3

Pipeline de montage automatique inspiré de `video-use` (coupe + compositing
production-correct) enrichi de **motion design (overlays PIL→ProRes)**, de
**B-roll IA généré** (OpenRouter / nano-banana, gemini-2.5-flash-image),
**d'effets sonores variés et synchronisés** et de **durées d'overlay synchro-parole**.
Pensé pour le format vertical 1080×1920 (Reels / TikTok / Shorts).

## Hard Rules (video-use + spécifiques montage-viral)

1. Audio d'abord : les coupes naissent des frontières de mots et des silences.
2. **Sous-titres brûlés EN DERNIER et SÉPARÉMENT** — pas via render.py mais via un
   `ffmpeg subtitles=` post-SFX avec `force_style='...,MarginV=26'` → sous-titres
   à y≈1750px, jamais sur les overlays.
3. Extraction par segment → concat lossless → overlays PTS-shiftés → PUIS SFX → PUIS sous-titres.
4. Fades audio 30 ms à chaque bord de coupe (anti-pop).
5. Jamais couper en plein mot ; PAD=0.30s, GAP_CUT=0.80-0.90s (conservateur).
6. Overlays `setpts=PTS-STARTPTS+T/TB` ; sous-titres en offsets timeline de sortie.
7. Normaliser à −14 LUFS / −1 dBTP via mix_sfx.py (loudnorm intégré).

## Pré-requis (vérifier au démarrage, installer au 1er usage)

- `ffmpeg` + `ffprobe` sur le PATH (build statique johnvansickle si absent).
- Clé `ELEVENLABS_API_KEY` avec permission *speech_to_text* (transcription Scribe,
  word-level) dans `~/.claude/skills/video-use/.env`.
- `OPENROUTER_API_KEY` dans le même `.env` pour le B-roll IA
  (modèle `google/gemini-2.5-flash-image` via OpenRouter).
- `Pillow` + `numpy` (overlays + animations B-roll + génération SFX Python).
- Helpers `video-use` : `~/.claude/skills/video-use/helpers/{transcribe,render}.py`.

## Processus

1. **Inventaire** : `ffprobe` la source (durée, w/h, portrait?). Extraire l'audio 16 kHz mono.
2. **Transcription** : `helpers/transcribe.py <video> --edit-dir edit/ --language fr`
   Sortie mots-timestampés dans `edit/transcripts/<source>.json` (format ElevenLabs Scribe).
3. **Lecture + analyse** : lire le transcript complet. Identifier :
   - Silences ≥ 0.80s (points de coupe)
   - Bafouillages / répétitions (segments à supprimer)
   - **Frontières de sujets** (quand le locuteur change de thème → fin de l'overlay)
   - Moments forts à illustrer avec B-roll
4. **Stratégie** : coupes, liste overlays + B-roll, SFX, durées synchro-parole.
5. **EDL** : `build_edl.py` → `edl.json`. PAD=0.30, GAP_CUT=0.85.
   Convertir aussi le transcript ElevenLabs en format video-use (`*_vu.json`) pour les sous-titres.
6. **Overlays graphiques** : `overlays.py` — textes adaptés au contenu.
   **Zone autorisée : y=1000–1580 uniquement** (poitrine/ventre, visage dégagé).
   PIL → ProRes 4444 (.mov, alpha). Palette: or (255,200,70), cyan (0,212,255),
   vert (45,222,135), rouge (255,90,90).
7. **B-roll IA** : `genimg.py` — prompts illustrant les thèmes forts.
   **Respecter toute contrainte ethnique/représentation de l'utilisateur.**
   Puis `broll_anim.py` — entrées spectaculaires (punch-zoom, glitch RGB, slide,
   flash, light-sweep) + cadres cinématiques. ProRes 4444 alpha plein cadre.
8. **Plan timeline** : `plan_overlays.py` — règles v3 :
   - **Overlays graphiques** : durée = longueur du sujet dans la parole
     (s2o(src_topic_end) - s2o(src_appear), capped 5–16s). L'overlay reste visible
     TANT QUE le locuteur parle du sujet illustré.
   - **B-roll** : durée courte 3–4s, SFX=shutter (son d'appareil photo).
   - **Pas de collision avoidance entre B-roll et graphique** : le B-roll est
     composité AU-DESSUS du graphique. Pendant le cutaway → image plein cadre.
     Après le cutaway → locuteur + panneau graphique encore visible. = "ballotage".
   - Collision avoidance uniquement entre B-roll et B-roll (gap=0.6s).
   - Ordre dans edl.json : graphiques TRIÉS PAR TEMPS en premier, puis B-roll.
   - Génère `sfx_cues.json`.
9. **Compositing** : `render.py edl.json -o composite_nosfx.mp4 --no-subtitles --no-loudnorm`
   (pas de sous-titres ici ! ils viennent après les SFX).
10. **SFX** : `mix_sfx.py composite_nosfx.mp4 composite_withsfx.mp4`
    SFX disponibles : whoosh, pop, boom, ding, riser, **shutter** (B-roll), **impact** (overlays forts).
    Générer shutter.wav + impact.wav via numpy si absents (voir scripts/).
    loudnorm −14 LUFS intégré dans mix_sfx.py.
11. **Sous-titres** : brûler séparément avec MarginV=26 (y≈1750, EN DESSOUS des overlays) :
    ```
    ffmpeg -y -i composite_withsfx.mp4 \
      -vf "subtitles='master.srt':force_style='FontName=Helvetica,FontSize=18,Bold=1,\
    PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BackColour=&H00000000,\
    BorderStyle=1,Outline=2,Shadow=0,Alignment=2,MarginV=26'" \
      -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
      -c:a copy -movflags +faststart final_montage.mp4
    ```
12. **Auto-évaluation** : extraire frames aux moments d'overlay. Vérifier :
    - Visage dégagé (aucun overlay au-dessus de y=1000)
    - Sous-titres en bas (y≈1750, pas sur les overlays)
    - B-roll et graphique actifs simultanément → B-roll bien au-dessus (couvre tout)
    - Après B-roll → graphique encore visible jusqu'à fin du sujet
13. **Livraison** : compresser (CRF 26 ≈ 75-80 Mo) et pousser sur GitHub.

## Réglages éprouvés

- Format vertical 1080×1920, 30 fps. Grade `warm_cinematic`.
- Coupes : PAD=0.30s, GAP_CUT=0.85s. ~12–15% de temps mort supprimé.
- Overlays graphiques : **y=1000–1580** (poitrine/ventre). Panneaux verre dépoli.
- Durées overlays : calculées depuis les frontières de sujets dans la transcription.
  MIN=5s, MAX=16s. Ne JAMAIS faire disparaître un overlay avant la fin du sujet parlé.
- B-roll : cutaways plein cadre 3.2–3.5s, fond flou + Ken Burns + label chip + coins.
  Composité APRÈS les graphiques → couvre momentanément le panneau.
  Après disparition → panneau graphique redevient visible ("ballotage").
- Sous-titres : 2 mots, MAJUSCULES, DejaVu Bold 18, **MarginV=26** (y≈1750).
  Construire le SRT AVANT le compositing, brûler APRÈS les SFX.
- SFX palette :
  - `impact` : apparition d'overlay graphique fort (intro, endcard)
  - `boom` : révélation / pivot / solution
  - `whoosh` : slide graphique / B-roll slide
  - `ding` : chiffre / statistique / liste
  - `pop` : CTA / apparition légère
  - `shutter` : **TOUJOURS pour les B-roll images** (son d'appareil photo)
  - `riser` : montée de tension en fond
- Densité : 1 graphique ~toutes les 20–30s (durée longue), 1 B-roll ~toutes les 15s.

## Pipeline de génération SFX (numpy, si wav absent)

```python
import numpy as np, wave, math
SR = 48000
def save_wav(path, s):
    d=(np.clip(s,-1,1)*32767).astype(np.int16)
    with wave.open(path,'w') as w:
        w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR);w.writeframes(d.tobytes())

t=np.linspace(0,0.14,int(SR*0.14),False)
shutter=(0.9*np.sin(2*math.pi*t*7000)*np.exp(-t*70)
        +0.5*np.sin(2*math.pi*t*3500)*np.exp(-t*45)
        +0.2*np.sin(2*math.pi*t*14000)*np.exp(-t*120))
save_wav("sfx/shutter.wav", shutter)

t=np.linspace(0,0.55,int(SR*0.55),False)
impact=(0.95*np.sin(2*math.pi*t*60)*np.exp(-t*5)
       +0.60*np.sin(2*math.pi*t*180)*np.exp(-t*9)
       +0.40*np.sin(2*math.pi*t*1200)*np.exp(-t*30))
save_wav("sfx/impact.wav", impact)
```

## Notes

- Secrets : `~/.claude/skills/video-use/.env` UNIQUEMENT. JAMAIS dans le dépôt.
- Intermédiaires lourds (ProRes .mov, composites .mp4) : gitignore.
  Committer : code + images broll/*.png + transcript + livrable final + sfx/*.wav.
- nano-banana sort en 1024×1024 → bg_blur + Ken Burns dans broll_anim.py.
- Le transcript ElevenLabs a `type:"word"` et `type:"spacing"` → filtrer sur `type=="word"`.
  Convertir en format video-use pour render.py build_master_srt (champ `text` sans espace).
