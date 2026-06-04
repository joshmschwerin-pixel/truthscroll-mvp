Greek lemmatizer integration

This project supports improved Greek lemmatization in the interlinear generator.

How to enable:

1. Install an external Greek lemmatizer package. This project attempts to load `greek-lemmatizer` if present. You can install it with:

```bash
npm run install-lemmatizer
```

2. After installation, regenerate the interlinear file:

```bash
node scripts/generate_interlinear_from_greek_and_kjv.js
```

Notes:
- The script uses the lemmatizer if it exposes a `lemmatize()` function or `getLemma()` function.
- If you prefer a different lemmatizer, install it and adjust `scripts/generate_interlinear_from_greek_and_kjv.js` to require the correct module name.
- For best results, also provide a `data/greek_lemma_overrides.json` file with high-value custom mappings (e.g., irregular forms).
