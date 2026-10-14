# Stacks: Playwright E2E Test Suite

![Playwright E2E](https://github.com/oluwakemie/stacks-playwright-e2e/actions/workflows/playwright.yml/badge.svg)

End-to-end tests for **Stacks**, a library catalogue web app ([live demo](https://sng-demo-ci.netlify.app)), written in **Playwright + TypeScript** and run on every push with **GitHub Actions**.

**[View the latest test report](https://oluwakemie.github.io/stacks-playwright-e2e/)**

## What's covered (43 tests)

| Area | Tests | Examples |
|---|---|---|
| Register | 14 | Validation rules, duplicate email, script-injection name rendered as text, double-submit creates one account |
| Login | 10 | Generic error for wrong password and unknown account, whitespace handling, password visibility toggle |
| Dashboard | 13 | Tab filters, live search, empty state and reset, topic + tab combinations, logout and back-button behaviour |
| Navigation guards | 4 | Logged-in users redirected away from /login and /register; real HTTP 404 for unknown URLs |
| Full journey | 1 | Register, browse, log out, log back in with the same credentials |
| Setup | 1 | Registers a shared account once and saves its session |

## How it's built

- **Page Object Model**: `pages/` holds one class per screen (`RegisterPage`, `LoginPage`, `DashboardPage`); tests contain only the assertions.
- **Shared login with `storageState`**: a setup project registers one account and saves its session, so authenticated tests skip the login form. Register and login tests run in a separate project with no session.
- **Stable selectors**: `data-testid` first, then accessible roles. No CSS chains or fixed sleeps.
- **Every test checks behaviour**, not just that an element exists. For example, the XSS test asserts the payload renders as literal text and no dialog fires.

## Findings worth noting

- **Flaky logout test:** traced through Playwright traces to client-side navigation that occasionally took longer than the default 5 s under parallel load. Fixed with a targeted 15 s wait on that one assertion, not a global timeout increase.
- **Auth guard timing:** the redirect for logged-out users resolves asynchronously (about 2 to 4 s behind a loading state). The first manual check missed it; the tests wait for the real outcome.

## Run it locally

```bash
npm ci
npx playwright install chromium
npx playwright test
npx playwright show-report
```

## CI

`.github/workflows/playwright.yml` runs on every push and pull request to `main`, weekly on Mondays, and on demand from the Actions tab. It type-checks, runs the suite, uploads the HTML report as an artifact, and publishes it to GitHub Pages.

---
Built by **Oluwakemi Dada**, QA Engineer · [oluwakemidada.com](https://www.oluwakemidada.com) · [LinkedIn](https://www.linkedin.com/in/oluwakemiesther/)
