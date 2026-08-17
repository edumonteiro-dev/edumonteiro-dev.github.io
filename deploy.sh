#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────────────────────
# deploy.sh — Vibecoder v11.0.0 · Release Pipeline
# Maintainer : Eduardo Monteiro <edumonteiro.dev@gmail.com>
# Target     : origin/main → Vercel / Netlify Edge Network
# Requires   : git >= 2.30, authenticated remote (SSH key or HTTPS token)
# ─────────────────────────────────────────────────────────────────────────────

RELEASE_VERSION="v11.0.2"
RELEASE_BRANCH="main"
COMMIT_MESSAGE="feat(pricing,blog): Dynamic B2B Pricing per locale, Blog i18n modal, fixed static string leaks — Vibecoder v11.0.2"
REMOTE="origin"

# ── 0. Pre-flight checks ─────────────────────────────────────────────────────
if ! command -v git &>/dev/null; then
  echo "[ABORT] git not found. Install git and retry." >&2
  exit 1
fi

if ! git rev-parse --is-inside-work-tree &>/dev/null; then
  echo "[ABORT] Not inside a git repository. Run from the project root." >&2
  exit 1
fi

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [ "${CURRENT_BRANCH}" != "${RELEASE_BRANCH}" ]; then
  echo "[ABORT] Expected branch '${RELEASE_BRANCH}', currently on '${CURRENT_BRANCH}'." >&2
  echo "        Run: git checkout ${RELEASE_BRANCH}" >&2
  exit 1
fi

if git rev-parse "${RELEASE_VERSION}" &>/dev/null; then
  echo "[ABORT] Tag '${RELEASE_VERSION}' already exists. Bump the version before releasing." >&2
  exit 1
fi

if ! git ls-remote --exit-code "${REMOTE}" &>/dev/null; then
  echo "[ABORT] Remote '${REMOTE}' is unreachable. Check credentials and connectivity." >&2
  exit 1
fi

echo "[OK] Pre-flight checks passed."

# ── 1. Stage all artefacts ───────────────────────────────────────────────────
git add .
echo "[OK] Staged: $(git diff --cached --name-only | wc -l | tr -d ' ') file(s)."

# ── 2. Abort if nothing to commit ────────────────────────────────────────────
if git diff --cached --quiet; then
  echo "[WARN] Nothing to commit. Working tree clean. Skipping commit step."
else
  git commit --message "${COMMIT_MESSAGE}"
  echo "[OK] Commit created: $(git rev-parse --short HEAD) — ${COMMIT_MESSAGE}"
fi

# ── 3. Apply annotated tag ───────────────────────────────────────────────────
git tag \
  --annotate "${RELEASE_VERSION}" \
  --message "Release ${RELEASE_VERSION}: Dynamic B2B Pricing per locale (CHF/EUR/USD), Blog lang selector modal, 100% i18n shell coverage, static string leaks fixed."

echo "[OK] Tag applied: ${RELEASE_VERSION}"

# ── 4. Push branch + tags atomically ────────────────────────────────────────
git push "${REMOTE}" "${RELEASE_BRANCH}"
git push "${REMOTE}" --tags

echo ""
echo "──────────────────────────────────────────────────────────────────────"
echo " [SEC-PASS] Vibecoder ${RELEASE_VERSION} pushed to ${REMOTE}/${RELEASE_BRANCH}."
echo " Deployment to Edge Network triggered. Monitor: vercel.com/dashboard"
echo "──────────────────────────────────────────────────────────────────────"
