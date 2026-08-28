#!/bin/bash
#
# ocr_tamil_pdf.sh - OCR processing for Tamil & Sanskrit Books
#
# Usage:
#   ./ocr_tamil_pdf.sh <pdf_path_or_url> <book_id> [page_range]
#
set -euo pipefail

INPUT_ARG="${1:?Usage: $0 <pdf_path_or_url> <book_id> [page_range]}"
BOOK_ID="${2:?Usage: $0 <pdf_path_or_url> <book_id> [page_range]}"
PAGE_RANGE="${3:-}"

DPI=300
PSM=6

WORKDIR="$(mktemp -d)"
PAGES_DIR="$WORKDIR/pages"
OCR_DIR="$WORKDIR/ocr"

# Define modular directory structure for output texts and images
BOOK_OUTPUT_DIR="output_texts/${BOOK_ID}"
IMAGES_DIR="${BOOK_OUTPUT_DIR}/images"
OUTPUT_TXT="${BOOK_OUTPUT_DIR}/${BOOK_ID}.txt"

mkdir -p "$PAGES_DIR" "$OCR_DIR" "$IMAGES_DIR"

cleanup() {
    rm -rf "$WORKDIR"
}
trap cleanup EXIT

# Download PDF if input is a URL
if [[ "$INPUT_ARG" =~ ^https?:// ]]; then
    INPUT_PDF="$WORKDIR/downloaded.pdf"
    curl -sSL -o "$INPUT_PDF" "$INPUT_ARG"
else
    INPUT_PDF="$INPUT_ARG"
fi

# Step 1: Render PDF pages to PNG images
if [[ -n "$PAGE_RANGE" ]]; then
    START_PAGE="${PAGE_RANGE%-*}"
    END_PAGE="${PAGE_RANGE#*-}"
    pdftoppm -png -r "$DPI" -f "$START_PAGE" -l "$END_PAGE" "$INPUT_PDF" "$PAGES_DIR/page"
else
    pdftoppm -png -r "$DPI" "$INPUT_PDF" "$PAGES_DIR/page"
fi

# Save rendered images inside output_texts/<book_id>/images/
cp "$PAGES_DIR"/page-*.png "$IMAGES_DIR"/ 2>/dev/null || true

# Step 2: Run Tesseract using combined Tamil + Sanskrit language models
for page in "$PAGES_DIR"/page-*.png; do
    [[ -f "$page" ]] || continue
    base_name=$(basename "$page" .png)
    tesseract "$page" "$OCR_DIR/$base_name" -l tam+san --psm "$PSM" >/dev/null 2>&1 &
done
wait

# Step 3: Clean text outputs via Python script and concatenate into final book file
> "$OUTPUT_TXT"
for txt in $(ls "$OCR_DIR"/page-*.txt | sort -V); do
    base_page=$(basename "$txt" .txt)
    python3 clean_text.py "$txt" "$WORKDIR/cleaned_temp.txt"
    echo "[[IMAGE:output_texts/${BOOK_ID}/images/${base_page}.png]]" >> "$OUTPUT_TXT"
    cat "$WORKDIR/cleaned_temp.txt" >> "$OUTPUT_TXT"
    echo -e "\n\n--- Page Break ---\n" >> "$OUTPUT_TXT"
done