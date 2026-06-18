// One-time content migration: handmade-blog -> VitePress.
// Reads the OLD repo, writes transformed markdown + assets into THIS repo.
// Run: node scripts/migrate.mjs
import fs from 'node:fs';
import path from 'node:path';

const OLD = '/mnt/f/cs-stuff/ultimatehg.github.io';
const NEW = '/mnt/f/cs-stuff/blog-uhg';

// oldGlobalId -> [category, slug, draft?]
const MAP = {
  0:  ['writeup', 'redpwn-coffer-overflow'],
  1:  ['writeup', 'pdfium-issue-933163'],
  2:  ['writeup', 'acrobat-fuzzing-part-1'],
  3:  ['writeup', 'acrobat-fuzzing-part-2'],
  4:  ['writeup', 'stackctf-android-part-1'],
  5:  ['writeup', 'stackctf-android-part-2'],
  6:  ['writeup', 'stackctf-android-part-3'],
  7:  ['writeup', 'stackctf-android-part-4'],
  8:  ['writeup', 'stackctf-osint-2'],
  9:  ['writeup', 'acrobat-fuzzing-part-3'],
  10: ['writeup', 'acrobat-fuzzing-part-4'],
  11: ['writeup', 'windows-fuzzing-part-1'],
  12: ['writeup', 'windows-fuzzing-part-2'],
  13: ['cve',     'cve-2021-33760'],
  14: ['writeup', 'greyhats-welcome-ctf-2023'],
  15: ['writeup', 'ecsc-2023-knife-party'],
  16: ['writeup', 'ecsc-2023-flux-capacitor'],
  17: ['writeup', 'ecsc-2023-lady-luck'],
  18: ['blog',    'ecsc-2023-recap'],
  19: ['blog',    'gcc-2024-recap'],
  20: ['writeup', 'hackbash-2024-authors-writeup'],
  21: ['writeup', 'windows-heap-exploration'],
  22: ['writeup', 'greyctf-2024-quals-authors-writeup'],
  23: ['writeup', 'cve-2023-28252'],
  24: ['cve',     'cve-2025-52689'],
  25: ['blog',    'defcon-33', true],   // draft (untracked, unpublished)
  26: ['cve',     'cve-tbc',   true],   // draft (placeholder)
};

const WORKS = {
  'FakeMeh (CODE_EXP 2020 Project).md':         ['0000', 'fakemeh'],
  'My Bukkit Plugins.md':                       ['0001', 'bukkit-plugins'],
  'VisualizerPlusPlus (GCC 2024 Project).md':   ['0002', 'visualizer-plus-plus'],
};

// id -> public URL (for cross-link rewriting)
const URL_FOR = {};
for (const [id, [cat, slug]] of Object.entries(MAP)) URL_FOR[id] = `/${cat}/${slug}`;

function pad(n) { return String(n).padStart(4, '0'); }

function splitFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) throw new Error('no frontmatter');
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const mm = line.match(/^(\w+):\s*(.*)$/);
    if (!mm) continue;
    let v = mm[2].trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    fm[mm[1]] = v;
  }
  return { fm, body: m[2] };
}

function yamlStr(s) { return JSON.stringify(String(s)); }

function rewriteBody(body) {
  // local images: ../images/XXXX/y.png -> /images/XXXX/y.png
  body = body.replace(/\.\.\/images\//g, '/images/');
  // cross-links to old article URLs -> new clean URLs
  body = body.replace(
    /https?:\/\/(?:ultimatehg\.github\.io|blog\.uhg\.sg)\/article\/(\d+)\.html/g,
    (full, id) => URL_FOR[id] || full,
  );
  body = body.replace(/\/article\/(\d+)\.html/g, (full, id) => URL_FOR[id] || full);
  // stale links to old static pages
  body = body
    .replace(/https?:\/\/(?:ultimatehg\.github\.io|blog\.uhg\.sg)\/articles\.html/g, '/writeup')
    .replace(/https?:\/\/(?:ultimatehg\.github\.io|blog\.uhg\.sg)\/works\.html/g, '/project')
    .replace(/https?:\/\/(?:ultimatehg\.github\.io|blog\.uhg\.sg)\/about\.html/g, '/about');
  return body.replace(/^\s+/, '') + (body.endsWith('\n') ? '' : '\n');
}

function writeFile(p, content) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}

// ---- articles ----
let counts = { blog: 0, cve: 0, writeup: 0, drafts: 0 };
for (const f of fs.readdirSync(path.join(OLD, '_articles')).sort()) {
  if (!f.endsWith('.md')) continue;
  const id = parseInt(f.slice(0, 4), 10);
  const entry = MAP[id];
  if (!entry) { console.warn('!! no map for', f); continue; }
  const [cat, slug, draft] = entry;
  const raw = fs.readFileSync(path.join(OLD, '_articles', f), 'utf8');
  const { fm, body } = splitFrontmatter(raw);

  let title = fm.title || '';
  if (cat === 'blog') title = title.replace(/^\[Blog\]\s*/i, '');
  const date = (fm.date || '').replace(/\./g, '-');
  const tags = (fm.tags || '').split(',').map(t => t.trim()).filter(Boolean);

  const lines = ['---', `title: ${yamlStr(title)}`];
  if (fm.subtitle) lines.push(`subtitle: ${yamlStr(fm.subtitle)}`);
  lines.push(`date: ${yamlStr(date)}`);
  if (tags.length) lines.push(`tags: [${tags.map(yamlStr).join(', ')}]`);
  if (draft) lines.push('draft: true');
  lines.push('---', '');

  const out = lines.join('\n') + rewriteBody(body);
  writeFile(path.join(NEW, cat, `${pad(id)}_${slug}.md`), out);
  if (draft) counts.drafts++; else counts[cat]++;
}

// ---- works -> projects ----
for (const [f, [prefix, slug]] of Object.entries(WORKS)) {
  const raw = fs.readFileSync(path.join(OLD, '_works', f), 'utf8');
  const { fm, body } = splitFrontmatter(raw);
  const repo = (body.match(/https?:\/\/github\.com\/[^\s)>"]+/) || [])[0];
  const lines = ['---', `title: ${yamlStr(fm.title || '')}`];
  if (fm.subtitle) lines.push(`subtitle: ${yamlStr(fm.subtitle)}`);
  if (fm.thumbnail) lines.push(`thumbnail: ${yamlStr(fm.thumbnail)}`);
  if (repo) lines.push(`repo: ${yamlStr(repo)}`);
  lines.push('---', '');
  writeFile(path.join(NEW, 'project', `${prefix}_${slug}.md`), lines.join('\n') + rewriteBody(body));
}

// ---- images + favicon ----
fs.cpSync(path.join(OLD, 'images'), path.join(NEW, 'public', 'images'), { recursive: true });
fs.mkdirSync(path.join(NEW, 'public'), { recursive: true });
fs.copyFileSync(path.join(OLD, 'app/assets/favicon.ico'), path.join(NEW, 'public', 'favicon.ico'));

console.log('migrated:', counts);
console.log('done.');
