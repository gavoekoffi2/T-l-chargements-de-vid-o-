# 🎬 TikTok Viral Pipeline — Remotion 9:16

Pipeline complet **YouTube → TikTok 9:16 ultra-viral**, écrit en TypeScript +
[Remotion 4](https://www.remotion.dev/). Il extrait automatiquement les
**meilleurs moments** d'une vidéo source, les **recadre en 9:16**, les
**transcrit**, puis les **monte** avec :

- **Sous-titres dynamiques mot-par-mot** style Hormozi / MrBeast (pop spring,
  mot actif en jaune/rouge, contour noir épais)
- **Hook animé** en intro (titre choc qui drop avec shake + glow néon)
- **Motion design** : zoom-punch sur les mots forts, burst d'emojis,
  barre de progression néon, badge de marque pulsé, contour néon flickering
- **Découpe intelligente** des moments forts (heuristique de viralité
  configurable, durée min 90s par défaut)
- **Rendu programmatique** : un MP4 par highlight via `@remotion/renderer`

---

## 🚀 Quickstart

### 1. Pré-requis

- **Node ≥ 20** (testé sur Node 22)
- **ffmpeg** : `sudo apt install ffmpeg` (Linux) / `brew install ffmpeg` (Mac)
- **yt-dlp** : `pip install -U yt-dlp`
- (optionnel) **WhisperX** ou **whisper** pour des timestamps mot-par-mot
  ultra-précis : `pip install whisperx`

### 2. Installation

```bash
npm install
```

### 3. Lancement complet (URL YouTube → MP4 finaux)

```bash
npm run build -- "https://youtu.be/yiuGeVaZs3s" --handle="@toncompte" --min=90 --max=120
```

Les fichiers finaux atterrissent dans `out/clip-01.mp4`, `out/clip-02.mp4`, …

### 4. Mode démo (sans téléchargement)

Si tu veux juste **vérifier que tout marche** sur ta machine, sans télécharger
de vidéo :

```bash
npm run build:demo
```

Ça génère un faux source en couleur-bars avec un faux transcript, et passe
toute la chaîne — utile pour valider l'installation.

### 5. Studio interactif Remotion

Pour bricoler le visuel à la main avec aperçu live :

```bash
npm run studio
```

---

## ⚙️ Options CLI (`npm run build`)

| Flag                | Défaut | Description                                                  |
| ------------------- | ------ | ------------------------------------------------------------ |
| `<url>`             | —      | URL YouTube / Facebook / TikTok / etc. (n'importe quoi yt-dlp) |
| `--handle=@x`       | `@yourhandle` | Handle affiché en haut-droite                          |
| `--min=90`          | `90`   | Durée minimale d'un clip (secondes)                          |
| `--max=120`         | `120`  | Durée maximale d'un clip (secondes)                          |
| `--clips=N`         | _illimité_ | Nombre max de clips à produire (par défaut, tous ceux détectés) |
| `--whisper`         | _off_  | Force transcription avec whisper(x) au lieu des sous-titres YouTube |
| `--demo`            | _off_  | Mode démo (source synthétique)                               |

Variables d'environnement :

- `COOKIES_FROM_BROWSER=firefox` — si YouTube te 403 (cas fréquent en cloud)
- `COOKIES=./cookies.txt` — fichier cookies exporté manuellement
- `WHISPER_MODEL=large-v3` — modèle whisper utilisé (défaut `medium` / `small`)

---

## 🧠 Comment ça marche

```
┌─────────────┐   ┌──────────────┐   ┌────────────────┐   ┌────────────┐   ┌──────────┐
│  yt-dlp     │ → │  transcribe  │ → │  highlights    │ → │  ffmpeg    │ → │ Remotion │
│  (source +  │   │  (SRT split  │   │  (heuristique  │   │  (cut +    │   │  (motion │
│   subs)     │   │   ou whisper)│   │   de viralité) │   │   9:16)    │   │  design) │
└─────────────┘   └──────────────┘   └────────────────┘   └────────────┘   └──────────┘
```

1. **Download** (`pipeline/download.ts`) — yt-dlp récupère la meilleure piste
   ≤ 1080p + les auto-captions (FR/EN) en SRT.
2. **Transcribe** (`pipeline/transcribe.ts`) — parse le SRT, divise les phrases
   en mots avec timestamps approximatifs ; fallback `whisper(x)` si demandé.
3. **Highlights** (`pipeline/highlights.ts`) — score chaque fenêtre `[start,end]`
   sur : densité de `? !`, phrases-clé virales (« le secret », « imagine »,
   « la vérité »…), ratio de mots emphatiques, densité de mots/sec. Choisit
   non-chevauchants par score descendant.
4. **Crop** (`pipeline/crop.ts`) — ffmpeg `scale -2:1920, crop=1080:1920:x:0`
   pour produire un 9:16 propre. Décale `x` via `--x=PX` si le sujet n'est
   pas au centre.
5. **Render** (`pipeline/render.ts`) — bundle Remotion, puis `renderMedia()`
   en boucle avec `inputProps` par clip.

---

## 🎨 Composants Remotion

| Composant            | Rôle                                                      |
| -------------------- | --------------------------------------------------------- |
| `TikTokClip`         | Composition racine 1080×1920                              |
| `BackgroundVideo`    | OffthreadVideo du clip 9:16 + vignette                    |
| `WordCaptions`       | Sous-titres mot-par-mot (spring snappy, couleur active)   |
| `HookTitle`          | Titre choc des 2.5 premières secondes                     |
| `EmojiBurst`         | Explosion d'emoji sur chaque mot emphatique               |
| `ZoomPunch`          | Wrapper qui scale subtilement à chaque punch              |
| `ProgressBar`        | Barre néon (cyan→jaune→rouge)                             |
| `BrandingBadge`      | Handle pulsé en haut-droite                               |
| `NeonFrame`          | Contour néon flickering                                   |
| `CalloutBox`         | (Disponible) Carte de stat/fact qui slide depuis la gauche|

Tout est dans `src/components/` — tu peux remixer librement.

---

## 🛠️ Étapes individuelles

Si tu veux lancer chaque étape à la main (debug, itération) :

```bash
npm run download -- "<url>"
npm run transcribe -- downloads/source.srt           # rapide, fallback
npm run transcribe -- downloads/source.mp4 --whisper # précis, lent
npm run highlights -- --min=90 --max=120
tsx pipeline/crop.ts --source=downloads/source.mp4
npm run render
```

Les artefacts intermédiaires (`data/words.json`, `data/highlights.json`,
`data/clips.json`) sont versionnables si tu veux figer un état.

---

## 🌐 YouTube bloqué (HTTP 403) ?

Les IPs cloud (GCP, AWS, Datacenter…) sont **massivement blacklistées** par
YouTube depuis 2024. Si yt-dlp te crache du 403 :

1. **Lance le pipeline en local** plutôt que dans un sandbox cloud.
2. Sinon, exporte tes cookies de navigateur :
   ```bash
   COOKIES_FROM_BROWSER=firefox npm run build -- "<url>"
   ```
3. Ou via extension « Get cookies.txt » :
   ```bash
   COOKIES=./cookies.txt npm run build -- "<url>"
   ```

---

## 📚 Références techniques

- [Remotion docs](https://www.remotion.dev/docs)
- [@remotion/captions](https://www.remotion.dev/docs/captions/create-tiktok-style-captions)
- [Template TikTok officiel](https://github.com/remotion-dev/template-tiktok)
- [WhisperX](https://github.com/m-bain/whisperx) — alignement word-level
- [yt-dlp](https://github.com/yt-dlp/yt-dlp)
- Pattern de cropping 9:16 inspiré de
  [AutoFlip](https://opensource.googleblog.com/2020/02/autoflip-open-source-framework-for.html)

---

## 📁 Arborescence

```
.
├── package.json
├── tsconfig.json
├── remotion.config.ts
├── src/
│   ├── index.ts              # registerRoot
│   ├── Root.tsx              # <Composition id="TikTokClip" .../>
│   ├── types.ts              # Zod schemas (Word, Highlight, ClipProps)
│   ├── compositions/
│   │   └── TikTokClip.tsx
│   ├── components/
│   │   ├── BackgroundVideo.tsx
│   │   ├── WordCaptions.tsx
│   │   ├── HookTitle.tsx
│   │   ├── EmojiBurst.tsx
│   │   ├── ZoomPunch.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── BrandingBadge.tsx
│   │   ├── NeonFrame.tsx
│   │   └── CalloutBox.tsx
│   └── utils/
│       ├── theme.ts          # couleurs / typo / dimensions
│       ├── words.ts          # split phrase→mots, scoring d'emphase
│       └── srt.ts            # parser SRT/VTT
├── pipeline/
│   ├── run.ts                # orchestrateur (entrée principale)
│   ├── download.ts
│   ├── transcribe.ts
│   ├── highlights.ts
│   ├── crop.ts
│   ├── render.ts
│   └── lib/
│       ├── ffmpeg.ts
│       └── heuristic.ts
├── public/                   # assets servis par Remotion (clips/, etc.)
├── downloads/                # source.mp4, source.srt (gitignored)
├── data/                     # words.json, highlights.json, clips.json
└── out/                      # MP4 finaux (gitignored)
```

---

## 📝 Licence

MIT — fais-en ce que tu veux. Crédite si tu publies un fork public 🙏
