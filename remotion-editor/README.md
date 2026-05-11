# Remotion Motion Design Video Editor

Pipeline complet : vidéo brute → suppression des silences → sous-titres animés → rendu final avec animations motion design.

## Ce que ça fait

| Étape | Outil | Résultat |
|-------|-------|---------|
| Suppression des silences | FFmpeg `silencedetect` | Coupe les pauses > 0.4 s |
| Transcription | OpenAI Whisper | Sous-titres avec timestamps mot-par-mot |
| Rendu motion design | Remotion (React) | Vidéo finale avec toutes les animations |

## Animations incluses

- **Sous-titres mot-par-mot** — chaque mot s'illumine avec gradient violet/rose au moment où il est prononcé
- **Champ de particules** — particules flottantes en arrière-plan
- **Vignette & dégradés** — overlay cinématographique + barre de couleur en haut/bas
- **Lower-third** — carte animée avec le nom du présentateur (entrée coulissante)
- **Zoom pulse** — zoom subtil à chaque nouvelle phrase
- **Flash de coupe** — transition flash blanc à chaque coupe
- **Barre de progression** — barre colorée en haut de l'écran
- **Slate intro** — écran titre animé avec particules (optionnel)
- **KineticText** — texte cinétique mot-par-mot pour les highlights (composant réutilisable)
- **CalloutBubble** — bulle d'annotation animée (composant réutilisable)
- **CounterAnimation** — animation de compteur pour les stats (composant réutilisable)

## Prérequis

```bash
# FFmpeg
sudo apt-get install -y ffmpeg

# Whisper
pip3 install openai-whisper

# Node.js >= 18
node --version
```

## Utilisation rapide

```bash
# Pipeline complet (conseillé)
./scripts/run_pipeline.sh ma_video.mp4 \
  --title "Ma super vidéo" \
  --speaker "Jean Dupont" \
  --lang fr \
  --model small

# La vidéo finale est dans out/final.mp4
```

## Options du pipeline

```
./scripts/run_pipeline.sh <video> [options]

  --title "Titre"         Titre affiché dans la slate intro
  --speaker "Nom"         Nom du présentateur (lower-third)
  --lang fr               Langue pour Whisper (fr|en|auto)
  --model small           Modèle Whisper (tiny|base|small|medium|large)
  --silence-db -35        Seuil de silence en dB (défaut: -35)
  --silence-sec 0.4       Durée min de silence à couper (défaut: 0.4s)
  --output out/final.mp4  Chemin de sortie
  --skip-silence          Ne pas supprimer les silences
  --skip-transcribe       Utiliser les sous-titres existants (public/subtitles.json)
  --width 1920            Largeur de sortie
  --height 1080           Hauteur de sortie
```

## Qualité des modèles Whisper

| Modèle | VRAM | Précision | Vitesse |
|--------|------|-----------|---------|
| tiny   | ~1 GB | basse | très rapide |
| base   | ~1 GB | correcte | rapide |
| small  | ~2 GB | bonne | moyen |
| medium | ~5 GB | très bonne | lent |
| large  | ~10 GB | excellente | très lent |

## Studio Remotion (preview en direct)

```bash
npm start
# → ouvre http://localhost:3000
```

## Rendu manuel

```bash
npm run render
# ou avec props personnalisés :
npx remotion render VideoEditor out/output.mp4 --props='{"data":{...}}'
```

## Structure du projet

```
remotion-editor/
├── src/
│   ├── Root.tsx                    # Point d'entrée Remotion
│   ├── VideoEditor.tsx             # Composition principale
│   ├── types.ts                    # Types TypeScript
│   └── components/
│       ├── AnimatedSubtitles.tsx   # Sous-titres mot-par-mot
│       ├── ParticleField.tsx       # Champ de particules SVG
│       ├── GradientOverlay.tsx     # Vignette + barres cinématographiques
│       ├── LowerThird.tsx          # Carte présentateur
│       ├── KineticText.tsx         # Texte cinétique (réutilisable)
│       ├── ZoomPulse.tsx           # Zoom pulse sur événements
│       ├── ProgressBar.tsx         # Barre de progression
│       ├── CalloutBubble.tsx       # Bulle annotation (réutilisable)
│       └── CounterAnimation.tsx    # Compteur animé (réutilisable)
├── scripts/
│   ├── run_pipeline.sh             # Pipeline complet
│   ├── 1_remove_silence.sh         # Suppression silences (FFmpeg)
│   ├── 2_transcribe.py             # Transcription (Whisper)
│   └── 3_render.sh                 # Rendu Remotion
└── public/                         # Vidéos + JSON générés
```
