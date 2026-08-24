### File 2: `README.md`
Save this file in the root directory as `README.md`.

```markdown
# Tamil Digitization & OCR Proofreading Suite

[![Tamil OCR Automation](https://github.com/OWNER/REPOSITORY/actions/workflows/ocr.yml/badge.svg)](https://github.com/OWNER/REPOSITORY/actions)

An automated toolchain for digitizing old Tamil and Manipravalam books, featuring a GitHub Actions OCR processing pipeline, a side-by-side web proofreading environment, and an active dictionary feedback loop.

---

## 📁 Repository Directory Structure

```text
├── .github/
│   └── workflows/
│       └── convert.yml             # GitHub Actions batch OCR automation
├── input_pdfs/
│   └── book_links.txt           # Input file with PDF URLs and page ranges
├── output_texts/                # Generated OCR text outputs
├── clean_text.py                # Post-processing OCR cleaning script
├── ocr_tamil_pdf.sh             # Core page extraction & Tesseract script
├── tam.user-words               # Custom Tesseract dictionary (updated via feedback)
├── update_lexicon.py            # Lexicon auditor and feedback loop engine
├── index.html                   # Side-by-side web editor layout
├── app.js                       # Frontend logic, keyboard & transliteration
├── master_lexicon.json          # Master cumulative word dictionary
└── PRODUCT.md                   # Detailed architecture specifications