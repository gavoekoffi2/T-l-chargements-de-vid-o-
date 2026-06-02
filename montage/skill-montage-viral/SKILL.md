---
name: montage-viral
description: Monte une vidéo (talking-head, témoignage, pitch) en format vertical ultra-professionnel et viral. Transcrit, coupe les silences/répétitions/bafouillages, ajoute des overlays motion design synchronisés à la parole, génère des images B-roll IA (nano-banana) pour illustrer les propos, anime ces images avec des entrées spectaculaires, ajoute des effets sonores aux apparitions, incruste des sous-titres dynamiques, applique un color grading cinématique et normalise l'audio. Utilise quand l'utilisateur demande un "montage", "monter une vidéo", "rendre une vidéo professionnelle/virale", "ajouter du motion design / des overlays / du B-roll / des sous-titres".
---

# Montage Viral — pipeline complet

Pipeline de montage automatique inspiré de `video-use` (coupe + compositing
production-correct) enrichi de **motion design (overlays PIL→ProRes)**, de
**B-roll IA généré** (OpenRouter / nano-banana, gemini-2.5-flash-image) et
**d'effets sonores synchronisés**. Pensé pour le format vertical 1080×1920
(Reels / TikTok / Shorts).

## Principe (rappel des Hard Rules video-use)

1. Audio d'abord : les coupes naissent des frontières de mots et des silences.
2. Sous-titres appliqués EN DERNIER dans la chaîne de filtres (sinon cachés par les overlays).
3. Extraction par segment → concat lossless `-c copy`, puis overlays PTS-shiftés, puis sous-titres.
4. Fades audio 30 ms à chaque bord de coupe (anti-pop).
5. Jamais couper en plein mot ; padder chaque bord (30–200 ms).
6. Overlays `setpts=PTS-STARTPTS+T/TB` ; sous-titres en offsets timeline de sortie.
7. Normaliser à −14 LUFS / −1 dBTP en fin de chaîne.

## Pré-requis (vérifier au démarrage, installer au 1er usage)

- `ffmpeg` + `ffprobe` sur le PATH (build statique johnvansickle si absent).
- `faster-whisper` (transcription locale, sans clé) **ou** clé `ELEVENLABS_API_KEY`
  avec permission *speech_to_text* (transcription Scribe, meilleure qualité) dans
  `~/.claude/skills/video-use/.env`.
- `OPENROUTER_API_KEY` dans le même `.env` pour le B-roll IA (modèle `google/gemini-2.5-flash-image`).
- `Pillow` (overlays + animations B-roll).
- Helpers `video-use` : `~/.claude/skills/video-use/helpers/{transcribe,render}.py`.
- Node 22 + Remotion seulement si un slot d'overlay React est demandé (sinon PIL suffit).

Les scripts de référence sont dans `scripts/` à côté de ce fichier. Copie-les dans
le dossier de travail `<videos_dir>/edit/` et adapte-les au contenu réel.

## Processus

1. **Inventaire** : `ffprobe` la source (durée, w/h, portrait?). Extraire l'audio 16 kHz mono.
2. **Transcription** : `transcribe.py` (Scribe si clé OK) sinon `scripts/transcribe_local.py`
   (faster-whisper). Sortie mots-timestampés dans `edit/transcripts/<source>.json`.
3. **Lecture + analyse** : lire la transcription. Repérer silences ≥0,6 s, bafouillages,
   répétitions, passages confus. Identifier les **moments à illustrer** (thèmes forts).
4. **Stratégie** (montrer à l'utilisateur, confirmer si possible) : forme, coupes,
   liste d'overlays + B-roll + SFX, style des sous-titres, longueur estimée.
5. **Coupe** : `scripts/build_edl.py` → `edit/edl.json` (ranges paddées, fusion des
   petits gaps, suppression des grands silences + segments à retirer). Grade `warm_cinematic`.
6. **Overlays motion design** : `scripts/overlays.py` — adapter textes/chiffres au contenu.
   PIL → ProRes 4444 (.mov, alpha). Easing pro (ease_out_cubic), palette de marque.
7. **B-roll IA** : `scripts/genimg.py` — prompts décrivant des scènes illustrant les propos.
   **Respecter toute contrainte de l'utilisateur sur les personnes représentées** (ex.
   "uniquement des Africains"). Puis `scripts/broll_anim.py` — entrées spectaculaires
   variées (punch-zoom, glitch RGB, slide+blur, flash, light-sweep) + cadres cinématiques.
8. **Plan timeline** : `scripts/plan_overlays.py` — mappe chaque cue source→sortie, place
   overlays + B-roll sans collision, génère `edit/sfx_cues.json`.
9. **Compositing** : `render.py edl.json -o composite.mp4 --build-subtitles --no-loudnorm`
   (cut + grade + 16 overlays + sous-titres).
10. **SFX + audio** : `scripts/mix_sfx.py composite.mp4 final.mp4` (whoosh/pop/boom/ding aux
    apparitions + loudnorm −14 LUFS). Générer les SFX via `scripts/make_sfx.sh` au 1er usage.
11. **Auto-évaluation** : extraire des frames aux frontières de coupe et à chaque overlay
    (planche contact), vérifier : pas de jump/flash, sous-titres lisibles non masqués,
    overlays alignés, B-roll plein cadre net. Corriger si besoin (≤3 passes).
12. **Livraison** : compresser (CRF 26 ≈ 80 Mo) et fournir + pousser sur GitHub pour un lien.

## Réglages éprouvés (à adapter)

- Format vertical 1080×1920, 30 fps. Grade `warm_cinematic`.
- Coupe : fusionner gaps <0,6 s, couper ≥0,6 s, pad 0,12 s. ~15 % de durée gagnée typique.
- Overlays graphiques : panneaux verre dépoli en tiers supérieur (n'obscurcir ni le visage
  centré ni la zone sous-titres en bas). Palette financière : or (255,200,70), cyan
  (0,212,255), vert (45,222,135), rouge (255,90,90).
- B-roll : cutaways plein cadre 2,8–3,0 s, fond flou + image centrée + chip label + coins.
- Sous-titres : 2 mots, MAJUSCULES, Helvetica/DejaVu 18 gras, MarginV=90 (zone sûre).
- SFX : whoosh (slide), pop (apparition), boom (révélation/punch/flash), ding (chiffre/accent).
- Densité : 1 élément animé ~toutes les 12–18 s ; laisser respirer le locuteur.

## Notes

- Secrets : toujours dans `~/.claude/skills/video-use/.env`, JAMAIS dans le dépôt.
- Intermédiaires lourds (.mov ProRes, .mp4) : gitignore ; committer seulement code +
  images B-roll + transcript + livrable final.
- nano-banana sort en 1024×1024 : traiter en fond flou + Ken Burns pour le vertical.
