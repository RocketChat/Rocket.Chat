cd apps/meteor &&
ROOT_URL=http://localhost:3000/ npx vite build &&
cd ../.. &&

# Only run meteor build if server sources are newer than marker or marker doesn't exist
MARKER="build/.meteor-build-marker"
needs_rebuild() {
  [ ! -f "$MARKER" ] && return 0
  find apps/meteor/server apps/meteor/packages apps/meteor/ee apps/meteor/lib apps/meteor/imports \
    -newer "$MARKER" -type f \( -name '*.ts' -o -name '*.js' -o -name '*.json' \) \
    2>/dev/null | grep -q .
}

if needs_rebuild; then
  cd apps/meteor && meteor build --server-only --directory ../../build && cd ../.. &&
  touch "$MARKER"
fi &&

docker compose -f docker-compose-vite.yml up --build