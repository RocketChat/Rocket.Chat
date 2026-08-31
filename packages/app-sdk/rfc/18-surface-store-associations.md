# Store associations

> Part of the [Apps Engine SDK RFC](README.md).

**Secondary concern.** The store in
[17](17-surface-settings-persistence-lifecycle.md) works without associations.
They carry some value, but they are not a clear win. This document states both
sides and stops short of a recommendation. Read it after the rest of the store
is settled.

## What an association is today

Legacy persistence has no query language. `create(data)` returns an id, and an
association is the only other way back to a record:

```ts
await persis.createWithAssociations(
  { userId, roomId, text },
  [new RocketChatAssociationRecord(RocketChatAssociationModel.ROOM, roomId)],
);
const records = await read.getPersistenceReader().readByAssociation(assoc);  // Array<object>
```

The tag does two jobs at once:

1. **Index.** It is the lookup path when the app does not hold the record id.
2. **Relation.** It says the record hangs off a room, a message, or a user.

## What the redesign does with it

`find(query)` takes job 1
([`src/store.ts`](../src/store.ts)). The sketch keeps the tag for job 2, and
attaches a new promise to it — cascade cleanup
([`src/context.ts`](../src/context.ts)):

```ts
await ctx.store.reminders.insert(doc, { associations: [{ model: 'room', id: ctx.room }] });
await ctx.store.reminders.findByAssociation({ model: 'room', id: ctx.room });
```

## The case for keeping them

1. **Only the host observes a deletion.** A room disappears, retention prunes a
   message, an admin deletes a user. The app may be disabled at that moment, or
   it may install later. No event listener makes the cleanup reliable.
2. **An app field is opaque to the host.** The reminder record already holds
   `roomId`, but the host cannot know that this string names a room, or which of
   several id fields owns the record. `{ model: 'room', id }` is a declared
   relation the host can act on.
3. **The host already indexes it.** `AppsPersistenceModel` carries
   `{ appId: 1, associations: 1 }`
   (`packages/models/src/models/AppsPersistence.ts`), so the lookup is cheap and
   needs no per-collection index.
4. **The migration is mechanical.** `createWithAssociations` → `insert(doc,
   { associations })`, `readByAssociation` → `findByAssociation`. App authors
   already know the concept.

## Why they are not a clear win

1. **Cascade cleanup does not exist.** The only cascade in tree is
   purge-on-uninstall (`AppPersistenceBridge.purge`, which runs
   `remove({ appId })`). Nothing removes app records when a room, a message, or
   a user goes away. So "the useful part of associations survives" describes a
   feature we would build, not one we port. The shape survives; the value is new
   host work.
2. **Nothing is lost if we drop them.** `find` covers the index role, which is
   the role legacy apps actually use. An app that stores `roomId` on the record
   reaches parity with today through `find({ roomId })`. The tag buys only the
   cleanup, and the cleanup is unbuilt.
3. **The tag duplicates a field.** In the reminder example, `roomId` sits in the
   record and `{ model: 'room', id }` sits beside it. Two sources for one fact,
   and nothing keeps them equal.
4. **Ownership belongs to the collection, not to the call.** Every `insert` into
   `reminders` repeats the same tag. One call that forgets it opts that record
   out of the cleanup, silently. A guarantee that each write can skip is
   best-effort by construction.
5. **`misc` reopens the untyped hatch.** `{ model: 'misc', id: string }` is a
   free-form string tag on an otherwise typed store.
6. **The semantics are unpriced.** Each answer below is host work, and the RFC
   states none of them. See the open questions.
7. **The compliance argument is weaker than it looks.** A best-effort garbage
   collector is not a data-removal control. If user deletion must remove app
   data, it needs a pipeline with a guarantee, and that pipeline would not lean
   on an optional per-record tag.
8. **The tag shape is frozen.** The bridge matches associations with `$all` over
   whole objects, so the match is exact object equality. A later field on the
   tag does not match the records already stored.

## Three options

**A — drop them.** `defineStore` keeps `schema` and `indexes`. `find` is the
only lookup. This is parity with today's behavior, at a smaller surface.
Cleanup becomes its own design, if we ever want it.

**B — keep the sketch as written.** Then the RFC must say that cascade cleanup
is unbuilt, and [the coverage table](50-capability-coverage.md) must read `◑`
for this row rather than `✅`.

**C — move the relation into the declaration.**

```ts
defineStore({
  reminders: {
    schema: reminderSchema,
    indexes: ['userId', 'roomId'],
    ownedBy: { room: 'roomId' },   // the whole collection dies with the room
  },
});
```

Then `insert` takes one argument, the guarantee holds per collection instead of
per call, the relation reuses the field the record already has, and the host
reads the ownership from the manifest at install time. `findByAssociation`
disappears, because `find({ roomId })` covers it.

C is the option worth defending if we keep the behavior at all. A and C both
shrink the app-facing surface; B keeps it and owes the reader a warning.

## Open questions

1. **Do we want cascade cleanup in v1?** If the answer is no, option A settles
   the whole document.
2. **Per-record tag or per-collection declaration?** B against C.
3. **Which deletions cascade?** Room deletion, retention prune, upload removal,
   and user deletion do not have the same weight. User deletion may also mean
   anonymize, not remove.
4. **Several owners on one record.** Does one deleted owner remove the record,
   or all of them? Legacy `$all` semantics do not answer this.
5. **Order against the app's own listeners.** If an app also listens for room
   deletion, does its listener run before the host drops its records?
6. **Opt-out.** An audit record may need to outlive the room it describes.

## What this document changes

Nothing in [`src/`](../src). The sketch stays as written until we pick A, B, or
C.
