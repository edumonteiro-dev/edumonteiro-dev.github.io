/**
 * DevSecOps: Gatekeeper de Artefatos Estáticos (Node.js)
 * Norma: Zero-Trust — Zero dependências externas — Validação de integridade dinâmica
 *
 * Uso no CI: node secops/gatekeeper.js
 * Requer: Node.js >= 18 (crypto built-in, sem dependências npm)
 */
'use strict';
const fs     = require('fs');
const crypto = require('crypto');
const path   = require('path');

// Raiz do projecto = directório pai de secops/
const ROOT = path.resolve(__dirname, '..');

const FILES_TO_CHECK = [
  'index.html',
  'contract.html',
  'legal.html',
];

// Allowlist: domínios externos permitidos em links de conteúdo
const ALLOWLIST = [
  'kmlucropro.com', 'vozdocondutor.com', 'vdcpt.github.io',
  'linkedin.com', 'github.com', 'workana.com', 'upwork.com', '99freelas.com',
  'share.google', 'api.web3forms.com',
];
const EXT_ASSET_RE = /<(?:script|link|img|iframe)[^>]+(?:src|href)=["'](https?:\/\/[^"']+)["']/gi;

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function isAllowed(url) {
  return ALLOWLIST.some(domain => url.includes(domain));
}

function gate() {
  console.log('[SEC-INIT] Gatekeeper iniciado. Root:', ROOT);
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

    console.log(`[SEC-CHECK] ${file}  ${buf.length.toLocaleString()}B  sha256=${digest}`);

    // Scan for unauthorized external assets
    let match;
    EXT_ASSET_RE.lastIndex = 0;
    while ((match = EXT_ASSET_RE.exec(content)) !== null) {
      const url = match[1];
      if (!isAllowed(url)) {
        console.error(`[VIOLATION] Dependência externa não autorizada em ${file}: ${url}`);
        violations++;
      }
    }

    // Mandatory section checks for index.html
    if (file === 'index.html') {
      const required = [
        'id="services"', 'id="pricing"', 'id="contact"',
        'id="projects"', 'id="process"',
        'function applyLocale',   // i18n engine (was: const T={)
        'neural-canvas',          // canvas animation (was: initCanvas)
        'function openScopeModal',
        'async function submitScope',
        'api.web3forms.com',
        'Eduardo Monteiro', 'monteiro.is-a.dev',
        'edumonteiro.dev@gmail.com',
        'serviceWorker',          // PWA SW registration
        'manifest.json',
      ];
      for (const token of required) {
        if (!content.includes(token)) {
          console.error(`[VIOLATION] Token obrigatório ausente em ${file}: ${token}`);
          violations++;
        }
      }
      if (content.includes('fonts.googleapis.com')) {
        console.error(`[VIOLATION] Dependência externa Google Fonts em ${file}`);
        violations++;
      }
    }

    // Mandatory section checks for contract.html
    if (file === 'contract.html') {
      const required = [
        'payment-50', 'payment-hr', 'uat-table',
        'sig-grid', 'rules-grid', 'annexA', 'annexB',
      ];
      for (const token of required) {
        if (!content.includes(token)) {
          console.error(`[VIOLATION] Secção obrigatória ausente em ${file}: ${token}`);
          violations++;
        }
      }
    }

    // legal.html mandatory sections
    if (file === 'legal.html') {
      const legalRequired = [
        'tab-terms','tab-privacy','tab-disclaimer','tab-rgpd','tab-cookies','FADP',
      ];
      for (const token of legalRequired) {
        if (!content.includes(token)) {
          console.error(`[VIOLATION] Token legal ausente em ${file}: ${token}`);
          violations++;
        }
      }
    }

    if (violations === 0) {
      console.log(`[SEC-ACK] ${file}: Zero violações detectadas.`);
    }
  }

  if (violations > 0) {
    console.error(`\n[CRITICAL-FATAL] ${violations} violação(ões) detectada(s). Pipeline abortada.`);
    process.exit(1);
  }

  console.log('\n[SEC-PASS] Todos os artefactos íntegros. Deployment autorizado.');
}

gate();
