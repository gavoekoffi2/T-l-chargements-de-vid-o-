---
name: montage-viral
description: Monte une vidéo (talking-head, témoignage, pitch) en format vertical ultra-professionnel et viral. Transcrit, coupe les silences/répétitions, ajoute du ZOOM dynamique sur le locuteur, des overlays motion design synchronisés à la parole (restent affichés tant que le sujet est parlé), génère BEAUCOUP d'images B-roll IA (nano-banana) pour illustrer chaque partie, anime ces images avec des entrées spectaculaires en alternance avec le locuteur (ballotage), ajoute une riche palette d'effets sonores variés (shutter, impact, swoosh, glitch, sub-drop, sparkle…), incruste des sous-titres ANIMÉS karaoké (mot surligné, couleurs, plusieurs templates de police), applique un color grading cinématique et normalise l'audio. Utilise quand l'utilisateur demande un "montage", "monter une vidéo", "rendre une vidéo professionnelle/virale", "ajouter du motion design / des overlays / du B-roll / des sous-titres / du zoom".
---

# Montage Viral — pipeline complet v4

Pipeline de montage automatique (inspiré `video-use`) enrichi de **zoom dynamique**,
**motion design (overlays PIL→ProRes)**, **B-roll IA abondant** (OpenRouter / nano-banana),
**SFX variés et captivants** et **sous-titres karaoké animés multi-templates**.
Format vertical 1080×1920 (Reels / TikTok / Shorts).

## Hard Rules

1. Audio d'abord : coupes sur frontières de mots / silences ≥ 0.65s. PAD=0.25s (jamais couper une phrase).
2. **Sous-titres brûlés EN DERNIER et SÉPARÉMENT** (filtre `ass=`), JAMAIS via render.py.
3. Ordre du pipeline : cut+grade → **zoom dynamique** → overlays (ballotage) → **SFX** → **sous-titres ASS**.
4. Fades audio 30 ms à chaque coupe. Overlays `setpts=PTS-STARTPTS+T/TB`.
5. Loudnorm −14 LUFS / −1 dBTP (intégré à mix_sfx.py).

## Règles PRO (éditeur pro — appliquées automatiquement)

### Règle #1 — RYTHME
- **GAP_CUT = 0.65s** (était 0.85–0.90 ; coupes plus serrées = énergie pro).
- **PAD = 0.25s** (marge aux bords, réduite de 0.30).
- **Fillers détectés** : segments ne contenant que {"euh","hm","hmm","ah","eh","bon","bah","ben",
  "hein","voilà","donc","alors","en fait","genre","quoi","ouais","ok"} → supprimés automatiquement.
- Implémenté dans `build_edl.py` : `is_filler(seg_words)`.

### Règle #2 — HIÉRARCHIE VISUELLE
- **Keyword popups** : `keyword_popup.py` extrait les 8 mots-clés les plus fréquents du transcript,
  génère des chips dorées animées 1.5s (ProRes 4444 alpha, pop-in + fade), positionnées **y≈450**
  (au-dessus du visage, style TikTok) lors de chaque apparition du mot-clé (min 8s entre occurrences).
  S'exécute APRÈS plan_overlays.py et patche edl.json.
- **Karaoké hl_scale = 145** (était 115–125) : le mot actif est bien plus visible (zoom +45%).

### Règle #3 — RELANCES TOUTES 3-4s
- **Micro-punches gaussiens** : `video_dynamics.py` insère une impulsion de zoom `PUNCH_AMP=0.10`
  toutes les `PUNCH_INTERVAL=3.5s` dans les longs segments via expression ffmpeg :
  `AMP*exp(-pow((on/FPS - tp)/sigma, 2))` additionnée au Ken Burns.
- **Gap-fill SFX** : `plan_overlays.py` scanne les gaps > 4s sans event visuel et injecte
  automatiquement un SFX audio (`ding`/`transition`/`click`/`swoosh_up`) au milieu du gap.

## Règles de mise en scène (CRITIQUES — demandées par l'utilisateur)

- **Zoom / dynamisme** : `video_dynamics.py` applique un Ken Burns alterné par coupe
  (zoom-in lent / zoom-out / punch-in net 1 segment sur 4). La vidéo ne doit JAMAIS être statique.
- **Beaucoup de B-roll** : illustrer CHAQUE partie importante. Viser ~14-18 images pour une
  vidéo de 4 min. Une image par idée forte. Ne jamais laisser un thème fort sans illustration.
- **Ballotage** : le B-roll est composité AU-DESSUS du panneau graphique. Séquence type :
  locuteur → cutaway B-roll 3s (plein cadre + son shutter) → retour locuteur (panneau encore visible).
  Si un sujet est LONG, enchaîner plusieurs B-roll en alternance avec le locuteur.
- **Overlays persistants** : un overlay reste à l'écran TANT QUE la personne parle du sujet
  illustré. Sa durée = longueur du sujet (5–16s). Le .mov doit durer aussi longtemps : les
  fonctions de dessin tiennent leur état final (compteurs figés à leur max) puis fade out.
  NE JAMAIS faire disparaître un overlay avant que le locuteur change de sujet.
- **Zones (anti-collision, anti-UI TikTok)** :
  - Visage : haut du cadre (y < 850) — laissé libre.
  - Overlays graphiques : **y = 880 → 1430** (poitrine/ventre).
  - Sous-titres : centrés à **y ≈ 1500** (ni sur les overlays, ni trop bas où l'UI TikTok masque).
  - Toujours garder un écart ≥ 50px entre bas d'overlay et sous-titres.

## Sous-titres ANIMÉS (subs_ass.py) — multi-templates

Format **ASS** (libass) avec PlayResX/Y = 1080/1920. Effets par chunk de 2-3 mots :
- **Karaoké** : le mot prononcé passe en couleur highlight + léger zoom (`\t` timing relatif).
- **Pop-in** : scale 40%→100% à l'apparition (`\fscx\fscy` + `\t`), `\fad(80,60)`.
- Templates prévus (varier d'une vidéo à l'autre, NE PAS toujours le même) :
  `tiktok_yellow` (Montserrat, highlight jaune) · `neon_pop` (Anton, rose néon) ·
  `bold_box` (Montserrat, fond boîte) · `gold_lux` (Bebas Neue, or) · `bangers_fun` (Bangers, cyan).
- Polices à installer dans `~/.fonts` au 1er usage (Anton, Bebas Neue, Montserrat, Bangers — Google Fonts).
- Usage : `python subs_ass.py <template> master.ass` puis brûler `ass='master.ass'`.

## Bibliothèque SFX (make_sfx.py) — 14 sons numpy

`whoosh, swoosh_up, swoosh_down, pop, boom, impact, sub_drop, ding, sparkle,
shutter, glitch, riser, transition, click`. Accompagner CHAQUE mouvement brusque d'un son :
- **shutter** : B-roll (son d'appareil photo) — règle par défaut pour toute image.
- **swoosh_up/down** : zoom / entrée rise. **glitch** : entrée glitch RGB.
- **sub_drop** : révélation chiffre choc (70H, 9%). **impact/boom** : overlay fort / pivot.
- **sparkle** : apparition premium (diplôme, RRA, héritage). **transition** : changement de scène.
- **ding** : chiffre/accent. **pop** : CTA léger. Gains dans mix_sfx.py (sub_drop/impact ~0.95).

## Pré-requis

- `ffmpeg`+`ffprobe` PATH. `Pillow`, `numpy`.
- `ELEVENLABS_API_KEY` (speech_to_text) + `OPENROUTER_API_KEY` dans `~/.claude/skills/video-use/.env`.
- Helpers video-use : `~/.claude/skills/video-use/helpers/{transcribe,render}.py`.
- Polices virales dans `~/.fonts` (cf. ci-dessus).

## Processus (orchestré par run_pipeline.sh)

1. **Inventaire** ffprobe + audio 16kHz.
2. **Transcription** : `helpers/transcribe.py <video> --edit-dir edit/ --language fr`.
3. **Analyse** : lire le transcript. Repérer silences, sujets (frontières → durée overlay),
   et TOUTES les idées fortes à illustrer (→ liste B-roll abondante).
4. **EDL** : `build_edl.py` (PAD=0.25, GAP_CUT=0.65, fillers détectés). Écrit aussi le transcript video-use (`*_vu.json`).
5. **Overlays** : `overlays.py` — zone y=880-1430, durées = longueur des sujets (tiennent l'état final).
6. **B-roll IA** : `genimg.py` (14-18 prompts, contrainte ethnique respectée) → `broll_anim.py`
   (entrées variées punch/glitch/slide/flash/rise/light-sweep + cadre + label).
7. **Plan** : `plan_overlays.py` — graphiques (durée sujet) + B-roll (ballotage, gap 0.5s),
   SFX variés par élément + gap-fill SFX auto (Règle #3). Écrit overlays[] dans edl.json + sfx_cues.json.
7b. **Keyword popups** : `keyword_popup.py` — génère chips dorées 1.5s pour les mots-clés forts (Règle #2). Patche edl.json.
8. **Base** : render.py sur un EDL sans overlays → `base_only.mp4` (cut+grade seul).
9. **Zoom** : `video_dynamics.py base_only.mp4 base_dyn.mp4` (Ken Burns alterné + punch-in + micro-punches 3.5s, Règle #3).
10. **Composite** : `composite.py base_dyn.mp4 composite_nosfx.mp4` (overlays PTS-shiftés, B-roll dessus).
11. **SFX** : `mix_sfx.py composite_nosfx.mp4 composite_withsfx.mp4` (14 SFX + loudnorm).
12. **Sous-titres** : `subs_ass.py <template> master.ass` → ffmpeg `ass=` → final_montage.mp4.
13. **Compression** : CRF 26 ≈ 73-80 Mo → livrable. Pousser sur GitHub.

`bash run_pipeline.sh <template>` enchaîne 4→13 automatiquement.

## Auto-évaluation (planche contact)

Extraire des frames à : un B-roll, un overlay+sous-titre simultanés, un punch-in. Vérifier :
- Visage dégagé (rien au-dessus de y=850).
- Overlay persistant pendant tout le sujet ; B-roll bien plein cadre au-dessus pendant le cutaway.
- Sous-titre karaoké à y≈1500, mot actif coloré, AUCUN chevauchement avec l'overlay.
- Zoom perceptible mais sans jitter (pré-scale x2 dans video_dynamics).

## Notes

- Secrets : `~/.claude/skills/video-use/.env` UNIQUEMENT.
- Intermédiaires lourds (.mov ProRes, base/composite .mp4) : gitignore. Committer code + broll png +
  transcript + sfx wav + ass + livrable final.
- nano-banana sort en 1024² → bg_blur + Ken Burns (broll_anim).
- Transcript ElevenLabs : filtrer `type=="word"` ; convertir en format video-use pour les sous-titres.
- Overlay .mov plus long que l'animation = les fonctions de dessin DOIVENT tenir leur état final.
