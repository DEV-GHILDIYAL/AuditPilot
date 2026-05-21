/**
 * generate_test_audit.js
 * Generates test_audit.xlsx with 10 language rows.
 * Rows 4 (de), 7 (pt), and 9 (sv) are intentionally wrong.
 * Run: node generate_test_audit.js
 */

const XLSX = require('xlsx');
const path = require('path');

const rows = [
  // Row 1 - en (PASS)
  {
    Language: 'en',
    'Page URL': 'http://localhost:3000/en/index.html',
    'Expected Content': 'Welcome to AuditPilot Test Site',
    'Button Name': 'Learn More',
    'Button Redirect URL': 'http://localhost:3000/en/about.html'
  },
  // Row 2 - fr (PASS)
  {
    Language: 'fr',
    'Page URL': 'http://localhost:3000/fr/index.html',
    'Expected Content': 'Bienvenue sur le site de test',
    'Button Name': 'En savoir plus',
    'Button Redirect URL': 'http://localhost:3000/fr/about.html'
  },
  // Row 3 - nl (PASS)
  {
    Language: 'nl',
    'Page URL': 'http://localhost:3000/nl/index.html',
    'Expected Content': 'Welkom op de testsite',
    'Button Name': 'Meer weten',
    'Button Redirect URL': 'http://localhost:3000/nl/about.html'
  },
  // Row 4 - de (FAIL) — Wrong expected content text
  {
    Language: 'de',
    'Page URL': 'http://localhost:3000/de/index.html',
    'Expected Content': 'Falsche Seite',   // ← INTENTIONALLY WRONG
    'Button Name': 'Mehr erfahren',
    'Button Redirect URL': 'http://localhost:3000/de/about.html'
  },
  // Row 5 - es (PASS)
  {
    Language: 'es',
    'Page URL': 'http://localhost:3000/es/index.html',
    'Expected Content': 'Bienvenido al sitio de prueba',
    'Button Name': 'Saber más',
    'Button Redirect URL': 'http://localhost:3000/es/about.html'
  },
  // Row 6 - it (PASS)
  {
    Language: 'it',
    'Page URL': 'http://localhost:3000/it/index.html',
    'Expected Content': 'Benvenuto nel sito di test',
    'Button Name': 'Scopri di più',
    'Button Redirect URL': 'http://localhost:3000/it/about.html'
  },
  // Row 7 - pt (FAIL) — Wrong button name
  {
    Language: 'pt',
    'Page URL': 'http://localhost:3000/pt/index.html',
    'Expected Content': 'Bem-vindo ao site de teste',
    'Button Name': 'Click Here',           // ← INTENTIONALLY WRONG
    'Button Redirect URL': 'http://localhost:3000/pt/about.html'
  },
  // Row 8 - pl (PASS)
  {
    Language: 'pl',
    'Page URL': 'http://localhost:3000/pl/index.html',
    'Expected Content': 'Witamy na stronie testowej',
    'Button Name': 'Dowiedz się więcej',
    'Button Redirect URL': 'http://localhost:3000/pl/about.html'
  },
  // Row 9 - sv (FAIL) — Wrong redirect URL
  {
    Language: 'sv',
    'Page URL': 'http://localhost:3000/sv/index.html',
    'Expected Content': 'Välkommen till testsidan',
    'Button Name': 'Läs mer',
    'Button Redirect URL': 'http://localhost:3000/sv/wrong.html'  // ← INTENTIONALLY WRONG
  },
  // Row 10 - ja (PASS)
  {
    Language: 'ja',
    'Page URL': 'http://localhost:3000/ja/index.html',
    'Expected Content': 'テストサイトへようこそ',
    'Button Name': '詳細を見る',
    'Button Redirect URL': 'http://localhost:3000/ja/about.html'
  }
];

// Build worksheet
const ws = XLSX.utils.json_to_sheet(rows, {
  header: ['Language', 'Page URL', 'Expected Content', 'Button Name', 'Button Redirect URL']
});

// Set column widths
ws['!cols'] = [
  { wch: 10 },  // Language
  { wch: 45 },  // Page URL
  { wch: 40 },  // Expected Content
  { wch: 25 },  // Button Name
  { wch: 45 }   // Button Redirect URL
];

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Audit');

const outPath = path.join(__dirname, 'test_audit.xlsx');
XLSX.writeFile(wb, outPath);

console.log(`✅ test_audit.xlsx generated at: ${outPath}`);
console.log(`   10 rows total — rows 4 (de), 7 (pt), 9 (sv) are intentionally wrong`);
