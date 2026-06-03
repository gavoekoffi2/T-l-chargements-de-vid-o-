#!/usr/bin/env bash
# ============================================================
#  install.sh — Montage Viral Skill pour Claude Code
#  Usage : bash install.sh
#  Résultat : skill installé dans ~/.claude/skills/montage-viral/
# ============================================================
set -e

SKILL_DIR="$HOME/.claude/skills/montage-viral"
SCRIPTS_DIR="$SKILL_DIR/scripts"

echo "=== Installation du skill montage-viral ==="
mkdir -p "$SCRIPTS_DIR"

# Copier SKILL.md et scripts
REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
cp "$REPO_DIR/SKILL.md"          "$SKILL_DIR/SKILL.md"
cp "$REPO_DIR/scripts/"*.py      "$SCRIPTS_DIR/"
echo "  ✓ SKILL.md et scripts copiés"

# Vérifier / installer les dépendances Python
echo "  Vérification des dépendances Python..."
python3 -c "import PIL" 2>/dev/null    || pip3 install -q Pillow
python3 -c "import numpy" 2>/dev/null  || pip3 install -q numpy
echo "  ✓ Pillow, numpy OK"

# Vérifier ffmpeg
if ! command -v ffmpeg &>/dev/null; then
  echo "  ⚠ ffmpeg non trouvé. Installe-le ou télécharge le build statique :"
  echo "    https://johnvansickle.com/ffmpeg/"
else
  echo "  ✓ ffmpeg $(ffmpeg -version 2>&1 | head -1 | awk '{print $3}')"
fi

# Vérifier les clés API dans ~/.claude/skills/video-use/.env
ENV_FILE="$HOME/.claude/skills/video-use/.env"
if [ ! -f "$ENV_FILE" ]; then
  mkdir -p "$(dirname "$ENV_FILE")"
  cat > "$ENV_FILE" << 'ENVEOF'
ELEVENLABS_API_KEY=REMPLACE_PAR_TA_CLE
OPENROUTER_API_KEY=REMPLACE_PAR_TA_CLE
ENVEOF
  echo "  ⚠ Fichier .env créé dans ~/.claude/skills/video-use/.env"
  echo "    → Remplis ELEVENLABS_API_KEY et OPENROUTER_API_KEY"
else
  echo "  ✓ .env déjà présent"
fi

echo ""
echo "=== Installation terminée ! ==="
echo "Le skill 'montage-viral' est disponible dans Claude Code."
echo "Utilise : /montage-viral  ou demande un 'montage professionnel'"
