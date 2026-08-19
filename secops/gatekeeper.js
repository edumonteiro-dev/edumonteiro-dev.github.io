/**
 * secops/gatekeeper.js — DevSecOps Gate v3.0
 * Zero-Trust static artifact auditor. Zero external dependencies.
 * Node.js >= 18 required (crypto built-in).
 *
 * Usage: node secops/gatekeeper.js
 * Exit 0 = deployment authorised. Exit 1 = pipeline aborted.
 *
 * Checks performed:
 *  [A] i18n.js exists and is parseable
 *  [B] Key parity 1:1 across all 6 locales (reads i18n.js directly)
 *  [C] CSP Zero-Trust tokens present in every HTML artefact
 *  [D] Structural integrity tokens per file
 *  [E] External asset allowlist — no unauthorised third-party scripts
 *  [F] Anti-Bleed: PT-language prohibited strings absent from HTML body
 *      (outside i18n.js, data-i18n attributes, and <code> blocks)
 *  [G] FCP boot script present in every secondary page
 */
'use strict';

const fs     = require('fs');
const crypto = require('crypto');
const path   = require('path');

const ROOT = path.resolve(__dirname, '..');

/* ── CONFIG ─────────────────────────────────────────────────── */

const EXPECTED_LOCALES = ['pt-PT','en-US','fr-CH','de-CH','es-ES','it-IT'];

const FILES_TO_CHECK = [
  'index.html',
  'blog.html',
  'contract.html',
  'legal.html'
];

const ALLOWLIST_DOMAINS = [
  'kmlucropro.com','vozdocondutor.com','vdcpt.github.io',
  'linkedin.com','github.com','workana.com','upwork.com','99freelas.com',
  'share.google','api.web3forms.com','monteiro.is-a.dev',
  'www.cnpd.pt','www.edoeb.admin.ch'
];

/** CSP directives that MUST be present in every HTML file */
const REQUIRED_CSP_TOKENS = [
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "upgrade-insecure-requests"
];

/**
 * Anti-Bleed: Portuguese terms that must NOT appear as literal text
 * in the HTML body of any page (outside i18n.js, data-i18n, <code>).
 * These are root-word patterns — matched case-insensitively.
 */
const PT_BLEED_PATTERNS = [
  /\bDesenvolvimento\b/i,
  /\bManuten[çc][ãa]o\b/i,
  /\bProje[tc]os?\b/i,
  /\bServi[çc]os?\b/i,
  /\bPre[çc]os?\b/i,
  /\bPortfólio\b/,       // "Portfólio" (PT diacritic) only — "Portfolio" is international
  /\bInício\b/i,
  /\bContacto\b/i,
  /\bPrivacidade\b/i,
  /\bSegurança\b/i,
  /\bPagamentos\b/i,
  /\bAnálise\b/i,
  /\bEntrega\b/i,
  /\bFicheiro\b/i,
  /\bSistema\b.*\bCrítico\b/i,
  /\bIntegra[çc][ãa]o com IA\b/i
];

/** Required structural tokens per file */
const STRUCT_TOKENS = {
  'index.html':   [
    'id="services"','id="pricing"','id="contact"','id="projects"','id="process"',
    'function applyLocale','neural-canvas','async function submitScope',
    'api.web3forms.com','Eduardo Monteiro','monteiro.is-a.dev',
    'edumonteiro.dev@gmail.com','serviceWorker','manifest.json',
    'id="footer-terms"','id="footer-gdpr"',
    'window.VC_LOCALE','VC_APPLY = applyLocale',
    '<script src="./i18n.js">'
  ],
  'blog.html': [
    'applyBlogLocale','VC_SET','VC_LOCALE',
    'id="blog-eyebrow"','id="blog-title"','id="blog-sub"',
    'id="cs-title"','id="cs-desc"','id="cs-cta"',
    'data-locale="de-CH"','data-locale="pt-PT"',
    '<script src="./i18n.js">',
    'edumonteiro.dev@gmail.com'
  ],
  'contract.html': [
    'payment-50','payment-hr','uat-table','sig-grid','rules-grid','annexA','annexB',
    'window.VC_LOCALE','<script src="./i18n.js">',
    "localStorage.getItem('vc-locale')"
  ],
  'legal.html': [
    'tab-terms','tab-privacy','tab-disclaimer','tab-rgpd','tab-cookies','FADP',
    'window.VC_LOCALE','<script src="./i18n.js">',
    "localStorage.getItem('vc-locale')"
  ]
};

/* ── UTILITIES ───────────────────────────────────────────────── */

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function isAllowed(url) {
  return ALLOWLIST_DOMAINS.some(d => url.includes(d));
}

/* ── [A+B] i18n.js PARSE + PARITY ENGINE ────────────────────── */

/**
 * Walk balanced braces in `src` starting at position `pos` (the '{').
 * Returns the raw substring including the outer braces.
 */
function walkBraces(src, pos) {
  let depth = 0, inStr = false, strCh = '', esc = false;
  for (let i = pos; i < src.length; i++) {
    const ch = src[i];
    if (esc)                           { esc = false; continue; }
    if (ch === '\\' && inStr)          { esc = true;  continue; }
    if (!inStr && "'\"`".includes(ch)) { inStr = true;  strCh = ch; continue; }
    if (inStr  && ch === strCh)        { inStr = false; continue; }
    if (inStr)                          continue;
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) return src.slice(pos, i + 1); }
  }
  return null;
}

/**
 * Strip all JS string literal values → replace with "" so words inside
 * translation strings are never confused with object property keys.
 */
function stripStringValues(src) {
  const out = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === "'" || ch === '"' || ch === '`') {
      const q = ch; i++;
      while (i < src.length) {
        const c2 = src[i];
        if (c2 === '\\') { i += 2; continue; }
        if (c2 === q)    { i++;    break;    }
        i++;
      }
      out.push('""');
    } else {
      out.push(ch);
      i++;
    }
  }
  return out.join('');
}

/** Extract JS property key names from a stripped interior block. */
function extractKeys(strippedInterior) {
  const keys  = new Set();
  const KEY_RE = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g;
  let m;
  while ((m = KEY_RE.exec(strippedInterior)) !== null) keys.add(m[1]);
  return keys;
}

/**
 * Read i18n.js from disk, extract the `var D = { ... }` dictionary,
 * return Map<locale, Set<allKeys>> where allKeys is the union of keys
 * across all nested sections (global + home + blog + legal + contract).
 */
function parseI18nFile() {
  const i18nPath = path.join(ROOT, 'i18n.js');
  if (!fs.existsSync(i18nPath)) {
    return { error: 'i18n.js not found at ' + i18nPath };
  }

  const src = fs.readFileSync(i18nPath, 'utf-8');

  /* Find "var D = {" — the dictionary root */
  const dictMarker = 'var D = {';
  const dictIdx    = src.indexOf(dictMarker);
  if (dictIdx === -1) return { error: 'var D = { not found in i18n.js' };

  const bracePos = dictIdx + dictMarker.length - 1;
  const dictBlock = walkBraces(src, bracePos);
  if (!dictBlock) return { error: 'Unbalanced braces in i18n.js var D' };

  const result = new Map();

  for (const locale of EXPECTED_LOCALES) {
    /* Find locale block: pattern is  'de-CH': {
 (with brace, not the VALID object)
     * We scan for "'<locale>'" followed ONLY by optional whitespace then ": {" */
    const localeStr = "'" + locale + "': {";
    const locIdx    = dictBlock.indexOf(localeStr);
    if (locIdx === -1) { result.set(locale, null); continue; }

    /* braceIdx is the '{' at the end of the match string */
    const braceIdx = locIdx + localeStr.length - 1;

    /* Extract the full locale object */
    const localeObj = walkBraces(dictBlock, braceIdx);
    if (!localeObj) { result.set(locale, null); continue; }

    /* Collect keys from ALL sections (global, home, blog, legal, contract).
     * Section keys are BARE identifiers (home:) not quoted ('home':). */
    const SECTIONS = ['global','home','blog','legal','contract'];
    const allKeys  = new Set();

    for (const section of SECTIONS) {
      /* Match "    home: {" — bare key at word boundary */
      const secPattern = new RegExp('\\b' + section + '\\s*:\\s*\\{');
      const secMatch   = secPattern.exec(localeObj);
      if (!secMatch) continue;

      const secBrace = localeObj.indexOf('{', secMatch.index + secMatch[0].length - 1);
      if (secBrace === -1) continue;

      const secObj = walkBraces(localeObj, secBrace);
      if (!secObj) continue;

      const interior = secObj.slice(1, -1);
      const stripped = stripStringValues(interior);
      const keys     = extractKeys(stripped);
      keys.forEach(key => allKeys.add(section + '.' + key));
    }

    result.set(locale, allKeys);
  }

  return { map: result };
}

function auditI18nParity() {
  console.log('\n[SEC-i18n] Reading i18n.js ...');
  const parsed = parseI18nFile();

  if (parsed.error) {
    console.error('[CRITICAL-FATAL][i18n] ' + parsed.error);
    return 1;
  }

  const localeMap = parsed.map;
  let violations  = 0;

  /* Verify all locales present */
  for (const locale of EXPECTED_LOCALES) {
    if (!localeMap.get(locale)) {
      console.error(`[VIOLATION][i18n] Locale ausente ou inválido: '${locale}'`);
      violations++;
    }
  }
  if (violations > 0) return violations;

  const refKeys = localeMap.get('de-CH'); /* canonical reference = primary market */
  console.log(`[SEC-i18n] Reference locale de-CH: ${refKeys.size} keys`);

  for (const [locale, keys] of localeMap.entries()) {
    if (locale === 'de-CH') continue;
    let lv = 0;
    for (const k of refKeys) {
      if (!keys.has(k)) {
        console.error(`[VIOLATION][i18n] Missing key in '${locale}': ${k}`);
        violations++; lv++;
      }
    }
    for (const k of keys) {
      if (!refKeys.has(k)) {
        console.error(`[VIOLATION][i18n] Extra key (not in de-CH) in '${locale}': ${k}`);
        violations++; lv++;
      }
    }
    if (lv === 0) console.log(`[SEC-ACK][i18n] '${locale}': parity 1:1 (${keys.size} keys) ✓`);
  }

  if (violations === 0)
    console.log(`[SEC-PASS][i18n] 1:1 parity confirmed — ${EXPECTED_LOCALES.length} locales × ${refKeys.size} keys ✓`);

  return violations;
}

/* ── [F] ANTI-BLEED ENGINE ───────────────────────────────────── */

/**
 * Strip regions that legitimately contain PT text so we don't false-positive:
 *   • <script>…</script> blocks (i18n dictionaries, JS logic)
 *   • <code>…</code>  (technical identifiers like localStorage('vc-locale'))
 *   • data-i18n="…"  attribute values
 *   • HTML comments
 *   • <meta> tags
 */
function stripLegitPtRegions(html) {
  let s = html;
  /* Remove <script> blocks (contain i18n dicts + engine with PT strings) */
  s = s.replace(/<script[\s\S]*?<\/script>/gi, '<script>[STRIPPED]</script>');
  /* Remove HTML comments */
  s = s.replace(/<!--[\s\S]*?-->/g, '');
  /* Remove <code> inline content (technical identifiers) */
  s = s.replace(/<code[^>]*>[\s\S]*?<\/code>/gi, '<code>[STRIPPED]</code>');
  /* Remove <meta> tags */
  s = s.replace(/<meta[^>]*>/gi, '');
  /* Pass 1 — strip id-bearing block elements (i18n-managed at runtime).
   * Regex handles multi-line content via [\s\S]*? */
  var idTagRe = /<(h[1-6]|p|span|a|button|div|li|td|label|small)[^>]*\bid="[^"]*"[^>]*>([\s\S]*?)<\/\1>/gi;
  s = s.replace(idTagRe, function(m, tag) { return '<' + tag + ' id="[M]">[i18n]</' + tag + '>'; });
  /* Pass 2 — <li> items (pricing/features rendered by applyLocale) */
  s = s.replace(/<li>[^<]{3,}<\/li>/gi, '<li>[i18n]</li>');
  /* Pass 3 — data-nav anchor text */
  s = s.replace(/data-nav="[^"]*"[^>]*>([^<]+)/g, 'data-nav="">[M]');
  /* Pass 4 — maintenance-text node */
  s = s.replace(/id="maintenance-text"[^>]*>([\s\S]*?)<\//gi, 'id="maintenance-text">[M]</');
  /* Pass 4b — data-tier-unit paragraphs (pricing, rendered by applyLocale) */
  s = s.replace(/data-tier-unit="[^"]*"[^>]*>[^<]*/g, 'data-tier-unit="">[M]');
  /* Pass 5 — data-wip text */
  s = s.replace(/data-wip[^>]*>[^<]*/g, '[M]');
  /* Pass 6 — cookie banner span */
  s = s.replace(/<p[^>]*>\s*<span id="cookie-text">[^<]*<\/span>/gi, '<p>[M]');
  /* Pass 7 — <label> elements (contract form labels, managed by applyT) */
  s = s.replace(/<label[^>]*>([^<]{1,120})<\/label>/gi, '<label>[M]</label>');
  /* Pass 8 — <td> text content (UAT table cells, managed by applyT) */
  s = s.replace(/<td>([^<]{2,80})<\/td>/gi, '<td>[M]</td>');
  /* Pass 9 — input placeholders (managed at runtime) */
  s = s.replace(/placeholder="[^"]*"/g, 'placeholder="[M]"');
  return s;
}

function antiBleedScan(file, content) {
  const stripped = stripLegitPtRegions(content);
  let violations = 0;

  for (const pattern of PT_BLEED_PATTERNS) {
    /* Scan the FULL stripped string (not line-by-line) to handle multi-line elements */
    const globalPat = new RegExp(pattern.source, 'gi');
    let m;
    while ((m = globalPat.exec(stripped)) !== null) {
      /* Find approximate line number */
      const lineNum = stripped.slice(0, m.index).split('\n').length;
      /* Extract context around the match */
      const ctxStart = Math.max(0, m.index - 30);
      const ctx = stripped.slice(ctxStart, m.index + 60).replace(/\n/g, ' ').trim();
      console.error(`[VIOLATION][ANTI-BLEED] PT "${m[0]}" in ${file}:${lineNum} — ${ctx.slice(0,80)}`);
      violations++;
    }
  }

  if (violations === 0) console.log(`[SEC-ACK][ANTI-BLEED] ${file}: zero PT bleed ✓`);
  return violations;
}

/* ── MAIN GATE ───────────────────────────────────────────────── */

function gate() {
  console.log('[SEC-INIT] Gatekeeper v3.0 — Root: ' + ROOT);
  console.log('─'.repeat(64));
  let totalViolations = 0;

  /* ── [A+B] i18n.js parity ── */
  totalViolations += auditI18nParity();

  /* ── [C–F] Per-file checks ── */
  for (const file of FILES_TO_CHECK) {
    const filePath = path.join(ROOT, file);

    if (!fs.existsSync(filePath)) {
      console.error(`[CRITICAL-FATAL] Missing artefact: ${file}`);
      process.exit(1);
    }

    const buf     = fs.readFileSync(filePath);
    const content = buf.toString('utf-8');
    const digest  = sha256(buf);

    console.log(`\n[SEC-CHECK] ${file}  ${buf.length.toLocaleString()}B  sha256=${digest}`);

    /* [C] CSP tokens */
    for (const token of REQUIRED_CSP_TOKENS) {
      if (!content.includes(token)) {
        console.error(`[VIOLATION][CSP] Missing directive in ${file}: ${token}`);
        totalViolations++;
      }
    }

    /* [D] Structural tokens */
    const required = STRUCT_TOKENS[file] || [];
    for (const token of required) {
      if (!content.includes(token)) {
        console.error(`[VIOLATION][STRUCT] Missing token in ${file}: ${token}`);
        totalViolations++;
      }
    }

    /* [E] External asset allowlist */
    const EXT_RE = /<(?:script|link|img|iframe)[^>]+(?:src|href)=["'](https?:\/\/[^"']+)["']/gi;
    let m;
    while ((m = EXT_RE.exec(content)) !== null) {
      const url = m[1];
      if (!isAllowed(url)) {
        console.error(`[VIOLATION][CSP] Unauthorised external dependency in ${file}: ${url}`);
        totalViolations++;
      }
    }
    if (content.includes('fonts.googleapis.com')) {
      console.error(`[VIOLATION][CSP] Google Fonts external dependency in ${file}`);
      totalViolations++;
    }

    /* [F] Anti-Bleed scan */
    totalViolations += antiBleedScan(file, content);

    /* [G] FCP boot presence on secondary pages */
    if (file !== 'index.html') {
      if (!content.includes('window.VC_LOCALE')) {
        console.error(`[VIOLATION][FCP] Missing FCP locale boot in ${file}`);
        totalViolations++;
      }
      if (!content.includes('<script src="./i18n.js">')) {
        console.error(`[VIOLATION][FCP] Missing <script src="./i18n.js"> in ${file}`);
        totalViolations++;
      }
    }
  }

  /* ── VERDICT ── */
  console.log('\n' + '═'.repeat(64));
  if (totalViolations > 0) {
    console.error(`[CRITICAL-FATAL] ${totalViolations} violation(s) detected. Pipeline aborted.`);
    process.exit(1);
  }
  console.log('[SEC-PASS] All artefacts clean. i18n parity 100%. Zero PT bleed. Deployment authorised. ✓');
}

gate();
