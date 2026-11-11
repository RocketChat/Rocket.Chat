---
name: playwright-tests
description: Guides writing Playwright end-to-end tests for the Rocket.Chat application. Use when creating, editing, or reviewing Playwright test files, writing e2e specs, working with page objects, or when the user asks about test structure, locator strategy, assertions, or test organization in apps/meteor/tests/e2e/.
---

# Playwright Test Development

## When to use

Use this skill only for **end-to-end tests written with [Playwright](https://playwright.dev/)** under `apps/meteor/tests/e2e/`. It does not cover unit or API tests (Jest, Mocha) or manual test cases.

## Read the guide first

[`apps/meteor/tests/e2e/README.md`](../../apps/meteor/tests/e2e/README.md) is the source of truth for e2e tests in this repository. Read it before writing or reviewing a spec. It covers:

- running the suite and its environment variables
- locators: which to prefer (`getByRole`, `getByText`, `getByLabel`, `locator(…, { has })`) and which to avoid (test ids, class names, position)
- page objects, and why `goto()` owns navigation and its wait
- web-first assertions and waiting on observable conditions, never fixed delays
- cleanup after tests
- performance patterns: seeding state through the API helpers in `utils/`, sharing a browser context in `.serial` suites, opening a room by URL
- a template for an optimized suite, and the anti-patterns to flag in review

## Where things live

- Specs: `apps/meteor/tests/e2e/**/*.spec.ts`
- Page objects: `apps/meteor/tests/e2e/page-objects/` (reuse one before adding a new one)
- API helpers for seeding state: `apps/meteor/tests/e2e/utils/`
- Config: `apps/meteor/playwright.config.ts`

## Before finishing

- Lint the spec: `yarn run -T oxlint <file>` from `apps/meteor`. The e2e folder has its own lint overrides, such as `no-floating-promises`.
- Check the change against the README's "Anti-patterns to flag in review" list.
