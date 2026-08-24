#!/bin/bash
set -euo pipefail

BOOKLIST="input_pdfs/booklist.txt"
OUTPUT_DIR="output_texts"

mkdir -p "$OUTPUT_DIR"

if [[ ! -f "$BOOKLIST" ]]; then
    echo "No booklist file found at $BOOKLIST."
    exit 0
fi

while IFS= read -r line || [ -n "$line" ]; do
    # Remove carriage returns and leading/trailing whitespace
    line=$(echo "$line" | tr -d '\r' | xargs)
    
    # Skip empty lines or comments
    [[ -z "$line" || "$line" =~ ^# ]] && continue

    # Split OCR_TEXT_URL and PDF_URL by pipe delimiter
    OCR_URL=$(echo "$line" | cut -d'|' -f1 | xargs)
    PDF_URL=$(echo "$line" | cut -d'|' -f2 | xargs)

    if [[ -z "$PDF_URL" ]]; then
        echo "⚠️ Skipping line without PDF URL: $line"
        continue
    fi

    # Derive base filename from PDF URL
    BASE_NAME=$(basename "${PDF_URL%%\?*}" .pdf)
    TXT_OUTPUT="${OUTPUT_DIR}/${BASE_NAME}.txt"
    IMG_DIR="${OUTPUT_DIR}/${BASE_NAME}_images"

    mkdir -p "$IMG_DIR"

    echo "=========================================="
    echo "Processing: $BASE_NAME"
    echo "=========================================="

    # 1. Download PDF & Convert to PNG Page Images
    PDF_TEMP="$(mktemp --suffix=.pdf)"
    echo "📥 Downloading PDF..."
    curl -sSL -o "$PDF_TEMP" "$PDF_URL"

    # Convert PDF to PNG images for side-by-side editing if images don't exist yet
    if [[ -z $(ls -A "$IMG_DIR" 2>/dev/null) ]]; then
        echo "🖼️ Converting PDF to PNG images for side-by-side web editor..."
        pdftoppm -png -r 150 "$PDF_TEMP" "$IMG_DIR/page"
    fi

    # 2. Text Extraction Strategy
    if [[ -n "$OCR_URL" ]]; then
        echo "⚡ Existing OCR Text URL found. Downloading text directly (Skipping Tesseract)..."
        curl -sSL -o "$TXT_OUTPUT" "$OCR_URL"
    else
        if [[ -f "$TXT_OUTPUT" ]]; then
            echo " Skipping Tesseract: Output text $TXT_OUTPUT already exists."
        else
            echo "🤖 Running Tesseract OCR on downloaded PDF..."
            ./ocr_tamil_pdf.sh "$PDF_TEMP" "$TXT_OUTPUT"
        fi
    fi

    rm -f "$PDF_TEMP"

done < "$BOOKLIST"

echo "✅ Booklist processing complete."