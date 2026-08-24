#!/usr/bin/env python3
import os
import re
import json
import glob

MASTER_LEXICON_FILE = "master_lexicon.json"
FLAGGED_OUTPUT = "words_for_review.json"
REPLACEMENTS_FILE = "replacements.json"
OUTPUT_TEXTS_DIR = "output_texts"

ANOMALY_PATTERNS = [
    r'\.',
    r'\d',
    r'[A-Za-z]',
    r'[\=\+\*\/\<\>]',
    r'(.)\1{2,}',
]

def load_validated_corrections():
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
    raw_paras = re.split(r'\n\s*\n|--- Page Break ---', text)
    paragraphs = []
    for p in raw_paras:
        clean_p = ' '.join(p.split())
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

        # Extract associated page image if marker present
        img_match = re.search(r'\[\[IMAGE:(.*?)\]\]', content)
        image_url = img_match.group(1) if img_match else ""

        paragraphs = split_into_paragraphs(content)

        for paragraph in paragraphs:
            clean_para = re.sub(r'\[\[IMAGE:.*?\]\]', '', paragraph).strip()
            if not clean_para:
                continue

            words = re.findall(r'[\u0B80-\u0BFF\w\.]+', clean_para)
            for w in words:
                clean_w = w.strip('.,;:"\'()[]{}')
                if not clean_w:
                    continue

                master_lexicon[clean_w] = master_lexicon.get(clean_w, 0) + 1

                if (is_suspicious(clean_w) or master_lexicon[clean_w] < 2):
                    if clean_w not in validated_words and clean_w not in seen_words:
                        seen_words.add(clean_w)
                        
                        flagged_entries.append({
                            "word": clean_w,
                            "paragraph": clean_para,
                            "raw_paragraph": clean_para,
                            "file": filename,
                            "image_url": image_url
                        })

    with open(MASTER_LEXICON_FILE, 'w', encoding='utf-8') as f:
        json.dump(master_lexicon, f, ensure_ascii=False, indent=2)

    with open(FLAGGED_OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(flagged_entries, f, ensure_ascii=False, indent=2)

    print(f"Updated {MASTER_LEXICON_FILE} and generated {FLAGGED_OUTPUT} ({len(flagged_entries)} items).")

if __name__ == "__main__":
    process_ocr_outputs()