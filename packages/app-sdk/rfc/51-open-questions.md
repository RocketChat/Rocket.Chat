# Open questions and deferred domains

> Part of the [Apps Engine SDK RFC](README.md).

---

## The app-facing surface

These need load-bearing product/runtime decisions I'd rather put to you than
guess at:

1. **Block Kit authoring DSL.** This proposal treats a rendered block as opaque
   and delegates authoring to `@rocket.chat/ui-kit` (already the in-tree
   direction). The concrete block/element API for apps is a sizable design of its
   own. **Decision needed:** adopt `@rocket.chat/ui-kit` component functions
   as-is, or design an app-specific thin layer?

2. **Suspend/resume durability contract.** The app-side API (`await ctx.ui.open`,
   and potentially a general `defineFlow` for multi-step wizards) is clear. The
   runtime guarantees are not: maximum suspension window, what happens to an
   in-flight suspended interaction when the app is updated or disabled, and
   whether we expose durable multi-step flows beyond single modals. **Decision
   needed:** how durable, and how long?

3. **Backward compatibility.** Do we ship a compatibility shim that runs existing
   marketplace apps unchanged on the new runtime, a codemod, or a hard major
   version break with a migration window? This shapes the whole rollout.
   There is prior art in tree: ADR 0002 migrates one return contract without
   breaking an app, by recognizing the new shape in a guard that runs **before**
   every legacy branch, and mapping each legacy shape onto a new variant
   (`return true` ≡ `prevent`, a returned entity ≡ a full `patch`). Its lesson is
   that the guard-before-legacy ordering is a review invariant, not a style
   preference. **Decision needed:** does that per-contract widening scale to the
   whole surface, or does the surface change too much for it?

4. **Isolation boundary & wire protocol.** In-process vs. per-app subprocess
   (today's Deno runtime) vs. shared apps-runtime service; and the exact NATS
   subject/message design for `ctx` RPC. Derivable from this API, but the
   isolation model has security/perf trade-offs worth deciding explicitly.

5. **Livechat / Omnichannel.** A large accessor surface (`ILivechatCreator`,
   `ILivechatUpdater`, visitor/department/contact readers). Trimmed to a
   representative `ctx.livechat` here; the full redesign deserves its own pass.

6. **Streaming / AI.** Out of scope for now, but the schema-first tool model maps
   cleanly onto exposing app capabilities to Rocket.Chat's own AI features (and,
   as Mastra shows, onto MCP) if that becomes a goal.

7. **The patch encoding.** `ctx.event.patch` sends a whole subject, and a shallow
   `Partial<T>` cannot express append, deletion or positional intent. ADR 0002
   keeps the door open by treating the payload as one *encoding* and branching
   on its shape, so an op-log sibling stays additive. It also shows the op log
   is nearly free: the legacy `MessageBuilder` is already a change recorder.
   **Decision needed:** ship the shallow patch alone, or generate ops from the
   authoring surface from day one?

8. **Which events may prompt.** `prompt` needs an operation that can be aborted
   and retried. Upload qualifies today; message send needs the client
   challenge/re-send plumbing 2FA has. **Decision needed:** do we build that
   plumbing, or does `prompt` stay upload-only in v1?

---

## The data layer

1. **Versioned data contract.** Shopify buys schema freedom with quarterly API
   versions and a published deprecation clock. Do we adopt a version for the
   apps data layer, and who owns the deprecation calendar?
2. **Selection depth and budget.** Is depth 2 right? Do we price a call in
   points, or only cap it?
3. **Batched writes.** Ship `ctx.apply` for the round-trip saving with no
   atomicity claim, or wait until the domain operations are transactional?
4. **Conditional writes.** Mandatory precondition on update, or opt-in?
5. **Workspace-wide search.** Does a cross-room search belong in the room client
   at all, or in a separate indexed directory entity with its own permission and
   its own cost model?
6. **Team and main room.** Do we hide the main room behind the team, or keep
   both visible? Hiding it is cleaner; it also makes "post to a team" ambiguous.
7. **Command catalog ownership.** The commands in
   [the entity declaration](27-data-host-gateways.md#declare-the-entity-once) are the public write contract. Who
   curates it, and what is the bar for adding one?
8. **Livechat, contacts, video conference.** Deliberately out of scope here.
   They are records with their own relation graphs and deserve the same
   treatment in a follow-up.

Two data-layer scopes carry their own registers:
[cursor pagination](30-data-cursor-pagination.md#open-questions) and
[the query surface](31-data-query-surface.md#open-questions).
