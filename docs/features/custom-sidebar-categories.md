# Custom Sidebar Categories

## Overview

Custom categories let each user group their sidebar rooms into personal, named collections that appear
alongside the system groups (Favorites, Teams, Channels, Direct messages, …). A user can create, rename,
delete and reorder categories; move rooms in and out of them via context menus; and toggle whether each
category keeps showing unread rooms while collapsed.

Categories are **per-user** and **client-only in meaning** — they are a presentation grouping of the user's
own subscriptions. They carry **no access, security or membership semantics**: moving a room into a category
never changes who can see the room or the room itself. Assignment is **exclusive** — a room lives in exactly
one place at a time (one custom category, *or* Favorites, *or* its system group).

Requires the `experimental-enterprise-features` license module.

## Data Model

### Category record — `ISidebarCategory`

```ts
// packages/core-typings/src/IUser.ts
export interface ISidebarCategory {
    _id: string;               // Random.id() for custom; system group key for defaults
    name: string;              // display name (trimmed; max 30 chars)
    default?: boolean;         // true for system-group entries managed by the platform
    showUnreads?: boolean;     // when collapsed, keep listing unread rooms (default: false)
    keepUnreadsOnTop?: boolean; // when expanded, sort unread rooms to the top (default: false)
}
```

### Room assignment

Room-to-category assignment is stored on the **subscription**, not on the category:

```ts
// Subscription.category: string | null
```

Set via `POST /experimental/rooms.setCategory`. The subscription field is the source of truth for which
category a room belongs to; the category record only carries display metadata and ordering.

## Persistence

### `sidebarCategories` preference (unified group ordering + category metadata)

The preference `sidebarCategories: ISidebarCategory[]` is the **single source of truth** for both the
ordered list of all visible groups and the metadata of custom categories. It contains entries for custom
categories *and* for any system group whose metadata has been touched (show-unreads, keep-unreads-on-top,
or position).

**Invariant enforced on every write:** all five dynamic groups (`Incoming_Calls`, `Incoming_Livechats`,
`Open_Livechats`, `On_Hold_Chats`, `Unread`) are always stored first, in the order prescribed by
`sidebarSectionsOrder`. Custom and static system groups follow. This is enforced by `withDynamicFirst`
in `useCategoryList.ts`, called by every write hook.

All mutations go through `usePersistCategoriesMutation`, which calls:

```http
POST /v1/users.setPreferences  { data: { sidebarCategories: ISidebarCategory[] } }
```

### Room assignment — `POST /experimental/rooms.setCategory`

```http
POST /experimental/rooms.setCategory
{ roomIds: string[], category: string | null }
```

- Requires `experimental-enterprise-features` license.
- Rejects system group keys (`SIDEBAR_SYSTEM_GROUP_KEYS`) as the target category.
- Verifies the target category exists in the user's `sidebarCategories` preference before writing.
- Writes to `subscription.category` and fires change notifications.
- `category: null` unassigns the room, returning it to its system group.

## Group Ordering

### `sidebarSectionsOrder` preference

An **admin-configurable** ordered list of system group keys that defines the default group order when
`sidebarCategories` has no explicit entry for a key. Falls back to `SIDEBAR_SYSTEM_GROUP_KEYS`.

### `mergeWithSectionsOrder(explicitIds, sectionsOrder)` — READ side

Used in `useCategoryList` when building the visible category list. Inserts any key missing from
`explicitIds` before its first successor that is already present, maintaining the `sectionsOrder`
relative ordering for system groups.

### `withDynamicFirst(ids, sectionsOrder)` — WRITE side

Called by every write hook before persisting `sidebarCategories`. Guarantees:
1. All five dynamic group keys appear first (in `sectionsOrder` canonical order), regardless of whether
   they are currently visible.
2. Static ids (custom + system) follow, merged with `sectionsOrder` via `mergeWithSectionsOrder`.

This makes moving logic simple: swapping two adjacent static groups is always a valid operation — dynamic
groups can never appear below a static group in the stored list, so a DOWN move can never cross one.

### `SIDEBAR_DYNAMIC_GROUP_KEYS`

```ts
export const SIDEBAR_DYNAMIC_GROUP_KEYS: readonly string[] = [
    'Incoming_Calls', 'Incoming_Livechats', 'Open_Livechats', 'On_Hold_Chats', 'Unread',
];
```

Groups that are hidden from the sidebar when empty. They are excluded from user reordering
(`canMoveGroup` returns `false` for them) and are always stored first by `withDynamicFirst`.

## Behaviors / Flows

### Create — `useCreateCustomCategory`

1. Generates `_id` with `Random.id()`.
2. Inserts the new entry at the first position after the last dynamic group entry in the stored list
   (using `findLastIndex`), so it appears first among static groups.
3. Optionally assigns rooms via `useSetCategory` in the same call (`Create and move` flow).

### Move room — `useMoveRoomCategory`

Accepts a `target` (category `_id`, `'favorites'` sentinel, or `undefined` to remove).
- `'favorites'`: calls `POST /v1/rooms.favorite` and removes the category assignment.
- Custom category `_id`: calls `POST /experimental/rooms.setCategory`.
- `undefined` / same as current: removes assignment (unfavorites or sets category to `null`).
- Dispatches a toast unless `silent: true` or the room has no name.

### Move category position — `useMoveCategoryPosition`

Takes `currentKeys` (visible group keys in render order), a `key` to move, and a direction.
Performs an adjacent swap in `currentKeys`, then calls `withDynamicFirst` on the result before
persisting — so dynamic groups are always re-sorted to the front regardless of what the swap produced.

### Toggle show-unreads / keep-unreads-on-top — `useToggleUnreads`

`upsertGroupEntry(id, patch)` — updates the matching `ISidebarCategory` entry in `sidebarCategories`
(or creates a new one if the entry doesn't exist yet). Always calls `withDynamicFirst` before persisting.

### Delete — `useDeleteCategory`

Removes the category entry from `sidebarCategories` and calls `POST /experimental/rooms.setCategory`
with `category: null` for all rooms that were in it — returning them to their system group.

### Name validation — `useValidateCategoryName`

Returns an i18n error string or `undefined`. Checks in order:
1. Empty / whitespace → `Please_enter_a_category_name`
2. Longer than `MAX_CATEGORY_NAME_LENGTH` (30) → `Category_name_is_too_long__max__maxLength__characters`
3. Matches a translated system group name (case-insensitive) → `Category_name_conflicts_with_system_group`
4. Duplicate among existing custom categories (case-insensitive, excluding `excludeId`) → `A_category_with_this_name_already_exists`

### Favorites interaction

`FAVORITES_TARGET = 'favorites'` is a sentinel for the Favorites system group. Moving a room to Favorites
calls `POST /v1/rooms.favorite` and strips the category assignment. Moving a room from Favorites into a
category unfavorites it. Assignment is exclusive.

### Visibility in the room list

`filterGroupVisibility` (in `useCategoryList.ts`) applies when building the room list:
- **Dynamic groups** — only shown when non-empty.
- **All other groups** (custom + static system) — always shown when EE is active, even if empty.

This means custom categories are always present in the visible group list with EE, so no category entry
in `sidebarCategories` can be silently dropped during a move.

## Sidebar UI

### Category collapser kebab — `CategoryMenu.tsx`

**Custom category:**
- Order: Move up / Move down / New channel
- Manage: Rename / Delete / New category
- When collapsed: Show unreads toggle
- When expanded: Keep unreads on top toggle

**System group:**
- Order: Move up / Move down (dynamic groups have both disabled)
- When collapsed: Show unreads toggle
- When expanded: Keep unreads on top toggle

### Room context menu — `CategoryRoomMenu.tsx`

For rooms inside a custom category, adds a "Remove from {category}" item.

### Room kebab — `useCategoryMenuItems.ts`

Builds the "Move to" submenu: Favorites + each custom category with a checkmark on the current one.
Appended with a "New category" item and "Remove from {category}" when applicable.

### Room-header grouping menu — `RoomHeaderCategoryMenu.tsx`

Placed before the room title in `RoomHeader`. Icon: `star-filled` (favorited) / `folder` (custom category) / `star` (default). Same item list as the room kebab submenu.

### Modals — `categories/`

| File | Purpose |
|------|---------|
| `CreateCategoryModal.tsx` | Create or "create and move" — single name field, max 30 chars. |
| `ManageCategoryModal.tsx` | Rename with duplicate/empty validation. |
| `DeleteCategoryModal.tsx` | Confirmation + "rooms will return to default groups" warning. |
| `hooks/useCategoryModals.tsx` | Single entry point: `openCreate(room?)` / `openManage(category)` / `openDelete(category)`. |

### Navbar create menu

`useCreateNewMenu.ts` adds a "Category" item (icon: `folder`) in the navbar `+` menu.

## REST Contract

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/v1/users.setPreferences` | Persist `sidebarCategories` (ordering + metadata) |
| POST | `/experimental/rooms.setCategory` | Assign / unassign rooms to a category |
| POST | `/v1/rooms.favorite` | Favorite / unfavorite (used by the Favorites target) |

## Key Files

| Layer | File |
|-------|------|
| Types | `packages/core-typings/src/IUser.ts` (`ISidebarCategory`, `SIDEBAR_SYSTEM_GROUP_KEYS`) |
| Category list + ordering | `apps/meteor/client/sidebar/hooks/useCategoryList.ts` |
| Room list | `apps/meteor/client/sidebar/hooks/useRoomList.ts` |
| Persist mutation | `apps/meteor/client/sidebar/categories/hooks/usePersistCategoriesMutation.ts` |
| Create category | `apps/meteor/client/sidebar/categories/hooks/useCreateCustomCategory.ts` |
| Move room | `apps/meteor/client/sidebar/categories/hooks/useMoveRoomCategory.ts` |
| Move category position | `apps/meteor/client/sidebar/categories/hooks/useMoveCategoryPosition.ts` |
| Toggle unreads | `apps/meteor/client/sidebar/categories/hooks/useToggleUnreads.ts` |
| Name validation | `apps/meteor/client/sidebar/categories/hooks/useValidateCategoryName.ts` |
| Custom categories list | `apps/meteor/client/sidebar/categories/hooks/useCustomCategories.ts` |
| Set category (client) | `apps/meteor/client/sidebar/categories/hooks/useSetCategory.ts` |
| Server endpoint | `apps/meteor/server/api/experimental/rooms.setCategory.ts` |
| Category UI | `apps/meteor/client/sidebar/categories/` |
| Room kebab | `apps/meteor/client/sidebar/RoomMenu.tsx` |
| Navbar create menu | `apps/meteor/client/navbar/NavBarPagesGroup/hooks/useCreateNewMenu.ts` |
| Room-header grouping | `apps/meteor/client/views/room/Header/icons/RoomGroupingMenu.tsx` |
| i18n | `packages/i18n/src/locales/en.i18n.json` |

## Tests

| Kind | File |
|------|------|
| API (preference persistence + validation) | `apps/meteor/tests/end-to-end/api/sidebar-custom-categories.ts` |
| E2E (Playwright) | `apps/meteor/tests/e2e/sidebar-custom-categories.spec.ts` |
| E2E page object | `apps/meteor/tests/e2e/page-objects/fragments/sidebar.ts` (custom-category helpers) |
