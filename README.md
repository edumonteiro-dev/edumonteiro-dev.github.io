# Eduardo Monteiro — AI-Powered Full-Stack Developer Portfolio (v5)

**Live:** https://monteiro.is-a.dev  
**Email:** edumonteiro.dev@gmail.com  
**Contact:** Email · Upwork · Google

---

## Estrutura de Arquivos

```
vibecoder/
│
├── index.html                   # SPA principal — portfólio completo
│   ├── CSS inlined              # Zero dependências externas (system fonts)
│   ├── JS inlined               # i18n engine (6 locales), neural canvas,
│   │                            # scroll reveal, pricing toggle, A2HS modal,
│   │                            # Service Worker registration
│   └── Secções: Hero · Métricas · Serviços · Projetos (8) ·
│                Processo · Stack · Preços · Contacto · Footer
│
├── contract.html                # MSA + SOW completo (B2B)
│   ├── CSS inlined              # Print-optimised
│   ├── JS inlined               # i18n sync com localStorage('vc-locale')
│   └── Secções: Partes · Pagamento 50/50 ou T&M · IP ·
│                UAT T01-T11 · DoD · 4 Regras de Ouro ·
│                Anexo A (SOW) · Anexo B (Timesheet) · Assinaturas
│
├── legal.html                   # Documentação legal e compliance
│   ├── CSS inlined
│   ├── JS inlined               # i18n + tab switching (5 secções × 6 idiomas)
│   └── Secções (tabs):
│       ├── Termos de Utilização
│       ├── Política de Privacidade (Zero-Tracking)
│       ├── Isenção de Responsabilidade
│       ├── RGPD / FADP (Swiss LPD focus)
│       └── Política de Cookies (Zero-Tracking standard)
│
├── manifest.json                # PWA manifest (display: standalone)
│   ├── name, short_name, description
│   ├── start_url: ./index.html
│   ├── background_color: #050508 · theme_color: #7B5CF0
│   └── icons: favicon.svg (any · maskable)
│
├── sw.js                        # Service Worker (PWA)
│   ├── Cache-First para assets estáticos
│   ├── Network-First para HTML (offline fallback → index.html)
│   ├── Cache name: em-dev-v4 (purge automático de versões anteriores)
│   └── Precache: index, contract, legal, manifest, assets
│
├── assets/
│   ├── logo.svg                 # Logo "EM" — hexagonal neural network
│   │                            # Gradiente #7B5CF0 → #00F5A0
│   │                            # text-anchor="middle" + dominant-baseline="central"
│   │                            # Embedded as Base64 data URI nos HTML
│   └── favicon.svg              # Favicon "EM" — 32×32px SVG
│                                # Embedded as Base64 data URI nos HTML
│
├── secops/
│   └── gatekeeper.js            # CI/CD integrity validator (Node.js ≥18)
│       ├── Scans: index.html + contract.html
│       ├── Verifica: zero deps externas não autorizadas
│       ├── Verifica: tokens obrigatórios por ficheiro
│       └── Uso: node secops/gatekeeper.js (exit 1 em caso de violação)
│
├── .github/
│   └── workflows/
│       └── deploy-seguro.yml    # GitHub Actions — Least Privilege OIDC
│           ├── Trigger: push main + workflow_dispatch
│           ├── permissions: contents:read · pages:write · id-token:write
│           ├── concurrency: group pages, cancel-in-progress:true
│           ├── fetch-depth: 1 (shallow clone)
│           └── Actions: checkout@v4 · configure-pages@v4 ·
│                        upload-pages-artifact@v3 · deploy-pages@v4
│
├── CNAME                        # monteiro.is-a.dev (GitHub Pages domain)
├── .nojekyll                    # Bypass Jekyll build (GitHub Pages)
├── _redirects                   # Netlify SPA fallback: /* /index.html 200
│
├── vercel.json                  # Vercel: static routing + security headers
│   └── Headers: CSP · X-Frame-Options:DENY · X-Content-Type-Options:nosniff
│               HSTS (2yr+preload) · Referrer-Policy · Permissions-Policy
│
├── netlify.toml                 # Netlify: redirects + security headers
│   └── [Mesmos headers que vercel.json]
│
└── README.md                    # Este ficheiro
```

---

## i18n — 6 Mercados

| Código | Mercado | Fallback |
|--------|---------|---------|
| `de-CH` | Schweiz (Deutsch) | **Padrão do sistema** |
| `pt-PT` | Portugal | navigator.language |
| `en-US` | United States | navigator.language |
| `fr-CH` | Suisse (Français) | navigator.language |
| `es-ES` | España | navigator.language |
| `it-IT` | Italia | navigator.language |

**Prioridade de resolução:** `localStorage('vc-locale')` → `navigator.languages[]` map → `de-CH`  
**Partilha de estado entre páginas:** `localStorage('vc-locale')` (todas as páginas sincronizadas)

---

## Projectos em Destaque (8)

| # | Projecto | Estado | Stack |
|---|---------|--------|-------|
| 0 | **kmlucropro.com** | 🔴 Live | Next.js · Firebase · Stripe · React |
| 1 | **Voz do Condutor** | 🔴 Live | HTML5 · CSS3 · JS · SEO |
| 2 | **Sistema Biométrico** | Portfolio | Python · OpenCV · PostgreSQL · FastAPI |
| 3 | **UNIFED PROBATUM** | 🔴 Live | D3.js · React · Python · BigQuery |
| 4 | **Gestão de Turnos** | Portfolio | React · Node.js · Firebase · REST |
| 5 | **Metodologia de Testes** | Portfolio | Playwright · Jest · Hotjar · CI/CD |
| 6 | **Haven** | Portfolio | React · TypeScript · WASM · FHIR · CRDT |
| 7 | **SpriCH** | Portfolio | Next.js · OpenAI · Firebase · Stripe |

---

## PWA — Add to Home Screen (A2HS)

- **Chrome/Android:** `beforeinstallprompt` intercetado → modal animado após 3.5s
- **iOS Safari:** Fallback instrutivo "Toca em ⎋ Partilhar → Adicionar ao Ecrã Principal"
- **Estado:** `localStorage('a2hs-dismissed')` (não volta a aparecer após rejeição)
- **Offline:** Service Worker precache → fallback `index.html`

---

## Segurança (Zero-Trust)

| Header | Valor |
|--------|-------|
| CSP | `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;` |
| X-Content-Type-Options | `nosniff` |
| Referrer-Policy | `strict-origin-when-cross-origin` |
| X-Frame-Options | `DENY` (Vercel/Netlify headers) |
| HSTS | `max-age=63072000; includeSubDomains; preload` |
| Permissions-Policy | `camera=(), microphone=(), geolocation=(), payment=()` |

**Zero dependências externas:** sem Google Fonts, sem CDN, sem analytics, sem tracking.  
**Assets inline:** logo.svg e favicon.svg embebidos como Data URIs Base64.

---

## Deploy

### GitHub Pages
```bash
git init && git branch -M main
git add .
git commit -m "feat: portfolio v5 — Eduardo Monteiro"
git remote add origin https://github.com/SEU_USERNAME/portfolio.git
git push -u origin main
# Settings → Pages → Source: GitHub Actions
```

### Vercel
```bash
vercel --prod
```

### Netlify
```bash
netlify deploy --prod --dir .
```

### CI Integrity Gate
```bash
node secops/gatekeeper.js   # exit 0 = deploy autorizado
```

---

## Contrato B2B

`contract.html` implementa o **MSA + SOW** completo com:
- Modelo **50%+50%** (Sinal Não Reembolsável + UAT 5 dias)
- Modelo **T&M** (Taxa horária + Cap mensal + vigência máxima X meses)
- **UAT Checklist** T01–T11 (interactiva)
- **4 Regras de Ouro:** IP Retention · Scope Control · Hour Cap · Zurich Jurisdiction
- **Anexo A:** SOW preenchível | **Anexo B:** Timesheet auditável
- **Lei aplicável:** Suíça — Foro de Zurique

---

*© 2026 Vibe Coder | Eduardo Monteiro | Dev Full-Stack com IA | monteiro.is-a.dev*

---

## Google Search Console — Verificação de Domínio

### Método 1: Registo DNS TXT (Recomendado para `monteiro.is-a.dev`)

Adicionar no painel de DNS do `is-a.dev` (ficheiro JSON do teu subdomínio):

```json
{
  "record": {
    "CNAME": "SEU_USERNAME.github.io",
    "TXT": "google-site-verification=41rGYePmqlc_MYFSnobndRDGndOqhp7N4TC6N8wjnpI"
  }
}
```

### Método 2: Meta Tag HTML (já implementada em `index.html`)

```html
<meta name="google-site-verification" content="NXgQN7yVnzjrSAmjrqZPS8pcB_LBqpkg09ZOdNm6t-o"/>
```

Esta meta tag está **já injectada** em `index.html` — não é necessária nenhuma acção adicional no código.

### Passos de Verificação

1. Acede a [Google Search Console](https://search.google.com/search-console)
2. Adiciona a propriedade `https://monteiro.is-a.dev`
3. Escolhe **Registo DNS** ou **Meta Tag** como método de verificação
4. O DNS TXT propaga em 5–60 minutos
5. Clica **Verificar** no Search Console

