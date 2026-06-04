# TruthScroll MVP

A starter Bible study web app with Bible reader, AI verse explanation, visual explorer, family lesson generator, and notes structure.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000

## MVP modules

- Read: public-domain sample Bible text
- Study: original-language/translation transparency mock data
- Ask: OpenAI-powered Bible Q&A endpoint
- Explore: visual cross-reference/theme map
- Family: age-based lesson generator

## Next production steps

1. Load full public-domain Bible text.
2. Add Greek/Hebrew morphology dataset.
3. Connect Supabase auth and notes tables.
4. Add licensed Bible translations.
5. Convert to Expo React Native after web MVP proves demand.

## Converting DOCX source files

If you have `.docx` source texts (e.g. SBLGNT, KJV) you can convert them to JSON for import.

1. Install the converter dependency:

```bash
pip install python-docx
```

2. Run the converter (example):

```bash
python scripts/convert_docx.py \
	"C:\\Users\\you\\Downloads\\SBLGNT_Koine_Greek_New_Testament.docx" \
	data/raw/sblgnt.json
```

3. Review `data/raw/sblgnt.json` and normalize verse references into the shape you need (e.g., `book`, `chapter`, `verse`, `text`).

4. Move normalized files into `data/` (e.g. `data/kjv.json`, `data/greek.json`) and update pages to import them.

Note: `scripts/convert_docx.py` is a best-effort extractor; complex DOCX structures may need manual processing.

### OCR for facsimile DOCX (recommended)

If your DOCX contains page-image facsimiles (scanned pages or page-image embeds), use system Tesseract + the included Python OCR script to reliably extract text.

1. Install Tesseract:

	 - Windows: download and run the installer from https://github.com/tesseract-ocr/tesseract/releases
	 - macOS: `brew install tesseract`
	 - Linux: use your distro package manager (e.g. `apt install tesseract-ocr`)

2. Install Python deps:

```bash
pip install pytesseract pillow
```

3. Run the OCR script (example):

```bash
python scripts/ocr_docx_tesseract.py \
	"data/KJV_1611_New_Testament_Early_Modern_English_Facsimile.docx" \
	data/kjv_ocr.json
```

4. Inspect `data/kjv_ocr.json` and normalize into the desired `data/kjv.json` shape.

Notes:
- If Tesseract is not on your PATH, set `pytesseract.pytesseract.tesseract_cmd` in the script to your Tesseract executable path.
- Large OCR runs may take minutes depending on page count.


