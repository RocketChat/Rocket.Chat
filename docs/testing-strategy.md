# Testing strategy

Pick the layer by **what the assertion observes**, not by the path a user takes.
Test each behavior once, at the lowest layer that can observe it.

## The layers

| Layer | Tool | Location | Run with |
| --- | --- | --- | --- |
| Unit | Jest or mocha | next to the code, or `apps/meteor/tests/unit/**` | `yarn testunit` in `apps/meteor` |
| Client component | Jest + Testing Library + `mockAppRoot()` from `@rocket.chat/mock-providers` | `apps/meteor/client/**/*.spec.tsx`, `apps/meteor/ee/client/**/*.spec.tsx` | `yarn .testunit:jest` in `apps/meteor` |
| Package integration | Jest + `mongodb-memory-server` + real `@rocket.chat/models` | `packages/*`, `ee/packages/*` | the package's own `test` script |
| API | mocha + supertest against a running server | `apps/meteor/tests/end-to-end/api/**`, `apps/meteor/tests/end-to-end/apps/**` | `yarn testapi` in `apps/meteor` |
| Playwright | Playwright against a running server | `apps/meteor/tests/e2e/**` | `yarn test:e2e` in `apps/meteor` |

The Meteor server cannot start in plain Node. Server code in `apps/meteor` that
imports `meteor/*` can only get an integration test through the API layer. Code
in `packages/` and `ee/packages/` can get one in-process. For an example, see
`ee/packages/abac/src/test-helpers/mongoMemoryServer.ts`.

## Choose the layer

Ask these questions in order. Stop at the first "yes".

1. **Can a function, hook or component show the behavior with its inputs
   mocked?** Write a unit or client component test. This covers parsers,
   validation, crypto vectors, and rendering by setting, permission or license.
   It also covers forms, menus and modals.
2. **Is it a server rule that the logic in `packages/` or `ee/packages/` owns?**
   Write a package integration test.
3. **Is it a server rule that you can observe through REST or DDP?** Write an
   API test. This covers permissions, the effects of settings, CRUD, routing,
   importers, schedulers and message hooks.
4. **Does it need a real browser and the real server together?** Only then write
   a Playwright test. See [What needs Playwright](#what-needs-playwright).

## What needs Playwright

- Browser APIs that jsdom does not have: WebCrypto key handling, MediaRecorder,
  WebRTC, file dialogs, drag and drop, downloads.
- Session and token lifecycle: login, logout, expiry, state across tabs and
  windows in `localStorage` or `sessionStorage`.
- Redirect-based authentication: OAuth, SAML, iframe login.
- Realtime updates that reach a second, already-open browser context.
- Scroll, focus order, keyboard navigation across the composer and its popups,
  and virtualized lists.
- Pages inside a host page: the embedded layout and the livechat widget.

## Rules

### Playwright tests the integration, not the variations

Write one Playwright test for each user flow. Put the variations in a lower
layer: permission on/off pairs, combinations of settings, file types, role
variants. If five tests go through the same code path, keep one.

### A hidden control is not access control

For each permission or setting that gates an action, write two tests:

- a client component test that the UI hides or disables the control
- an API test that the server refuses the action

### A test that mocks REST is not a Playwright test

A Playwright test that replaces the server responses with `page.route` does not
test the server. Move it to a client component test with `mockAppRoot()`.

### Create test data through the API

Drive the UI only for the behavior under test. Create users, rooms, messages,
files and settings through the API helpers in `apps/meteor/tests/e2e/utils` and
`apps/meteor/tests/data`. For example, start an omnichannel conversation with
`createConversation` from `apps/meteor/tests/e2e/utils/omnichannel/rooms.ts`,
not through the widget.

### Do not sleep

A fixed `waitForTimeout` or `sleep` is a defect.

- In Playwright, wait for an observable condition. Use web-first assertions,
  `locator.waitFor()` or `page.waitForResponse()`.
- For a scheduler, set its timeout to a few seconds through its setting, and
  poll the API for the result.
- Unit-test the scheduler logic itself with fake timers.

### Search before you add a test

Before you add a Playwright test, look for the same behavior in
`apps/meteor/tests/end-to-end/api` and in the `*.spec.tsx` files next to the
component. Extend an existing test. Do not duplicate it at a higher layer.

### Every test must be able to fail

- Give each `expect` a matcher. `expect(locator)` alone asserts nothing.
- Assert on the page or the context that the test changes.
- Make sure the test runs. Playwright only picks up `*.spec.ts` files. The mocha
  and Jest configs in `apps/meteor` list their spec globs explicitly, so a new
  location needs an entry in `.mocharc.js` or `jest.config.ts`.
- Delete a skipped test, or open an issue for it. Do not leave it skipped with
  no reason.

### Server code that imports Meteor

- Test pure logic with a unit test that stubs `meteor/*` and other
  dependencies. `apps/meteor/tests/unit/server` uses mocha with `proxyquire`.
- Test behavior across modules with an API test.
- A module that needs many stubs to test is a candidate to move to a package.
  In a package it can get an in-process integration test.

### Shared state is expensive in Playwright

All Playwright specs share one server and one database. A spec that changes a
global setting must run in series and restore the setting afterwards, and a
failure can leak into other specs. Prefer a lower layer for behavior that needs
global settings changed.

## Known gaps

- `packages/livechat` has no component test setup. Widget-only behavior, such
  as trigger conditions and `setTheme`, has no layer below Playwright today.
- `packages/web-ui-registration` has no Jest setup. Login, registration and
  password-reset form rules have no layer below Playwright today.
