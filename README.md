# Téléchargements de vidéos

Petit utilitaire pour télécharger une vidéo (Facebook Ads Library, Facebook, Instagram, YouTube, TikTok…) via [`yt-dlp`](https://github.com/yt-dlp/yt-dlp).

## Pré-requis

```bash
pip install -U yt-dlp
# (recommandé) pour fusionner audio+vidéo sur YouTube
sudo apt-get install -y ffmpeg
```

## Utilisation rapide

```bash
./download.sh "https://www.facebook.com/ads/library/?id=1476252494504954"
```

Les fichiers atterrissent dans `downloads/`.

## Pubs Facebook (Ads Library) protégées

L'Ads Library renvoie souvent **HTTP 403** sans session authentifiée. Deux options :

**Option A — Cookies du navigateur (le plus simple)**

```bash
COOKIES_FROM_BROWSER=firefox ./download.sh "<url>"
# ou: chrome, brave, edge, safari, chromium…
```

**Option B — Fichier cookies exporté**

Avec une extension type *Get cookies.txt*, exporte les cookies pour `facebook.com`, puis :

```bash
COOKIES=./cookies.txt ./download.sh "<url>"
```

## Astuce si l'URL Ads Library échoue

L'URL `…/ads/library/?id=…` est une page d'aperçu. Si yt-dlp n'arrive pas à extraire le média :

1. Ouvre la page dans le navigateur, lance la lecture.
2. DevTools → onglet **Network** → filtre `mp4`.
3. Copie l'URL `.mp4` réelle et passe-la au script.
