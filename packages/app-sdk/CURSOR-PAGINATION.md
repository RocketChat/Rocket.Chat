# Cursor (keyset / seek) pagination for the apps data layer

**Status:** research report
**Companion to:** [`PROPOSAL-DATA-LAYER.md`](PROPOSAL-DATA-LAYER.md) — this substantiates the
one-line claim in its [§5.2](PROPOSAL-DATA-LAYER.md) ("Offset paging over an active room
silently drops or repeats messages. A cursor does not.") and specifies the
`{ pageSize, cursor }` paging model that [§7.2](PROPOSAL-DATA-LAYER.md),
[§8](PROPOSAL-DATA-LAYER.md) and [§13](PROPOSAL-DATA-LAYER.md) assume.
**Scope:** the read/list path only. Writes, selection and the entity model are the
proposal's business; this document is about *how a list turns pages*.

---

## 1. TL;DR

**Recommendation.** Every list in the data layer pages by **keyset (seek), never by
`skip`/`limit`**. The sort key is chosen per entity and, wherever the entity has one,
it is an **immutable** field (messages by `ts`, not `_updatedAt`); the `_id` is
appended as a mandatory tie-breaker because Rocket.Chat `_id`s are random strings and
carry no order of their own. The page token the app receives is **opaque**: a
base64url-encoded, host-signed JSON that pins the sort field, the last `(sortValue,
_id)` pair, the direction, a codec version, and a hash of the frozen query shape — so a
cursor cannot be replayed against a different filter to escape the policy that produced
it. Two new compound indexes are the price of admission (`rocketchat_message` on
`(rid, ts, _id)` and, if room lists are to page at all, `rocketchat_room` on a chosen
sort key).

Three findings from the codebase make this the only defensible choice, and they are
developed below:

1. **`_id` is a random string, not an `ObjectId`.** Messages carry a client-generated
   `Random.id()` (17 chars, non-time-ordered). `_id` alone can never be the sort key.
2. **Offset paging is the current reality, everywhere.** `findPaginated` is
   `skip`+`limit`+`countDocuments`, used by ~40 REST endpoints. It is exactly the
   drop/duplicate hazard the proposal calls out.
3. **The indexes to back a keyset scan mostly do not exist yet.** The message index is
   `(rid, ts, _updatedAt)` — no `_id` tie-breaker — and rooms/users/teams have no index
   on any `_updatedAt`-style sort key at all.

---

## 2. Current pagination reality

### 2.1 The driver, and the shape of a `find`

The models run on the **raw MongoDB Node.js driver**, not on Meteor's `Mongo.Collection`
abstraction. `apps/meteor/server/database/utils.ts:8` reaches into Meteor once to borrow
the connection and hands the bare driver objects to everything else:

```ts
// apps/meteor/server/database/utils.ts:8
export const { db, client } = MongoInternals.defaultRemoteCollectionDriver().mongo;
```

Every model extends `BaseRaw`, which holds a driver `Collection<T>` and issues driver
calls directly ([`packages/models/src/models/BaseRaw.ts`](../models/src/models/BaseRaw.ts)):

```ts
// BaseRaw.ts:67, :90
public readonly col: Collection<T>;
this.col = this.db.collection(this.collectionName, options?.collection || {});

// BaseRaw.ts:229-235 — a find is (filter, options) with projection/sort/skip/limit
find<…>(query: Filter<T> = {}, options?: O): FindCursor<…> {
    const optionsDef = this.doNotMixInclusionAndExclusionFields(options);
    return this.col.find(query, optionsDef) as unknown as FindCursor<…>;
}
```

This matters for the report's later code: the keyset query is a plain driver
`col.find(filter, { sort, limit, projection })`, and the `$or` seek predicate goes in the
`filter`. There is no ORM in the way.

### 2.2 Offset pagination is the house style

The list primitive on every model is `findPaginated`, and it is textbook offset paging —
a cursor plus a **separate full `countDocuments`** for the grand total
([`BaseRaw.ts:237-250`](../models/src/models/BaseRaw.ts)):

```ts
// BaseRaw.ts:237-250
findPaginated<…>(query: Filter<T> = {}, options?: O): FindPaginated<…> {
    const cursor = optionsDef ? this.col.find(query, optionsDef) : this.col.find(query);
    const totalCount = this.col.countDocuments(query);   // ← the whole-match count
    return { cursor, totalCount };
}
```

The REST layer drives it with an `offset`/`count` pair. `getPaginationItems`
([`apps/meteor/server/api/lib/getPaginationItems.ts`](../../apps/meteor/server/api/lib/getPaginationItems.ts))
parses `offset` and clamps `count` to `API_Upper_Count_Limit` (default **100**,
`apps/meteor/server/settings/general.ts:6`; `API_Default_Count` **50**, line 7).
`channels.messages` is representative — and note it hands the client's raw `sort`
straight to Mongo ([`apps/meteor/server/api/v1/channels.ts:496-542`](../../apps/meteor/server/api/v1/channels.ts)):

```ts
// channels.ts:496, :528-542
const { offset, count } = await getPaginationItems(this.queryParams);
const { sort, fields, query } = await this.parseJsonQuery();
…
const { cursor, totalCount } = Messages.findPaginated(ourQuery, {
    sort: sort || { ts: -1 },
    skip: offset,
    limit: count,
    projection: fields,
});
const [messages, total] = await Promise.all([cursor.toArray(), totalCount]);
return API.v1.success({ messages: …, count: messages.length, offset, total });
```

`getPaginationItems` is used by **~40** v1 endpoint files; the `{ items, count, offset,
total }` envelope is the platform's public list contract today. This is precisely the
pattern [§5.2](PROPOSAL-DATA-LAYER.md) and [§13](PROPOSAL-DATA-LAYER.md) replace with
`{ pageSize, cursor }`.

Two structural costs come with it, both of which the proposal's cost ceiling
([§11.1](PROPOSAL-DATA-LAYER.md)) is trying to bound:

- **`skip` is O(n).** MongoDB walks and discards the first `offset` documents on every
  page; deep offsets get linearly slower.
- **`countDocuments` is a second full scan of the match** (unless the filter is fully
  index-covered). Every page pays for a total the caller rarely needs.

### 2.3 The one place RC already "seeks" — and where it stops short

Message history loading is *not* pure offset paging; it already uses a `ts` range as a
seek boundary ([`apps/meteor/server/lib/messages/loadMessageHistory.ts:39-55`](../../apps/meteor/server/lib/messages/loadMessageHistory.ts)):

```ts
// loadMessageHistory.ts:39-55
const options = { sort: { ts: -1 }, limit, skip: offset };
const records = end
    ? await Messages.findVisibleByRoomIdBeforeTimestampNotContainingTypes(rid, end, …, options, …).toArray()
    : await Messages.findVisibleByRoomIdNotContainingTypes(rid, …, options, …).toArray();
```

…where the finder applies `ts: { $lt: timestamp }`
([`packages/models/src/models/Messages.ts:857-884`](../models/src/models/Messages.ts)):

```ts
// Messages.ts:863-870
const query = { _hidden: { $ne: true }, rid: roomId, ts: { $lt: timestamp }, … };
```

This is a half-keyset. It has the right instinct — bound by the last `ts` you saw
instead of counting — **but it still passes `skip: offset`, and it has no `_id`
tie-breaker.** Two messages sent in the same millisecond straddling a page boundary can
be dropped or repeated, and the residual `skip` reintroduces the O(n) cost the `ts`
bound was meant to avoid. The data layer's keyset is this pattern, finished:
`_id` tie-break added, `skip` removed.

A second precedent is worth naming: the client's incremental sync reads rooms with
`_updatedAt: { $gt: … }` ([`Rooms.ts:findBySubscriptionUserIdUpdatedAfter`, ~line
1238](../models/src/models/Rooms.ts)). That is a *changed-since* query, not a stable
paged scan — and, as [§4.4](#44-the-mutable-sort-field-hazard) shows, sorting a page by
`_updatedAt` is the trap, not the template.

---

## 3. The `_id` format — the decisive fact

**Rocket.Chat `_id`s are random strings, generated application-side, and stored as BSON
strings — not `ObjectId`s.** This is what forces a real sort key plus a tie-breaker, so
it is worth pinning down exactly.

The base record type declares `_id` as a string
([`packages/core-typings/src/IRocketChatRecord.ts:7`](../core-typings/src/IRocketChatRecord.ts)):

```ts
// IRocketChatRecord.ts:7-14
_id: z.string();
_updatedAt: Date;   // and _updatedAt is a real, mutable Date — see §4.4
```

The generator is `Random.id()`, which is a **17-character string over a curated,
non-hex alphabet** — no embedded timestamp, no lexical time order
([`packages/random/src/RandomGenerator.ts`](../random/src/RandomGenerator.ts)):

```ts
// RandomGenerator.ts:10, :72-76
const UNMISTAKABLE_CHARS = '23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz';
id(charsCount = 17) {
    return this._randomString(charsCount, UNMISTAKABLE_CHARS);   // e.g. "Jjwjg6gouWLXhMGKW"
}
```

For messages the id is generated **on the client** and accepted verbatim by the server:

```ts
// apps/meteor/client/lib/chats/data.ts:27
_id: originalMessage?._id ?? Random.id(),
```
```ts
// apps/meteor/server/lib/messages/sendMessage.ts:156 (the method check)
objectMaybeIncluding({ _id: String, msg: String, … })
```

Only when a document arrives with **no** `_id` does `BaseRaw` fall back to a Mongo
`ObjectId`, and even then it stores the **hex string**, not the BSON type
([`BaseRaw.ts:301-311`](../models/src/models/BaseRaw.ts)):

```ts
// BaseRaw.ts:303-304
const oid = new ObjectId();
doc = { _id: oid.toHexString(), ...doc };
```

So a single collection can hold both a 17-char `Random.id()` and a 24-char ObjectId-hex
string, both typed `string`. (Direct-message rooms add a third scheme: their `_id` is
historically the sorted participant `_id`s concatenated —
`createDirectRoom.ts:80`, marked *deprecated* but still in the data.)

**Consequences that drive the rest of the design:**

- **`_id` cannot be the sort key.** `sort({ _id: -1 })` returns lexical-random order, not
  newest-first. Any "just paginate by `_id`" shortcut (which works when `_id` is an
  `ObjectId`) is off the table here.
- **`_id` *is* a perfect tie-breaker.** It is unique and immutable, so appending it to
  any sort key yields a total order — exactly what a keyset seek needs to be stable
  across ties.
- **The cursor must be opaque.** An app must never construct a cursor from an `_id` and
  assume ordering. Encoding the sort field and value in the token (rather than exposing
  `_id`) keeps apps from depending on an ordering `_id` does not have — see [§5](#5-cursor-token-design).

---

## 4. Sort keys, indexes, and the keyset technique

### 4.1 Per-entity sort key and the index that must back it

A keyset scan is only cheap if a single index serves the equality prefix, the range on
the sort key, **and** the tie-break on `_id`, in one ordered walk. The table below pairs
each entity's natural sort key with the index that exists today
(cited) and what a keyset actually needs.

| Entity (collection) | Natural sort key | Immutable? | Index that exists today | Backs `(sortKey, _id)` keyset? |
|---|---|---|---|---|
| **Message** — room timeline (`rocketchat_message`) | `ts` | **yes** (set once at insert) | `{ rid: 1, ts: 1, _updatedAt: 1 }` (`Messages.ts:43`) | **Partly** — prefix `(rid, ts)` is covered; `_id` tie-break is **not**. Needs `(rid, ts, _id)`. |
| **Message** — thread replies (`rocketchat_message`) | `ts` (filter `tmid`) | yes | `{ tmid: 1 }` sparse (`Messages.ts:68`) | No — `(tmid, ts, _id)` would be needed for a large thread. |
| **Message** — thread list (`rocketchat_message`) | `tlm` | no (bumped per reply) | `{ rid: 1, tlm: -1 }` partial (`Messages.ts:70`) | Prefix only; no `_id`. |
| **Room** — a user's rooms (`rocketchat_room`) | `_updatedAt` or `lm` | **no** | none on `_updatedAt`/`lm` | **No index at all.** Only `{ ts: 1 }` (`Rooms.ts:65`), `{ t: 1, ts: 1 }` (`:96`). |
| **Room** — discussions of a room | `ts` (filter `prid`) | yes | `{ prid: 1 }` sparse (`Rooms.ts:68`) | Prefix only; `(prid, ts, _id)` would be needed. |
| **User** — directory (`users`) | `createdAt` or `username` | createdAt yes | `{ createdAt: 1 }` (`Users.ts:64`), `{ username: 1 }` sparse (`Users.ts:105`) | Single-field; no `_id` tie-break. |
| **Subscription** — a user's memberships (`rocketchat_subscription`) | `_updatedAt` / `ls` | no | `{ rid: 1, ls: 1 }` (`Subscriptions.ts:58`), `{ ts: 1 }` (`:47`) | No `(u._id, sortKey, _id)`. |
| **Team** (`rocketchat_team`) | `createdAt` / `name` | name yes | `{ name: 1 }` unique **only** (`Team.ts:13`) | Name yes for prefix; nothing else. |

The headline: **only the message room-timeline has an index whose prefix a keyset can
lean on, and even that one lacks the `_id` tie-breaker.** Every other paged list the data
layer wants is currently either a single-field index or no index on the sort key at all.

### 4.2 The seek query, as `BaseRaw` would write it

Descending (newest first) is the default for messages —
`loadMessageHistory` and `channels.messages` both default to `sort: { ts: -1 }`. The seek
predicate is the standard `(sortKey, _id)` lexicographic `$or`, and the page is fetched
one over to detect a successor:

```ts
// A page of a room's messages, keyset style, on the raw driver BaseRaw exposes.
// where: closed filter compiled by the host; cursor: decoded token (see §5).
async function messagePage(
    rid: string,
    where: Filter<IMessage>,
    cursor: { ts: Date; id: string } | undefined,
    pageSize: number,           // already clamped to MAX_PAGE_SIZE = 100
) {
    const seek: Filter<IMessage> = cursor
        ? {
              $or: [
                  { ts: { $lt: cursor.ts } },                       // strictly older ts
                  { ts: cursor.ts, _id: { $lt: cursor.id } },       // same ts, tie-break by _id
              ],
          }
        : {};

    const docs = await Messages.find(
        { rid, ...where, ...seek },
        {
            sort: { ts: -1, _id: -1 },      // total order; both keys inverted together
            limit: pageSize + 1,            // the +1 is the "has next page" probe
            projection: /* from the selection, PROPOSAL §9.1 */ {},
        },
    ).toArray();

    const hasMore = docs.length > pageSize;
    const page = hasMore ? docs.slice(0, pageSize) : docs;
    const last = page[page.length - 1];
    const nextCursor = hasMore && last ? { ts: last.ts, id: last._id } : undefined;
    return { page, nextCursor };
}
```

Notes that are specific to RC:

- **Both sort keys are inverted together** (`{ ts: -1, _id: -1 }`). Mixing directions
  (`ts: -1, _id: 1`) breaks the single-index walk and forces an in-memory sort.
- **An ascending stored index serves a descending scan.** `(rid, ts, _id)` created
  ascending is walked backwards for `{ ts: -1, _id: -1 }`; there is no need for a second
  descending index.
- **`limit(pageSize + 1)`** is how the next page is detected without a `countDocuments`.
  The proposal's list is an async iterable, so "is there another page" is answered by
  whether the probe row came back — never by a total.

### 4.3 Forward, backward, ascending, descending

The token carries the direction; the four combinations differ only in the comparison
operator and the sort:

| Direction × order | Range predicate on `(sortKey, _id)` | `sort` |
|---|---|---|
| Forward, descending (newest→older) | `{$or:[{k:{$lt:kv}},{k:kv,_id:{$lt:iv}}]}` | `{k:-1,_id:-1}` |
| Forward, ascending (older→newer) | `{$or:[{k:{$gt:kv}},{k:kv,_id:{$gt:iv}}]}` | `{k:1,_id:1}` |
| Backward, descending (page *up* toward newer) | `{$or:[{k:{$gt:kv}},{k:kv,_id:{$gt:iv}}]}` | `{k:1,_id:1}` then reverse in memory |
| Backward, ascending | `{$or:[{k:{$lt:kv}},{k:kv,_id:{$lt:iv}}]}` | `{k:-1,_id:-1}` then reverse in memory |

Backward paging flips the comparison and the index walk, then reverses the fetched slice
so the caller still receives the page in the list's declared order. Because the slice is
at most `pageSize`, the reversal is O(pageSize), not O(n). A room timeline scrolling up
(the common chat case) is "backward, descending": you already hold the older boundary and
want the *newer* neighbours.

### 4.4 The mutable-sort-field hazard

The tie-break makes a keyset *stable against ties*. It does **not** make it stable
against a sort key that changes value. That is a per-entity policy decision, and RC's
schema makes the split sharp:

- **`ts` on a message is immutable.** It is set once (`sendMessage.ts:195-196`), and edits
  land on the separate `editedAt` field (`IMessage.ts:273`). A message never moves in a
  `ts`-sorted list. A backward scroll through history is therefore repeatable: a new
  message arriving at the head cannot perturb a page you already turned.
- **`_updatedAt` is mutable by construction.** `BaseRaw` stamps it on *every* write via
  `setUpdatedAt` ([`packages/models/src/models/setUpdatedAt.ts`](../models/src/models/setUpdatedAt.ts)),
  so any edit, reaction, or read-receipt bump moves the row to the head of an
  `_updatedAt`-sorted list. The same is true of a room's `lm` (last-message time), which
  changes on every new message in the room.

The failure mode of a mutable sort key: you read page 1 sorted by `_updatedAt` desc;
before you read page 2, a row from page 3 is touched and jumps ahead of your cursor;
you now **see it again on page 2** (a duplicate), and the row that got pushed past the
cursor is **skipped**. This is the *same* drop/duplicate the proposal attributes to
offset paging — a keyset on a mutable field does not escape it.

**Policy this argues for:**

1. Where an entity has an immutable timeline key, the list sorts by it. Messages sort by
   `ts`. This is non-negotiable and it is already how RC orders a room.
2. Where the only meaningful order is a mutable field (a user's rooms by "recent
   activity" = `lm`/`_updatedAt`), the layer must either (a) accept and *document*
   at-most-once-shifting semantics, (b) snapshot at query start, or (c) refuse to offer
   that sort as a stable cursor and expose it only as a live subscription. See
   [Open questions](#open-questions).

### 4.5 Why this beats `skip`/`limit` — the concrete contrast

| | Offset (`skip`+`limit`+`count`) — today | Keyset (`(sortKey,_id)` seek) — proposed |
|---|---|---|
| Cost of page *n* | O(offset) skip + a full `countDocuments` | O(log N + pageSize), index-bounded, no count |
| Concurrent insert at head | shifts every later page → **duplicate** at the next boundary | new rows land ahead of the cursor; the in-progress scan is untouched |
| Concurrent delete before the window | shifts every later page → **skip** at the next boundary | the seek is a value comparison; a deletion just removes one row |
| Deep pages | linearly worse | flat |
| Total available | free (already computed) | **not available** without a separate count query |
| Random page jump ("go to page 40") | trivial | not supported — cursors are sequential |

The trade the proposal accepts: **no total, no random page jump**, in exchange for a flat
cost curve and stability under the writes that a live chat workspace produces
constantly. For an async-iterable list ([§7.2](PROPOSAL-DATA-LAYER.md)) that trade is
almost free — the consumer asks for "the next page", never "page 40 of 128".

### 4.6 The app-facing async iterable

The keyset loop is entirely hidden behind the `AsyncIterable` that
`Reader.list` / `RoomsClient.messages` return in [`src/data.ts`](src/data.ts). The app
writes a `for await` and never sees a token — the client requests page after page, threading
the opaque cursor from one `DataRequest` into the next, and stops when a page comes back
without a `nextCursor`:

```ts
// what the client does behind ctx.rooms.messages(roomId, { where, with, pageSize })
async function *listMessages(
    roomId: RoomId,
    selection: ListSelection<MessageEntity>,
    transport: DataTransport,
    principal: Principal,
): AsyncIterable<Message> {
    let cursor = selection.cursor;
    do {
        const request = toDataRequest('message', 'list', principal, {
            ...eraseSelection(selection),
            pageSize: selection.pageSize ?? MAX_PAGE_SIZE,
            cursor,
        }, roomId);
        assertWithinBudget(request);                       // §8: depth <= 2, size <= 100, where present

        const { items, nextCursor } = await transport.read(request) as Page<Message>;
        for (const message of items) yield message;        // one page, in the list's declared order
        cursor = nextCursor;                               // opaque; undefined => last page
    } while (cursor);
}
```

Consumed exactly as the proposal's [§7.2](PROPOSAL-DATA-LAYER.md) and
[`examples/data-layer.ts`](examples/data-layer.ts) show — the paging is invisible:

```ts
for await (const message of ctx.rooms.messages(roomId, {
    where:    { threads: 'exclude', since: yesterday },
    with:     { sender: { select: ['id', 'username'] } },
    pageSize: 100,
})) {
    ctx.logger.info(message.sender.username, message.text);
}
```

The response the transport returns is a page, not a total-bearing envelope — there is
no `count`/`total`, only the rows and the next token:

```ts
interface Page<T> { readonly items: readonly T[]; readonly nextCursor?: string }
```

That is the whole behavioural difference from today's `{ items, count, offset, total }`
REST shape ([§2.2](#22-offset-pagination-is-the-house-style)), surfaced in the type.

---

## 5. Cursor token design

### 5.1 What the token must carry, and why opaque

The app receives a `cursor: string` and passes it back unread — it is
**opaque**. Opacity is not decoration here; [§3](#3-the-_id-format--the-decisive-fact)
showed that `_id` has no order, so a token an app could parse would tempt apps to
reconstruct ordering that does not exist and to hand-craft cursors. The token must also
be **tamper-evident**, because a list cursor is produced *after* the host applied its
read policy ([§11.2](PROPOSAL-DATA-LAYER.md)): if an app could edit the embedded filter,
it could seek into rooms the policy excluded.

The payload, before encoding:

```ts
interface CursorPayload {
    v: 1;                     // codec version — reject on mismatch (schema/index changed)
    e: string;                // entity, e.g. "message" — must equal the request's entity
    k: string;                // sort field public name, e.g. "ts" (never the storage field)
    d: 'asc' | 'desc';        // direction the page was produced in
    // the last row of the emitted page — the seek anchor:
    last: [unknown, string];  // [sortValue, _id]  (sortValue JSON-encoded; Date → epoch ms)
    q: string;                // hash of the frozen query shape (see §5.3)
    exp?: number;             // optional expiry (epoch s)
}
```

### 5.2 Codec sketch

Base64url of a compact JSON, with an HMAC the host holds. The app never sees the key;
the host verifies before it trusts a single field.

```ts
import { createHmac, timingSafeEqual } from 'node:crypto';

const b64url = (b: Buffer) => b.toString('base64url');
const unb64url = (s: string) => Buffer.from(s, 'base64url');

export function encodeCursor(payload: CursorPayload, secret: Buffer): string {
    const body = b64url(Buffer.from(JSON.stringify(payload)));
    const sig = b64url(createHmac('sha256', secret).update(body).digest());
    return `${body}.${sig}`;                    // "<payload>.<sig>"
}

export function decodeCursor(token: string, secret: Buffer): CursorPayload {
    const [body, sig] = token.split('.');
    if (!body || !sig) throw new CursorError('malformed');

    const expected = b64url(createHmac('sha256', secret).update(body).digest());
    const a = unb64url(sig);
    const b = unb64url(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) throw new CursorError('bad signature');

    const payload = JSON.parse(unb64url(body).toString()) as CursorPayload;
    if (payload.v !== 1) throw new CursorError('stale codec');            // §5.4
    if (payload.exp && payload.exp * 1000 < Date.now()) throw new CursorError('expired');
    return payload;
}

// Rebuild the driver-level seek anchor (§4.2) from the verified payload.
export function toSeek(p: CursorPayload): { value: unknown; id: string } {
    const [raw, id] = p.last;
    // the entity descriptor says field "ts" is a Date → rehydrate from epoch ms
    return { value: reviveByFieldType(p.e, p.k, raw), id };
}
```

### 5.3 Binding the cursor to its query, and to the envelope

The `q` hash is the safety interlock. When the host answers a `list`, it canonicalizes
the parts of the request that must not change between pages — `entity`, the closed
`where`, the sort key, the `select`/`with` shape, and the **principal**
([§8](PROPOSAL-DATA-LAYER.md)'s `DataRequest`) — and stores `q = sha256(canonical)` in the
token. On the next page it recomputes `q` from the *incoming* request and rejects the
cursor if they differ:

```ts
// host, inside the list gateway, before running the seek
const q = hashQueryShape(request);                    // entity + where + sort + select + principal
const cur = decodeCursor(request.page.cursor, secret);
if (cur.e !== request.entity) throw new CursorError('entity mismatch');
if (cur.q !== q)              throw new CursorError('cursor does not match this query');
```

This is what stops "read page 1 of *my* rooms, then swap the filter to *all* rooms and
keep paging with the old cursor". It also means the token is inert if lifted to another
principal, because the principal is in the hash. The token rides in the envelope exactly
where [§8](PROPOSAL-DATA-LAYER.md) put it — `DataRequest.page = { size, cursor }` — and
nowhere else; the client in [`src/data.ts`](src/data.ts) already threads `cursor?: string`
through `ListSelection` and `ErasedSelection` into that field.

### 5.4 Versioning

The `v` tag is not ceremony. If we later add the `_id` tie-break index and switch a
list's sort key, or change how a `Date` is serialized in `last`, every previously issued
cursor becomes a lie. Bumping `v` and rejecting old tokens with a clean
`CursorError('stale codec')` turns that into a caught, retryable error (the app restarts
the list from the top) instead of a silently wrong page. This mirrors the envelope's own
`v: 1` in [§8](PROPOSAL-DATA-LAYER.md).

**Signing: recommended, with a caveat.** The HMAC is cheap and it is the only thing that
makes the `q`-binding trustworthy. The alternative — keeping cursor state server-side and
handing out a random handle — adds a store and a TTL for no real gain in a stateless,
NATS-fronted gateway. Sign it. The open question is key management across a horizontally
scaled apps runtime (see below).

---

## 6. Change streams / live queries

Rocket.Chat's realtime layer is **separate from the read path**, which is what lets a
point-in-time cursor coexist with a live-updating collection.

Writes emit explicit broadcasts rather than the query layer tailing the oplog inline. A
room write calls `notifyOnRoomChanged`, which publishes on the service bus
([`apps/meteor/server/lib/notifyListener.ts`](../../apps/meteor/server/lib/notifyListener.ts)):

```ts
// notifyListener.ts (representative)
void api.broadcast('watch.rooms', { clientAction, room: item });
// …and watch.messages, watch.subscriptions, watch.roles, …
```

The change-stream primitive is available on every model
(`BaseRaw.watch()` → `this.col.watch(pipeline)`, `BaseRaw.ts:548-550`) and the
streamer/listener modules (`apps/meteor/server/modules/streamer`,
`.../modules/listeners`) fan these `watch.*` events out to connected clients, which merge
them into their local cache.

The interaction with cursor pagination is clean, and it is one more argument for the
immutable sort key:

- **A cursor is a snapshot of position, not of data.** It says "resume after
  `(ts, _id)`". New inserts at the head (larger `ts`) fall *outside* an in-progress
  backward scan's window and cannot disturb pages already turned — exactly the property
  [§4.4](#44-the-mutable-sort-field-hazard) relies on.
- **Live and paged are different subscriptions.** The right shape for an app is: page
  backward through history with cursors *and* subscribe to `watch.messages` for the tail.
  The two never contend, because history is `ts < cursor` and the live tail is
  `ts > everything`. Mixing them — trying to keep a cursor "live" — is what reintroduces
  the mutable-field hazard and should be avoided.
- **Deletes are tombstoned, not silent.** `BaseRaw.deleteOne`/`deleteMany` copy the doc
  to a trash collection before removal (`BaseRaw.ts:321-354`), and removals surface as
  `watch.*` events, so a client can reconcile a row that vanished from between two pages.

---

## 7. Cost, and the "reject unbounded list" rule

The proposal wants a hard cost ceiling on any list ([§11.1](PROPOSAL-DATA-LAYER.md)).
Keyset pagination supplies the ceiling only in combination with the other three controls;
each closes a specific hole:

1. **Page size cap (100).** `limit(pageSize + 1)` bounds documents scanned *per page* and
   documents materialized. This is the same 100 the REST API already enforces via
   `API_Upper_Count_Limit` (`general.ts:6`), so it is not a new burden on operators.
2. **Required `where` / index-backed sort.** A keyset is only O(log N + pageSize) **if an
   index serves the equality prefix + sort key**. A list whose `where` has no matching
   index (or an unindexed sort key) degrades to a collection scan *per page* — worse than
   offset, because you pay it every page. The gateway must therefore know, from the
   entity descriptor ([§9.1](PROPOSAL-DATA-LAYER.md)), which `(filter, sort)` pairs are
   index-backed, and **refuse the rest**. `assertWithinBudget` in
   [`src/data.ts`](src/data.ts) already rejects a `list` with no `where`; the missing
   half is rejecting a `where`/sort combination with no backing index.
3. **Relation fan-out stays one batched query per page.** The loader ([§9.2](PROPOSAL-DATA-LAYER.md))
   issues one `find({_id:{$in:[…]}})` per relation per page, so a hydrated page of 100 is
   `1 + (relations)` queries, independent of page depth.

The rule that falls out, and that the proposal already states: **an unfiltered
workspace-wide list is a collection scan and must be refused** — reachable only through
an explicit, permissioned, cursor-only capability, never as a default from a handler.
With `_id` unordered and no `_updatedAt` index on rooms/users, "list every room" today
would be a scan *and* an unindexed sort — the worst case — which is exactly why it should
require both a permission and a deliberately added index before it is offered at all.

---

## 8. Migration

The keyset layer is additive; nothing about today's offset REST endpoints has to change.

- **REST stays offset; the app data layer is keyset.** The `{ items, count, offset,
  total }` endpoints backed by `findPaginated` are a separate public contract with their
  own clients. Apps consume the new `ctx` clients, which speak `{ pageSize, cursor }` end
  to end ([§7.2](PROPOSAL-DATA-LAYER.md), [§13](PROPOSAL-DATA-LAYER.md)). The two can run
  side by side indefinitely.
- **Reuse the seek that already exists.** The message keyset is `loadMessageHistory`'s
  `ts` bound ([§2.3](#23-the-one-place-rc-already-seeks--and-where-it-stops-short)) with
  the `_id` tie-break added and `skip` removed. The gateway can call the existing
  `findVisibleByRoomIdBeforeTimestamp`-style finders extended with the `$or` predicate,
  rather than inventing a new model method.
- **Close the raw-query door as apps arrive.** Today's REST still (behind
  `ALLOW_UNSAFE_QUERY_AND_FIELDS_API_PARAMS`) accepts a client-supplied Mongo `query`
  and `fields`; the deprecation notice is blunt about why —
  *"breaks the security of the API and can lead to data exposure"*
  ([`parseJsonQuery.ts:58-60, 113-128`](../../apps/meteor/server/api/lib/parseJsonQuery.ts)),
  slated for removal in 9.0.0. The apps data layer must **not** reproduce this: its
  `where` is the closed, versioned DSL ([§6, rule 5](PROPOSAL-DATA-LAYER.md)), and its
  `sort` is a fixed per-entity key, not a client-supplied Mongo sort like
  `channels.messages` accepts today.
- **New indexes ship before the lists that need them.** Because `createIndexes` runs from
  the model constructor (`BaseRaw.ts:92, 101-119`), adding an index is a one-line change
  to `modelIndexes()` — but on a collection the size of `rocketchat_message` the *build*
  is the migration. See the write-cost caveat below.
- **The app store speaks the same language.** [§13](PROPOSAL-DATA-LAYER.md) wants
  `Collection.find` (`context.ts:248`) to learn the same closed filter + `{ pageSize,
  cursor }` paging, so an app author learns one query language. The app-private store
  documents *do* get `Random.id()`-style ids from the same `BaseRaw`, so the same
  "unordered `_id`, sort key + tie-break" reasoning applies unchanged — one codec can
  serve both if the entity/field-type resolution is parameterized (Open questions).

---

## Recommended new indexes

| Collection | Add | Purpose | Caveat |
|---|---|---|---|
| `rocketchat_message` | `{ rid: 1, ts: 1, _id: 1 }` | Fully index-backed room-timeline keyset incl. tie-break | Largest collection in most workloads; background build is a real operation. Consider whether extending the existing `{ rid: 1, ts: 1, _updatedAt: 1 }` (`Messages.ts:43`) to append `_id` (or replacing `_updatedAt` with `_id`) is cheaper than a new index. |
| `rocketchat_message` | `{ tmid: 1, ts: 1, _id: 1 }` | Keyset over a large thread's replies | Only if thread reply lists must page; small threads don't need it. |
| `rocketchat_room` | `{ <sortKey>: 1, _id: 1 }` for the chosen room sort (e.g. `_updatedAt` or `lm`) | Any room list that pages at all | No such index exists today (`Rooms.ts:42-119`); also gated on resolving the mutable-sort-field policy ([§4.4](#44-the-mutable-sort-field-hazard)). |
| `rocketchat_room` | `{ prid: 1, ts: 1, _id: 1 }` | Keyset over a room's discussions | Extends the existing sparse `{ prid: 1 }` (`Rooms.ts:68`). |
| `users` | `{ createdAt: 1, _id: 1 }` (or `{ username: 1, _id: 1 }`) | Directory keyset with tie-break | Extends single-field `{ createdAt: 1 }` (`Users.ts:64`). |
| `rocketchat_subscription` | `{ 'u._id': 1, <sortKey>: 1, _id: 1 }` | A user's memberships, paged | No `(u._id, sortKey, _id)` exists today (`Subscriptions.ts:34-`). |

None of these are free on write: every added compound index is another b-tree updated on
every insert/update to that collection. On `rocketchat_message` in particular, the
insert-heavy hot path, a new index has a measurable write cost — which is an argument for
*extending* the existing `(rid, ts, …)` index rather than adding a parallel one, and for
adding room/subscription sort indexes only for the lists we actually ship.

---

## Open questions

1. **Mutable sort-field policy.** For lists whose only natural order is a mutable field
   (rooms by `lm`/`_updatedAt`, subscriptions by activity), do we (a) document
   at-most-once row-shifting, (b) snapshot at query start, or (c) refuse a stable cursor
   and expose only a live subscription? [§4.4](#44-the-mutable-sort-field-hazard) argues
   (c) or (a); the proposal should decide before offering those lists.
2. **Sign cursors, and how to manage the key?** HMAC is recommended
   ([§5.4](#54-versioning)), but a horizontally scaled, possibly out-of-process apps
   runtime needs a shared, rotatable signing key. Where does it live, and how does
   rotation interact with in-flight cursors (grace period? dual-key verify?)?
3. **Which new indexes, and paid when?** The table above lists candidates; each is a
   write-cost and a build-time cost on collections that can be enormous. Do we add the
   `_id` tie-break by *extending* `{ rid: 1, ts: 1, _updatedAt: 1 }` or as a new index?
   Which room/subscription sort indexes are worth their write cost given the lists we will
   actually expose?
4. **One codec for both stores?** [§13](PROPOSAL-DATA-LAYER.md) wants the app-private
   `Collection.find` to share the query/paging language. Can the platform cursor codec
   and the app-store cursor codec be literally the same function, parameterized by an
   entity/field-type resolver — or do their differing field-type maps and trust
   boundaries (platform cursors cross a policy gate; store cursors do not) justify two?
5. **Tie-break correctness vs. index cost on huge collections.** If we decline to add
   `(rid, ts, _id)` on `rocketchat_message` for write-cost reasons, the same-millisecond
   tie-break falls back to an in-memory sort of the tied rows. Is that acceptable given
   observed `ts` collision rates per room, or is the index mandatory?
6. **Backward paging ergonomics.** The async-iterable in [§7.2](PROPOSAL-DATA-LAYER.md)
   naturally expresses forward paging. Do apps need first-class backward paging (scroll
   up), and if so does the iterable grow a `.reverse()`/`before` affordance, or is
   backward paging a distinct call that returns a fresh cursor?
