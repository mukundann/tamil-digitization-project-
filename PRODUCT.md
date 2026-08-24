# PRODUCT.md — Tamil OCR & Proofreading Platform

## 📌 Executive Summary
The **Tamil Digitization & Proofreading Suite** is an automated, self-improving platform designed to convert scanned historical Tamil and Manipravalam literature into verified digital text. It features an automated GitHub Actions OCR pipeline, a side-by-side web editor with live transliteration and virtual keyboard tools, and an active feedback engine that feeds corrected vocabulary directly back into the OCR model.

---

## 🎯 Target Audience & Core Value Proposition
* **Target Audience:** Digital humanities scholars, Tamil literature researchers, archivists, and open-source contributors.
* **Core Value Proposition:** Solves character misreads in old Tamil typography by bridging high-throughput automated OCR extraction with an easy, split-screen human proofreading interface. Every edit made by a user feeds directly into a custom word database to continuously improve subsequent OCR passes.

---

## 🏗️ System Architecture & Workflow Pipeline

```text
[ Scanned PDF / Links ] ──► [ GitHub Actions Pipeline ]
                                        │
                                        ├──► Page-by-Page Splitting (pdftoppm)
                                        └──► Dual Engine OCR (Tesseract -l tam+san)
                                                │
                                                ▼
                                    [ Raw Output Texts & Page PNGs ]
                                                │
                                                ▼
                                    [ Split-Screen Web Editor ]
                             (Side-by-Side: Page Image vs. Text)
                             (Phonetic Typing + On-Screen Keyboard)
                                                │
                                                ▼
                                   [ Feedback / Lexicon Engine ]
                            (Tracks corrected words into database)
                                                │
                                                ▼
                                  [ Self-Improving Tamil Lexicon ]
                         (Updates tam.user-words for future OCR runs)


🔥 Key Product Features
1. Page-by-Page Automated GitHub Actions OCR
Incremental Processing: Extracts and OCRs PDF pages individually using pdftoppm and Tesseract OCR (-l tam+san).

Batching & Quota Handling: Limits workflow execution to manageable page chunks (e.g., 30 pages per run) to prevent job timeouts on large books.

2. Side-by-Side Split View Web Editor (index.html + app.js)
Page-Level Visual Alignment: Displays the original scanned document page (PNG) on the left panel and the editable extracted text on the right panel.

English-to-Tamil Phonetic Transliteration: Real-time English typing converts directly into Tamil script upon hitting Space or Enter (e.g., vanakkam ➔ வணக்கம்).

Virtual Tamil Keyboard: Provides a full on-screen keyboard with vowels, consonants, Grantha characters, and diacritics for direct click insertions.

3. Word Correction Database & Closed-Loop Feedback
Correction Tracking: Saves word-level and paragraph-level human edits into replacements.json.

Lexicon Propagation: Updates master_lexicon.json and appends newly verified words into tam.user-words.

Model Feedback: Tesseract automatically includes updated custom user dictionaries (tam.user-words) in subsequent runs to eliminate repetitive misreads.

Component,Technology
CI/CD & Processing,"GitHub Actions, Shell Scripting, Python 3"
OCR Engines,"Tesseract OCR (tam, san), poppler-utils (pdftoppm)"
Web Frontend,"HTML5, CSS3, ES6 JavaScript (Native Browser / Client-Side)"
Data Formats,"JSON (replacements.json, master_lexicon.json), Plain Text (.txt)"