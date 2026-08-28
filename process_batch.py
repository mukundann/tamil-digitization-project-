#!/usr/bin/env python3
import glob
import json
import os
import re
import subprocess
import requests

# Configuration
INPUT_DIR = "input_pdfs"
OUTPUT_DIR = "output_texts"
TEMP_PDF_DIR = "temp_pdf"
MANIFEST_PATH = os.path.join(OUTPUT_DIR, "manifest.json")
BATCH_SIZE = 10
MAX_PAGES_PER_RUN = 10

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(TEMP_PDF_DIR, exist_ok=True)

more_work_remains = False

# 1. Define modular per-book base folder
book_dir="output_texts/${book_id}"
chunk_dir="${book_dir}/chunks"
images_dir="${book_dir}/images"
final_output="${book_dir}/${book_id}.txt"

# 2. Ensure directories exist before running
mkdir -p "$book_dir" "$chunk_dir" "$images_dir"


def get_pdf_total_pages(pdf_path):
    """Uses pdfinfo to get total number of pages in PDF."""
    try:
        res = subprocess.run(["pdfinfo", pdf_path], capture_output=True, text=True, check=True)
        match = re.search(r"^Pages:\s+(\d+)", res.stdout, re.MULTILINE)
        if match:
            return int(match.group(1))
    except Exception as e:
        print(f"Error fetching page count for {pdf_path}: {e}")
    return 0


def set_github_env(var_name, value):
    """Exports variable to GITHUB_ENV if running in GitHub Actions."""
    github_env = os.environ.get("GITHUB_ENV")
    if github_env:
        with open(github_env, "a", encoding="utf-8") as f:
            f.write(f"{var_name}={value}\n")


def update_manifest(book_id):
    """Adds completed book_id to output_texts/manifest.json."""
    manifest = []
    if os.path.exists(MANIFEST_PATH):
        try:
            with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
                manifest = json.load(f)
        except Exception:
            manifest = []

    if book_id not in manifest:
        manifest.append(book_id)
        with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
            json.dump(manifest, f, ensure_ascii=False, indent=2)
        print(f"Updated manifest.json with '{book_id}'")


txt_files = glob.glob(os.path.join(INPUT_DIR, "*.txt"))

for txt_file in txt_files:
    print(f"Reading links from {txt_file}...")
    with open(txt_file, "r", encoding="utf-8") as f:
        lines = f.readlines()

    for line in lines:
        line = line.strip()
        if not line or line.startswith("#"):
            continue

        parts = line.split()
        url = parts[0]
        target_range = parts[1] if len(parts) > 1 else ""

        # Base book identifier
        base_name = os.path.splitext(os.path.basename(url.split("?")[0]))[0]
        book_id = f"{base_name}_p{target_range}" if target_range else base_name

        # Per-book directory structure
        book_dir = os.path.join(OUTPUT_DIR, book_id)
        images_dir = os.path.join(book_dir, "images")
        final_output = os.path.join(book_dir, f"{book_id}.txt")
        chunk_dir = os.path.join(book_dir, "chunks")

        os.makedirs(book_dir, exist_ok=True)
        os.makedirs(images_dir, exist_ok=True)

        # Skip if completely finished
        if os.path.exists(final_output):
            print(f"Skipping {book_id}: Final output ({final_output}) already exists.")
            update_manifest(book_id)
            continue

        print("-" * 46)
        print(f"Downloading PDF: {url}")
        pdf_path = os.path.join(TEMP_PDF_DIR, f"{base_name}.pdf")

        try:
            if not os.path.exists(pdf_path):
                resp = requests.get(url, stream=True, timeout=60)
                resp.raise_for_status()
                with open(pdf_path, "wb") as pf:
                    for chunk in resp.iter_content(chunk_size=8192):
                        pf.write(chunk)
        except Exception as e:
            print(f"Failed to download {url}: {e}")
            continue

        pdf_total = get_pdf_total_pages(pdf_path)
        if pdf_total == 0:
            print(f"Skipping {book_id}: Could not determine page count.")
            continue

        # Parse page range
        if target_range and "-" in target_range:
            r_start, r_end = map(int, target_range.split("-"))
            req_start = r_start
            req_end = min(r_end, pdf_total)
        else:
            req_start = 1
            req_end = pdf_total

        os.makedirs(chunk_dir, exist_ok=True)
        pages_processed_this_run = 0

        for start in range(req_start, req_end + 1, BATCH_SIZE):
            end = min(start + BATCH_SIZE - 1, req_end)
            chunk_output = os.path.join(chunk_dir, f"chunk_{start:04d}_{end:04d}.txt")

            if os.path.exists(chunk_output):
                continue

            if pages_processed_this_run >= MAX_PAGES_PER_RUN:
                print("Reached quota limit for this workflow run.")
                more_work_remains = True
                break

            print(f"Processing {book_id} pages {start} to {end}...")
            
            # Execute ocr_tamil_pdf.sh for current range
            cmd = ["./ocr_tamil_pdf.sh", pdf_path, book_id, f"{start}-{end}"]
            subprocess.run(cmd, check=True)
            
            pages_processed_this_run += (end - start + 1)

        # If all pages processed, concatenate chunks into final book text
        chunk_files = sorted(glob.glob(os.path.join(chunk_dir, "chunk_*.txt")))
        if len(chunk_files) > 0 and not more_work_remains:
            with open(final_output, "w", encoding="utf-8") as outfile:
                for cfile in chunk_files:
                    with open(cfile, "r", encoding="utf-8") as infile:
                        outfile.write(infile.read())
            print(f"Successfully assembled {final_output}")
            update_manifest(book_id)

set_github_env("MORE_WORK_REMAINS", str(more_work_remains).lower())