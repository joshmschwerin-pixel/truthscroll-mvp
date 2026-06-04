#!/usr/bin/env python3
"""OCR DOCX facsimile pages using system Tesseract and pytesseract.

Usage:
  python scripts/ocr_docx_tesseract.py input.docx output.json

Requirements:
  - Install Tesseract OCR (Windows installer or package manager). On Windows typical path:
      C:\Program Files\Tesseract-OCR\tesseract.exe
  - pip install pytesseract pillow

If Tesseract is not on PATH, set `pytesseract.pytesseract.tesseract_cmd` to the exe path.
"""
import sys
import os
import zipfile
import re
import json
import tempfile
from PIL import Image
import pytesseract


def extract_images(docx_path, out_dir):
    with zipfile.ZipFile(docx_path) as z:
        for info in z.infolist():
            if info.filename.startswith('word/media/'):
                target = os.path.join(out_dir, os.path.basename(info.filename))
                with z.open(info) as src, open(target, 'wb') as dst:
                    dst.write(src.read())
                yield target


def ocr_images(img_paths, lang='eng'):
    texts = []
    for p in img_paths:
        try:
            im = Image.open(p)
            text = pytesseract.image_to_string(im, lang=lang)
            texts.append(text)
        except Exception as e:
            print(f'OCR error for {p}: {e}', file=sys.stderr)
    return '\n'.join(texts)


REF_RE = re.compile(r'^(?:([1-3]?\s?[A-Za-z]+)\s+)?(\d+):(\d+)\s*(.*)$')


def parse_verses(text):
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    items = []
    last = None
    for line in lines:
        m = REF_RE.match(line)
        if m:
            book = m.group(1) or None
            chap = int(m.group(2))
            verse = int(m.group(3))
            body = m.group(4).strip()
            obj = {'book': book, 'chapter': chap, 'verse': verse, 'text': body}
            items.append(obj)
            last = obj
        else:
            if last:
                last['text'] = (last['text'] + ' ' + line).strip()
            else:
                items.append({'text': line})
    return items


def main():
    if len(sys.argv) < 3:
        print('Usage: python scripts/ocr_docx_tesseract.py input.docx output.json')
        sys.exit(2)
    inp = sys.argv[1]
    out = sys.argv[2]
    if not os.path.exists(inp):
        print('Input not found:', inp, file=sys.stderr)
        sys.exit(2)

    tmp = tempfile.mkdtemp(prefix='docx_media_')
    imgs = list(extract_images(inp, tmp))
    if not imgs:
        print('No images found in DOCX. If the DOCX contains text rather than images, consider using the Node converter.', file=sys.stderr)
        sys.exit(1)
    print(f'Found {len(imgs)} images. Running OCR...')

    # If Tesseract is not on PATH, uncomment and set the path below:
    # pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

    full = ocr_images(imgs)
    items = parse_verses(full)
    with open(out, 'w', encoding='utf-8') as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
    print(f'Wrote {len(items)} items to {out}')


if __name__ == '__main__':
    main()
