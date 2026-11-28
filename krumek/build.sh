#!/bin/sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$ROOT_DIR"

rm -rf dist
mkdir -p dist

cp index.html dist/index.html
cp _headers dist/_headers
cp -R assets dist/assets
cp -R admin dist/admin

# Only API routes invoke Pages Functions; public static files are served as assets.
printf '%s\n' '{"version":1,"include":["/api/*"],"exclude":[]}' > dist/_routes.json

echo "Build complete: dist/"
