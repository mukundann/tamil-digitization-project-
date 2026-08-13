#!/usr/bin/env python3
import os
import glob
import subprocess
import requests
import re
from pathlib import Path

# Configuration
INPUT_DIR = "input_pdfs"
OUTPUT_DIR = "output_texts"
TEMP_PDF_DIR = "temp_pdf"
BATCH_SIZE = 10
MAX_PAGES_PER_RUN = 10

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(TEMP_PDF_DIR, exist_ok=True)

more_work_remains = False


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

        # Extract base name from URL
        base_name = os.path.splitext(os.path.basename(url.split("?")[0]))[0]

        if target_range:
            final_output = os.path.join(OUTPUT_DIR, f"{base_name}_p{target_range}.txt")
            chunk_dir = os.path.join(OUTPUT_DIR, f"chunks_{base_name}_p{target_range}")
        else:
            final_output = os.path.join(OUTPUT_DIR, f"{base_name}.txt")
            chunk_dir = os.path.join(OUTPUT_DIR, f"chunks_{base_name}")

        # Skip if completely finished
        if os.path.exists(final_output):
            print(f"Skipping {base_name}: Final output ({final_output}) already exists.")
            continue

        print("-" * 46)
        print(f"Downloading PDF: {url}")
        pdf_path = os.path.join(TEMP_PDF_DIR, f"{base_name}.pdf")

        # Download PDF file
        try:
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
            print(f"Skipping {base_name}: Could not determine page count.")
            if os.path.exists(pdf_path):
                os.remove(pdf_path)
            continue

        # Parse requested range
        if target_range and "-" in target_range:
            r_start, r_end = map(int, target_range.split("-"))
            req_start = r_start
            req_end = min(r_end, pdf_total)
        else:
            req_start = 1
            req_end = pdf_total

        os.makedirs(chunk_dir, exist_ok=True)
        pages_processed_this_run = 0

        # Process chunks
        for start in range(req_start, req_end + 1, BATCH_SIZE):
            end = min(start + BATCH_SIZE - 1, req_end)
            chunk_output = os.path.join(chunk_dir, f"chunk_{start:04d}_{end:04d}.txt")

            if os.path.exists(chunk_output):
                print(f"Chunk already exists for pages {start} to {end}. Skipping...")
                continue

            if pages_processed_this_run >= MAX_PAGES_PER_RUN:
                print("Reached quota limit for this workflow run.")
                more_work_remains = True
                break

            print(f"Processing pages {start} to {end}...")
            #