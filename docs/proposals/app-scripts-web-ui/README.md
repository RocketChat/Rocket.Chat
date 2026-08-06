# Proposal: Apps that provide scripts for the web UI

## Status

Exploration. Not yet approved. This document records options and a recommendation.

> Note: the prose uses Simplified Technical English (ASD-STE100) — short active sentences,
> present tense, one instruction per sentence.

## Problem

Today a Rocket.Chat app has **no code presence in the browser**. An app runs only on the
server, inside a Deno subprocess. The client is a generic renderer. We want apps to provide
scripts that run in the web UI, so an app can react in the browser without a server round-trip.

This document answers three questions:

1. How would an iframe-as-sandbox approach look?
2. Do we need a bundler for all app-provided scripts?
3. Could WebAssembly (WASM) sandbox app code instead of an iframe?

## Current state (the ground truth)

### Server apps run in a Deno subprocess

One process runs one app. The host starts `deno run` with tight permission flags:
`--allow-read`, `--allow-env`, and `--allow-net` **only** when the app manifest declares the
`networking` permission.

- `packages/apps/src/server/runtime/deno/AppsEngineDenoRuntime.ts` — `buildProcessConfiguration()`
  builds the command and the flags.
- `packages/apps/src/server/runtime/base/BaseRuntimeSubprocessController.ts` — spawns the
  process and runs the JSON-RPC loop.

The host and the app speak **JSON-RPC 2.0 over stdio**, msgpack-encoded. The app calls the host
through one message category, `bridges:*`; a permission gate and an `APP_ID` sentinel protect
each call (see `docs/adr/0001-app-accessor-logic-in-base-runtime.md`). The **OS process is the
security boundary** — the app code itself runs in a plain `new Function(...)`, not a hardened VM.

### Apps ship no browser code today

The client renders UIKit **block JSON** that the app sends from the server. Each user action
does a round-trip:

- `apps/meteor/app/ui-message/client/ActionManager.ts` — `emitInteraction()` sends
  `POST /apps/ui.interaction/:appId`, with a 5-second trigger timeout.
- `packages/ui-kit/src/interactions/{ServerInteraction,UserInteraction}.ts` — the two
  interaction directions (server → client, client → server).

Action buttons register **server-side** (`IUIExtend.registerButton`, descriptor
`packages/apps-engine/src/definition/ui/IUIActionButtonDescriptor.ts`). The app has zero
code-execution presence in the client.

### An iframe precedent exists — but for remote URLs, not app code

- `apps/meteor/client/apps/gameCenter/GameCenterContainer.tsx` — loads a remote `game.url` in a
  plain `<iframe>` in the contextual bar. **No `sandbox` attribute.**
- `packages/apps/src/client/AppsEngineUIHost.ts` and `AppsEngineUIClient.ts` — the External
  Components `postMessage` bridge. It exposes only `GET_USER_INFO` and `GET_ROOM_INFO`. It uses
  `targetOrigin: '*'` and does **not** verify `event.origin`. This is insecure as-is.
- `apps/meteor/client/views/root/hooks/useIframeCommands.ts` — the Iframe Integration receiver.
  It shows the good pattern: an origin allowlist plus a fixed command set.

### A bundler is already in use — server-side

- `packages/apps/src/server/runtime/base/bundler.ts` — `bundleLegacyApp()` bundles multi-file
  apps with **esbuild** at install time. esbuild is already a dependency of `@rocket.chat/apps`.

Apps package as a `.zip` of compiled `.js` files plus an `app.json` manifest.

### No WASM

There is no WebAssembly in the apps code today.

## Question 1 — How would iframe-as-sandbox look?

The browser isolates an iframe for us. This is the pragmatic near-term option. Two forms:

- **Visible surface** — the app draws in a contextual-bar or modal iframe. This extends the
  External Components pattern, but the iframe loads *app-shipped* HTML/JS, not a remote URL.
- **Headless script** — an invisible iframe runs app logic and talks to the host over
  `postMessage`. This is the closest match to "run app code in the web UI" without giving the
  app the main DOM.

### Mechanics

1. Set `sandbox="allow-scripts"` on the iframe. Do **not** add `allow-same-origin`. The frame
   then has no same-origin access to Rocket.Chat.
2. Serve the app bundle from a `blob:` (null) origin, or a dedicated origin. A strict
   Content-Security-Policy then applies to the frame.
3. Reuse the `postMessage` bridge, but **harden it**:
   - Set an explicit `targetOrigin`; do not use `'*'`.
   - Verify `event.origin` on every inbound message.
   - Expose a capability-gated method set. Mirror the server `bridges:*` model — the manifest
     declares which host methods the app may call.

### Trade-offs

- **For:** a native boundary; a working precedent; low cost to build.
- **Against:** one iframe per app costs memory; all host calls are asynchronous only; theming
  across the boundary needs work; the current `'*'` origin gap must be fixed first.

## Question 2 — Do we need a bundler? (Yes)

Yes. And the pipeline already exists on the server.

- Add a client entry field to `app.json` (for example `uiEntry`).
- Bundle that entry with the same esbuild step to **one minified ES module**.
- Mark the host SDK as **external**. The host injects the SDK into the frame; the app does not
  bundle it.
- Block `node:*` and Deno APIs at bundle time. The bundle then defines exactly the allowed
  import surface.
- Bundle at marketplace build time, or at install time on the server (as legacy apps do now).

### Why it is necessary

- Apps have many files and npm dependencies; the browser needs one self-contained module.
- A strict Content-Security-Policy wants one hashed asset.
- The bundler enforces the capability surface, not only file joining.

## Question 3 — Could WASM sandbox app code instead of an iframe?

Partly. Know the limit first.

WASM isolates memory and has **no ambient capabilities**. But WASM has **no DOM, no `fetch`, and
no timers**. It sees only the functions you import.

- Apps are written in TypeScript against JS APIs, and UI needs the DOM. To run app JS inside
  WASM, you must ship a **JS engine compiled to WASM** (for example QuickJS/Javy, or Porffor).
  That engine is heavy (one engine per app, megabytes), starts slowly, and still needs a
  hand-written bridge for every host call.
- WASM therefore suits a **headless logic sandbox** — untrusted computation with a strict
  capability gate, like the server Deno model but in the browser. It does **not** give a UI
  surface. You still render through UIKit blocks or an iframe DOM.

### Verdict

WASM does not replace the iframe for rendering. It could replace the iframe only for a
pure-logic script runner. Even then it is immature and expensive today.

## Recommendation

1. **Near term:** extend the existing External Components iframe + `postMessage` bridge to load
   app-shipped bundles. Harden the bridge (origin checks, capability-gated methods that mirror
   `bridges:*`). Add an esbuild client-entry step keyed off a new `app.json` field.
2. **Later, if we need untrusted headless compute without a DOM:** evaluate a JS-in-WASM runner
   as a second sandbox tier. Keep the iframe for anything that draws UI.

## Open questions

- **SDK surface.** Which host methods does a client script get? Start from the External
  Components methods (`GET_USER_INFO`, `GET_ROOM_INFO`) and grow under the capability model.
- **Lifecycle.** When does the host start and stop a headless frame? Per room, per session, or
  on demand?
- **Manifest permissions.** How do client capabilities map to the existing server permission
  list?
- **Distribution.** Does the marketplace pre-bundle the client entry, or does the server bundle
  it at install time?
- **Performance budget.** How many concurrent iframes are acceptable before we pool or reuse
  them?
