#!/bin/sh
# Copies @huggingface/transformers vendor files to public/hf/ for client-side loading.
# Meteor's bundler can't handle ESM-only packages with import.meta, so we serve them
# as static files and load via <script type="module">.

HF_DIST="node_modules/@huggingface/transformers/dist"
ORT_DIST="node_modules/onnxruntime-web/dist"
TARGET="public/hf"

if [ ! -d "$HF_DIST" ]; then
  echo "skip: @huggingface/transformers not installed"
  exit 0
fi

mkdir -p "$TARGET"
cp "$HF_DIST/transformers.min.js" "$TARGET/" 2>/dev/null
cp "$HF_DIST/ort-wasm-simd-threaded.jsep.wasm" "$TARGET/" 2>/dev/null
cp "$ORT_DIST/ort-wasm-simd-threaded.jsep.mjs" "$TARGET/" 2>/dev/null

echo "hf vendor files copied to $TARGET"
