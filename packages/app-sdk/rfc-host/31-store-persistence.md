# The store: collections, indexes and quotas

> Part of the [Apps Engine host RFC](README.md).

**Status:** research report
**Substantiates:** [17](../rfc/17-surface-settings-persistence-lifecycle.md) — "typed
collections (`defineStore`) with familiar CRUD + `find(query)`".
**Scope:** where an app's records live in MongoDB, who creates the indexes, and what
an open store costs the workspace. The app-facing shape of `ctx.store` is
[17](../rfc/17-surface-settings-persistence-lifecycle.md)'s business. The relation tag
is [18](../rfc/18-surface-store-associations.md)'s.

---

## 1. TL;DR

**Recommendation.** Each declared store collection gets **its own MongoDB collection**,
named `rocketchat_app_<appId>_<name>`. The host creates it and its indexes at install,
reconciles them at update, and drops them at uninstall. The declaration moves into the
app package, so the host owns the schema and the index set before any app code runs.

**The index declaration becomes the query contract.** `indexes` today is a list of
field names ([`src/store.ts:18-21`](../src/store.ts)). It becomes a list of index specs,
and `find` accepts only a key set that one declared index serves as a prefix. An app
cannot issue a query the host did not plan for.

Five findings from the codebase and from MongoDB's own limits force this shape:

1. **One shared collection cannot hold every app's indexes.** MongoDB caps a collection
   at **64 indexes**. Today's `apps_persistence` spends one on `{ appId, associations }`
   (`packages/models/src/models/AppsPersistence.ts:11-20`). A workspace with 30 apps and
   4 declared indexes each needs 120. The cap is per collection, so the shared layout
   fails at a workspace size Rocket.Chat already sells.
   ([MongoDB limits](https://www.mongodb.com/docs/manual/reference/limits/))
2. **The namespace budget is not the constraint; the index budget is.** Rocket.Chat
   declares 75 model collections and 261 index specs today. Atlas advises at most
   5,000 collections and indexes together on an M10. Per-app collections add tens of
   namespaces; the indexes inside them add hundreds. Cap the indexes, not the
   collections.
3. **Index creation is best-effort today, and it warns instead of failing.**
   `BaseRaw.createIndexes` catches the error and calls `console.warn`
   (`packages/models/src/models/BaseRaw.ts:109-110`). An app store cannot inherit that:
   a missing index turns a planned lookup into a collection scan, silently.
4. **Nothing in the server sets a query timeout.** `maxTimeMS` appears zero times in
   `packages/models/src` and `apps/meteor/server`. One unindexed app query can occupy a
   mongod worker for as long as it likes.
5. **The pattern is already in tree, one level down.** `apps_logs` discriminates by
   `appId`, prefixes its compound indexes with it, and expires rows with a TTL index
   (`packages/models/src/models/AppLogsModel.ts:11-40`). It proves the mechanics and it
   shows their ceiling: it serves one host-defined shape, not N app-defined ones.

**The price.** Install and uninstall become DDL operations. The host carries a schema
registry per app version. An app gets a quota it can exceed, so the host needs an
answer for what happens when it does.

---

## 2. What the store has to serve

The app-facing contract is six methods per collection
([`src/context.ts:245-252`](../src/context.ts)):

```ts
export interface Collection<T extends object> {
	insert(doc: T, opts?: { associations?: Association[] }): Promise<string>;
	get(id: string): Promise<(T & { _id: string }) | undefined>;
	find(query?: Partial<T>, opts?: PageOpts): Promise<(T & { _id: string })[]>;
	findByAssociation(assoc: Association): Promise<(T & { _id: string })[]>;
	update(id: string, patch: Partial<T>, opts?: { upsert?: boolean }): Promise<void>;
	delete(id: string): Promise<boolean>;
}
```

Three properties of that contract drive the host design:

| The contract says | The host must therefore |
|---|---|
| `find(query?: Partial<T>)` | compile the query itself. It never forwards an app object to the driver |
| `T` comes from a schema | hold that schema, and validate a write before it reaches Mongo |
| collections are named and declared | know the names before the app runs, so it can build the indexes |

---

## 3. The declaration reaches the host through the package

`defineStore` runs inside the app bundle. The host needs the same information at
install, when no app code has run yet, and at uninstall, when the app may not load at
all. So the store declaration is **build-time output**, not a runtime call.

The bundler already emits `app.json` from the manifest object and cross-checks the
declared scopes ([42](../rfc/42-platform-permissions.md)). It emits the store the same
way: the collection names, each collection's JSON Schema, and each collection's index
specs. `Schema` carries a `toJsonSchema()` projection for exactly this
([`src/schema.ts`](../src/schema.ts)).

The host stores it beside the settings it already keeps per app —
`IAppStorageItem.settings` in `rocketchat_apps`
(`packages/apps/src/server/storage/IAppStorageItem.ts:21`).

Two consequences:

- **The admin sees the store at install.** Collection count, index count and the
  requested quota are reviewable, like a permission is.
- **A remote runtime cannot widen it.** Under the split runtime
  ([41](../rfc/41-platform-deployment-and-isolation.md)) the app process is untrusted.
  It names a collection; it does not define one.

---

## 4. Where the records live

Three layouts. `A` = installed apps, `K` = collections per app, `i` = indexes per
collection.

| | A — one shared collection | B — one collection per app | C — one collection per store collection |
|---|---|---|---|
| name | `rocketchat_apps_store` | `rocketchat_app_<appId>` | `rocketchat_app_<appId>_<name>` |
| discriminator | `{ appId, c }` in every doc and every index | `{ c }` in every doc and index | the namespace |
| index cap of 64 applies to | **every app together** | one app | one store collection |
| namespaces | 1 + all indexes | `A × (1 + K·i)` | `A × K × (1 + i)` |
| purge on uninstall | `deleteMany({ appId })` | one `drop` | `K` drops |
| per-app size | an aggregation over the collection | `$collStats`, free | `$collStats`, free |
| TTL per collection | a partial TTL index against the shared cap | a partial TTL index | a plain TTL index |
| document validator | not expressible per collection | not expressible per collection | `$jsonSchema` per collection |

**A is disqualified by the cap.** 64 indexes is a hard MongoDB limit, and the layout
spends them from one budget for the whole workspace. The default license allows 5
marketplace apps and 0 private ones
(`ee/packages/license/src/validation/validateDefaultLimits.ts:11-22`); an enterprise
license raises both. The layout that breaks when a customer installs more apps is the
wrong layout.

**B and C cost about the same in namespaces**, because the indexes dominate the count,
not the collections. At `A=30, K=8, i=5`, B needs 1,230 namespaces and C needs 1,440.
Rocket.Chat's own 75 collections and 261 indexes sit underneath either number, and both
stay inside Atlas's 5,000 guidance for the smallest dedicated tier.

**C wins on everything the namespace does for free.** Size, expiry, validation and
deletion are per-collection operations in MongoDB, and in C the MongoDB collection is
the unit the app declared. B has to re-implement each of them over a discriminator
field.

### 4.1 The names

`getCollectionName` prefixes every model with `rocketchat_`
(`packages/models/src/index.ts:115-117`). The store keeps the prefix and adds its own:

```
rocketchat_app_<appId>_<name>
             └ 36-byte UUID   └ the declared key, ^[a-z][a-z0-9_]{0,31}$
```

84 bytes at most, against a 255-byte namespace limit that also has to hold the database
name. `manifest.id` is already a validated UUID
([`src/app.ts:100-101`](../src/app.ts)), so the app cannot squat another app's prefix.

### 4.2 The document

```ts
{ _id: string, _updatedAt: Date, _v: number, ...appFields }
```

App fields sit at the top level, so an index key reads `{ userId: 1 }` and an operator
can query the collection by hand. Three rules keep that safe, and the host checks all
three at install, from the JSON Schema:

1. The top-level schema is a **closed object**. No catch-all key, no passthrough.
2. No top-level key starts with `_` or `$`, and none contains a dot.
3. `_id` is host-minted. `BaseRaw.insertOne` already mints a hex string
   (`packages/models/src/models/BaseRaw.ts:301-305`), and the store keeps that shape so
   an app id looks like every other Rocket.Chat id.

Rule 1 is what makes rules 2 and 3 static. An open record type would move the check to
every write.

---

## 5. The gateway

One host-side component owns the collections, in the shape
[27](../rfc/27-data-host-gateways.md) uses for the data layer.

```
ctx.store.reminders.find({ userId })
   │  envelope: { op: 'store.find', collection: 'reminders', where: { userId } }
   ▼
StoreGateway
   ├─ appId ← the binding, never the payload
   ├─ collection ∈ the declared set, else refuse
   ├─ where ← compiled from the declared fields, key by key
   ├─ shape ← served by a declared index as a prefix, else refuse
   └─ db.collection('rocketchat_app_<appId>_reminders').find(…, { maxTimeMS })
```

Three of those five lines are security, not performance:

- **The app never names its own `appId`.** The namespace derives from the binding the
  host resolved, so an app cannot read another app's store by editing an envelope.
- **The `where` is rebuilt, never forwarded.** The app sends `{ userId: 'abc' }` on the
  wire as JSON, and JSON does not respect the TypeScript type. A forwarded object
  admits `{ userId: { $ne: null } }`, `$expr` and `$where`. The gateway reads the
  declared field list, takes the keys it recognizes, and rejects any value that is not a
  scalar the schema allows.
- **`maxTimeMS` is set on every call.** It is set nowhere in the server today, and the
  store is the wrong place to continue that.

---

## 6. Indexes

### 6.1 The declaration

`indexes: (keyof T & string)[]` ([`src/store.ts:18-21`](../src/store.ts)) says only
"index this field". It cannot express the three things apps actually need — a compound
key, uniqueness, and expiry:

```ts
defineStore({
  reminders: {
    schema: reminderSchema,
    indexes: [
      { on: ['userId', 'dueAt'] },            // compound, and the sort key for find
      { on: ['roomId'], unique: true },       // one reminder config per room
      { on: 'expiresAt', ttl: '7d' },         // the host builds the TTL index
    ],
  },
});
```

Rules the host enforces at install:

| Rule | Why |
|---|---|
| index fields are top-level and declared in the schema | an index on an undeclared field can never be used |
| `unique` implies `partialFilterExpression: { <field>: { $exists: true } }` | otherwise every document that omits the field collides with every other |
| no text, geo or wildcard index in v1 | a text index is limited to one per collection, and a wildcard index is an open budget |
| at most 5 indexes per collection, 8 collections per app | see the arithmetic in [§4](#4-where-the-records-live) |

### 6.2 The query surface is the index surface

`find` accepts a key set only if a declared index serves it as a prefix. `{ userId }`
and `{ userId, dueAt }` are served by the first index; `{ dueAt }` alone is not.

This is the same rule the data layer applies to lists
([30 §7](../rfc/30-data-cursor-pagination.md)), and it is stricter than it sounds,
because here the app writes the index list itself. An app that wants a query declares
the index for it. The refusal is a build-time error where the query keys are literal,
and a runtime error otherwise.

The alternative is to allow the scan and cap it with `maxTimeMS`. That trades a clear
error at install for an intermittent timeout in production, on data that only grows.

### 6.3 Creation, reconciliation, failure

| Moment | The host |
|---|---|
| install | creates each collection and each index, then marks the app installable. A failure fails the install |
| enable | verifies the live index set matches the declaration; repairs a drift |
| update | diffs the declared set against the live one; creates the added, drops the removed. The new version does not enable until the diff applies |
| uninstall | drops the collections. `AppManager.removeLocal` already calls the purge hook (`packages/apps/src/server/AppManager.ts:710`) |
| orphan | a reconciliation pass lists `rocketchat_app_*` and drops what no installed app claims |

Three failure modes deserve names:

1. **A unique index cannot be built on existing data.** The app version 2 adds
   `unique: true`; version 1's rows already contain duplicates. The build fails and the
   update must fail with it, cleanly, leaving version 1 enabled. A half-applied index
   diff is worse than a refused update.
2. **A build on a large collection is slow.** MongoDB 7 and later build with only brief
   exclusive locks, so writes continue, but the build still costs IO for minutes. The
   update runs it while the app is disabled — `AppManager.update` disables the app
   first (`packages/apps/src/server/AppManager.ts:740`) — and it reports progress
   instead of blocking a request.
3. **Every instance loads every app.** `createIndexes` is idempotent and MongoDB
   deduplicates identical specs, so a race between instances is safe. The install path
   still runs the DDL once, on the instance that serves the install.

---

## 7. Quota

The store is the first surface where an app can consume workspace disk without limit.
Legacy persistence has the same property and no answer; the redesign should not ship
the same gap.

| | |
|---|---|
| what is measured | `$collStats` `storageSize`, summed over the app's collections. Metadata only, so it is O(1) |
| when | on a schedule, and after a write that crosses a soft threshold. Not on every write |
| default | a workspace setting. 256 MB per app is a starting number, not a defended one |
| over the soft limit | the admin sees a warning on the app's page |
| over the hard limit | `insert` and `update` fail with a quota error the app receives. `get`, `find` and `delete` keep working |

Reads keep working on purpose. An app that cannot read its own store cannot clean it up.

Two more caps belong here, and both are cheap:

- **256 KB per document.** The BSON limit is 16 MB, which is far past the point where a
  store record is the wrong tool.
- **A page cap on `find`.** `PageOpts` already carries the request; the gateway sets the
  ceiling.

---

## 8. Schema evolution

The schema lives in the app bundle and the data lives in Mongo. They drift the moment
version 2 changes a field.

**The host validates on write and trusts on read.** Validation on read would turn a data
problem into an outage: an app that changes a field would fail on every existing row,
including the rows it needs in order to migrate them.

`_v` carries the schema version the row was written under. `onUpdate` receives
`previousVersion` ([`src/app.ts:62`](../src/app.ts)), so an app migrates its own rows
there, and the host does not guess at a migration it cannot understand.

`update(id, patch)` compiles to `$set`. A patch validates against the schema's partial
projection, field by field. A cross-field invariant — "`dueAt` is after `createdAt`" —
does not survive a partial patch, and the documentation has to say so. The alternative
is a read, a merge, a full validation and a conditional write on every patch, which
prices a common operation for an uncommon guarantee.

---

## 9. Legacy data

Legacy persistence writes `{ appId, associations, data }` into `apps_persistence` with
no collection name (`apps/meteor/app/apps/server/bridges/persistence.ts:42`). Nothing
in those rows says which typed collection they would belong to, so no automatic
migration exists.

The consequence is small, and it is worth stating rather than solving: legacy apps keep
the legacy bridge and the legacy collection, and an app that moves to the new SDK moves
its own rows in `onUpdate` through a read-only view of the old records. Two collections
coexist until the last legacy app is gone. `apps_persistence` is then dropped, not
migrated.

---

## 10. What an open store risks

The store is app-defined by design. That is the feature. These are its costs, ordered by
how much of the workspace each one can take down.

| # | Risk | Blast radius | The control |
|---|---|---|---|
| 1 | **Unbounded growth.** An app fills the disk | the whole workspace, including core collections | the quota in [§7](#7-quota). Per-app collections make it measurable at all |
| 2 | **Unindexed reads.** A scan pins a mongod worker | every query on the server | the index contract in [§6.2](#62-the-query-surface-is-the-index-surface), plus `maxTimeMS` |
| 3 | **Index bloat.** 40 indexes on a hot collection evict core pages from the WiredTiger cache | every query on the server | the per-app index cap, and the admin review at install |
| 4 | **Query injection.** A forwarded filter object carries `$where` or `$expr` | the server's CPU; not other apps' data, because the namespace is per app | the gateway compiles the filter ([§5](#5-the-gateway)) |
| 5 | **Write amplification in the oplog.** A chatty app pushes replicas behind and lengthens the recovery window | replication, and every consumer that tails the oplog | the quota, and a write-rate ceiling per app |
| 6 | **Undeclared personal data.** An app stores user data the workspace's retention and erasure paths never see | compliance | uninstall purges. Per-user erasure does not exist — see [18](../rfc/18-surface-store-associations.md) |
| 7 | **Schema drift.** Version 2 reads version 1 rows | one app | `_v`, and validate-on-write only ([§8](#8-schema-evolution)) |
| 8 | **A failed index build blocks an update** | one app, at update time | the update fails whole, and version 1 stays enabled ([§6.3](#63-creation-reconciliation-failure)) |
| 9 | **Orphan namespaces.** An install fails halfway and leaves collections behind | the namespace budget | the reconciliation pass ([§6.3](#63-creation-reconciliation-failure)) |
| 10 | **A sharded deployment.** New collections are unsharded and land on the primary shard | the primary shard | out of scope for v1; state it, do not solve it |

Risks 1, 2 and 3 share one shape: **the app declares, and the workspace pays.** Every
control above is a version of the same answer — make the declaration explicit, review it
at install, and cap it.

---

## 11. What this changes

| Where | Change |
|---|---|
| [`src/store.ts:18-21`](../src/store.ts) | `indexes` becomes a list of index specs, not field names |
| [`src/context.ts:248`](../src/context.ts) | `find` narrows from `Partial<T>` to the key sets the declared indexes serve |
| [17](../rfc/17-surface-settings-persistence-lifecycle.md) | states the index contract and the quota as part of the store, not as runtime detail |
| the manifest | `app.json` gains the store declaration; the admin reviews it at install |
| [`rfc/50-capability-coverage.md`](../rfc/50-capability-coverage.md) | persistence stays `✅` only if the index contract ships with it |

---

## Open questions

1. **Is 5 indexes and 8 collections per app the right shape of cap?** The numbers come
   from the namespace arithmetic in [§4](#4-where-the-records-live), not from a survey
   of what marketplace apps store. That survey is worth running before the cap ships.
2. **What is the default quota, and who raises it?** A workspace setting, a per-app
   grant the admin approves like a scope, or a marketplace-declared request?
3. **Does the store need atomic operations?** Two instances run the same job. Legacy
   offers no compare-and-set, so no app depends on one, and every app that needs a lease
   today has an unfixable race. A single `findOneAndUpdate`-shaped primitive would close
   it. Do we ship it in v1?
4. **How many workspaces share a MongoDB cluster in Cloud?** The namespace arithmetic
   assumes one workspace per cluster. If Cloud packs many workspaces into one cluster,
   layout B trades the per-collection conveniences for `K`× fewer collections — 30
   instead of 240 at the numbers above — while the index count stays the same. The trade
   may be worth it. This is a question for whoever owns the Cloud topology.
5. **Does the admin see the store?** Collection sizes, row counts and index usage per
   app are one `$collStats` call away in layout C. That is an admin screen nobody has
   asked for yet, and the cheapest observability the redesign can offer.
