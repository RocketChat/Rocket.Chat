# Field-level permissions

> Part of the [Apps Engine SDK RFC](README.md).

[42](42-platform-permissions.md) gates calls. This gates a **field** of a value
the app is otherwise allowed to read: an app with `room.read` sees the room, but
sees `abacAttributes` only with `abac.read`.

The engine ships an answer today. Keep its declaration; move its decision.

## Today: `@@SecureFields`

The converter lifts the value into a sidecar and deletes the property:

```ts
// apps/meteor/app/apps/server/converters/codecs/rooms.ts
...secureFieldsMapper((room: RoomData) => {
  if (!room.abacAttributes) return undefined;
  const value = [{ permission: 'abac.read', name: 'abacAttributes', value: room.abacAttributes }];
  delete room.abacAttributes;
  return value;
}),
```

msgpack extension type 2 marks the object. The subprocess re-attaches what it
may have:

```ts
// deno-runtime/lib/secureFields.ts
secureFields.forEach(({ permission, name, value }) => {
  if (!app.getInfo().permissions?.find((p) => p.name === permission)) return;
  rest[name] = value;
});
```

**Right:** the rule is data, sits next to the field, is written once, and nests
at any depth. The redesign keeps all four.

**Wrong:**

1. **The value crosses the wire before the check.** Fine while the receiver is
   the app's own sandbox; not fine under
   [41](41-platform-deployment-and-isolation.md), where it reaches a shared
   service first.
2. **It checks the declaration, not the grant.** `app.getInfo().permissions` is
   `app.json`, shipped inside the bundle. The authority is `permissionsGranted`
   on the storage item. Equal only while consent is all-or-nothing — after
   [42 §4](42-platform-permissions.md#4-consent-is-per-scope), an app grants
   itself a field by declaring it.
3. **The rule lives in the codec.** It does not survive a transport change, and
   [26](26-data-wire-contract.md) proposes one.
4. **Absent and redacted are both `undefined`.** An app mirroring rooms outward
   clears the attributes at the far end.

## Declare the field

`policy.field` exists; its values become two conditions instead of one string:

```ts
policy: {
  read: 'canSeeRoom',
  field: {
    topic:          { principal: 'view-room-administration' },  // the acting user holds it
    abacAttributes: { scope: 'abac.read' },                     // the app's grant holds it
  },
},
```

Both named → both required. Same intersection as
[42 §3](42-platform-permissions.md#3-two-principals-and-they-intersect).

## Project it away

```
select: ['id', 'name', 'abacAttributes']
   ▼  scope?  grant has abac.read → no
   ▼  projection  { _id: 1, name: 1 }        ← never queried, never encoded, never sent
```

Cheaper than the sidecar, which reads the value and throws it away.

## Selecting an ungranted field is an error

```ts
await ctx.rooms.get(id, { select: ['id', 'abacAttributes'] });
// PermissionDenied: field "abacAttributes" on "room" requires scope "abac.read"
```

`select` already carries the app's intent, so the host can separate "did not ask"
from "asked and may not have it". Defect 4 needs no redaction marker.

`select` is also a source literal, so the [bundler
check](42-platform-permissions.md#the-bundler-cross-check) extends from methods
to fields — a build error, which is the type-level signal `abacAttributes?:` never
gave.

**The write side needs nothing.** `READ_ONLY_ROOM_FIELDS` and the
`_unmappedProperties_` deletion exist because a legacy write takes an open
partial. `CreateRoomInput` has no `abacAttributes` member. Making it writable
means adding a command, `rooms.setAbacAttributes`, with its own row in the gate
table.

## Two tiers

| tier | depends on | runs |
|---|---|---|
| static field scope | the grant, the principal's role | in the projection, before the query |
| per-row field policy | the record itself | after the read, host-side, before the codec |

Tier 2 costs one evaluation per record — 100 per page. Declare the tier in the
entity so the cost is visible where the rule is written. `abacAttributes` is
tier 1.

## Event payloads

No `select`, so the host builds the payload from a **default selection derived
from the grant**. Same declaration, same side of the wire. But the app never
asked, so defect 4 survives here.

Partial answer for free: the catalog is closed and the manifest is known at
build, so the payload *type* follows the declared scopes — declare `abac.read`
and `abacAttributes` exists on the listener's room; omit it and there is no
property to reference. Runtime silence becomes compile-time absence. It does not
cover an optional scope declined after the build.

## What this changes in `src/`

- [`data.ts`](../src/data.ts) — `policy.field` becomes
  `Record<string, { scope?: PermissionScope; principal?: string; perRow?: boolean }>`;
  `roomEntity` gains `abacAttributes`.
- [24](24-data-read-surface.md) — an ungranted `select` field raises
  `PermissionDenied` naming the field and the scope.

## Open questions

1. **Deny or omit on an ungranted `select`?** Probably follows `optional`: a
   missing **required** scope means the app should not run — error; an
   **optional** one was declared survivable — omit, and let
   `ctx.permissions.has` branch. Two behaviors, or one rule?
2. **Do event payloads need a `redacted: [...]` key?** Honest and small; also a
   new concept on every event.
3. **Does a field scope compose with `when`?** A filter naming an unreadable
   field should be rejected at load, not silently never match
   ([15](15-surface-event-listeners.md#when-narrows-delivery-permissions-narrow-authority)).
4. **Who curates the field policy table?** Same owner question as the command
   catalog ([51](51-open-questions.md)).
5. **Migration.** `@@SecureFields` has one production consumer. Drop-in
   replacement, or side-by-side while legacy apps exist?
