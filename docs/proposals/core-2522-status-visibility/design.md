# Design

How status visibility works, and where the application changes.

## The model

One rule, one owner:

> A user keeps a list of people who may not see their status. Everyone else sees it as before.

There is no role model, no workspace-wide default, and no admin override. Those existed in an earlier draft and were cut on 2026-08-12; see [task.md](./task.md).

## Storage

```ts
settings.preferences.statusVisibilityDenied: IUser['_id'][]
```

**Ids, not usernames.** A rename must never silently lift a block. The user picker works in usernames, so the boundary converts: `resolveStatusVisibilityDenied` on the way in (username → id), `resolveStatusVisibilityUsernames` on the way out (id → username, applied in `/v1/me` and in `users.info`).

**Under `preferences`, written only by the user's own route.** `users.setPreferences` is the only path that writes it. No admin endpoint touches it, which is what makes the list the user's alone without needing a permission check to enforce it.

## The decision

`server/lib/statusVisibility.ts` — a pure predicate, no I/O, no state:

```
feature off        → visible
viewer is the target → visible
viewer on the list → hidden
otherwise          → visible
```

`redactStatus` in the same file produces what a blocked viewer sees: `status: 'offline'` with `statusText`, `statusSource`, `statusExpiresAt`, `statusDefault` and `statusConnection` all dropped, so it is indistinguishable from genuinely offline.

## Resolution and cache

`server/lib/statusVisibilityChecker.ts` resolves the inputs and caches verdicts, because the presence emit path is synchronous and cannot query.

- `buildStatusVisibilityChecker(viewerId, targetIds)` short-circuits on licence and on the workspace setting, then loads only the targets that actually have a block list.
- Verdicts are stored per viewer. A separate set marks which targets are configured at all.
- **Fails closed.** With no cached verdict, a target known to be configured is hidden until the next warm. That is why the marker set exists.
- **Reconciles.** Every warm is authoritative about the targets it looked at, so a target that clears its list stops being marked — otherwise it would stay hidden after any later invalidation.

Invalidation is local first, then broadcast as `presence.invalidateVisibility` so other instances follow.

## Enforcement points

**Presence stream** (`server/lib/notifications/core/lib/Presence.ts`). Verdicts are warmed when a client subscribes; at emit time each connection substitutes an offline payload for the targets it may not see. Invalidation re-warms the affected connections and replays presence, so a block takes effect without a reload.

**Read surfaces**, each running the same predicate: `users.presence`, `users.list`, `users.info` (`getFullUserData`), `im.members`, spotlight, and `getUserStatusText`.

## Known gaps

- **`user-status` broadcast is unfiltered.** Verification found no consumer of it in this repository, which is why it was left alone. Filtering it would mean widening the presence service payload, on the presence hot path.
- **Apps and bots.** The apps-engine user bridge exposes status and is not covered.
- **Omnichannel.** `statusLivechat` is a separate field and was not considered.
