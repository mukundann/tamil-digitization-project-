#!/usr/bin/env python3
import os
import re
import json
import glob

MASTER_LEXICON_FILE = "master_lexicon.json"
FLAGGED_OUTPUT = "words_for_review.json"
REPLACEMENTS_FILE = "replacements.json"
OUTPUT_TEXTS_DIR = "output_texts"

# Patterns indicating OCR glitches / suspicious characters
ANOMALY_PATTERNS = [
    r'\.',           # Misplaced dots inside words
    r'\d',           # Digits merged into words
    r'[A-Za-z]',     # English characters mixed in Tamil
    r'[\=\+\*\/\<\>]', # Math/special symbols
    r'(.)\1{2,}',    # Repeated characters 3+ times
]

def load_validated_corrections():
    """Load previously reviewed & validated words from replacements.json."""
    if os.path.exists(REPLACEMENTS_FILE):
        try:
            with open(REPLACEMENTS_FILE, 'r', encoding='utf-8') as f:
                return set(json.load(f).keys())
        except Exception:
            return set()
    return set()

def is_suspicious(word):
    for pattern in ANOMALY_PATTERNS:
        if re.search(pattern, word):
            return True
    return False

def split_into_paragraphs(text):
    """Split text by double line breaks or page breaks."""
    raw_paras = re.split(r'\n\s*\n|--- Page Break ---', text)
    paragraphs = []
    for p in raw_paras:
        clean_p = ' '.join(p.split()) # Normalize whitespace inside paragraph
        if clean_p:
            paragraphs.append(clean_p)
    return paragraphs

def process_ocr_outputs():
    validated_words = load_validated_corrections()
    
    master_lexicon = {}
    if os.path.exists(MASTER_LEXICON_FILE):
        try:
            with open(MASTER_LEXICON_FILE, 'r', encoding='utf-8') as f:
                master_lexicon = json.load(f)
        except Exception:
            master_lexicon = {}

    flagged_entries = []
    seen_words = set()

    for file_path in glob.glob(os.path.join(OUTPUT_TEXTS_DIR, "*.txt")):
        filename = os.path.basename(file_path)
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        paragraphs = split_into_paragraphs(content)

        for paragraph in paragraphs:
            # Tokenize paragraph into clean words
            words = re.findall(r'[\u0B80-\u0BFF\w\.]+', paragraph)
            for w in words:
                clean_w = w.strip('.,;:"\'()[]{}')
                if not clean_w:
                    continue

                master_lexicon[clean_w] = master_lexicon.get(clean_w, 0) + 1

                # Flag condition:
                # 1. Matches suspicious pattern OR is rare (< 2 occurrences)
                # 2. Has NOT been previously validated in replacements.json
                if (is_suspicious(clean_w) or master_lexicon[clean_w] < 2):
                    if clean_w not in validated_words and clean_w not in seen_words:
                        seen_words.add(clean_w)
                        
                        # Wrap word with <mark> inside paragraph for visual context
                        highlighted_paragraph = re.sub(
                            r'\b' + re.escape(clean_w) + r'\b',
                            f'<mark class="highlight">{clean_w}</mark>',
                            paragraph,
                            count=1
                        )
                        
                        flagged_entries.append({
                            "word": clean_w,
                            "paragraph": highlighted_paragraph,
                            "raw_paragraph": paragraph,
                            "file": filename
                        })

    # Save updated master lexicon
    with open(MASTER_LEXICON_FILE, 'w', encoding='utf-8') as f:
        json.dump(master_lexicon, f, ensure_ascii=False, indent=2)

    # Save flagged entries with full paragraph context
    with open(FLAGGED_OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(flagged_entries, f, ensure_ascii=False, indent=2)

    print(f"Updated {MASTER_LEXICON_FILE} and generated {FLAGGED_OUTPUT} ({len(flagged_entries)} items).")

if __name__ == "__main__":
    process_ocr_outputs()