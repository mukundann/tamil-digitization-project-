#!/usr/bin/env python3
import re
import sys

def clean_vyakhyanam_ocr(text):
    # 1. Fix specific 'ச' -> 'த' misreads (e.g., சன்னுடைய -> தன்னுடைய)
    # capturing variations like சன்னுடைய, சன்னுடையது, சன்னுடையதான
    text = re.sub(r'\bசன்னுடைய', 'தன்னுடைய', text)
    text = re.sub(r'\bசன்னால்', 'தன்னால்', text)
    text = re.sub(r'\bசன்னைய', 'தன்னைய', text)
    text = re.sub(r'\bசனக்கு', 'தனக்கு', text)
    text = re.sub(r'\bசனது', 'தனது', text)

    # 2. Normalize 'Sri' variations
    text = re.sub(r'ஸரீ', 'ஸ்ரீ', text)
    text = re.sub(r'ஶ்ரீ', 'ஸ்ரீ', text)
    text = re.sub(r'ஸ்ரீ\s*\d+', 'ஸ்ரீ', text)

    # 3. Common Tesseract Tamil & Grantha typography fixes
    replacements = {
        # Old font / OCR misreads
        'மக்திர': 'மந்திர',
        'மக்த்ர': 'மந்த்ர',
        'ஸச்கிதி': 'ஸந்நிதி',
        'ஸக்சிதி': 'ஸந்நிதி',
        
        # 'இ' / 'இர' vs 'தி' misreads due to faint pulli
        'இருமொழி': 'திருமொழி',
        'இருப்பதிக': 'திருப்பதிக',
        'இருப்பிரிதி': 'திருப்பிரிதி',
        'இருநாங்கூர்': 'திருநாங்கூர்',
        'இருவிண்ணக': 'திருவிண்ணக',
        'இருவயிந்திரபுர': 'திருவயிந்திரபுர',
        
        # Manipravalam vocabulary fixes
        'லபி.த்ச': 'லபித்த',
        'அனுபவித்து': 'அநுபவித்து',
        'மங்களாசாஸகஞ்': 'மங்களாசாஸநஞ்',
        'க் ஷ்': 'க்ஷ்',
        'ஸ் ரீ': 'ஸ்ரீ',
    }

    for target, replacement in replacements.items():
        text = text.replace(target, replacement)

    # 4. Clean up scan artifacts, header noise, and broken lines
    text = re.sub(r'https?://\S+', '', text)
    text = re.sub(r'110://\s*\S+', '', text)
    text = re.sub(r'^[ஜ்‌\s*வ்‌\s*ஷி\s*ண\s*துப\s*டட\s*உ\s*\|]+$', '', text, flags=re.MULTILINE)
    
    # 5. Space and blank line cleanup
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)

    return text

if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(1)

    with open(sys.argv[1], 'r', encoding='utf-8') as infile:
        raw_data = infile.read()

    cleaned_data = clean_vyakhyanam_ocr(raw_data)

    with open(sys.argv[2], 'w', encoding='utf-8') as outfile:
        outfile.write(cleaned_data)