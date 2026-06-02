# Montage Motion Design — Remotion

Montage professionnel généré via [Remotion](https://remotion.dev).

## Structure

```
montage/
├── src/
│   ├── index.ts               # Point d'entrée Remotion
│   ├── Root.tsx               # Compositions enregistrées
│   ├── constants.ts           # FPS, couleurs, durées
│   ├── compositions/
│   │   ├── Intro.tsx          # Séquence intro animée (3s)
│   │   ├── VideoWithOverlays.tsx  # Vidéo + motion design (15s)
│   │   ├── Outro.tsx          # Outro + CTA (3s)
│   │   └── Transition.tsx     # Transitions sweep/glitch/flash/zoom
│   └── components/
│       ├── AnimatedTitle.tsx  # Titre lettre par lettre + lignes
│       ├── LowerThird.tsx     # Bandeau info cinématique
│       ├── ParticleField.tsx  # Champ de particules
│       ├── HexGrid.tsx        # Grille hexagonale SVG
│       ├── GlitchText.tsx     # Texte avec effet glitch RGB
│       ├── ScanLines.tsx      # Lignes de scan TV
│       ├── CircularTimer.tsx  # Compteur circulaire
│       └── Flare.tsx          # Lens flare animé
└── public/
    └── video.mp4              # ← DÉPOSER LA VIDÉO SOURCE ICI
```

## Installation

```bash
cd montage
npm install
```

## Utilisation

### 1. Ajouter la vidéo source

Copie ou télécharge la vidéo et place-la dans `public/video.mp4` :

```bash
cp /chemin/vers/ta-video.mp4 public/video.mp4
```

### 2. Personnaliser (optionnel)

Dans `src/constants.ts` :
- `MAIN_DURATION` — durée de la partie vidéo en frames (30fps)
- `COLORS` — palette de couleurs

Dans `src/compositions/VideoWithOverlays.tsx` :
- Modifier les textes dans les `LowerThird` (nom, titre)

### 3. Prévisualiser

```bash
npm start
```
Ouvre http://localhost:3000 — tu peux naviguer entre les compositions.

### 4. Rendre la vidéo finale

```bash
npm run render
```
La vidéo finale est exportée dans `out/montage.mp4`.

## Effets inclus

| Effet | Description |
|-------|-------------|
| Intro animée | Particules, hexagones, title reveal lettre par lettre |
| Color grading | Teal & orange cinématique |
| Vignette | Vignette dynamique pulsante |
| Scan lines | Lignes de balayage type CRT |
| Lower thirds | Bandeaux d'info animés |
| Glitch text | Texte RGB décalé |
| Lens flares | Reflets lumineux animés |
| Transitions | Sweep, glitch, flash, zoom |
| Outro | Cercles concentriques + dégradé gradient |
| Timer | Compteur circulaire |
| Timecode | Timecode monospace discret |
| Bandes ciné | Letterbox cinématographique |
