#!/bin/bash
#
# ocr_tamil_pdf.sh - OCR processing for Tamil & Manipravalam Vyakhyanam Books
#
# Usage:
#   ./ocr_tamil_pdf.sh <pdf_path_or_url> output.txt [page_range]
#
set -euo pipefail

INPUT_ARG="${1:?Usage: $0 <pdf_path_or_url> output.txt [page_range]}"
OUTPUT_TXT="${2:?Usage: $0 <pdf_path_or_url> output.txt [page_range]}"
PAGE_RANGE="${3:-}"

# 300 DPI handles small commentary fonts and Grantha ligatures
DPI=300
# PSM 6 treats each page as a single uniform block of text
PSM=6

WORKDIR="$(mktemp -d)"
PAGES_DIR="$WORKDIR/pages"
OCR_DIR="$WORKDIR/ocr"
mkdir -p "$PAGES_DIR" "$OCR_DIR"

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

# Step 2: Run Tesseract using combined Tamil + Sanskrit language models
for page in "$PAGES_DIR"/page-*.png; do
    [[ -f "$page" ]] || continue
    base_name=$(basename "$page" .png)
    tesseract "$page" "$OCR_DIR/$base_name" -l tam+san --psm "$PSM" >/dev/null 2>&1 &
done
wait

# Step 3: Clean text outputs via Python script and concatenate in order
> "$OUTPUT_TXT"
for txt in $(ls "$OCR_DIR"/page-*.txt | sort -V); do
    python3 clean_text.py "$txt" "$WORKDIR/cleaned_temp.txt"
    cat "$WORKDIR/cleaned_temp.txt" >> "$OUTPUT_TXT"
    echo -e "\n\n--- Page Break ---\n" >> "$OUTPUT_TXT"
done