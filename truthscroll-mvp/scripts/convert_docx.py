#!/usr/bin/env python3
"""Simple DOCX -> JSON extractor for TruthScroll.

Usage:
  python scripts/convert_docx.py /path/to/input.docx data/raw/output.json

This is a best-effort extractor that reads paragraphs and attempts to detect verse
references of the form "BookName 1:1". It outputs a JSON array of objects with
optional `reference` and `text` fields. You should review and normalize the output.

Requires: python-docx
  pip install python-docx
"""
import sys
import re
import json
from docx import Document

REF_RE = re.compile(r"^([A-Za-z]+)\s+(\d+):(\d+)\b")

def extract(docx_path):
    doc = Document(docx_path)
    out = []
    current_ref = None
    for p in doc.paragraphs:
        text = p.text.strip()
        if not text:
            continue
        m = REF_RE.match(text)
        if m:
            book = m.group(1)
            chap = m.group(2)
            verse = m.group(3)
            # remove the leading reference from text
            content = text[m.end():].strip()
            ref = f"{book} {chap}:{verse}"
            out.append({"reference": ref, "text": content})
            current_ref = ref
        else:
            # try to attach to current_ref if present
            if current_ref:
                out.append({"reference": current_ref, "text": text})
            else:
                out.append({"text": text})
    return out

def main():
    if len(sys.argv) < 3:
        print("Usage: convert_docx.py input.docx output.json")
        sys.exit(2)
    inp = sys.argv[1]
    outp = sys.argv[2]
    data = extract(inp)
    with open(outp, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(data)} items to {outp}")

if __name__ == '__main__':
    main()
