# Independent E2EE search module checks

These checks need no Rocket.Chat server. They do not activate local indexing.

## Test boundaries

The configuration extends the app's Jest presets. It maps the shared search contract and message guards to their local source files.
This keeps the checks independent of previously built workspace packages.

The query fixtures use mocked backends. Adapter checks use an in-process desktop bridge fixture, not a packaged desktop app.
Storage tests use jsdom local storage. They do not prove browser persistence or cross-process IPC.

The focused type configuration uses the app's compiler options and the local contract source.
It does not typecheck the full app.

## Ownership requirements

A writer needs a distinct backend handle for each open session. Use `createSearchIndexSessionBackend` after the raw backend opens.
Revoke that handle before another session can use the raw backend.
An old handle rejects new calls and late results. It also unsubscribes its event listeners.
Revocation cannot cancel an operation that the backend already accepted. The runtime must serialize raw opens, closes, and mutations.

The local query requires the open result and every version-1 capability. Unsupported backends reject without a browser fallback.
Recent pagination uses descending timestamps and UTF-8 binary ID order.

Consent storage requires the canonical workspace root URL and user ID. Supply the workspace root, not the current page URL.
User-only legacy consent does not enable indexing.
Logout closes access but keeps scoped consent, the sealed index, and a valid catch-up timestamp.
Consent withdrawal deletes the index.

## Run

From `apps/meteor`, run the focused type check:

```sh
node ../../node_modules/typescript/bin/tsc \
  --project tests/e2ee-search-modules/tsconfig.json --noEmit --incremental false
```

Run the extracted module tests with the workspace configuration:

```sh
TZ=UTC TS_NODE_COMPILER_OPTIONS='{"allowJs": false}' \
node ../../node_modules/jest/bin/jest.js --runInBand \
  --config tests/e2ee-search-modules/jest.config.mjs \
  client/lib/e2eeSearch/
```

The paths assume installed dependencies at the repository root. No test writes into dependency packages.

## Combined browser check

The browser fixture also needs W1's browser backend, harness, and built worker. Run it in a tree with both concerns.
It uses the real SQLite worker and encrypted persistence. Its sync responses and decrypted messages are fixtures, not live server responses.

From `apps/meteor`, run:

```sh
node ../../node_modules/typescript/bin/tsc \
  --project tests/e2ee-search-modules/tsconfig.browser.json --noEmit --incremental false
node node_modules/@playwright/test/cli.js test \
  --config tests/e2ee-search-modules/playwright.config.ts
```

The checks cover tied result pages, hidden and trash deletions, empty edits, session ownership, and snapshot reopen.
A second fixture uses the real session manager to check logout retention and deletion after consent withdrawal.
These checks do not establish live-server behavior or release readiness.

## App integration checks

The E2EE wrapper configuration uses the app's package mappings and the current shared contract source.
It mocks only the search integration factory for existing E2EE tests.
The separate factory test connects the actual session, writer, and runtime with controlled stores and synchronization responses.

```sh
TZ=UTC TS_NODE_COMPILER_OPTIONS='{"allowJs": false}' \
node ../../node_modules/jest/bin/jest.js --runInBand --coverage=false \
  --config tests/e2ee-search-modules/jest.e2ee.config.mjs \
  client/lib/e2ee/rocketchat.e2e.searchIndex.spec.ts \
  client/lib/e2ee/rocketchat.e2e.room.searchIndex.spec.ts
```

The UI directory has separate test and render commands.
Build workspace dependencies before these checks. The checks use the built UI packages without source-export shims.
Controlled render fixtures do not establish live workspace behavior.
