import os
import re
import json
import glob

MASTER_LEXICON_FILE = "master_lexicon.json"
REVIEW_QUEUE_DIR = "review_queue"
OUTPUT_TEXTS_DIR = "output_texts"

ANOMALY_PATTERNS = [r'\.', r'\d', r'[A-Za-z]', r'[\=\+\*\/\<\>]', r'(.)\1{2,}']

def is_suspicious(word):
    return any(re.search(pat, word) for pat in ANOMALY_PATTERNS)

def process_ocr_outputs():
    os.makedirs(REVIEW_QUEUE_DIR, exist_ok=True)
    master_lexicon = {}
    if os.path.exists(MASTER_LEXICON_FILE):
        try:
            with open(MASTER_LEXICON_FILE, 'r', encoding='utf-8') as f:
                master_lexicon = json.load(f)
        except Exception:
            master_lexicon = {}

    for file_path in glob.glob(os.path.join(OUTPUT_TEXTS_DIR, "*.txt")):
        filename = os.path.basename(file_path)
        base_name = os.path.splitext(filename)[0]
        
        # Create a folder for each book's page queues
        book_queue_dir = os.path.join(REVIEW_QUEUE_DIR, base_name)
        os.makedirs(book_queue_dir, exist_ok=True)

        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Split text by page markers
        pages = content.split("--- Page Break ---")

        for page_idx, page_text in enumerate(pages, start=1):
            page_flagged = []
            paragraphs = [p.strip() for p in re.split(r'\n\s*\n', page_text) if p.strip()]

            for paragraph in paragraphs:
                words = re.findall(r'[\u0B80-\u0BFF\w\.]+', paragraph)
                for w in words:
                    clean_w = w.strip('.,;:"\'()[]{}')
                    if not clean_w:
                        continue

                    master_lexicon[clean_w] = master_lexicon.get(clean_w, 0) + 1

                    if is_suspicious(clean_w) or master_lexicon[clean_w] < 2:
                        highlighted_paragraph = re.sub(
                            r'\b' + re.escape(clean_w) + r'\b',
                            f'<mark class="highlight">{clean_w}</mark>',
                            paragraph,
                            count=1
                        )
                        page_flagged.append({
                            "word": clean_w,
                            "paragraph": highlighted_paragraph,
                            "raw_paragraph": paragraph,
                            "file": filename,
                            "page_num": page_idx,
                            "page_image": f"{OUTPUT_TEXTS_DIR}/{base_name}_images/page-{page_idx}.png"
                        })

            # Save individual page JSON if anomalies exist
            if page_flagged:
                page_file = os.path.join(book_queue_dir, f"page_{page_idx}.json")
                with open(page_file, 'w', encoding='utf-8') as pf:
                    json.dump(page_flagged, pf, ensure_ascii=False, indent=2)

    with open(MASTER_LEXICON_FILE, 'w', encoding='utf-8') as f:
        json.dump(master_lexicon, f, ensure_ascii=False, indent=2)

    print("✅ Page-level review queues successfully generated in review_queue/")

if __name__ == "__main__":
    process_ocr_outputs()