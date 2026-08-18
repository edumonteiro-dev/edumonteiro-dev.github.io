/**
 * DevSecOps: Gatekeeper de Artefatos Estáticos (Node.js)
 * Norma: Zero-Trust — Zero dependências externas — Validação de integridade dinâmica
 *
 * Uso no CI: node secops/gatekeeper.js
 * Requer: Node.js >= 18 (crypto built-in, sem dependências npm)
 *
 * v2.2 — i18n AST audit engine:
 *   - extractI18nBlock:  balanced-brace walk, extrai o objeto "var i18n={...}"
 *   - extractLocaleBlock: navega até cada chave de locale no bloco ORIGINAL
 *                         e extrai o conteúdo interno (sem strip — as locale
 *                         keys são encontradas no raw, as property keys via
 *                         strip do bloco interno)
 *   - stripStringValues: apaga valores de string para evitar falsos positivos
 *                        (palavras dentro de traduções não são confundidas
 *                        com chaves JS)
 *   Pipeline falha (exit 1) se qualquer chave estiver ausente numa locale.
 */
'use strict';
const fs     = require('fs');
const crypto = require('crypto');
const path   = require('path');

const ROOT = path.resolve(__dirname, '..');

const FILES_TO_CHECK    = ['index.html', 'contract.html', 'legal.html'];
const EXPECTED_LOCALES  = ['pt-PT', 'en-US', 'fr-CH', 'de-CH', 'es-ES', 'it-IT'];

const ALLOWLIST = [
  'kmlucropro.com', 'vozdocondutor.com', 'vdcpt.github.io',
  'linkedin.com', 'github.com', 'workana.com', 'upwork.com', '99freelas.com',
  'share.google', 'api.web3forms.com', 'monteiro.is-a.dev',
  'www.cnpd.pt', 'www.edoeb.admin.ch',
];
const EXT_ASSET_RE = /<(?:script|link|img|iframe)[^>]+(?:src|href)=["'](https?:\/\/[^"']+)["']/gi;

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}
function isAllowed(url) {
  return ALLOWLIST.some(d => url.includes(d));
}

/* ──────────────────────────────────────────────────────────────────────
 * BALANCED-BRACE WALKER
 * Returns the substring starting at `startPos` (which must be a '{')
 * through its matching closing brace, inclusive.
 * ────────────────────────────────────────────────────────────────────── */
function walkBraces(src, startPos) {
  let depth = 0, inStr = false, strCh = '', esc = false;
  for (let i = startPos; i < src.length; i++) {
    const ch = src[i];
    if (esc)                           { esc = false; continue; }
    if (ch === '\\' && inStr)          { esc = true;  continue; }
    if (!inStr && "'\"`".includes(ch)) { inStr = true;  strCh = ch; continue; }
    if (inStr  && ch === strCh)        { inStr = false; continue; }
    if (inStr)                          continue;
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) return src.slice(startPos, i + 1); }
  }
  return null;
}

/* ──────────────────────────────────────────────────────────────────────
 * EXTRACT var i18n = { ... }; BLOCK
 * ────────────────────────────────────────────────────────────────────── */
function extractI18nBlock(html) {
  const marker = 'var i18n = {';
  const idx    = html.indexOf(marker);
  if (idx === -1) return null;
  const bracePos = idx + marker.length - 1; // position of '{'
  return walkBraces(html, bracePos);
}

/* ──────────────────────────────────────────────────────────────────────
 * STRIP STRING VALUES from a JS object skeleton.
 * Replaces every quoted string literal with "" so that words inside
 * translation values are invisible to the property-key regex scanner.
 * The locale-key strings ('pt-PT' etc.) are NOT stripped here because
 * we locate them in the ORIGINAL block before calling this function.
 * ────────────────────────────────────────────────────────────────────── */
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

/* ──────────────────────────────────────────────────────────────────────
 * EXTRACT KEYS from a stripped locale block interior.
 * Finds bare JS identifier keys: word followed by optional whitespace
 * then a colon. Works on the de-stringified text so values don't leak.
 * ────────────────────────────────────────────────────────────────────── */
function extractKeys(strippedInterior) {
  const keys  = new Set();
  const KEY_RE = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g;
  let m;
  while ((m = KEY_RE.exec(strippedInterior)) !== null) keys.add(m[1]);
  return keys;
}

/* ──────────────────────────────────────────────────────────────────────
 * BUILD locale -> Set<key> MAP
 *
 * Strategy:
 *  1. Search for the locale literal in the ORIGINAL i18n block (raw).
 *     e.g.  'de-CH': {
 *  2. Use walkBraces on the ORIGINAL to extract the inner content of
 *     that locale object verbatim.
 *  3. stripStringValues on the inner content to neutralise value words.
 *  4. extractKeys on the stripped interior.
 * ────────────────────────────────────────────────────────────────────── */
function buildLocaleKeyMap(i18nBlock) {
  const result = new Map();

  for (const locale of EXPECTED_LOCALES) {
    // Find the locale string key in the raw block
    // Pattern: 'de-CH'  (or "de-CH") followed by : {
    const searchStr = "'" + locale + "'";
    const localeIdx = i18nBlock.indexOf(searchStr);

    if (localeIdx === -1) {
      result.set(locale, null);
      continue;
    }

    // Walk forward from the locale key to find the opening brace of its object
    let braceIdx = -1;
    let j = localeIdx + searchStr.length;
    while (j < i18nBlock.length) {
      const ch = i18nBlock[j];
      if (ch === '{') { braceIdx = j; break; }
      if (ch !== ':' && ch !== ' ' && ch !== '\t' && ch !== '\n' && ch !== '\r') break;
      j++;
    }

    if (braceIdx === -1) { result.set(locale, null); continue; }

    const localeObjRaw = walkBraces(i18nBlock, braceIdx);
    if (!localeObjRaw) { result.set(locale, null); continue; }

    // Interior = strip the outer { }
    const interior = localeObjRaw.slice(1, -1);
    const stripped  = stripStringValues(interior);
    result.set(locale, extractKeys(stripped));
  }

  return result;
}

/* ──────────────────────────────────────────────────────────────────────
 * i18n PARITY AUDIT — public entry point
 * ────────────────────────────────────────────────────────────────────── */
function auditI18nParity(html) {
  let violations = 0;

  const i18nBlock = extractI18nBlock(html);
  if (!i18nBlock) {
    console.error('[VIOLATION][i18n] Bloco var i18n não encontrado em index.html');
    return 1;
  }

  const localeMap = buildLocaleKeyMap(i18nBlock);

  // Verify presence of all expected locales
  for (const locale of EXPECTED_LOCALES) {
    if (!localeMap.get(locale)) {
      console.error(`[VIOLATION][i18n] Locale ausente ou não parseável: '${locale}'`);
      violations++;
    }
  }
  if (violations > 0) return violations;

  const refKeys = localeMap.get('pt-PT');

  for (const [locale, keys] of localeMap.entries()) {
    if (locale === 'pt-PT') continue;
    let lv = 0;
    for (const k of refKeys)  { if (!keys.has(k)) { console.error(`[VIOLATION][i18n] Chave ausente no idioma: '${locale}' -> '${k}'`); violations++; lv++; } }
    for (const k of keys)     { if (!refKeys.has(k)) { console.error(`[VIOLATION][i18n] Chave extra (não em pt-PT): '${locale}' -> '${k}'`); violations++; lv++; } }
    if (lv === 0) console.log(`[SEC-ACK][i18n] '${locale}': paridade 1:1 (${keys.size} chaves). ✓`);
  }

  if (violations === 0) {
    console.log(`[SEC-PASS][i18n] Paridade 1:1 confirmada — ${EXPECTED_LOCALES.length} locales × ${refKeys.size} chaves. ✓`);
  }
  return violations;
}

/* ──────────────────────────────────────────────────────────────────────
 * MAIN GATE
 * ────────────────────────────────────────────────────────────────────── */
function gate() {
  console.log('[SEC-INIT] Gatekeeper v2.2 iniciado. Root:', ROOT);
  let violations = 0;

  for (const file of FILES_TO_CHECK) {
    const filePath = path.join(ROOT, file);
    if (!fs.existsSync(filePath)) {
      console.error(`[CRITICAL-FATAL] Artefacto ausente: ${file}`);
      process.exit(1);
    }

    const buf     = fs.readFileSync(filePath);
    const content = buf.toString('utf-8');
    const digest  = sha256(buf);

    console.log(`\n[SEC-CHECK] ${file}  ${buf.length.toLocaleString()}B  sha256=${digest}`);

    // External asset allowlist
    let match;
    EXT_ASSET_RE.lastIndex = 0;
    while ((match = EXT_ASSET_RE.exec(content)) !== null) {
      const url = match[1];
      if (!isAllowed(url)) {
        console.error(`[VIOLATION][CSP] Dependência externa não autorizada em ${file}: ${url}`);
        violations++;
      }
    }

    if (file === 'index.html') {
      const required = [
        'id="services"', 'id="pricing"', 'id="contact"',
        'id="projects"', 'id="process"',
        'function applyLocale',
        'neural-canvas',
        'function openScopeModal',
        'async function submitScope',
        'api.web3forms.com',
        'Eduardo Monteiro', 'monteiro.is-a.dev',
        'edumonteiro.dev@gmail.com',
        'serviceWorker',
        'manifest.json',
        // DE i18n bleed correction tokens
        'SaaS-Entwicklung',
        'KI-Integration',
        'Kritische Systeme',
        'Analytik & BI',
        'Laufende Wartung',
        'Schichtmanagement',
        'B2B-Bedingungen',
        'Datenschutz',
        'Cookie-Richtlinie',
        'DSG / DSGVO',
        // CSP Zero-Trust tokens
        "frame-src 'none'",
        "object-src 'none'",
        'https://api.web3forms.com',
        // Footer id-based i18n rendering
        'id="footer-terms"',
        'id="footer-gdpr"',
      ];
      for (const token of required) {
        if (!content.includes(token)) {
          console.error(`[VIOLATION][STRUCT] Token obrigatório ausente em ${file}: ${token}`);
          violations++;
        }
      }
      if (content.includes('fonts.googleapis.com')) {
        console.error(`[VIOLATION][CSP] Dependência externa Google Fonts em ${file}`);
        violations++;
      }

      console.log('\n[SEC-i18n] Auditoria de paridade de chaves i18n...');
      violations += auditI18nParity(content);
    }

    if (file === 'contract.html') {
      const required = ['payment-50','payment-hr','uat-table','sig-grid','rules-grid','annexA','annexB'];
      for (const token of required) {
        if (!content.includes(token)) {
          console.error(`[VIOLATION][STRUCT] Secção obrigatória ausente em ${file}: ${token}`);
          violations++;
        }
      }
    }

    if (file === 'legal.html') {
      for (const token of ['tab-terms','tab-privacy','tab-disclaimer','tab-rgpd','tab-cookies','FADP']) {
        if (!content.includes(token)) {
          console.error(`[VIOLATION][LEGAL] Token legal ausente em ${file}: ${token}`);
          violations++;
        }
      }
    }
  }

  console.log('\n' + '─'.repeat(60));
  if (violations > 0) {
    console.error(`[CRITICAL-FATAL] ${violations} violação(ões) detectada(s). Pipeline abortada.`);
    process.exit(1);
  }
  console.log('[SEC-PASS] Todos os artefactos íntegros. Paridade i18n 100%. Deployment autorizado. ✓');
}

gate();
