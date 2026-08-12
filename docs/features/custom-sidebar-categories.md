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

## Data Model

A category is a small record stored in the user's preferences:

```ts
// packages/core-typings/src/IUser.ts
export interface ISidebarCustomCategory {
	_id: string;              // Random.id(), generated client-side on create
	name: string;             // display name (trimmed; max 30 chars)
	showUnreads?: boolean;    // when collapsed, keep listing unread rooms (default: true)
	keepUnreadsOnTop?: boolean; // when opened, sort unread rooms to the top (default: false)
	rooms?: string[];         // rids assigned to this category
}
```

The ordered list of a user's categories is the preference `sidebarCustomCategories: ISidebarCustomCategory[]`.
The array order **is** the render order (top to bottom). New categories are prepended so they appear first.

## Persistence

### Server-side — custom categories

All category mutations are persisted through the existing user-preferences endpoint — there is **no new
endpoint**:

```http
POST /v1/users.setPreferences  { data: { sidebarCustomCategories: ISidebarCustomCategory[] } }
```

- The REST schema (`UsersSetPreferenceParamsPOST`) validates the array with `additionalProperties: false`
  and `required: ['_id', 'name']` per item, so malformed entries are rejected with `400 invalid-params`.
- The Meteor method `saveUserPreferences` mirrors the field with `Match.Optional([Match.ObjectIncluding({ _id: String, name: String })])`.
- The value round-trips back to the client through the user object (`me` / login payload →
  `useUserPreference('sidebarCustomCategories')`), so changes are reactive across the user's sessions.

Every write replaces the **whole** array (read-modify-write in the hook), which keeps ordering and exclusivity
invariants in a single atomic preference update.

### Client-side only — group ordering and unread toggles

Three preferences are stored in `localStorage` (no server round-trip):

| localStorage key | Hook | Purpose |
|---|---|---|
| `sidebarCategoriesOrder` | `useAllGroupsOrder` | Unified order of all groups (custom + system), persisted server-side. When empty, custom categories appear first then system groups in `sidebarSectionsOrder` order. |
| `sidebarHiddenUnreadGroups` | `useShowUnreadsGroups` | System groups with "Show unreads" turned OFF (default ON for all). |
| `sidebarKeepUnreadsOnTopGroups` | `useKeepUnreadsOnTopGroups` | System groups with "Keep unreads on top" turned ON (default OFF). |

Custom categories store `showUnreads` and `keepUnreadsOnTop` on their own preference object (server-side), so these system-group hooks apply only to system groups.

## Behaviors / Flows

All flows live in `client/sidebar/hooks/useCustomCategories.ts`.

| Flow | Function | Notes |
|------|----------|-------|
| Create | `createCategory(name)` | Prepends `{ _id, name, showUnreads: true, rooms: [] }` so the new category appears first. Validates name first. |
| Rename | `renameCategory(id, name)` | No-op + close when unchanged. |
| Delete | `deleteCategory(id)` | Rooms fall back to their system group (the rooms themselves are untouched). |
| Toggle unreads | `toggleShowUnreads(id)` | Flips `showUnreads` (default treated as `true`). |
| Keep unreads on top | `toggleKeepUnreadsOnTop(id)` | Flips `keepUnreadsOnTop` (default `false`). |
| Move room | `moveRoom(room, target)` | `target` is a category id or the `FAVORITES_TARGET` sentinel. Strips from every other category first (exclusive). Dispatches a move toast. |
| Create & move | `createCategoryAndMoveRoom(name, room)` | Creates the category and moves the room in a single persist call. Dispatches a move toast. |
| Remove room | `removeRoom(room)` | Strips from all categories + unfavorites → returns to its system group. Dispatches a toast. |
| Lookup | `getRoomCategory(rid)` | The category currently containing a room, if any. |

### Name validation

`validateName(name, excludeId?)` returns `'empty'` (blank/whitespace) or `'duplicate'` (case-insensitive match against another category) or `undefined`. The modals map these to `Please_enter_a_category_name` / `A_category_with_this_name_already_exists`. Max length is `MAX_CATEGORY_NAME_LENGTH = 30`.

### Favorites interaction

`Favorites` is a system group, not a custom category, but it participates in the same "Move to" target list via the `FAVORITES_TARGET = 'favorites'` sentinel. Moving a room to Favorites, favorites it (`POST /v1/rooms.favorite` + `toggleFavoriteRoom` mutation effect) and strips it from any custom category; moving it into a custom category unfavorites it. This keeps assignment exclusive.

### Exclusivity in the room list

`useRoomList.ts` builds a `rid → categoryId` map first. A room assigned to a custom category is added **only** to that category's set and `return`s before the system-group bucketing — so it never appears twice. 
Custom categories **persist even when empty**.

### Group ordering

`useAllGroupsOrder` applies a unified sort over all groups (custom + system combined) after the debounce, so Move up / Move down in the category kebab takes effect immediately. Keys not yet in the saved order get rank `-1` (sorted first), so newly created categories always surface at the top.

### Collapsed display

When a group is collapsed, it shows only its unread rooms when "Show unreads" is on; otherwise the rooms are hidden and the collapser badge shows the total unread count. 

When "Keep unreads on top" is set, unread rooms are stable-partitioned to the top (preserving the configured sort within each partition). 
This logic lives in `useRoomList.ts`'s `makeGroup` function.

## Sidebar

Custom categories are implemented in the **classic sidebar only** (`client/sidebar/`). The navigation sidebar
(`client/views/navigation/sidebar/`) does not currently have custom-category support — its `RoomListCollapser`
and room-list hook are separate and do not use any of the category hooks.

## Menus

### Room kebab — `RoomMenu.tsx`

For non-livechat rooms, `RoomMenu.tsx` strips the `toggleFavorite` action and adds a **"Category"** section with a submenu ("Move to").

The submenu has two sections:
1. Category targets — Favorites + each custom category, each with a check-mark `addon` when it is the current grouping. Built by `useRoomCategoryItems`.
2. Utility actions — "New category" (opens `CreateCategoryModal` seeded with the room) and "Remove from {category}" (danger item, only shown when the room is currently grouped).

### Category collapser kebab — `CategoryMenu.tsx`

A `GenericMenu` (`icon='kebab'`, `mini`) rendered inside `RoomListCollapser`. Sections differ by type:

**Custom category:**
- Order: Move up / Move down / New channel (opens `CreateChannelModal` and moves the new room into the category)
- Manage: Rename / Delete / New category
- When closed: Show unreads (toggle switch)
- When opened: Keep unreads on top (toggle switch)

**System group:**
- Order: Move up / Move down
- When closed: Show unreads (toggle switch)
- When opened: Keep unreads on top (toggle switch)

Reorder actions close the menu before moving. The toggle-switch rows call `toggleCustomShowUnreads` / `toggleSystemShowUnreads` depending on whether a `category` prop is present.

### Room-header grouping menu — `RoomGroupingMenu.tsx`

A `GenericMenu` placed before the room title in `RoomHeader`. Its icon reflects the current grouping: `star-filled` for a favorite, `folder` for a room in a custom category, `star` otherwise.

It renders two sections of items built by `useRoomCategoryItems`:
1. Category targets (Favorites + custom categories, with check marks).
2. Utility actions (New category / Remove from category), omitted when empty.

### Modals — `categories/`

| File | Purpose |
|------|---------|
| `CreateCategoryModal.tsx` | Create or "create and move" — single name field, max 30 chars. |
| `ManageCategoryModal.tsx` | Rename with duplicate/empty validation. |
| `DeleteCategoryModal.tsx` | Confirmation before deleting a category. |
| `useCategoryModals.tsx` | Single entry point: `openCreate(room?)` / `openManage(category)` / `openDelete(category)`. |

### Navbar create menu

`useCreateNewMenu.ts` adds a "Category" item (icon: `folder`) below the create-room items in the navbar `+` menu. It calls `useCategoryModals().openCreate()` with no room argument.

## REST Contract

| Method | Endpoint | Field |
|--------|----------|-------|
| POST | `/v1/users.setPreferences` | `data.sidebarCustomCategories: ISidebarCustomCategory[]` |
| GET | `/v1/me` | returns `settings.preferences.sidebarCustomCategories` |

## Key Files

| Layer | File |
|-------|------|
| Type | `packages/core-typings/src/IUser.ts` (`ISidebarCustomCategory`) |
| REST typings/schema | `packages/rest-typings/src/v1/users/UsersSetPreferenceParamsPOST.ts` |
| Meteor method | `apps/meteor/server/meteor-methods/users/saveUserPreferences.ts` |
| Core hook | `apps/meteor/client/sidebar/hooks/useCustomCategories.ts` |
| Unified group order | `apps/meteor/client/sidebar/hooks/useAllGroupsOrder.ts` |
| Show-unreads (system groups) | `apps/meteor/client/sidebar/hooks/useShowUnreadsGroups.ts` |
| Keep-unreads-on-top (system groups) | `apps/meteor/client/sidebar/hooks/useKeepUnreadsOnTopGroups.ts` |
| Room list | `apps/meteor/client/sidebar/hooks/useRoomList.ts` |
| Category UI components | `apps/meteor/client/sidebar/categories/` |
| Collapser | `apps/meteor/client/sidebar/RoomList/RoomListCollapser.tsx` |
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
