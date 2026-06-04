import json
import re
import os
import sys

ROOT = os.path.dirname(os.path.dirname(__file__))
GREEK_IN = os.path.join(ROOT, 'data', 'greek_nt.json')
OUT = os.path.join(ROOT, 'data', 'greek_lemmas.json')

OVERRIDES_P = os.path.join(ROOT, 'data', 'greek_lemma_overrides.json')
STRONGS_P = os.path.join(ROOT, 'data', 'strongs.json')

def split_greek(text):
    if not text:
        return []
    parts = re.split(r"\s+", text)
    cleaned = []
    for p in parts:
        p2 = re.sub(r"[\d\p{P}\uFEFF\u200B\u200C\u2060\u202A-\u202E\[\]⸂⸃⸀⸁\u200E\u200F\"“”«»]", '', p, flags=re.UNICODE)
        p2 = p2.strip()
        if p2:
            cleaned.append(p2)
    return cleaned

# load greek forms
try:
    data = json.load(open(GREEK_IN, 'r', encoding='utf8'))
except Exception as e:
    print('Failed to load', GREEK_IN, e)
    sys.exit(1)

forms = set()
for v in data:
    text = v.get('text')
    if not text: continue
    for w in re.findall(r"[\w\u0370-\u03FF⸂⸃⸀⸁]+", text, flags=re.UNICODE):
        forms.add(w)

forms = sorted(forms)
print('Unique Greek forms found:', len(forms))

# try to use cltk
lemmas = {}
use_cltk = False
try:
    from cltk.lemmatize.grc import Lemmatizer
    lemmatizer = Lemmatizer()
    use_cltk = True
    print('Using CLTK lemmatizer')
except Exception as e:
    print('CLTK not available; will fallback to simple heuristics')

import unicodedata

def strip_diacritics(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s) if not unicodedata.combining(c))

suffixes = ['ωντες','ουσιν','ουσι','οντας','ων','ου','ειν','ει','η','ης','ος','ον','αι','ας','α','εν','σ','θη','θην','θηναι',
            'ους','ους','ες','ων','ειται','εῖ','ῃ','ῃς','ῃν','ωντα','οντας','αντος','ασι','ουσιν','ουσα','οντας']

for f in forms:
    lemma = None
    if use_cltk:
        try:
            res = lemmatizer.lemmatize(f)
            # CLTK may return list of tuples or list; handle defensively
            if isinstance(res, list) and len(res) > 0:
                first = res[0]
                if isinstance(first, (list, tuple)):
                    lemma = first[1]
                else:
                    lemma = first
        except Exception:
            lemma = None
    if not lemma:
        fs = strip_diacritics(f).lower()
        # prefer explicit strongs mapping if available (strongs keys are often lemmas)
        strongs = {}
        try:
            if os.path.exists(STRONGS_P):
                strongs = json.load(open(STRONGS_P, 'r', encoding='utf8'))
        except Exception:
            strongs = {}
        # direct match on form or stripped form
        if f in strongs:
            lemma = f
        elif fs in strongs:
            lemma = fs
        else:
            if fs in forms:
                lemma = fs
            else:
                for s in suffixes:
                    if fs.endswith(s):
                        cand = fs[:-len(s)]
                        if len(cand) >= 2:
                            lemma = cand
                            break
    if not lemma:
        lemma = strip_diacritics(f)
    # apply manual overrides if present
    try:
        if os.path.exists(OVERRIDES_P):
            overrides = json.load(open(OVERRIDES_P, 'r', encoding='utf8'))
        else:
            overrides = {}
    except Exception:
        overrides = {}
    if f in overrides:
        lemma = overrides[f]
    else:
        # also check stripped/lower override keys
        if ' ' in f:
            # some overrides may be keyed with spaces (e.g., 'ὁ λόγος')
            key = f
            if key in overrides:
                lemma = overrides[key]
        sf = strip_diacritics(f)
        if sf in overrides:
            lemma = overrides[sf]
    lemmas[f] = lemma

# write out
with open(OUT, 'w', encoding='utf8') as fh:
    json.dump(lemmas, fh, ensure_ascii=False, indent=2)

print('Wrote', len(lemmas), 'lemmas to', OUT)
