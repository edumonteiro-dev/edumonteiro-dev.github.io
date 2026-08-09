# Eduardo Monteiro — AI-Powered Full-Stack Developer Portfolio

**Live:** https://monteiro.is-a.dev  
**Email:** edumonteiro.dev@gmail.com  
**GitHub:** https://github.com/edumonteiro-dev

## Soluções Tecnológicas de Alto Desempenho, Fiáveis e Escaláveis

Sistema de alto desempenho e máxima fiabilidade, desenvolvido com código limpo, rigorosamente tipado e de fácil manutenção. Totalmente otimizado para velocidade, SEO e escalabilidade.

## Deploy Targets

| Platform      | Config File      | Command / Action                              |
|---------------|------------------|-----------------------------------------------|
| Vercel        | `vercel.json`    | `vercel --prod` or import via dashboard       |
| Netlify       | `netlify.toml`   | Drag & drop folder or `netlify deploy --prod` |
| Workana       | —                | Link: https://edumonteiro-dev.github.io       |
| Upwork        | —                | Link: https://edumonteiro-dev.github.io       |
| 99Freelas     | —                | Link: https://edumonteiro-dev.github.io       |

## File Structure

```
/
├── index.html          # Portfolio SPA — JS/CSS 100% inlined (GitHub Pages safe)
├── contract.html       # MSA + SOW + UAT — JS/CSS 100% inlined
├── assets/
│   ├── logo.svg        # EM monogram — hexagonal neural network (purple/teal)
│   └── favicon.svg     # EM favicon — 32×32 SVG
├── .nojekyll           # Bypass Jekyll build on GitHub Pages
├── vercel.json         # Static routing + HTTP security headers
├── netlify.toml        # Redirects + CSP + HSTS headers
└── _redirects          # Netlify SPA fallback rule
```

## Security Headers (All Platforms)

- `Content-Security-Policy` — strict allowlist
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security` — max-age 2 years + preload
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` — camera/mic/geo/payment blocked

## i18n — 6 Markets

`PT-PT` · `EN-US` · `FR-CH` · `DE-CH` · `ES-ES` · `IT-IT`  
Locale persisted in `localStorage('vc-locale')` — shared between `index.html` and `contract.html`.

## Contract (contract.html)

- Payment model toggle: **50%+50% Fixed** or **T&M Hourly with Cap**
- Full legal clauses in all 6 languages
- UAT Checklist T01–T11 (interactive checkboxes)
- Definition of Done (DoD) checklist
- Annex A: SOW template (fillable)
- Annex B: Timesheet template (fillable)
- 4 Golden Financial Rules
- Governing law: **Swiss law — Zurich courts**
- Print-optimised CSS (`window.print()`)

## Projects Featured

1. *kmlucropro.com* — SaaS TVDE (Live)
2. *Voz do Condutor* — vozdocondutor.com (Live)
3. *Sistema Biométrico* — Fingerprint matching
4. *UNIFED PROBATUM* — Analytics dashboard (Live)
5. *Gestão de Turnos* — HR scheduling
6. *Metodologia de Testes* — QA framework.

---
*© 2026 Eduardo Monteiro · edumonteiro-dev.github.io*
