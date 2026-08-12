import os
import re
import json
import glob
from collections import Counter

# File paths
LEXICON_DB = "master_lexicon.json"
FLAGGED_OUTPUT = "words_for_review.txt"
OUTPUT_TEXTS_DIR = "output_texts"

# Common OCR noise patterns for Tamil & Grantha scans
FLAG_PATTERNS = [
    r'\.',               # Unexpected periods inside words
    r'இரு(?=[பநாவிவ])',   # Dropped 'திரு' prefix (e.g., 'இருநாங்கூர்' instead of 'திருநாங்கூர்')
    r'க(?=திர|த்ர)',      # 'க' misread for nasal 'ந்' (e.g., 'மக்திர' instead of 'மந்திர')
    r'[ஸஶ][ரீ]',          # Non-standard Grantha 'ஸ்ரீ' glyph variations
    r'[\u0B80-\u0BFF]\d', # Numbers accidentally attached to Tamil letters
    r'^[^\u0B80-\u0BFF]+$', # Non-Tamil string fragments mixed into text
]

def load_master_lexicon():
    if os.path.exists(LEXICON_DB):
        with open(LEXICON_DB, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def save_master_lexicon(lexicon):
    with open(LEXICON_DB, 'w', encoding='utf-8') as f:
        json.dump(lexicon, f, ensure_ascii=False, indent=2)

def extract_tamil_words(text):
    # Match sequences of Tamil Unicode characters (\u0B80-\u0BFF) and periods
    tokens = re.findall(r'[\u0B80-\u0BFF\.]+', text)
    cleaned = []
    for token in tokens:
        word = token.strip('.')
        if word:
            cleaned.append(word)
    return cleaned

def is_flagged(word):
    return any(re.search(pat, word) for pat in FLAG_PATTERNS)

def process_ocr_outputs():
    lexicon = load_master_lexicon()
    new_words_count = 0
    flagged_words = set()

    # Process all generated text files in output_texts/
    text_files = glob.glob(os.path.join(OUTPUT_TEXTS_DIR, "*.txt"))
    
    for filepath in text_files:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        words = extract_tamil_words(content)
        word_counts = Counter(words)

        for word, count in word_counts.items():
            # Flag suspicious patterns
            if is_flagged(word):
                flagged_words.add(word)
                continue

            # Update master lexicon with frequency
            if word not in lexicon:
                lexicon[word] = count
                new_words_count += 1
            else:
                lexicon[word] += count

    # Save updated database
    save_master_lexicon(lexicon)

    # Output flagged words for review
    with open(FLAGGED_OUTPUT, 'w', encoding='utf-8') as f:
        f.write("# WORDS REQUIRING HUMAN REVIEW / CORRECTION\n")
        f.write("# Pattern / Anomaly Flagged Candidates:\n\n")
        for word in sorted(flagged_words):
            f.write(f"{word}\n")

    print(f"✅ Master Lexicon updated. Total unique valid words: {len(lexicon)} (+{new_words_count} new)")
    print(f"⚠️  Flagged {len(flagged_words)} suspicious words saved to '{FLAGGED_OUTPUT}' for review.")

if __name__ == "__main__":
    process_ocr_outputs()