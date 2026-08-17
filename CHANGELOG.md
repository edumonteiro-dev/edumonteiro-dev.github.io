# CHANGELOG — Vibe Coder | Eduardo Monteiro Dev

> Repositório: `monteiro.is-a.dev` · Deployment Target: Vercel / Netlify Edge Network  
> Norma de versionamento: [Semantic Versioning 2.0.0](https://semver.org)  
> Formato: [Keep a Changelog 1.0.0](https://keepachangelog.com)

---

## [v11.0.2] — 2026-08-16 · Dynamic B2B Pricing per Locale + Blog i18n Modal

### Sumário Executivo

Release correctiva com três intervenções cirúrgicas: (1) pricing dinâmico por locale e moeda no `index.html`, eliminando a paridade forçada EUR para todos os mercados; (2) seletor de idioma injectado no `blog.html` com troca instantânea sem reload; (3) cobertura i18n 100% da shell do `blog.html`, incluindo footer links e WIP badges.

Resultado da pipeline: `[SEC-PASS] — 0 violações. Deployment autorizado.`

---

### CHANGED

#### `index.html` · 111,801 B · sha256=`20c9a7b5ae46abe08ce8ea1a393fd730600c864cc63bb7326dc0465d6596a810`

**Pricing dinâmico por locale e moeda — matriz `PRICING`:**

| Locale | Modelo 50/50 (Tier Pro) | Modelo Horário | Moeda |
|---|---|---|---|
| `pt-PT` | 3.000€–5.500€ | 60€–80€/h | EUR |
| `es-ES` | 3.000€–5.500€ | 60€–80€/h | EUR |
| `en-US` | $3,500–$6,000 | $130–$160/h | USD |
| `fr-CH` | 3.200–5.800 CHF | 140–170 CHF/h | CHF |
| `de-CH` | 3.200–5.800 CHF | 140–170 CHF/h | CHF |
| `it-IT` | 3.200–5.800 CHF | 140–170 CHF/h | CHF |

- Motor `PRICING` substituiu o array estático `prices50` / `pricesHr` — preços e unidades agora derivados de locale, não hardcoded.
- Função `_applyPricing(locale, model)` exposta em `window` para chamada síncrona por `applyLocale()` a cada troca de idioma.
- Toggle 50%/50% ↔ Horário preserva o locale activo — sem reset de moeda.
- `maintenanceText` integrado na matriz `PRICING` por locale com moeda correcta (CHF/EUR/USD).
- Hook em `applyLocale()`: `window._applyPricing(locale, activeModel)` chamado após cada troca de idioma.

#### `blog.html` · 28,228 B · sha256=`fc3ca6fd5309283f76226c52c8a2300f44eb2b3b3c9a136556d8f7003c535538`

**Seletor de idioma injectado na header:**
- Dropdown `#lang-dropdown` com 6 opções (`pt-PT`, `en-US`, `fr-CH`, `de-CH`, `es-ES`, `it-IT`).
- Click fora fecha o dropdown — `document.addEventListener('click', ...)`.
- Selecção: `localStorage.setItem('vc-locale', locale)` + `applyBlogLocale()` instantâneo — zero page reload.
- Estado activo sincronizado visualmente via classe `.active` na opção seleccionada.

**Cobertura i18n 100% da shell — strings mapeadas por locale:**

| ID no DOM | Traduzido |
|---|---|
| `bh-back` | ✓ (back link) |
| `bh-lang-current` | ✓ (label do botão) |
| `blog-eyebrow` | ✓ |
| `blog-title` | ✓ |
| `blog-sub` | ✓ |
| `topics-label` | ✓ |
| `wip-01` … `wip-10` | ✓ (10 badges) |
| `cs-title` | ✓ |
| `cs-desc` | ✓ |
| `cs-cta` + `href` mailto | ✓ (body localizado) |
| `ft-privacy` | ✓ |
| `ft-terms` | ✓ |
| `ft-cookies` | ✓ |

**Conteúdo editorial protegido:** títulos e descrições dos artigos #03 (DE-CH), #04 (FR-CH), #05 (IT-CH), #06 (EN) sem `data-i18n` — imunes à troca de locale da shell.

---

### INTEGRITY — Artefactos Modificados (v11.0.2 vs v11.0.1)

| Ficheiro | v11.0.1 SHA-256 | v11.0.2 SHA-256 |
|---|---|---|
| `index.html` | `5847449d…` | `20c9a7b5ae46abe08ce8ea1a393fd730600c864cc63bb7326dc0465d6596a810` |
| `blog.html` | `b37f62d0…` | `fc3ca6fd5309283f76226c52c8a2300f44eb2b3b3c9a136556d8f7003c535538` |

Todos os outros artefactos permanecem com os checksums da v11.0.1.

---

## [v11.0.1] — 2026-08-16 · Hotfix: Blog i18n State Sync

### Sumário Executivo

Hotfix crítico à v11.0.0. A versão anterior continha um bug de perda de estado transversal de idioma: ao navegar de `index.html` (com locale alterado) para `blog.html`, a shell da página renderizava sempre em `pt-PT` independentemente da preferência persistida. A v11.0.0 é considerada tecnicamente comprometida para utilizadores internacionais.

Resultado da pipeline: `[SEC-PASS] — 0 violações. Deployment autorizado.`

---

### FIXED

#### `blog.html` · 24,544 B · sha256=`b37f62d0d1d954aeb9318357a07cecc083ba812e05d15fbe1138efadb7d8f299`

**Bug:** `blog.html` declarava `<html lang="pt-PT">` estático e não continha qualquer lógica de leitura de `localStorage`. O valor `vc-locale` persistido pelo `index.html` era ignorado na totalidade — a shell do blog renderizava sempre em Português independentemente do idioma seleccionado pelo utilizador.

**Correcção:** Introdução do motor `applyBlogLocale()` — leitura síncrona de `localStorage.getItem('vc-locale')` no fecho do `<body>` (sem `DOMContentLoaded`, eliminando FOUC).

**Cobertura de idiomas — 6 locales completos, espelhando o Design System do `index.html`:**

| Locale | Elementos traduzidos |
|---|---|
| `pt-PT` | eyebrow, título, subtítulo, topics-label, 10× wip-badge, cs-title, cs-desc, cs-cta, mailto body, back-link |
| `en-US` | idem |
| `fr-CH` | idem |
| `de-CH` | idem |
| `es-ES` | idem |
| `it-IT` | idem |

**Conteúdo editorial protegido (intocável):** os títulos e descrições dos 10 artigos em DE-CH (#03), FR-CH (#04), IT-CH (#05) e EN (#06) não foram alterados — são conteúdo editorial multilingue nativo, não shell da página.

**Fallback:** `BLOG_I18N['pt-PT']` activado quando `vc-locale` é `null` (primeiro acesso sem preferência persistida).

**`document.documentElement.lang`** actualizado dinamicamente por locale para conformidade semântica HTML5 e acessibilidade WCAG 2.1.

---

### INTEGRITY — Artefacto Modificado (v11.0.1 vs v11.0.0)

| Ficheiro | v11.0.0 SHA-256 | v11.0.1 SHA-256 |
|---|---|---|
| `blog.html` | `29c7cce1f6d0db1abedb5df8582669d6c42959870d7308f95a2446a617f34b4c` | `b37f62d0d1d954aeb9318357a07cecc083ba812e05d15fbe1138efadb7d8f299` |

Todos os outros artefactos permanecem com os checksums da v11.0.0.

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
