# Apps Engine SDK — RFC index

A ground-up redesign of the Rocket.Chat Apps Engine, written as one document per
**scope**. Each document states one problem, argues one design, and carries its
own open questions. Read the scope you want to discuss; you do not need the rest.

The host side of the same redesign — the app's identity, the gate, the gateway,
the runtime — is argued in its own index: [Apps Engine host RFC](../rfc-host/README.md).

**Status:** RFC / design proposal. Nothing here ships yet. The types under
[`src/`](../src) and the apps under [`examples/`](../examples) compile, so every
claim about inference is checkable — see [Trying it](52-trying-it.md).

## Start here

| | Document | Scope |
|---|---|---|
| 00 | [The redesign, in one page](00-overview.md) | goal, the Mastra mapping, the design principles |
| 01 | [What we studied in Mastra](01-prior-art-mastra.md) | the eleven patterns we took, and why |
| 02 | [What's wrong with the legacy API](02-legacy-api-problems.md) | the eight defects the redesign answers |

## The app-facing surface

What an app author writes.

| | Document | Scope |
|---|---|---|
| 10 | [The composition root](10-surface-composition-root.md) | `createApp` / `defineApp`, the kit, the registry |
| 11 | [The context (`ctx`)](11-surface-context.md) | one injected object replaces the accessor tree |
| 12 | [Slash commands](12-surface-slash-commands.md) | schema-parsed arguments, preview |
| 13 | [Scheduled jobs](13-surface-scheduled-jobs.md) | declarative cron, typed imperative scheduling |
| 14 | [HTTP endpoints](14-surface-http-endpoints.md) | routes, body/query/param schemas, auth |
| 15 | [Event listeners](15-surface-event-listeners.md) | one listener, intent by return value |
| 16 | [Interactive UI](16-surface-interactive-ui.md) | `await ctx.ui.open` — suspend and resume |
| 17 | [Settings, persistence, providers, lifecycle](17-surface-settings-persistence-lifecycle.md) | the remaining app-facing pieces |
| 18 | [Store associations](18-surface-store-associations.md) | secondary concern: cascade cleanup, and whether to keep the tag |

## The data layer

What sits behind `ctx.rooms`, `ctx.messages`, `ctx.users`, … on the host.

| | Document | Scope |
|---|---|---|
| 20 | [Overview](20-data-overview.md) | the hybrid recommendation, and what this layer must deliver |
| 21 | [The entities](21-data-entities.md) | six entities, three kinds of thing, four collections |
| 22 | [Prior art](22-data-prior-art.md) | repository, selection set, write-as-a-value, synced cache |
| 23 | [The recommendation](23-data-recommendation.md) | the six rules, and why not a single pattern |
| 24 | [The read surface](24-data-read-surface.md) | `select` / `with`, cursor lists, closed filters |
| 25 | [The write surface](25-data-write-surface.md) | named commands, preconditions, batching |
| 26 | [The wire contract](26-data-wire-contract.md) | the request envelope that crosses NATS |
| 27 | [The host side](27-data-host-gateways.md) | `defineEntity`, policy, projection, the loader |
| 28 | [Views](28-data-views.md) | Thread, Discussion, Team, Direct message |
| 29 | [Cost, permission, consistency](29-data-cost-permission-consistency.md) | the ceilings and the guarantees |
| 30 | [Cursor pagination](30-data-cursor-pagination.md) | research report: keyset paging, tokens, indexes |
| 31 | [The query surface](31-data-query-surface.md) | research report: filters, aggregates, the analytics gap |
| 32 | [What changes in the app-facing surface](32-data-impact-on-the-surface.md) | the edits this domain forces on 10–17 |

## The platform

| | Document | Scope |
|---|---|---|
| 40 | [Security & permissions](40-platform-security-and-permissions.md) | the non-forgeable actor, declared permissions |
| 41 | [Deployment & isolation](41-platform-deployment-and-isolation.md) | in-process vs. the apps-runtime microservice |
| 42 | [Permissions](42-platform-permissions.md) | the grant, the single gate, the two principals, consent |
| 43 | [Field-level permissions](43-platform-field-permissions.md) | gating a *field*, not a call: `@@SecureFields` and what replaces it |

## Wrap-up

| | Document | Scope |
|---|---|---|
| 50 | [Capability coverage](50-capability-coverage.md) | legacy → new, and what is still `◑` |
| 51 | [Open questions](51-open-questions.md) | the decisions this RFC does not make |
| 52 | [Trying it](52-trying-it.md) | type-check commands and the package layout |

## Related decisions in the repo

This RFC is not the only place the apps engine is being re-decided. Where an
in-tree ADR settles a question this RFC also asks, the RFC document cites it and
records what transfers.

| Where | What it settles | Read it in |
|---|---|---|
| `docs/adr/0001-app-accessor-logic-in-base-runtime.md` | accessor logic moves into the base runtime | on `develop` |
| `docs/adr/0002-unified-event-result-for-pre-events.md` | one `pass`/`patch`/`prevent`/`prompt` return type for pre-events | [15](15-surface-event-listeners.md), [16](16-surface-interactive-ui.md), [40](40-platform-security-and-permissions.md), [41](41-platform-deployment-and-isolation.md), [51](51-open-questions.md) |
| `docs/adr/0003-media-call-events-for-apps.md` | the first consumer of ADR 0002 | not yet folded in |

ADRs 0002 and 0003 live on branch `feat/apps-media-call-hooks`, not on
`develop`, so the paths above are not links.

## Conventions

- One scope per document. If a discussion outgrows a document, split it and add
  a row above; the number prefixes leave room in each range.
- Cross-references are links, not section numbers, so a document can be
  reorganized without breaking its neighbours.
- Documents 30 and 31 are **research reports** against the current codebase.
  They keep their own section numbering, because their internal
  cross-references are dense.
