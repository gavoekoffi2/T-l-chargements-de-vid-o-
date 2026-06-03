# 🎬 Montage Viral — Skill pour Claude Code

Skill de montage vidéo professionnel automatisé pour Claude Code.  
Transcription → coupes intelligentes → overlays motion design → B-roll IA → SFX → sous-titres → livrable viral.

## Installation en 1 commande

```bash
git clone https://github.com/gavoekoffi2/T-l-chargements-de-vid-o-.git
cd T-l-chargements-de-vid-o-/montage-viral-skill
bash install.sh
```

Ou depuis une session Claude Code, donne ce lien à l'agent :

```
https://raw.githubusercontent.com/gavoekoffi2/T-l-chargements-de-vid-o-/claude/video-montage-motion-design-6fLCV/montage-viral-skill/install.sh
```

## Clés API requises

Dans `~/.claude/skills/video-use/.env` :
```
ELEVENLABS_API_KEY=sk_...   # Pour la transcription word-level (Scribe)
OPENROUTER_API_KEY=sk-or-v1-...  # Pour le B-roll IA (gemini-2.5-flash-image)
```

## Ce que fait le skill

| Étape | Description |
|---|---|
| Transcription | ElevenLabs Scribe — timestamps mot par mot |
| Coupes | Silences ≥0.85s supprimés, PAD=0.30s (fin de phrase préservée) |
| Overlays | 8 panneaux motion design (PIL→ProRes 4444), zone poitrine/ventre |
| B-roll IA | 8 images générées par IA (OpenRouter), personnages selon consignes |
| Animations | punch-zoom, glitch RGB, slide, flash, light-sweep + cinematic frame |
| Timeline | Durées synchro-parole — l'overlay reste jusqu'à fin du sujet |
| Ballotage | B-roll composité AU-DESSUS des graphiques → cutaway → retour panneau |
| SFX | shutter (B-roll), impact/boom/whoosh/ding/pop (overlays) |
| Sous-titres | MarginV=26 (y≈1750px) — jamais sur les overlays |
| Audio | −14 LUFS / −1 dBTP (standard TikTok/Reels/Shorts) |

## Format de sortie

- 1080×1920 vertical (Reels / TikTok / YouTube Shorts)
- CRF 26 ≈ 75-80 MB
- H.264 + AAC 128k, faststart

## Utilisation

Dans Claude Code :
```
/montage-viral
```
Ou simplement demander :
> "Monte cette vidéo de façon professionnelle et virale"
