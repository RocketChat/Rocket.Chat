# Durable suspend and resume

> Part of the [Apps Engine host RFC](README.md).

**Status:** research report
**Substantiates:** [16](../rfc/16-surface-interactive-ui.md) — "The runtime persists
the suspended continuation keyed by the view/trigger id and resumes it on submit."
**Answers:** [51, open question 2](../rfc/51-open-questions.md) — the durability
contract.
**Scope:** the mechanism that makes one `await ctx.ui.open` survive a separate
HTTP request, a different instance, and a subprocess restart. Block authoring,
the block schema and the app-facing shape of `ctx.ui` are
[16](../rfc/16-surface-interactive-ui.md)'s business.

---

## 1. TL;DR

**Recommendation.** The host **replays the handler against a journal of its own
`ctx` calls**. It never freezes a JavaScript stack. On `ctx.ui.open` the host
writes a *continuation* record and returns a suspend signal to the app process.
The record holds the entry point, the original input, the journal so far, the
surface descriptor and the app version.

On submit, any instance loads the record and re-invokes that entry point on its
local subprocess. Each replayed `ctx` call is answered from the journal, not
re-issued. The `ctx.ui.open` that suspended now returns the validated form
values, and the handler runs live from there.

Four findings from the codebase force this shape:

1. **`triggerId` cannot be the resume key.** The client mints it, it lives 5
   seconds, and it is consumed on first use
   (`apps/meteor/client/lib/ActionManager.ts:20,73,141`). The submit carries a
   *new* one (`:78`).
2. **The host records nothing about an open surface today.** The app process
   mints the surface id
   (`packages/apps-engine/src/definition/uikit/UIKitInteractionPayloadFormatter.ts:31`)
   and the bridge only broadcasts the payload
   (`apps/meteor/app/apps/server/bridges/uiInteraction.ts:22`).
3. **An in-memory promise is not durable.** Every instance loads every app
   (`apps/meteor/server/services/apps-engine/service.ts:50`), so the submit can
   land on an instance that never ran the handler. The subprocess also restarts
   on its own (`packages/apps/src/server/runtime/base/LivenessManager.ts:9-14`).
4. **The `ctx` boundary is already a journal seam.** Every `ctx` method is async
   and crosses to the host ([41](../rfc/41-platform-deployment-and-isolation.md)).
   The host therefore sees every effect in order, and needs no new app-side
   machinery to record it.

**The price.** One record per open surface, a journal size cap, and a
determinism rule the app author must respect.

---

## 2. What the wire gives the host today

### 2.1 Three ids, three lifetimes

| Id | Minted by | Lives | Reused |
|---|---|---|---|
| `triggerId` | the browser, `Random.id()` | 5 s, then deleted (`ActionManager.ts:20,73`) | never — consumed at `:141` |
| ui-kit `view.id` | the **app process**, `uuid()` (`UIKitInteractionPayloadFormatter.ts:31`) | until the surface closes | every interaction on that surface |
| `actionId` | the app, per block element | with the block | per click |

> **`triggerId` authorizes one push to one browser. It is not a correlation key.**
> The resume key must be the surface id, and [§7](#7-the-host-mints-the-surface-id)
> argues the host must mint it.

The glossary reserves **view** for a data-layer lens
([28](../rfc/28-data-views.md)). This document says **surface instance** for one
opened modal or contextual bar, and cites the wire field as ui-kit `view.id`.

### 2.2 The open is a push; the submit is a request/response

```
slash command                                   submit
────────────                                    ──────
browser  /v1/commands.run  ──► host             browser  POST /apps/ui.interaction/:appId
                             │                          │  { viewSubmit, viewId, state, triggerId' }
                       app subprocess                    ▼
                             │  ctx.ui.open            host ──► app ──► response body
                             ▼                            │
              broadcast notify.uiInteraction              ▼
                             │                    the body IS the next interaction
                             ▼                    (modal.update / errors / close)
                     browser opens the modal
```

The submit response drives the client: anything other than `errors`,
`modal.update` or `contextual_bar.update` closes the surface
(`ActionManager.ts:94`). So a resumed handler does not push its answer — the host
returns it as the body of the request that resumed it.

### 2.3 The correlate-by-id workaround, in tree

A core app has the same problem. It packs state into the id string, then parses
it back out:

```ts
// apps/meteor/server/modules/core-apps/nps.module.ts:50
const bannerId = viewId.replace(`${npsId}-`, '');
```

The id is the only channel the host offers today. A continuation record replaces
it.

---

## 3. Two clocks, and neither one is the suspension

| Clock | Budget | Source |
|---|---|---|
| app subprocess JSON-RPC request | 30 s, `APPS_ENGINE_RUNTIME_TIMEOUT` | `BaseRuntimeSubprocessController.ts:30` |
| client interaction round trip | 5 s, then the view is disposed | `ActionManager.ts:20` |
| the suspension itself | human scale — a user reads the modal | new, see [§10](#10-the-durability-contract) |

Two consequences fix the design:

- **A suspension may not occupy a subprocess request.** Two things end it: the
  30 s cap, and the liveness ping (10 s interval, 4 consecutive misses →
  restart, `LivenessManager.ts:9-14`). So `ctx.ui.open` must return the RPC
  promptly and leave the handler unfinished.
- **A resume has ~5 s to answer.** Replay plus the live tail of the handler must
  fit in the client window. This caps the journal
  ([§5.3](#53-what-it-costs)), and it is why the record holds data rather than
  work to redo.

---

## 4. Why not the two cheaper mechanisms

| | A — live promise | B — replay + journal | C — explicit resume point |
|---|---|---|---|
| where the state lives | the subprocess heap | a host record | a host record |
| survives a restart | no | yes | yes |
| survives another instance | no, needs sticky routing | yes | yes |
| re-runs app code | no | yes, from the top | no |
| double-writes | — | no, the journal answers | no |
| app-facing cost | none | a determinism rule | the `await` is no longer one function |

**A is not implementable here.** The submit is a fresh HTTP request, and any
instance may serve it. Each instance runs its own subprocess per app
(`AppStatusReport` is keyed by `instanceId`,
`packages/core-services/src/types/IAppsEngineService.ts:6-7`). Sticky routing
would pin an interaction to one node and still lose it on the next restart.

**C is the honest fallback.** The host stores the descriptor and a *named*
handler, and the resume calls that handler with the values. It costs nothing and
it works. But it is a different app-facing surface: the code after the `await`
becomes a separate function. That is the legacy shape
[16](../rfc/16-surface-interactive-ui.md) removes, so C means the RFC's headline
example does not compile.

**B keeps the surface and pays for it in the host.** The rest of this document
specifies B.

---

## 5. The recommended mechanism: replay against a `ctx` journal

### 5.1 The journal

The host numbers every `ctx` call in one execution and records the result:

```ts
type JournalEntry = { seq: number; method: string; argsHash: string; result: unknown };
```

On the replay pass the host's `ctx` implementation answers entry `seq` from the
record and **does not re-issue it**. A write returns its recorded result; it does
not run twice. When the journal runs out, `ctx` goes live again and new entries
append.

```
open   ctx.settings.get      seq 0 ──► live   ─┐
       ctx.rooms.get         seq 1 ──► live    ├─ journal
       ctx.ui.open           seq 2 ──► SUSPEND ─┘

resume ctx.settings.get      seq 0 ──► journal
       ctx.rooms.get         seq 1 ──► journal
       ctx.ui.open           seq 2 ──► the submitted values
       ctx.settings.set      seq 3 ──► live
```

### 5.2 Divergence fails closed

At each `seq` the host compares `method + argsHash` against the record. A
mismatch means the replay took a different path, so the recorded results no
longer belong to the calls being made. The host **aborts the resume, closes the
surface with an error, and logs the divergence.** It never guesses and it never
re-issues a write.

Only `ctx` calls are journaled. App-local computation must therefore be a pure
function of journaled results. `Date.now()` and `Math.random()` are the two
sources that break that in practice. The SDK should add journaled `ctx.now()`
and `ctx.random()`, and make them the only supported way to get either inside a
handler that may suspend. This is a small app-facing addition
[16](../rfc/16-surface-interactive-ui.md) does not yet carry.

### 5.3 What it costs

| | |
|---|---|
| storage | one record per open surface, journal included |
| suspend | one insert |
| resume | one read, one update, plus the replay itself |
| replay time | bounded by the journal cap, and it must fit the 5 s client window |
| cap | a journal limit — entries and bytes. Over the cap, `ctx.ui.open` fails with an error the app receives; it does not suspend |

The cap is a design constraint, not only a guard: it pushes the surface open
toward the front of a handler, where the replay is short.

### 5.4 How the handler unwinds

Two ways to leave the handler unfinished, and one is safer:

| | |
|---|---|
| **throw a reserved marker** | any `try/catch` in app code swallows the suspension |
| **never settle the promise** (recommended) | `ctx.ui.open` returns a promise that does not settle on this pass; the runtime settles the *RPC* as soon as the host has written the record |

The second survives app-side `try/catch`. It does mean a `finally` block does not
run at the suspension — which is correct: the handler is not finished, it is
paused.

---

## 6. The record

```ts
type Continuation = {
  _id: string;                       // the surface instance id — the resume key
  appId: string;
  appVersion: string;                // a mismatch kills the record, §9
  entry:                             // what to re-invoke
    | { kind: 'slashCommand'; command: string }
    | { kind: 'actionButton'; actionId: string }
    | { kind: 'listener'; event: string };
  input: unknown;                    // the original invocation payload
  principal: { userId: string; roomId?: string; threadId?: string };
  surface: { kind: 'modal' | 'contextualBar'; descriptorId: string; stateSchema: string };
  journal: JournalEntry[];
  createdAt: Date;
  expiresAt: Date;                   // TTL index
  consumedAt?: Date;
};
```

**Where it lives.** A host-owned collection, `rocketchat_apps_continuations`,
with a TTL index on `expiresAt`. Not the app store: `ctx.store` is app-readable
and app-writable ([17](../rfc/17-surface-settings-persistence-lifecycle.md)), and
an app that can edit its own continuation can forge a resume. The precedent for
host-owned, app-scoped durable state is the scheduler's own collection,
`rocketchat_apps_scheduler` (`apps/meteor/app/apps/server/bridges/scheduler.ts:42`).

**Under the split runtime** ([41](../rfc/41-platform-deployment-and-isolation.md))
the store stays with the monolith. The apps-runtime is untrusted, so it holds no
record that decides who a resume runs as.

---

## 7. The host mints the surface id

Today the app mints it (`UIKitInteractionPayloadFormatter.ts:31`) and the host
never sees it declared. Three things follow once it is the resume key:

1. **The host mints it** at `ctx.ui.open`, stamps the outgoing interaction, and
   returns it to the app. An app-minted key lets an app name a record it does not
   own.
2. **The host no longer trusts the submitted view.** The client returns the whole
   view on submit (`packages/ui-kit/src/interactions/UserInteraction.ts:51`). The
   host holds the descriptor, so it needs only `state` from the client, and it
   validates that against the descriptor's schema before the app sees it.
3. **The key is single-use per submit.** `consumedAt` closes the replay window, so
   a repeated submit resolves nothing twice.

---

## 8. A resume re-checks authority; it does not restore it

The record stores no authority. At resume the host re-resolves it:

| | |
|---|---|
| the app | still installed, still enabled — otherwise the surface closes with an error |
| gate 1 | the grant still covers the scopes the tail of the handler uses ([42](../rfc/42-platform-permissions.md)) |
| gate 2 | the principal is resolved again from the request, never read from the record ([10](10-identity-app-user.md)) |
| the actor | stamped by the platform from the authenticated submit, as on any interaction ([40](../rfc/40-platform-security-and-permissions.md)) |

A grant an admin revoked while the modal was open does not come back because a
handler is mid-flight.

---

## 9. Lifecycle

| Event | The continuation |
|---|---|
| app disabled | dead. The resume fails at [§8](#8-a-resume-re-checks-authority-it-does-not-restore-it); the surface closes with an error |
| app updated | dead. `appVersion` mismatch — the new bundle may issue different `ctx` calls, and divergence would be undetectable at `seq 0` |
| app uninstalled | records purged with the app's other state |
| subprocess restart | unaffected. The record is data; any subprocess can replay it |
| instance restart | unaffected, same reason |
| TTL expiry | the record disappears; a late submit gets "this form expired" |

The update row is the sharp one. A user with a modal open during a marketplace
update loses the form. The alternative — replay a v1 journal into v2 code — risks
a silent double write, so the design refuses it.

---

## 10. The durability contract

[51's open question 2](../rfc/51-open-questions.md) asks how durable and how long.
The mechanism does not decide it; these are the numbers it makes available.

| | Proposed | Why |
|---|---|---|
| suspension window | 15 min, a workspace setting | long enough for a user to fill a form, short enough that a stale grant cannot linger |
| journal cap | 64 entries or 64 KB | keeps the replay inside the 5 s client window |
| suspensions per execution | unbounded in the mechanism | a wizard is N records; each resume writes the next |
| multi-step flows | out of scope here | the record already supports it; the app-facing shape is [16](../rfc/16-surface-interactive-ui.md)'s call |

---

## 11. `prompt` needs one thing more

[16's `prompt` section](../rfc/16-surface-interactive-ui.md) already states the
app-side rule — the handler must be safe to run twice up to the point where it
prompts. The journal upgrades that from a promise the author keeps to a property
the host enforces, for **one app's** handler.

It does not cover the chain. A suspended `upload.beforeUploaded` listener sits
inside a host-run sequence of listeners across several apps. A re-run of that
sequence re-runs the others too. That is a separate problem for the enforcement
scope. It is also why the migration doc's third action item —
["Break the file upload flow for async validation step"](../../../docs/apps-engine-migration.md)
— is on the critical path for `prompt`, not for modals.

---

## Open questions

1. **Is the determinism rule acceptable to app authors?** A violation surfaces
   as "the form failed", never as a compile error. A lint rule in the bundler
   cross-check
   ([42](../rfc/42-platform-permissions.md)) could catch `Date.now` and
   `Math.random` in a handler that may suspend.
2. **Does the journal need the arguments, or only their hash?** The hash detects
   divergence. The arguments themselves would let the host explain one, at the
   cost of a copy of app data in a host collection.
3. **Contextual bars are not modals.** A modal closes in minutes. A contextual
   bar can sit open for an afternoon, which makes a 15-minute window wrong for it.
   Does the window vary per surface kind?
4. **What resumes a continuation the user abandons?** `viewClosed` arrives when
   the user dismisses the surface, so the record can be consumed there. It does
   not arrive when the tab dies, which is what the TTL is for.
5. **Does a resume belong to the instance that serves the submit, or to a queue?**
   An inline resume keeps the 5 s window honest. A queue would survive a slow
   app, but the client has already given up by then.
