# Prior art: the patterns to borrow from

> Part of the [Apps Engine SDK RFC](README.md).

## Pattern A — the repository

### The shape

A repository is a collection-like object that hides the storage for **one
aggregate**. The caller asks in domain terms. The repository owns the query.

```ts
// host side
interface RoomRepository {
  byId(id: RoomId): Promise<Room | undefined>;
  byName(name: string): Promise<Room | undefined>;
  membersOf(id: RoomId, page: Page): Promise<User[]>;
  discussionsOf(id: RoomId, page: Page): Promise<Room[]>;
}
```

### What it gets right for us

- **One owner per record.** Every read of a room goes through one file.
- **A seam for the projection.** The repository is where a selection becomes a
  database query. Nothing above it needs to know Mongo exists.
- **A seam for the policy.** Room visibility is one decorator around one object.
- **Testable.** A fake repository is a map.
- **It matches `ctx`.** [the context](11-surface-context.md) lists one client per domain. A gateway
  per record is the mirror image of that on the host.

### What it does not answer

| Question | Repository's answer |
|---|---|
| How does an app say "the room **and** its creator"? | none — which is how the deep/shallow fork of [relations, the cost driver](21-data-entities.md#relations-are-the-cost-driver) starts |
| Where do Thread and Discussion live? | ambiguous — the pattern is silent on views |
| What stops `find({})` from returning 400k rooms? | none |
| What does the call look like on the wire? | none — a repository is an object, not a message |
| How do writes preserve invariants? | `save(entity)` actively works against them |

The honest framing:

> **The repository pattern answers "where does the host code live". It does not
> answer "what can an app ask for".** We need both answers, and they are
> different patterns.

---

## What other plugin systems do

### Survey

| System | How a plugin reads host data | How it writes | Boundary |
|---|---|---|---|
| **Shopify apps** | GraphQL Admin API — versioned schema, selection sets, cursor connections, a per-call **cost budget in points** | mutations, i.e. named domain operations | HTTP, out of process |
| **Atlassian Forge** | `api.asApp()` / `api.asUser()` against the product REST API; `@forge/kvs` for app-private data | product REST | out of process, sandboxed |
| **VS Code** | curated namespaces (`workspace.textDocuments`), live document objects, events | a `WorkspaceEdit` **value**, applied by the host via `workspace.applyEdit()` | in process |
| **Figma** | a live proxy scene graph — property reads hit the host synchronously | assign to node properties | in process |
| **Kubernetes controllers** | informer / lister — a **locally synced read cache** | typed write-through, optimistic concurrency on `resourceVersion` | out of process |
| **Discourse, WordPress** | the ORM directly (`Topic.find`, `WP_Query`) | model `save` | none |

Three of these are worth developing. Two are worth naming as hazards.

### Pattern B — the selection set (Shopify)

A Shopify app does not call `getOrder()` and then `getCustomer()`. It states the
shape it wants, and the platform returns exactly that:

```graphql
query { order(id: "…") { id name customer { id email } lineItems(first: 10) { … } } }
```

Four ideas here are directly useful to us.

1. **The caller declares the hydration.** This is precisely the cure for
   [relations, the cost driver](21-data-entities.md#relations-are-the-cost-driver). The platform never needs a shallow
   twin of an entity, because a shallow read is an empty selection.
2. **The schema is the versioned contract.** Shopify ships quarterly API
   versions and deprecates fields on a published clock. That is what buys them
   the freedom to change storage. We need the same freedom, for the same reason.
3. **A cost budget per call.** Shopify prices a query in points before it runs
   it, and rejects a query that is too expensive. A shared apps runtime needs
   exactly this ([the cost ceiling](29-data-cost-permission-consistency.md#cost)).
4. **Cursor connections, not `skip`/`limit`.** Offset paging over an active room
   silently drops or repeats messages. A cursor does not.

**What we should not take:** a GraphQL server, a query string, or unbounded
nesting. Apps write TypeScript. We want the *shape* of a selection set with
compile-time inference, not a language the app assembles as text.

### Pattern C — the write as a value (VS Code)

A VS Code extension never mutates a file. It builds a description of the change
and hands it back:

```ts
const edit = new vscode.WorkspaceEdit();
edit.replace(uri, range, newText);
await vscode.workspace.applyEdit(edit);   // the host validates and applies
```

Three properties matter to us:

- **The host owns the invariants.** The extension cannot half-apply a change or
  skip a notification.
- **The edit is a value.** It serializes. It crosses a process boundary intact.
  It is also trivially testable and loggable.
- **Several changes travel together**, so the call cost is one round trip
  regardless of how many changes it carries.

This lines up with the [design principles](00-overview.md#design-principles) ("mutations take plain validated objects,
not builders") and it extends it: a write is not only a plain object, it is a
plain object the **host** applies through a domain operation that owns the
invariants ([writes are not CRUD](21-data-entities.md#writes-are-not-crud)).

Its read side is instructive too. VS Code exposes a small, curated set of
namespaces, and everything else is reached by traversal from an object you
already hold. That is the "few clients plus declared relations" shape, and it
argues against a client per concept.

### Pattern D — the synced read cache (Kubernetes)

A controller does not query the API server per reconcile. An informer keeps a
local cache, and the controller reads from it. Writes go to the API server and
carry a `resourceVersion` for optimistic concurrency.

We should not build a full replica cache for apps. Two narrower ideas transfer:

- **A per-execution identity map.** Inside one handler, the same id read twice
  should cost one query. This also gives read-your-writes inside the handler.
- **Conditional writes.** An app that edits a message it read a second ago can
  lose a concurrent human edit. Passing the record's `_updatedAt` back as a
  precondition turns a lost update into a rejected write.

### Two patterns to reject, and why

**The live proxy graph (Figma).** `node.parent.children[0].name` is delightful,
and it requires a **synchronous** property read against host memory. That is
in-process only. Adopting it would forfeit [the deployment model](41-platform-deployment-and-isolation.md) — the whole point
of reaching the platform only through `ctx` is that `ctx` can be an RPC proxy.
Figma itself needed a second JS realm to contain plugins, and still cannot move
them off the host.

**Direct ORM access (Discourse, WordPress).** Zero design cost on day one, and a
permanent tax after: the database schema becomes the public API, so it can never
change. Both platforms still pay it.

