# What changes in the app-facing surface

> Part of the [Apps Engine SDK RFC](README.md).

| Item | In the current sketch | Change |
|---|---|---|
| `models.ts` `RoomType` | includes `'discussion'`, `'team'` | four domain types; discussion and team become flags ([the room-type fix](28-data-views.md#direct-message--a-lens-and-the-room-type-fix)) |
| ids | plain `string` aliases | branded, applied at the schema boundary ([identity](21-data-entities.md#identity-needs-to-be-explicit)) |
| `MessagesClient.get`, `RoomsClient.get` | no options | accept `{ select, with }` ([selection](24-data-read-surface.md#selection-replaces-the-deepshallow-fork)) |
| `ThreadsClient` | its own client returning `IMessage[]` | removed; `message.thread` relation + `ctx.messages.replies()` ([Thread](28-data-views.md#thread--a-relation-on-a-message)) |
| `ctx.teams` | absent | added ([Team](28-data-views.md#team--the-one-view-that-owns-a-record)) |
| `RoomsClient.messages` | `PageOpts & { sort }` | cursor + closed `where` ([cursor lists](24-data-read-surface.md#lists-are-cursors-with-a-closed-filter)) |
| `PageOpts` | `{ limit, skip }` | `{ pageSize, cursor }` |
| `Collection.find(query?: Partial<T>)` | ad-hoc | the same closed filter DSL, so an app learns one query language for platform data and for its own store |
| discussion creation | absent | `ctx.rooms.createDiscussion` ([Discussion](28-data-views.md#discussion--a-lens-on-a-room)) |
| writes | plain objects | plain objects **plus** a named-command catalog per entity ([named commands](25-data-write-surface.md#writes-are-named-commands)) |

