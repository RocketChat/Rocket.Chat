# Real browser checks for the E2EE search backend

This folder runs the browser backend checks in real Chrome, Firefox and Safari.
It does not need a Rocket.Chat server.

## What it checks

The driver runs ports of the Playwright specs in the parent folder:

- The search index backend contract.
- Persistence: the encrypted copy, plaintext in OPFS, the stored key, and wipe.
- Storage: persistent storage requests, eviction, and refused storage.
- Multi-tab: leader election, lock handover, and a second worker on the same copy.

The driver also runs probes. The probes report what the page and a worker can do, such as storage, WebAssembly, and SQLite. They appear in the results file. They do not count as pass or fail.

## Why it exists

Playwright ships patched Firefox and WebKit builds. These builds are not the browsers that users run.
Some results differ. For example, Playwright WebKit cannot store a non-extractable CryptoKey in IndexedDB. Real Safari can.
This driver runs the same checks in the browsers on the machine.

## Backend scope and limits

The backend has no application entry point. Retention, consent, and application recovery policy remain separate.
The backend reports index loss and invalidates stored room checkpoints. It does not restart an application crawler.

The Playwright harness adds `recentPages.pw.ts` and `lifecycle.pw.ts` to the original driver checks.
These cover 205 timestamp ties, UTF-8 binary order, two-key followers, session events, memory handover, and worker failure.
The standalone driver does not run these additional specs.

Visible-tab leadership remains deferred. A background leader can delay requests, and a 30-second timeout does not prevent that delay.
Change notifications do not refresh application results without an application subscriber.
Memory-only replacement loses indexed content. The application must handle the loss signal before it can resume indexing safely.
Browser beta acceptance and release approval remain open.

## Run

From `apps/meteor`:

```sh
yarn test:e2ee-search-real-browsers                  # chrome, firefox and safari
yarn test:e2ee-search-real-browsers chrome firefox   # only the browsers that you name
```

Or run the script directly:

```sh
node tests/e2ee-search-browser/real-browsers/run.mjs safari
```

The script runs the browsers one after another. It prints one summary line per browser, for example `chrome: 36 passed, 0 failed`.
The exit code is 0 only when every check passes in every browser. Otherwise the exit code is 1.

Chrome and Firefox run headless. Safari uses safaridriver when it can create a session. The safaridriver path brings Safari to the front during the run. If it cannot create a session, the script opens Safari with `open -g`. The summary line for Safari shows which method ran.

## Requirements

- macOS.
- Dependencies installed with `yarn install` at the repository root.
- Google Chrome at `/Applications/Google Chrome.app`. To use another path, set `CHROME_BIN`.
- Firefox at `/Applications/Firefox.app`. To use another path, set `FIREFOX_BIN` to the Firefox executable.
- For safaridriver, turn on Develop > Allow Remote Automation in Safari. Without this setting, the script uses `open -g`.

## Output

The script writes everything to `out/`, which git ignores:

- `results-<browser>.json`: every check, with its status and timing.
- `<browser>.log`: the console output of the run.
- The built test page and the throwaway browser profiles.

Each run replaces the results file of the browser that it runs.

The script closes the tabs that it opens. A browser can refuse a close from a script. In that case the tab stays on `about:blank`.
