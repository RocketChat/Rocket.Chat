# packages/app-sdk

The Apps Engine redesign RFC: [`rfc/`](rfc) is the app-facing SDK,
[`rfc-host/`](rfc-host) is the host. One document per scope. These rules govern
how a document is written — they are as binding as the design they describe.

## Length

| | |
|---|---|
| a scope document | 30–80 lines; 150 is the ceiling, and only for a scope that carries a model |
| a research report | no limit — [30](rfc/30-data-cursor-pagination.md) and [31](rfc/31-data-query-surface.md) are working notes against the codebase and keep their own numbering |
| a section | one claim; if it needs three paragraphs to land, it is two sections, or the claim is wrong |

Cut until the argument stops surviving. Then stop.

## Show, do not explain

Prefer, in this order: **code, table, diagram, prose.** A snippet that shows the
call replaces the paragraph that describes it. Prose carries only what the code
cannot state — the rule, the trade-off, the consequence.

```ts
principal: { kind: 'app' }      // → the user keyed by this binding's appId
principal: { kind: 'actor' }    // → the user the platform stamped on ctx.actor
```

Not: "the envelope carries a discriminator rather than an identity, so that the
gateway can resolve the principal itself instead of trusting the payload".

## Do not argue with the RFC's own past

A superseded decision is **gone**. Never write "unlike the earlier proposal",
"this replaces what 29 said", "the missing half of that sentence", or "seen from
the other side". Every document states what is true now, in one voice.

Citing a *live* decision in another scope is different, and is encouraged: link
it and move on.

## Legacy only where it binds

Legacy context earns its place in exactly two cases:

1. a migration cost the redesign will actually pay, or
2. a mechanism the redesign keeps and builds on.

A defect the new design removes **by construction** needs no defence, and
describing it invites a reader to check that the new design handles a case that
can no longer occur. The catalog of legacy defects lives in
[02](rfc/02-legacy-api-problems.md) and nowhere else.

State a legacy fact as a citation, not a narration:

```
`AppManager.createAppUser` (packages/apps/src/server/AppManager.ts:1186)
```

One line, checkable, no story. Verify the line number before you commit it.

## Use the established word

[`GLOSSARY.md`](GLOSSARY.md) records the nomenclature both indexes have fixed.
A term listed there means that and nothing else. `gateway`, `client`, `command`,
`surface`, `scope`, `view` and `store` each name two different things in this
domain — check the collisions table before you reach for one.

A new term earns a row in the same commit that introduces it.

## Shape of a document

```
# Title
> Part of the [… RFC](README.md).

one or two lines: what this scope decides
the shape          — code or a diagram, first thing after the intro
the rules          — numbered sections, one claim each
open questions     — the decisions this document does not make
```

Cross-references are links, never section numbers. Add the row to `README.md` in
the same commit.
