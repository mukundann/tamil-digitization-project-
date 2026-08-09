#!/bin/bash
#
# ocr_tamil_pdf.sh - Convert a Tamil PDF (or URL) into a plain text file using OCR
#
# Requirements (Debian/Ubuntu):
#   sudo apt-get install -y poppler-utils tesseract-ocr curl
#
# Usage:
#   ./ocr_tamil_pdf.sh <input_pdf_path_or_url> output.txt [page_range]
#   Example full:   ./ocr_tamil_pdf.sh input.pdf output.txt
#   Example range:  ./ocr_tamil_pdf.sh input.pdf output.txt 1-10
#
set -euo pipefail

INPUT_ARG="${1:?Usage: $0 <pdf_path_or_url> output.txt [page_range]}"
OUTPUT_TXT="${2:?Usage: $0 <pdf_path_or_url> output.txt [page_range]}"
PAGE_RANGE="${3:-}" # Optional: e.g., "1-10"

DPI=150
PSM=4  # page segmentation mode; 4 = single column of variable-size text

WORKDIR="$(mktemp -d)"
PAGES_DIR="$WORKDIR/pages"
OCR_DIR="$WORKDIR/ocr"
TESSDATA_DIR="$WORKDIR/tessdata"
mkdir -p "$PAGES_DIR" "$OCR_DIR" "$TESSDATA_DIR"

# Cleanup temporary working directory on exit
cleanup() {
    rm -rf "$WORKDIR"
}
trap cleanup EXIT

# Download PDF if input argument is a URL
if [[ "$INPUT_ARG" =~ ^https?:// ]]; then
    echo "Downloading PDF from URL..."
    INPUT_PDF="$WORKDIR/downloaded.pdf"
    curl -sSL -o "$INPUT_PDF" "$INPUT_ARG"
else
    INPUT_PDF="$INPUT_ARG"
fi

# Download Tamil tesseract language data if not present
TAMIL_TRAINEDDATA="$TESSDATA_DIR/tam.traineddata"
if [[ ! -f "$TAMIL_TRAINEDDATA" ]]; then
    echo "Downloading Tamil language pack (tam.traineddata)..."
    curl -sSL -o "$TAMIL_TRAINEDDATA" "https://github.com/tesseract-ocr/tessdata_fast/raw/main/tam.traineddata"
fi

# Step 1: Render PDF pages to PNG images (handling optional page range)
if [[ -n "$PAGE_RANGE" ]]; then
    START_PAGE="${PAGE_RANGE%-*}"
    END_PAGE="${PAGE_RANGE#*-}"
    echo "Rendering pages $START_PAGE to $END_PAGE of PDF to PNG..."
    pdftoppm -png -r "$DPI" -f "$START_PAGE" -l "$END_PAGE" "$INPUT_PDF" "$PAGES_DIR/page"
else
    echo "Rendering all pages of PDF to PNG..."
    pdftoppm -png -r "$DPI" "$INPUT_PDF" "$PAGES_DIR/page"
fi

# Step 2: Run Tesseract OCR on each page image
echo "Running OCR on extracted pages..."
for page in "$PAGES_DIR"/page-*.png; do
    [[ -f "$page" ]] || continue
    base_name=$(basename "$page" .png)
    tesseract "$page" "$OCR_DIR/$base_name" \
        --tessdata-dir "$TESSDATA_DIR" \
        -l tam \
        --psm "$PSM" >/dev/null 2>&1 &
done
wait

# Step 3: Concatenate OCR output files in page order
echo "Merging OCR text output..."
> "$OUTPUT_TXT"
for txt in $(ls "$OCR_DIR"/page-*.txt | sort -V); do
    cat "$txt" >> "$OUTPUT_TXT"
    echo -e "\n\n--- Page Break ---\n" >> "$OUTPUT_TXT"
done

echo "OCR complete. Output saved to: $OUTPUT_TXT"
