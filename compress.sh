#!/bin/bash
# Compress all website images using sips (macOS built-in)
# Resizes to max 1500px on longest side, sets JPEG quality to 82

BASE="/Users/harshita/Code Folder/Portfolio Website"
MAX_PX=1500
JPEG_Q=82

FOLDERS=(
  "Gulaal"
  "Moschino"
  "Project Asli"
  "acne studios"
  "elements/portraits"
  "elements/posterfolio"
  "loewe"
  "posterfolio"
  "product"
)

echo "── SIZE BEFORE ─────────────────────────────"
for f in "${FOLDERS[@]}"; do du -sh "$BASE/$f" 2>/dev/null; done
echo ""

total=0
for folder in "${FOLDERS[@]}"; do
  dir="$BASE/$folder"
  [ -d "$dir" ] || continue

  # JPEGs — resize + quality
  while IFS= read -r -d '' img; do
    sips -Z $MAX_PX --setProperty formatOptions $JPEG_Q "$img" > /dev/null 2>&1
    echo "✓ JPEG  $img"
    ((total++))
  done < <(find "$dir" -type f \( -iname "*.jpg" -o -iname "*.jpeg" \) -print0)

  # PNGs — resize only (PNG is lossless, resizing is the main win)
  while IFS= read -r -d '' img; do
    sips -Z $MAX_PX "$img" > /dev/null 2>&1
    echo "✓ PNG   $img"
    ((total++))
  done < <(find "$dir" -type f -iname "*.png" -print0)

done

echo ""
echo "── SIZE AFTER ──────────────────────────────"
for f in "${FOLDERS[@]}"; do du -sh "$BASE/$f" 2>/dev/null; done
echo ""
echo "Done — $total images processed."
