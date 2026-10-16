# Subscription Labels and Sidebar Filters

## Overview

Labels and filters let each user slice their rooms their own way in the Sidebar Rail preview:

- **Labels** are per-user tags (name, icon, color) the user puts on their own rooms. A room can carry any
  number of labels.
- **Filters** are an ordered list of user-defined views. Each one combines user labels with **system labels**
  (Unread, Direct messages, Favorites, …) and is rendered as a collapsible group of matching rooms in the
  **Filters** panel of the rail.

Like categories, labels and filters are a presentation concern: they carry no access, security or membership
semantics. Unlike categories, assignment is **not exclusive** — a room shows in every filter it matches.

The whole feature sits behind the `sidebarRail` feature preview and needs no license. Entry points only show
where the panel can render: preview on, `!sidebar.shouldToggle`, not embedded
(`useSidebarFiltersEnabled`). The panel portals into `#sidebar-region`, so — like the Search panel — it does
not mount while the `secondarySidebar` preview is on.

## Data Model

Types live in `packages/core-typings/src/ISidebarFilter.ts`.

```ts
interface ISubscriptionLabel {
    _id: string;                    // Random.id()
    name: string;                   // trimmed, 1–40 chars, unique per user ignoring case and inner whitespace
    icon: SubscriptionLabelIcon;    // one of SUBSCRIPTION_LABEL_ICONS, default 'tag'
    color: SubscriptionLabelColor;  // 'default' | 'red' | 'green' | 'blue' | 'yellow'
}

type LabelRef = { type: 'user'; _id: string } | { type: 'system'; key: SystemLabelKey };

interface ISidebarFilterRule {
    mode: 'any' | 'all';
    labels: LabelRef[];
}

interface ISidebarFilter {
    _id: string;
    name: string;                   // trimmed, 1–60 chars
    sort: { by: 'activity' | 'name'; direction: 'asc' | 'desc' };
    matches: ISidebarFilterRule;    // "Show rooms with"
    notMatches: ISidebarFilterRule; // "Hide rooms with"
    needsReview?: true;             // see Cascade
}
```

Limits: 100 labels, 30 filters per user.

### Room assignment

Label assignment is stored on the **subscription** as `labels?: string[]` (label ids). The field is part of
`subscriptionFields` in `apps/meteor/lib/publishFields.ts`: every subscription broadcast uses that projection
and the client replaces the whole record, so without it any unrelated change would wipe `labels` on the
client. Omnichannel rooms (`t: 'l'`) cannot be labelled, but system labels still match them.

## Persistence

All four keys live under `settings.preferences`:

| Key | Contents |
|---|---|
| `subscriptionLabels` | `ISubscriptionLabel[]` |
| `sidebarFilters` | `ISidebarFilter[]`, in display order |
| `sidebarFiltersDisplay` | `{ viewMode, displayAvatar }` for the Filters panel only (default `medium`, avatars on) |
| `sidebarFiltersRevision` | counter bumped on every write of the first two keys |

The server owns every write. `users.setPreferences` already rejects unknown keys, and the deprecated
`saveUserPreferences` Meteor method explicitly rejects these four.

### Revision counter

`updateUserFilterPreferences` (`apps/meteor/server/lib/sidebarFilters/`) reads labels and filters, lets the
caller compute the next values, then writes them with
`updateOne({ _id, sidebarFiltersRevision: <read value> }, { $set, $inc: { sidebarFiltersRevision: 1 } })`.
A concurrent write makes the filter miss, and the whole read–mutate–write is retried up to 3 times. This keeps
labels and the filters referring to them consistent without deep array-equality filters.

The client never trusts the stored shape: an admin can overwrite `settings` wholesale through `users.update`,
so the panel sanitizes everything it reads (`client/sidebar/SidebarRail/filters/lib/sanitize.ts`).

## Matching

A filter is evaluated per subscription on the client (`lib/evaluateFilter.ts`):

1. A filter with `needsReview`, or with both rules empty, matches nothing.
2. Hidden (`open === false`) and archived rooms are dropped unless `matches` references the `hidden` /
   `archived` system label — the same rooms the regular sidebar leaves out.
3. The room must pass `matches` (`any`: at least one label; `all`: every label). An empty `matches` passes
   every room.
4. The room must **not** pass `notMatches` (same `any`/`all` semantics). Exclusion wins over inclusion.

System labels (`lib/systemLabels.ts`):

| Key | Matches when |
|---|---|
| `unread` | `isUnreadRoom` (respects `hideUnreadStatus`) |
| `mentions` | `userMentions > 0 \|\| groupMentions > 0` |
| `threads` | `tunread?.length` |
| `direct` | `t === 'd'` (includes group DMs) |
| `public` / `private` | `t === 'c'` / `t === 'p'` |
| `teams` | `teamMain` (the team's main room only) |
| `favorites` | `f` |
| `discussions` | `prid` |
| `federated` | `isRoomFederated` |
| `hidden` | `open === false` |
| `archived` | `archived` |

Rooms are sorted per filter by `lm` (activity) or by `lowerCaseFName` / `lowerCaseName` depending on
`UI_Use_Real_Name`, reusing `applyQueryOptions`.

## Cascade

Deleting a label:

1. In one revisioned write, drops the label and removes its `{ type: 'user' }` refs from every filter.
2. Removes the label id from every subscription of the user, then notifies those subscriptions.

A filter that loses rules is **kept**. When the cascade leaves both rules empty, or empties `matches` (which
would silently widen the filter to "every room except …"), the server sets `needsReview: true`. The panel then
shows "This filter has no rules" with an Edit link; saving the filter through `sidebarFilters.update` clears
the flag.

## Endpoints

All are `POST /api/experimental/...`, authenticated, with a relaxed rate limit of 20 calls per 10 s so menu
actions like Move up/down don't trip the default REST limit. Typings are in `ExperimentalEndpoints`
(`packages/rest-typings/src/experimental/index.ts`); the client calls them through `useExperimentalEndpoint`.

| Endpoint | Body | Response |
|---|---|---|
| `subscriptionLabels.create` | `{ name, icon?, color? }` | `{ label }` |
| `subscriptionLabels.update` | `{ labelId, name?, icon?, color? }` | `{ label }` |
| `subscriptionLabels.delete` | `{ labelId }` | — |
| `sidebarFilters.create` | `{ name, sort, matches, notMatches }` | `{ filter }` |
| `sidebarFilters.update` | `{ filterId, name, sort, matches, notMatches }` | `{ filter }` |
| `sidebarFilters.delete` | `{ filterId }` | — |
| `sidebarFilters.duplicate` | `{ filterId, name }` (placed right after the source) | `{ filter }` |
| `sidebarFilters.reorder` | `{ filterIds }` (a permutation of the current ids) | — |
| `sidebarFilters.setDisplayPreferences` | `{ viewMode?, displayAvatar? }` | — |
| `subscriptions.setLabels` | `{ roomId, labelIds }` (empty unsets the field) | — |
| `subscriptions.readMany` | `{ roomIds }` (≤ 500, unique) | — |

`subscriptions.readMany` exists because "Mark as read" on a filter group can cover many rooms, and a client
loop over `/v1/subscriptions.read` hits the default rate limit. It runs `readMessages` one room at a time so
read-receipt callbacks still fire, and a failing room is logged and skipped.

## Live updates

No new stream:

- Preference writes call `notifyOnUserChange` with the changed `settings.preferences.<key>` in `diff`, which
  reaches the client through `userData` and `useUserPreference`.
- Label assignment calls `notifyOnSubscriptionChangedByRoomIdAndUserId` (or the plural variant for the delete
  cascade), which reaches clients through `subscriptions-changed`.

## Client

Everything lives in `apps/meteor/client/sidebar/SidebarRail/filters/`:

- `SidebarRailFiltersPanel` (in `SidebarRail/`) mounts next to the Search panel in `LayoutWithSidebar`, opened
  by the rail button (`customize` icon) or `$mod+Shift+F`.
- `SidebarRailFiltersList` renders each filter as a `SidebarCollapseGroup` over `SidebarVirtualList`, reusing
  `RoomListRow`. Collapse state is kept in local storage under `sidebarFiltersCollapsed`.
- Rooms get a **Labels** entry in the room toolbox kebab (`useSubscriptionLabelsRoomAction`) and in every room
  context menu built by `useRoomMenuActions` (`useSubscriptionLabelsMenuItem`).
- Labels typed in the Labels modal that don't exist yet are created on **Save**, in sequence, then assigned.
