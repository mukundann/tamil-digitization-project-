name: Run Tamil PDF OCR

on:
  push:
    paths:
      - 'input_pdfs/**.pdf'
  workflow_dispatch: # Allows manual trigger from the GitHub UI

permissions:
  contents: write

jobs:
  ocr:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Install Dependencies
        run: |
          sudo apt-get update
          sudo apt-get install -y poppler-utils tesseract-ocr curl

      - name: Make Script Executable
        run: chmod +x ./ocr_tamil_pdf.sh

      - name: Process PDFs
        run: |
          mkdir -p output_texts
          for pdf in input_pdfs/*.pdf; do
            # Skip if no PDF matches
            [ -e "$pdf" ] || continue
            
            filename=$(basename "$pdf" .pdf)
            echo "Processing $pdf..."
            ./ocr_tamil_pdf.sh "$pdf" "output_texts/${filename}.txt"
          done

      - name: Commit and Push Output Text Files
        run: |
          git config --global user.name "github-actions[bot]"
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          
          git add output_texts/*.txt
          
          # Only commit if there are changed/new text files
          if ! git diff --staged --quiet; then
            git commit -m "Automated OCR text extraction [skip ci]"
            git push
          else
            echo "No new OCR outputs to commit."
          fi