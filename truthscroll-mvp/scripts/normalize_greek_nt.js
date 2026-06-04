const fs = require('fs');
const path = require('path');

const rawPath = path.join(__dirname, '..', 'data', 'greek_nt_raw.json');
const outPath = path.join(__dirname, '..', 'data', 'greek_nt.json');

const bookMap = {
  'Κατὰ Μαθθαῖον': 'Matthew',
  'Κατὰ Μᾶρκον': 'Mark',
  'Κατὰ Λουκᾶν': 'Luke',
  'Κατὰ Ἰωάννην': 'John',
  'Πράξεις Ἀποστόλων': 'Acts',
  'Πρὸς Ῥωμαίους': 'Romans',
  'Πρὸς Κορινθίους Α': '1 Corinthians',
  'Πρὸς Κορινθίους Β': '2 Corinthians',
  'Πρὸς Γαλάτας': 'Galatians',
  'Πρὸς Ἐφεσίους': 'Ephesians',
  'Πρὸς Φιλιππησίους': 'Philippians',
  'Πρὸς Κολοσσαεῖς': 'Colossians',
  'Πρὸς Θεσσαλονικεῖς Α': '1 Thessalonians',
  'Πρὸς Θεσσαλονικεῖς Β': '2 Thessalonians',
  'Πρὸς Τιμόθεον Α': '1 Timothy',
  'Πρὸς Τιμόθεον Β': '2 Timothy',
  'Πρὸς Τίτον': 'Titus',
  'Πρὸς Φιλήμονα': 'Philemon',
  'Πρὸς Ἑβραίους': 'Hebrews',
  'Ἀποκάλυψις Ἰωάννου': 'Revelation',
  'Ἰωάννου Α': '1 John',
  'Ἰωάννου Β': '2 John',
  'Ἰωάννου Γ': '3 John',
  'Πέτρου Α': '1 Peter',
  'Πέτρου Β': '2 Peter',
  'Ἰούδα': 'Jude'
};

const data = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
const verses = [];
let book = null;
let chapter = null;
let currentVerse = null;

for (const item of data) {
  const text = (item.text || '').trim();
  if (!text) continue;

  if (bookMap[text]) {
    book = bookMap[text];
    chapter = null;
    currentVerse = null;
    continue;
  }

  const chapterMatch = text.match(/^Κεφάλαιον\s+(\d+)$/);
  if (chapterMatch) {
    chapter = Number(chapterMatch[1]);
    currentVerse = null;
    continue;
  }

  const verseMatch = text.match(/^(\d+):(\d+)\s+(.+)$/);
  if (verseMatch) {
    const verseNumber = Number(verseMatch[2]);
    const verseText = verseMatch[3].trim();
    if (book && chapter !== null) {
      currentVerse = { book, chapter, verse: verseNumber, text: verseText };
      verses.push(currentVerse);
    }
    continue;
  }

  if (currentVerse) {
    currentVerse.text += ' ' + text;
  }
}

fs.writeFileSync(outPath, JSON.stringify(verses, null, 2), 'utf8');
console.log(`Wrote ${verses.length} verses to ${outPath}`);
