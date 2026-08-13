# CLAUDE.md — Tamil PDF Digitization & Proofreading Project

## 📌 Project Overview
This repository automates the end-to-end digitization of Tamil PDF books. It extracts PDF pages, performs OCR (Tesseract), generates a review queue for low-confidence words/paragraphs, provides a web interface for manual proofreading with phonetic transliteration, and feeds human corrections back into the codebase to refine output text files and train the master vocabulary lexicon.

---

## 🛠️ Repository Structure & Key Files

| File / Folder | Description |
| :--- | :--- |
| `ocr_tamil_pdf.sh` | Bash script converting PDF pages into PNGs via `pdftoppm` and running parallel Tesseract OCR (`tam` language). |
| `update_lexicon.py` | Python engine managing `master_lexicon.json`, flagging OCR anomalies (`words_for_review.json`), and cascading `replacements.json` feedback across documents. |
| `index.html` | Web-based proofreading application UI. |
| `app.js` | Web app logic handling JSON data loading, UI rendering, offline English-to-Tamil phonetic transliteration, and export functions. |
| `output_texts/` | Directory storing generated plain text files extracted from OCR. |
| `master_lexicon.json` | Dynamic vocabulary lexicon tracking unique Tamil words and occurrence frequencies. |
| `words_for_review.json` | Auto-generated review queue of paragraphs containing flagged OCR errors or low-frequency words. |
| `replacements.json` | Exported human feedback file mapping original OCR errors to verified Tamil corrections. |
| `.github/workflows/ocr.yml` | GitHub Actions workflow automating batch OCR runs and lexicon updates. |

---

## 🚀 Common Workflow Commands

### 1. Extract PDF & Run Parallel OCR
Extracts pages and performs OCR on a input PDF file:
```bash
chmod +x ocr_tamil_pdf.sh
./ocr_tamil_pdf.sh input_pdfs/sample.pdf output_texts/sample.txt
