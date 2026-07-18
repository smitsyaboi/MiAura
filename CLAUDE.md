# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

MiAura is a published Chrome Web Store extension (Manifest V3, mood tracker, Frutiger Aero aesthetic). It is popup-only: there is no background service worker or content script — all code runs only while the popup is open. There is no build step or framework; `popup.html` loads `popup.js` as an ES module, which imports everything from `js/`.

## Commands

```bash
npm test                                 # run all tests (vitest)
npx vitest run tests/storage.test.js    # run one test file
npm run test:watch                       # watch mode
npm run test:coverage                    # coverage report (writes coverage/, untracked)
npm run lint                             # eslint — run before committing; must be clean
```

ESLint (flat config, `eslint.config.js`) declares per-context globals: browser+webextensions for `popup.js`/`js/`, serviceworker+webextensions for `background.js`, node+browser for `tests/`. If a new file legitimately needs another global, extend the config rather than suppressing inline. To try changes in a browser: chrome://extensions → Developer mode → Load unpacked → select the repo root.

## Architecture

- **`js/storage.js` is the only module that touches `chrome.storage.local`.** All data lives under one key, `miAura_v2`: `{ version, settings, moods, meta }`. Moods are keyed `"YYYY-MM-DD"` with integer `level` 1–5. Every helper does a full load→modify→save round trip. `migrateIfNeeded()` handles the legacy localStorage→chrome.storage migration and must stay non-destructive (it verifies the write before deleting old data).
- **Data safety:** `saveData()` validates structure and throws on any write that would drop more than one real (non-`isTest`) logged day — never bypass it with a direct `chrome.storage.local.set`. The first save of each day snapshots the previous state to `miAura_v2_backup`; `loadData()`/`migrateIfNeeded()` restore from it if the primary key is missing or corrupt (a corrupt primary is quarantined to `miAura_v2_corrupt`, never discarded). Test mocks must deep-clone on get/set like the real API, or aliasing breaks the backup tests.
- **Levels vs colours:** the data layer stores only integer levels; `js/themes.js` is the single place levels map to colours/labels. Keep colour knowledge out of storage.
- **Dates are local, never UTC.** Always use `formatDateString`/`getTodayDateString` from `js/dateUtils.js`; `toISOString().slice(0,10)` introduces timezone bugs (this has bitten the tests before).
- **Localization:** `js/localization.js` holds a `translations` table for `en, fr, pt, de, sv` and a cached-language pattern — `initLanguageCache()` is seeded once in `popup.js` `init()` so `t(key, lang)` stays synchronous. Any new user-facing string must be added to all five languages. Banner text supports `{days}`-style placeholders replaced at render time.
- **UI flow:** three "pages" (divs) toggled by `showPage()` in `js/eventHandlers.js` — page1 mood logging, page2 wave-graph calendar (`js/gridRenderer.js`, SVG, week/month/year views), page3 settings. Banners (review prompt, welcome) are absolutely positioned in `.container` so they float over any page.
- **Review prompt schedule** (`js/reviewPrompt.js` + schedule helpers in storage): gated on total logged days (excluding `isTest` entries), first ask at 5, dismissal re-arms 10 logged days later, max 3 lifetime asks, `hasReviewed` suppresses forever. It fires after a mood is logged (in `popup.js` `onMoodSelect`), deliberately not at popup open. Constants `REVIEW_*` are exported from storage.js.
- **Test entries:** the hidden test panel (tap the Settings title 5×) creates moods with `isTest: true`. Any user-facing counter or trigger should exclude them.

## Tests

Vitest with `happy-dom` for DOM tests (`// @vitest-environment happy-dom` pragma). `chrome.storage.local` and `localStorage` are mocked per-file with a plain object store — copy the mock pattern from `tests/storage.test.js` when adding a new test file.

## Releases

Version must be bumped in three places: `manifest.json`, `package.json` (+lockfile), and the footer of `README.md`. Store zip contains only runtime files:

```bash
zip -r miaura-vX.Y.Z.zip css fonts icons js popup.html popup.js manifest.json LICENSE PRIVACY.md
```

The extension's store promise is "no tracking, 100% local, `storage` permission only." Any change that adds permissions or network calls must also update PRIVACY.md, README.md, and the store listing — do not add these casually.
