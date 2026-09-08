# The store

> Part of the [Apps Engine SDK RFC](README.md).

App-private persistence. `defineStore` declares the collections; `ctx.store`
reads and writes them. Platform data — rooms, messages, users — belongs to the
data layer ([20](20-data-overview.md)), never to the store.

## The shape

```ts
// app.ts — the declaration
export const store = defineStore({
  reminders: {
    schema: z.object({
      userId: z.string(),
      roomId: z.string(),
      text: z.string(),
      dueAt: z.string(),
      delivered: z.boolean(),
      expiresAt: z.date(),
    }),
    indexes: [
      { on: ['userId', 'delivered'] },  // the per-user pending list
      { on: ['delivered', 'dueAt'] },   // the digest, oldest first
      { on: 'expiresAt', ttl: '30d' },  // the host drops the row
    ],
  },
});

export const app = createApp({ manifest, settings, store });
```

```ts
// any handler — the collection, the record and the query are all typed
const pending = await ctx.store.reminders.find({ userId: ctx.sender, delivered: false });
//    Array<{ _id: string; userId: string; …; expiresAt: Date }>

const id = await ctx.store.reminders.insert({ userId, roomId, text, dueAt, delivered: false, expiresAt });
await ctx.store.reminders.update(id, { delivered: true });
```

The collection map flows from `createApp` into every `ctx`
([10](10-surface-composition-root.md)). A collection the app did not declare is
not a property of `ctx.store`.

## The surface

| Call | |
|---|---|
| `insert(doc)` | validates `doc` against the schema, returns the host-minted `_id` |
| `get(id)` | one record, or `undefined` |
| `find(query?, opts?)` | a page of records. `query` is limited to the served key sets |
| `update(id, patch, { upsert })` | `$set` of the patch, validated field by field |
| `delete(id)` | `true` if a record went away |

Five calls, one collection each. No aggregate, no join, no transaction: the
store answers what its indexes serve. An app that needs more computes it in the
handler, or keeps the derived record itself.

## The declaration is the query surface

`find` accepts a key set only when a declared index serves it as a prefix.

```ts
indexes: [{ on: ['userId', 'delivered'] }]

find({ userId })                     // ✅ the prefix
find({ userId, delivered: false })   // ✅ the whole key
find({ delivered: false })           // ❌ no index starts with delivered
find({ text: 'hi' })                 // ❌ in the record, in no index
```

The rule is a type, not a runtime check. `ServedQuery`
([`src/store.ts`](../src/store.ts)) builds the accepted key sets from the
declared indexes, and [`examples/store-queries.ts`](../examples/store-queries.ts)
asserts every rejection above with `@ts-expect-error`. An app that wants a query
declares the index for it; the host builds it at install
([host 31](../rfc-host/31-store-persistence.md)).

Three more rules the type enforces at the declaration:

- **`unique: true`** — the host refuses the second record with that key.
- **`ttl: '30d'`** — the host expires the record 30 days past the field's date.
  The field must be a `Date`, because MongoDB expires dates and not strings.
- an index key names a field the schema declares. A collection with no index
  answers `get` and an unfiltered page, and nothing else.

## Writes validate, reads do not

```ts
{ _id, _updatedAt, _v, ...appFields }   // the host mints all three
```

The schema ships in the app bundle; the records live in the host's database. So a
write validates against the current schema and a read does not. A read that
validated would fail on every record the previous version wrote — including the
records the app needs in order to migrate them.

`_v` carries the schema version a record was written under. The app migrates its
own records in `onUpdate`, which receives `previousVersion`
([`src/app.ts`](../src/app.ts), and [17](17-surface-settings-providers-lifecycle.md)
for the rest of the lifecycle). The app's schema is a closed object, so no app
field shadows the host's three.

`update` validates the patch field by field. A cross-field invariant — "`dueAt`
is after `createdAt`" — does not survive a partial patch.

## Limits the app can hit

| Limit | What the app sees |
|---|---|
| the storage quota | `insert` and `update` fail. `get`, `find` and `delete` keep working |
| the per-record size cap | `insert` fails |
| the page cap on `find` | fewer records than `limit` asked for |
| the query timeout | `find` fails |

Reads survive the quota on purpose: an app that cannot read its own store cannot
prune it. The numbers, and who raises them, are
[host 31](../rfc-host/31-store-persistence.md)'s.

## The relation tag

`insert` takes an optional per-record relation — `{ associations: [{ model:
'room', id }] }` — and `findByAssociation` reads it back.
[18a](18a-surface-store-associations.md) owns that decision and has not made
it; dropping the tag is one of its three options. Everything above works
without it.

## Open questions

1. **Does `find` order its results?** The served index fixes an order, and the
   surface does not name one. Either `find` promises index order, or it promises
   none and the app sorts what it read.
2. **`skip`, or a cursor?** `PageOpts` pages by offset. The data layer rejected
   offsets for lists ([30](30-data-cursor-pagination.md)); a store collection
   grows the same way, at a smaller size.
3. **Compare-and-set.** Two instances run the same job. Legacy offers no atomic
   primitive, so no app depends on one, and every lease an app writes today has
   a race. One `findOneAndUpdate`-shaped call closes it. Does it ship in v1?
