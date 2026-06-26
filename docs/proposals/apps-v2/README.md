# Apps v2 — Design proposals

Numbered design decisions for the v2 apps SDK, captured as we grill through them. Running
context lives in [`../apps-v2-sdk-design.md`](../apps-v2-sdk-design.md); current-state
analysis in [`../apps-current-architecture/`](../apps-current-architecture/).

**Read [`TENETS.md`](TENETS.md) first** — the cross-cutting principles that govern every
decision below. It is the lens for all of `0001`+.

**Resuming the work?** Start with [`NEXT-SESSION.md`](NEXT-SESSION.md) — steering notes,
remaining pillars, and the specific open forks waiting.

| # | Decision | Status |
|---|---|---|
| [0001](0001-app-entry-and-transport-split.md) | App entry point (`defineApp` factory) & transport-agnostic definition | accepted |
| [0002](0002-data-access-and-read-queries.md) | Data access: unified `ctx` repositories & constrained read-query model | accepted |
| [0003](0003-event-handler-model.md) | Event-handler model: `(event, ctx)`, returned `Decision`, two write paths, pre/post split, event-name grammar | accepted |
| [0004](0004-declarative-event-filtering.md) | Declarative host-side event filtering as an optional `on()` arg | accepted |
