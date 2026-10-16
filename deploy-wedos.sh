#!/usr/bin/env bash
# Deploy statického webu webdesignhub na Wedos webhosting přes FTP(S).
# Nahraje POUZE verzované soubory (git ls-files) kromě README.md a tohoto skriptu.
# => index.html, varianty.html, assets/**  (NE .git, NE reference.html, NE README.md)
#
# Použití:
#   1) zkopíruj deploy-wedos.env.example -> deploy-wedos.env a vyplň údaje
#   2) bash deploy-wedos.sh            (běžný deploy)
#      bash deploy-wedos.sh --dry-run  (jen vypíše, co by nahrál)
set -euo pipefail

cd "$(dirname "$0")"

ENV_FILE="deploy-wedos.env"
[ -f "$ENV_FILE" ] || { echo "CHYBA: chybí $ENV_FILE (zkopíruj z deploy-wedos.env.example a vyplň)"; exit 1; }
# shellcheck disable=SC1090
source "$ENV_FILE"

: "${WEDOS_FTP_HOST:?nastav WEDOS_FTP_HOST v $ENV_FILE}"
: "${WEDOS_FTP_USER:?nastav WEDOS_FTP_USER v $ENV_FILE}"
: "${WEDOS_FTP_PASS:?nastav WEDOS_FTP_PASS v $ENV_FILE}"
WEDOS_FTP_DIR="${WEDOS_FTP_DIR:-/}"          # vzdálený docroot (viz komentář v .env)
WEDOS_FTP_TLS="${WEDOS_FTP_TLS:-1}"          # 1 = vynutit FTPS (explicit TLS)
WEDOS_FTP_INSECURE="${WEDOS_FTP_INSECURE:-0}" # 1 = neověřovat TLS certifikát (nouzově)

DRY_RUN=0
[ "${1:-}" = "--dry-run" ] && DRY_RUN=1

# normalizace vzdálené cesty na tvar "/dir/" nebo "/"
case "$WEDOS_FTP_DIR" in
  "") WEDOS_FTP_DIR="/";;
esac
[ "${WEDOS_FTP_DIR#/}" = "$WEDOS_FTP_DIR" ] && WEDOS_FTP_DIR="/$WEDOS_FTP_DIR"
[ "${WEDOS_FTP_DIR%/}" = "$WEDOS_FTP_DIR" ] && WEDOS_FTP_DIR="$WEDOS_FTP_DIR/"

CURL_OPTS=(--fail --show-error --silent --ftp-create-dirs --disable-epsv)
[ "$WEDOS_FTP_TLS" = "1" ] && CURL_OPTS+=(--ssl-reqd)
[ "$WEDOS_FTP_INSECURE" = "1" ] && CURL_OPTS+=(-k)

# seznam souborů k nahrání: verzované soubory kromě README.md a deploy artefaktů
mapfile -t FILES < <(git ls-files | grep -vE '^(README\.md|deploy-wedos\.(sh|env|env\.example))$')

# --- automatický cache-busting: verze assetů = krátký hash jejich obsahu ---
# V index.html je placeholder "?v=auto"; při deployi ho nahradíme hashem obsahu,
# takže prohlížeče stáhnou CSS/JS znovu jen tehdy, když se soubor opravdu změní.
hash8() {
  if command -v md5sum >/dev/null 2>&1; then md5sum "$1" | cut -c1-8
  else git hash-object "$1" | cut -c1-8; fi
}
CSS_V="$(hash8 assets/style.css)"
JS_V="$(hash8 assets/main.js)"
[ -n "$CSS_V" ] && [ -n "$JS_V" ] || { echo "CHYBA: nepodařilo se spočítat hash assetů"; exit 1; }
echo "Cache-bust verze: style.css?v=${CSS_V}  main.js?v=${JS_V}"

# dočasný index.html s dosazenými verzemi (zdroj s ?v=auto necháváme beze změny)
TMP_INDEX="$(mktemp)"
trap 'rm -f "$TMP_INDEX"' EXIT
sed -E \
  -e "s#(assets/style\.css\?v=)[^\"']*#\1${CSS_V}#g" \
  -e "s#(assets/main\.js\?v=)[^\"']*#\1${JS_V}#g" \
  index.html > "$TMP_INDEX"

echo "Cíl:   ftp://${WEDOS_FTP_HOST}${WEDOS_FTP_DIR}  (uživatel: ${WEDOS_FTP_USER}, TLS=${WEDOS_FTP_TLS})"
echo "Soubory k nahrání: ${#FILES[@]}"

for f in "${FILES[@]}"; do
  remote="ftp://${WEDOS_FTP_HOST}${WEDOS_FTP_DIR}${f}"
  # index.html nahrajeme z dočasné verze s dosazenými hash-verzemi assetů
  src="$f"
  [ "$f" = "index.html" ] && src="$TMP_INDEX"
  if [ "$DRY_RUN" = "1" ]; then
    echo "  [dry] $f  ->  $remote"
    [ "$f" = "index.html" ] && echo "        └ index.html s verzemi: style.css?v=${CSS_V}, main.js?v=${JS_V}"
    continue
  fi
  printf '  ↑ %s\n' "$f"
  curl "${CURL_OPTS[@]}" --user "${WEDOS_FTP_USER}:${WEDOS_FTP_PASS}" -T "$src" "$remote"
done

echo "Hotovo."
