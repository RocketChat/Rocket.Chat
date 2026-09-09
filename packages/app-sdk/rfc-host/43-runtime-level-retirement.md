# Retiring a level

> Part of the [Apps Engine host RFC](README.md).

An [API level](42-runtime-api-levels.md) that is never removed is an additive-only
API with extra machinery. This document decides how a level ends: the tool that
moves an app off it, the date that forces the move, and the order the two ship in.

## 1. The codemod runs on the author's source

A stored package is minified, so rewriting it is out. The author's TypeScript, in
their repository, run by their team, is not — we ship a tool, they review the diff
and republish. That is what reaches the private apps, which no telemetry and no
server-side recompile touches.

| Change | Codemod | Author |
|---|---|---|
| renames, moved exports, signatures | automatic | review the diff |
| sync → async | automatic — `ast/operations.ts`, 237 lines, in production today | review, check races |
| structural | detect and report | real work, needs a guide |

A CLI, invoked per transition (`--from 1 --to 2`) so 2 → 3 reuses it, idempotent,
producing a diff rather than a silent rewrite, and reporting what it detected but
could not transform with file and line. Keeping the third row small is a design
constraint on the new level, not an afterthought.

Rewriting the stored packages instead is irreversible, minified and blind to
private apps. Transforming the bundled source at load time is safe and re-appliable
— `sanitizeDeprecatedUsage.ts` does exactly that today — but it cannot see through
dynamic dispatch, so it supplements the codemod and does not replace it.

## 2. The window is announced, not measured

Deleting a level once telemetry shows no use never fires while private apps
dominate, which makes the shim permanent. The mechanism is a published date:

- level N+1 ships **with** level N's end-of-support release named
- level N runs untouched for the whole window
- at that release level N is removed, and its apps stop with an error that was
  predicted, documented and shown in the admin UI throughout

Bound it by elapsed time **and** releases — "no earlier than 12 months **and** no
earlier than N+3". A workspace that upgrades rarely first sees the warning partway
in, so its notice runs from its own upgrade, not ours.

Owners hold the source we lack. What is missing is a signal to act and a date to
act by, which makes the window the deliverable and the shim its cost.

## 3. Incompatible is a status

`AppStatus` (`packages/apps-engine/src/definition/AppStatus.ts`) has no state for
"incompatible with this host", so such an app looks like one that crashed —
`AppManager.load()` drops it to an `EmptyRuntime` behind a `console.warn`
(`AppManager.ts:304-307`). Add the status, and admin messaging naming the app, its
level and the release that ends it.

This is what carries the notice in [2](#2-the-window-is-announced-not-measured),
it depends on nothing else here, and it ships immediately.

## Sequencing

**The gate ships in a release workspaces upgrade *through*, strictly before the
break.** Relaxing a gate is non-breaking, so it can ship early and quietly.

| Phase | Release | Contents | Breaks |
|---|---|---|---|
| 0 | next patch | the status and admin messaging ([3](#3-incompatible-is-a-status)) | no |
| 1 | N | `apiLevel`, the load gate, per-level resolution, one level registered | no |
| 2 | N | the marketplace accepts and emits `apiLevel` | no |
| 3 | N+1 | level 2; level 1 shim registered; codemod published; end of support announced | no |
| — | window | authors run the codemod; admins see per-app warnings naming the cutoff | no |
| 4 | the announced release | level 1 removed | yes, by design |

Phases 1 and 3 cannot be one release: a workspace jumping straight onto the major
boots the *old* gate against the *new* engine, which is the mass stop this exists
to prevent. Phase 4's date is fixed at phase 3, because the notice period *is* the
migration mechanism — announcing it late pays the shim's whole cost and collects
none of its benefit.

## Open questions

1. **Which changes in the new level are codemoddable?** Answer it *while* that
   level is designed: triage each proposed change into the three rows in
   [1](#1-the-codemod-runs-on-the-authors-source), then write the transform against
   one real marketplace app. The fraction of the diff it covers sets the realistic
   window length.
2. **What is the enterprise upgrade cadence?** It decides whether 12 months is real
   notice, and the announcement cannot be revised downward once made.
3. **Who ships the CLI?** A new `@rocket.chat/apps-codemod`, or a subcommand of the
   apps CLI, which is maintained outside this monorepo.
