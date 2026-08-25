#!/usr/bin/env python3
import glob
import json
import os
import re

# File Paths
LEXICON_DB = "master_lexicon.json"
REPLACEMENTS_FILE = "replacements.json"
OUTPUT_TEXTS_DIR = "output_texts"
REVIEW_QUEUE_DIR = "review_queue"

# Known OCR Noise Patterns
FLAG_PATTERNS = [
    r"\.",  # Isolated/unexpected periods
    r"இரு(?=[பநாவிவ])",  # Misread 'திரு' prefix
    r"க(?=திர|த்ர)",  # 'க' misread for nasal 'ந்'
    r"[ஸஶ][ரீ]",  # Grantha 'ஸ்ரீ' variations
    r"[\u0B80-\u0BFF]\d",  # Numbers stuck to Tamil text
]


def load_json(filepath, default):
    if os.path.exists(filepath):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"⚠️ Warning loading {filepath}: {e}")
    return default


def save_json(data, filepath):
    dirname = os.path.dirname(filepath)
    if dirname:
        os.makedirs(dirname, exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def clean_html_content(raw_text):
    """Strips initial HTML boilerplate if present."""
    if "<html" in raw_text.lower() or "<body" in raw_text.lower():
        text = re.sub(
            r"<(script|style)[^>]*>.*?</\1>",
            "",
            raw_text,
            flags=re.DOTALL | re.IGNORECASE,
        )
        text = re.sub(r"<[^>]+>", " ", text)
        return (
            text.replace("&nbsp;", " ")
            .replace("&lt;", "<")
            .replace("&gt;", ">")
            .replace("&amp;", "&")
        )
    return raw_text


def apply_cascading_replacements(text, replacements):
    """Applies proofreading fixes from replacements.json."""
    for wrong_word, corrected_word in replacements.items():
        if wrong_word in text:
            text = text.replace(wrong_word, corrected_word)
    return text


def extract_tamil_tokens(text):
    raw_tokens = re.findall(r"[\u0B80-\u0BFF\.]+", text)
    return [t.strip(".") for t in raw_tokens if len(t.strip(".")) > 1]


def is_flagged(word):
    return any(re.search(pattern, word) for pattern in FLAG_PATTERNS)


def process_corpus():
    master_lexicon = load_json(LEXICON_DB, {})
    replacements = load_json(REPLACEMENTS_FILE, {})

    new_word_count = 0
    text_files = glob.glob(os.path.join(OUTPUT_TEXTS_DIR, "*.txt"))

    print(f"Processing {len(text_files)} text file(s)...")

    for filepath in text_files:
        book_id = os.path.splitext(os.path.basename(filepath))[0]

        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            raw_content = f.read()

        # Step 1: Clean HTML headers and apply saved proofreading fixes
        clean_text = clean_html_content(raw_content)
        if replacements:
            clean_text = apply_cascading_replacements(clean_text, replacements)

        if clean_text != raw_content:
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(clean_text)

        # Step 2: Split by Page Break markers
        pages = re.split(
            r"\n\s*---+\s*Page Break\s*---+\s*\n",
            clean_text,
            flags=re.IGNORECASE,
        )

        for page_num, page_text in enumerate(pages, start=1):
            if not page_text.strip():
                continue

            page_flagged_items = []
            paragraphs = [
                p.strip() for p in page_text.split("\n\n") if p.strip()
            ]

            for p_idx, paragraph in enumerate(paragraphs):
                words = extract_tamil_tokens(paragraph)

                for word in words:
                    if is_flagged(word):
                        page_flagged_items.append(
                            {
                                "book": book_id,
                                "page": page_num,
                                "paragraph_index": p_idx,
                                "flagged_word": word,
                                "context": paragraph,
                                "image_path": f"output_texts/{book_id}_images/page-{page_num}.png",
                            }
                        )
                    else:
                        if word not in master_lexicon:
                            master_lexicon[word] = 1
                            new_word_count += 1
                        else:
                            master_lexicon[word] += 1

            # Step 3: Write page-level JSON queue file
            if page_flagged_items:
                page_queue_path = os.path.join(
                    REVIEW_QUEUE_DIR, book_id, f"page_{page_num}.json"
                )
                save_json(page_flagged_items, page_queue_path)

    save_json(master_lexicon, LEXICON_DB)
    print(
        f"✅ Updated master lexicon ({len(master_lexicon)} words, +{new_word_count} new)."
    )
    print(
        f"📁 Page review queues written under '{REVIEW_QUEUE_DIR}/<book_id>/'."
    )


if __name__ == "__main__":
    process_corpus()