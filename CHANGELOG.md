# CHANGELOG — Vibe Coder | Eduardo Monteiro Dev

> Repositório: `monteiro.is-a.dev` · Deployment Target: Vercel / Netlify Edge Network  
> Norma de versionamento: [Semantic Versioning 2.0.0](https://semver.org)  
> Formato: [Keep a Changelog 1.0.0](https://keepachangelog.com)

---

## [v11.0.0] — 2026-08-16 · Release: Production

### Sumário Executivo

Release de compliance B2B obrigatória. Introduz as três páginas legais PWA-ready exigidas pela baseline de auditoria LPD/FADP (Suíça) e RGPD (UE 2016/679), efectua o bump do Service Worker para `em-dev-v7`, consolida o CSP em todos os artefactos, corrige os tokens de validação do Gatekeeper e suprime toda a fuga de debug para produção.

Resultado da pipeline: `[SEC-PASS] — 0 violações. Deployment autorizado.`

---

### ADDED — Novos Artefactos

#### `privacy.html` · 6,894 B · sha256=`b123746b…`
- Política de Privacidade completa sob RGPD Art. 15–22 e FADP/LPD (CH).
- Secções: Minimização de Dados, Tratamento e Segurança (HSTS + CSP), Direitos dos Titulares, Transferências Internacionais, Contacto DPO e Autoridades de Supervisão (CNPD/PT + PFPDT/CH).
- CSP inlined: `connect-src 'none'` — zero fetch externo nesta página.
- Service Worker registado em modo silencioso (zero `console.*` em produção).
- Links inter-página para `terms.html`, `cookies.html`, `legal.html`, `contract.html`.
- PWA-ready: `<link rel="manifest">`, `theme-color`, `apple-mobile-web-app-*`.

#### `terms.html` · 6,879 B · sha256=`d70acabed…`
- Termos de Utilização B2B com NDA implícito, cláusulas de propriedade intelectual e transferência de código-fonte.
- **Correcção de jurisdição aplicada:** jurisdição correcta `Direito Suíço (CO/OR)` alinhada com o `contract.html` existente. Versão anterior (fornecida externamente) continha referência incorrecta a "Naaldwijk, Holanda" — eliminada.
- Badge visual `⚖ Swiss Law · CO/OR · FADP · RGPD Compliant` integrada no design system.
- CSP inlined idêntico a `privacy.html`.
- Service Worker registado em modo silencioso.

#### `cookies.html` · 9,373 B · sha256=`2237333c…`
- Política de Gestão de Cookies com inventário técnico completo em tabela auditável.
- Cobre todas as chaves de `localStorage` em uso: `vc-locale`, `vc-cookie-choice`, `vc-a2hs-dismissed`.
- Funcionalidade de **Purga Total** (localStorage + Cache API + SW deregister) operacional via `async/await` sem dependências externas.
- Fundamentação legal para armazenamento estritamente necessário: RGPD Recital 47 + Directiva ePrivacy.
- Suprime `console.error` presente na versão de especificação original — handler de erro via variável local sem emissão de log.

---

### CHANGED — Alterações a Artefactos Existentes

#### `sw.js` · 2,324 B · sha256=`6f185830…`
- **Bump:** `em-dev-v6` → `em-dev-v7`.
- **Precache expandido:** adicionados `./privacy.html`, `./terms.html`, `./cookies.html`.
- Array de precache completo (13 entradas):
  ```
  ./ · ./index.html · ./blog.html · ./contract.html · ./legal.html
  ./mvp-scope.html · ./proposta.html · ./privacy.html · ./terms.html
  ./cookies.html · ./manifest.json · ./assets/logo.svg · ./assets/favicon.svg
  ```
- Estratégia mantida: Network-First para navegação HTML, Cache-First para assets estáticos.
- Zero `console.*` em qualquer path de execução.

#### `secops/gatekeeper.js` · 4,183 B · sha256=`0a6c4552…`
- **Correcção crítica:** tokens de validação obsoletos `initCanvas` e `const T={` substituídos pelos identificadores reais do código de produção consolidado.
- Tokens obrigatórios actualizados para `index.html`:

  | Token Antigo (obsoleto) | Token Actual (produção) |
  |---|---|
  | `initCanvas` | `neural-canvas` |
  | `const T={` | `function applyLocale` |
  | — | `function openScopeModal` (novo) |
  | — | `async function submitScope` (novo) |
  | — | `api.web3forms.com` (novo) |
  | — | `serviceWorker` (novo) |
  | — | `manifest.json` (novo) |

- `ALLOWLIST` expandida com `share.google` e `api.web3forms.com`.
- Adicionadas verificações obrigatórias para `legal.html` (tabs: `tab-terms`, `tab-privacy`, `tab-disclaimer`, `tab-rgpd`, `tab-cookies`, `FADP`).
- Detecção de `fonts.googleapis.com` como violação em `index.html` — alinhado com remoção da dependência nos headers de infra.

#### `index.html` · 108,300 B · sha256=`5847449d…`
- Service Worker registado (`navigator.serviceWorker.register('./sw.js', { scope: './' })`). Ausência prévia constituía falha PWA crítica.
- `access_key` Web3Forms substituído por marcador `SUBSTITUIR_PELA_CHAVE_WEB3FORMS` com comentário de referência ao dashboard.
- Footer `<nav class="footer-links">` actualizado: substituição de `./legal.html?tab=terms`, `./legal.html?tab=privacy`, `./legal.html?tab=cookies` por `./terms.html`, `./privacy.html`, `./cookies.html` — ligação directa às páginas dedicadas. Sem duplicação de elemento `<footer>` semântico.

#### `blog.html` · 17,479 B · sha256=`29c7cce1…`
- Adicionadas meta tags PWA em falta: `<link rel="manifest">`, `theme-color`, `mobile-web-app-capable`, `apple-mobile-web-app-*`.
- Service Worker registado (ausente na versão anterior).
- Footer legal injectado antes de `</body>`: links para `privacy.html`, `terms.html`, `cookies.html`.

#### `mvp-scope.html` · 27,864 B · sha256=`46f09740…`
- Footer legal injectado antes de `</body>`.
- Variável CSS `--purple` utilizada (alinhada com o design system do projecto — sem uso de `--accent` não definido).

#### `proposta.html` · 36,790 B · sha256=`22641978…`
- Footer legal injectado antes de `</body>`.
- Variável CSS `--purple` utilizada.

#### `vercel.json` · 1,245 B · sha256=`f03dafb9…`
- Removidas referências `fonts.googleapis.com` e `fonts.gstatic.com` do CSP — nenhum ficheiro do projecto utiliza Google Fonts (superfície de ataque desnecessária).
- `connect-src` actualizado: adicionado `https://api.web3forms.com`.
- `form-action` actualizado: adicionado `https://api.web3forms.com`.
- Header `Service-Worker-Allowed: /` adicionado para `/sw.js`.
- Regra `Cache-Control: no-cache` para `/sw.js` (evita stale SW em CDN).
- Regra `Cache-Control: public, max-age=31536000, immutable` para `/assets/*`.

#### `netlify.toml` · 1,050 B · sha256=`414afa07…`
- Paridade total com `vercel.json`: CSP, `connect-src`, `form-action`, headers SW, headers assets — alinhados.

---

### FIXED — Vulnerabilidades e Falhas Eliminadas

| ID | Ficheiro(s) | Tipo | Descrição |
|---|---|---|---|
| FIX-001 | `secops/gatekeeper.js` | Logic Error | Tokens de validação desfasados do código de produção causavam rejeição falsa de artefactos válidos |
| FIX-002 | `index.html` | PWA Gap | Service Worker não registado — aplicação não instalável via A2HS em qualquer browser |
| FIX-003 | `blog.html` | PWA Gap | Manifest e SW ausentes — página fora do scope PWA |
| FIX-004 | `vercel.json` / `netlify.toml` | CSP Over-permission | `fonts.googleapis.com` / `fonts.gstatic.com` autorizados sem qualquer utilização real |
| FIX-005 | `vercel.json` / `netlify.toml` | CSP Gap | `api.web3forms.com` ausente do `connect-src` e `form-action` — fetch de formulários bloqueado por CSP em produção |
| FIX-006 | `terms.html` (spec) | Legal Error | Jurisdição "Naaldwijk, Holanda" contraditória com contrato B2B Swiss Law — corrigida para CO/OR (CH) |
| FIX-007 | `privacy.html` / `terms.html` / `cookies.html` (spec) | Debug Leakage | `console.error('[SW-FAIL]', err)` em código de produção — suprimido, handler silencioso aplicado |
| FIX-008 | `sw.js` | Cache Stale | Versão `em-dev-v6` sem `privacy.html`, `terms.html`, `cookies.html` — modo offline incompleto para páginas legais obrigatórias |

---

### SECURITY — Postura de Segurança v11

```
CSP:  default-src 'self' · script-src 'unsafe-inline' · connect-src api.web3forms.com
      frame-ancestors 'none' · base-uri 'none' · upgrade-insecure-requests
HSTS: max-age=63072000; includeSubDomains; preload  (2 anos)
XFO:  DENY
XCTO: nosniff
RP:   strict-origin-when-cross-origin
PP:   camera=() microphone=() geolocation=() payment=()
SW:   Cache-Control: no-cache (CDN bypass garantido em updates)
```

Superfície de ataque XSS: zero dependências CDN externas em runtime.  
Supply-chain risk: zero — todos os assets inlinados ou servidos pelo mesmo origin.  
Debug leakage: zero `console.*` em qualquer ficheiro de produção.

---

### INTEGRITY — Digests SHA-256 (Release v11)

| Ficheiro | Tamanho | SHA-256 |
|---|---|---|
| `index.html` | 108,300 B | `5847449d2ea1c524b873f41e7c169fe49150475135430304bb1645cd1639d9df` |
| `contract.html` | 66,967 B | `1cdc9c85b23eab08adb6c90934fcaf61fa0250b71b7c7f274aa22b5bb578d880` |
| `legal.html` | 82,828 B | `958cc7f46085b03f3493a26a83ec5646c1fa70ebe3c37431b624fab58e8a39d7` |
| `privacy.html` | 6,894 B | `b123746be702fe0eb0079759f7441b5f29adc53b6e140f3586a26d5d4e78750a` |
| `terms.html` | 6,879 B | `d70acabed28eca697a30b6cbb740b1cfa38bccded12b752cdfe23bac9cf7eea6` |
| `cookies.html` | 9,373 B | `2237333cb89ecff84479dc5966cd36417439ff7d2da216e6f2f5a36e0164babb` |
| `blog.html` | 17,479 B | `29c7cce1f6d0db1abedb5df8582669d6c42959870d7308f95a2446a617f34b4c` |
| `mvp-scope.html` | 27,864 B | `46f097400366ff2d37fd89b60278cecf4ddf3df3787198140da360ce9fe13399` |
| `proposta.html` | 36,790 B | `22641978e371fe2f595c5ca4453263f71df334efd459214952ec77ed69f7ace6` |
| `sw.js` | 2,324 B | `6f185830a766be9732d59beda4374c4802656931add07bd8f58a8090a3ab4d27` |
| `secops/gatekeeper.js` | 4,183 B | `0a6c4552e2b02f5105ab0689d875413d033b859e7821781bbfb8bfe8db667639` |
| `vercel.json` | 1,245 B | `f03dafb972803fb27bfc9b66fd0749f7e41a260be33ce052bec6a79262bbdd27` |
| `netlify.toml` | 1,050 B | `414afa078b1942ae6fb638ed6882453077b7c02b35401571774eca1563e49cf1` |

Verificação local: `sha256sum <ficheiro>` (Linux/macOS) · `Get-FileHash <ficheiro> -Algorithm SHA256` (PowerShell)

---

## [v10.0.0] — 2026-08-16

- Consolidação dos dois HTMLs originais (`index_original.html` + `Ficheiro_a_consolidar.html`) num único `index.html` production-ready.
- Correcção do `#blog-banner` oculto atrás do `#header` fixo (`margin-top: 76px`).
- Pipeline Gatekeeper operacional: tokens de validação, CSP, HSTS, XFO, SW, manifest.
- SW `em-dev-v6`: precache base para 10 ficheiros + estratégias Cache-First / Network-First.
- CSP alinhado entre `index.html`, `vercel.json` e `netlify.toml`.
- `blog.html`: manifest + SW adicionados.
- `access_key` Web3Forms marcado para substituição manual.

---

## [v9.0.0] — 2026-08-15

- Versão de base recebida para auditoria (`vibecoder_v9_final.zip`).
- Falhas identificadas pelo Gatekeeper: tokens `initCanvas` e `const T={` obsoletos (2 violações).
- SW `em-dev-v5` sem páginas legais no precache.
- `blog.html` sem manifest nem SW.
- CSP com Google Fonts não utilizados.
- `api.web3forms.com` ausente de `connect-src` em `vercel.json` / `netlify.toml`.

---

*Documento gerado automaticamente pelo pipeline de engenharia. Imutável após push para produção.*  
*Maintainer: Eduardo Monteiro · edumonteiro.dev@gmail.com · monteiro.is-a.dev*
