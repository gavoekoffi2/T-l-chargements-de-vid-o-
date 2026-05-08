#!/usr/bin/env bash
# Usage:
#   ./download.sh <url> [output_dir]
#   ./download.sh "https://www.facebook.com/ads/library/?id=1476252494504954"
#
# Téléchargement d'une vidéo (Facebook Ads Library, FB, IG, YouTube, TikTok, etc.)
# via yt-dlp. Pour les pubs Facebook protégées, exporte tes cookies de navigateur
# (extension "Get cookies.txt") et passe le fichier via la variable COOKIES.
#
#   COOKIES=./cookies.txt ./download.sh "<url>"

set -euo pipefail

URL="${1:-}"
OUT_DIR="${2:-downloads}"

if [[ -z "${URL}" ]]; then
  echo "Usage: $0 <url> [output_dir]" >&2
  exit 1
fi

if ! command -v yt-dlp >/dev/null 2>&1; then
  echo "yt-dlp introuvable. Installation : pip install -U yt-dlp" >&2
  exit 127
fi

mkdir -p "${OUT_DIR}"

ARGS=(
  --no-check-certificates
  --concurrent-fragments 4
  --retries 5
  --fragment-retries 5
  --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
  -o "${OUT_DIR}/%(uploader)s-%(title).80s-%(id)s.%(ext)s"
)

if [[ -n "${COOKIES:-}" ]]; then
  ARGS+=(--cookies "${COOKIES}")
elif [[ -n "${COOKIES_FROM_BROWSER:-}" ]]; then
  ARGS+=(--cookies-from-browser "${COOKIES_FROM_BROWSER}")
fi

exec yt-dlp "${ARGS[@]}" "${URL}"
