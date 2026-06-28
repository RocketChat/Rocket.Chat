# Custom Sidebar Categories

## Overview

Custom categories let each user group their sidebar rooms into personal, named collections that render
**above** the system groups (Favorites, Teams, Channels, Direct messages, …). A user can create, rename,
delete and reorder categories; move rooms in and out of them via context menus or drag-and-drop; and toggle
whether each category keeps showing unread rooms while collapsed.

Categories are **per-user** and **client-only in meaning** — they are a presentation grouping of the user's
own subscriptions. They carry **no access, security or membership semantics**: moving a room into a category
never changes who can see the room or the room itself. Assignment is **exclusive** — a room lives in exactly
one place at a time (one custom category, *or* Favorites, *or* its system group).

> The categories UI is **not** behind a license/premium gate or a feature-preview toggle in the current
> implementation. It renders in both the classic sidebar and the navigation (feature-preview) sidebar.

## Data Model

A category is a small record stored on the user's preferences:

```ts
// packages/core-typings/src/IUser.ts
export interface ISidebarCustomCategory {
	_id: string;        // Random.id(), generated client-side on create
	name: string;       // display name (trimmed; max 30 chars)
	icon?: string;      // emoji name (e.g. `rocket`, no colons); falls back to the folder icon
	showUnreads?: boolean; // when collapsed, keep listing unread rooms (default: true)
	rooms?: string[];   // rids assigned to this category
}
```

### Emoji icon

A category can carry an optional emoji, chosen from the shared emoji picker in the Create / Rename modals
(`EmojiIconPicker.tsx`). The picker button sits before the name field (Slack-style) and previews the current
icon: the chosen emoji, or the **folder** icon when none is set. The stored value is the picker's emoji name
(e.g. `rocket`), rendered via the `<Emoji>` component.

`CategoryLabel.tsx` renders the icon before the category name in the sidebar collapser — the emoji when set,
otherwise the folder icon (constrained to the folder's `x20` size so both match). The collapser's `aria-label`
keeps the plain name, so the emoji is purely visual and does not affect accessible names or the `region`-name
selectors used by tests. System groups (Channels, Direct messages, …) render no leading icon.

The emoji also replaces the folder icon **in the menus**: the "Move to" list (`MoveToList.tsx`, used by both
the sidebar room kebab submenu and the room-header dropdown) renders a category's emoji via the `Option`
`avatar` slot. And the **room-header grouping control** (`RoomGroupingMenu.tsx`) uses the same
`HeaderToolbarAction` button — identical size to the right-side room actions (Room info, Threads, …) — and shows
the category's emoji as its icon (falling back to filled-star / folder / star).

**Unsetting:** while an emoji is selected, the picker button shows a small clear badge (an
`IconButton secondary`, theme-aware) that reverts the category to the default folder icon.

The ordered list of a user's categories is the preference `sidebarCustomCategories: ISidebarCustomCategory[]`.
The array order **is** the render order (top to bottom).

## Persistence

All mutations are persisted server-side through the existing user-preferences endpoint — there is **no new
endpoint**:

```
POST /v1/users.setPreferences  { data: { sidebarCustomCategories: ISidebarCustomCategory[] } }
```

- The REST schema (`UsersSetPreferenceParamsPOST`) validates the array with `additionalProperties: false`
  and `required: ['_id', 'name']` per item, so malformed entries are rejected with `400 invalid-params`.
- The Meteor method `saveUserPreferences` mirrors the field with `Match.Optional([Match.ObjectIncluding({ _id: String, name: String })])`.
- The value round-trips back to the client through the user object (`me` / login payload →
  `useUserPreference('sidebarCustomCategories')`), so changes are reactive across the user's sessions.

Every write replaces the **whole** array (read-modify-write in the hook), which keeps ordering and exclusivity
invariants in a single atomic preference update.

## Behaviors / Flows

All flows live in the hook `client/views/navigation/hooks/useCustomCategories.ts`.

| Flow | Function | Notes |
|------|----------|-------|
| Create | `createCategory(name)` | Appends `{ _id, name, showUnreads: true, rooms: [] }`. Validates name first. |
| Rename | `renameCategory(id, name)` | No-op + close when unchanged. |
| Delete | `deleteCategory(id)` | Rooms fall back to their system group (the rooms themselves are untouched). |
| Reorder | `reorderCategory(id, 'up' \| 'down')` | Swaps adjacent entries; clamped at the ends. |
| Toggle unreads | `toggleShowUnreads(id)` | Flips `showUnreads` (default treated as `true`). |
| Move room | `moveRoom(room, target)` | `target` is a category id or the `favorites` sentinel. Strips the room from every other category first (exclusive). |
| Create & move | `createCategoryAndMoveRoom(name, room)` | One persisted action: new category seeded with the room (flow D). |
| Remove room | `removeRoom(room)` | Strips from all categories + unfavorites → returns to its system group. |
| Lookup | `getRoomCategory(rid)` | The category currently containing a room, if any. |

### Name validation

`validateName(name, excludeId?)` returns `'empty'` (blank/whitespace) or `'duplicate'`
(case-insensitive match against another category) or `undefined`. The modals map these to
`Please_enter_a_category_name` / `A_category_with_this_name_already_exists`. Max length is
`MAX_CATEGORY_NAME_LENGTH = 30`.

### Favorites interaction

`Favorites` is a system group, not a custom category, but it participates in the same "Move to" target list
via the `FAVORITES_TARGET = 'favorites'` sentinel. Moving a room to Favorites favorites it
(`POST /v1/rooms.favorite` + `toggleFavoriteRoom` mutation effect) and strips it from any custom category;
moving it into a custom category unfavorites it. This keeps assignment exclusive.

### Exclusivity in the room list

`client/sidebar/hooks/useRoomList.ts` (classic) builds a `rid → categoryId` map first. A room assigned to a
custom category is added **only** to that category's set and `return`s before the system-group bucketing — so
it never appears twice. Custom categories are emitted first (above system groups) and **persist even when
empty** (an expanded empty category reserves one row for the "drag rooms here" placeholder).

### Collapsed display

When a group (custom category or system group) is collapsed, it shows only its unread rooms (when "Show
unreads" is on) **plus the currently-open room**. The open room (`useOpenedRoom()`) is always kept visible in
its group even when collapsed and not unread, so the active conversation never disappears from the sidebar.
This is applied in both `useRoomList.ts` (classic) and `getDisplayRooms` in `RoomsNavigationContext.ts` (nav).

## The two sidebars

The feature is implemented once and rendered in both sidebars; the category components under
`client/views/navigation/sidebar/categories/` are **sidebar-agnostic**.

| | Classic (default) | Navigation (feature preview `secondarySidebar`) |
|---|---|---|
| Room list hook | `client/sidebar/hooks/useRoomList.ts` | `client/views/navigation/...` |
| Collapser | `client/sidebar/RoomList/RoomListCollapser.tsx` | `client/views/navigation/sidebar/RoomList/RoomListCollapser.tsx` |
| Room row | `client/sidebar/RoomList/SidebarItemTemplateWithData.tsx` | `client/views/navigation/sidebar/RoomList/SidebarItemWithData.tsx` |
| Room kebab | `client/sidebar/RoomMenu.tsx` → `RoomMenuWithCategories` | same shared component |

Which sidebar renders is decided in
`client/views/root/MainLayout/LayoutWithSidebar.tsx` via `<FeaturePreview feature='secondarySidebar'>`.

## Menus

Fuselage's `GenericMenu` (react-aria) cannot host a nested flyout, so the category menus are custom popovers
built from `Position` + `Tile` (`role="menu"`) + `Option` (`role="menuitem"`).

### Room kebab — `RoomMenuWithCategories.tsx`

The standard room actions (Hide, Mark read, Leave, …) render as before, but the **Favorite** action's slot is
replaced by a **"Move to ▸"** item that opens a cascading submenu (`MoveToList`). The submenu is an
absolutely-positioned child of the *same* popover (one portal) — nesting a second `Position` portal crashes on
teardown. Outside-click is handled by a capturing `mousedown` listener that keeps the menu open while the
target is inside any `[role="menu"]`.

### Move-to list — `MoveToList.tsx` (shared)

`Move to` title → `Favorites` + each category (the current grouping shown **bold + check**) → divider →
`New category` → `Remove from {category}` (only when the room is currently grouped). Built by
`useRoomCategoryItems.tsx`. Used by both the room kebab submenu and the room-header grouping dropdown.

### Category collapser kebab — `CategoryMenu.tsx`

- **Custom category:** Move up / Move down / New channel / **Manage** (Rename / Delete / New category) /
  divider / **When closed** → Show unreads (toggle).
- **System group:** Move up / Move down / New category / divider / When closed → Show unreads.

Reorder actions close the menu (so the popover doesn't end up anchored to a category that just moved). The
Show-unreads row is a `role="menuitemcheckbox"` wrapping a `ToggleSwitch`.

### Room-header grouping menu — `client/views/room/Header/icons/RoomGroupingMenu.tsx`

A popover on the far left of the room header (icon reflects the current grouping: `star-filled` for a favorite,
`folder` for a category, `star` otherwise) that opens the same `MoveToList`.

## Drag and drop

Native HTML5 DnD, coordinated through `CategoryDnDContext.tsx`:

- **Dragging a room** (`useRoomDrag`): rows are `<a href>` links, so `dataTransfer.clearData()` is called to
  drop the `text/uri-list` payload (otherwise Chrome shows "open link / split view" drop zones). The native
  drag image is hidden (a transparent pixel via `setDragImage`) and a **custom tilted ghost** is rendered that
  follows the cursor — Chrome rasterizes a `setDragImage` bitmap *without* CSS transforms, so the tilt only
  survives on a live DOM node. The ghost is appended inside `.rcx-sidebar` so it inherits the sidebar theme.
- **Drop targets** (`useGroupDrop`): a custom category accepts any room not already in it; a system group
  accepts a room **only** when it is that room's native group (drop = remove from the custom category). Native
  group keys are resolved by `nativeCategory.ts` (`getNativeCategoryKey`). Non-accepting system groups fade out
  while a drag is in progress.
- **Highlight:** on drag-over, the whole target block (collapser header + its rows) highlights with
  `--rcx-color-surface-hover`. The header bar is kept permanently transparent (`transparentBarClass`) so the
  wrapper's inline background drives the header tint in the same render as the rows — header and rows light up
  together. Leaving the group reverts via a 60 ms debounced clear (avoids flicker when moving between sibling
  rows).
- **Empty category:** `CategoryEmptyPlaceholder.tsx` renders a full-width "Drag rooms here" drop zone.

## Translations

Keys added to `packages/i18n/src/locales/en.i18n.json` (rebuild `@rocket.chat/i18n` after editing):

| Key | English |
|-----|---------|
| `Category` | Category |
| `Create_category` | Create category |
| `Categories_are_private_custom_groupings_of_rooms` | Categories are private custom groupings of rooms. |
| `Category_created` | Category created. |
| `You_can_add_rooms_after` | You can add rooms after |
| `Please_enter_a_category_name` | Please enter a category name |
| `A_category_with_this_name_already_exists` | A category with this name already exists |
| `Rename_category` / `Delete_category` | Rename category / Delete category |
| `New_category` / `New_channel` | New category / New channel |
| `Move_to` | Move to |
| `Move__roomName__to` | Move {{roomName}} to: |
| `Create_and_move` | Create and move |
| `Remove_from__categoryName__` | Remove from {{categoryName}} |
| `__roomName__moved_to__categoryName__` | {{roomName}} moved to {{categoryName}}. |
| `__roomName__removed_from__categoryName__` | {{roomName}} removed from {{categoryName}}. |
| `Show_unreads` / `When_closed` / `Manage` | Show unreads / When closed / Manage |
| `Drag_rooms_here` | Drag rooms here |

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
| Meteor method | `apps/meteor/server/methods/saveUserPreferences.ts` |
| Core hook | `apps/meteor/client/views/navigation/hooks/useCustomCategories.ts` |
| Show-unreads (per group) | `apps/meteor/client/views/navigation/hooks/useShowUnreadsGroups.ts` |
| System-group order | `apps/meteor/client/views/navigation/hooks/useSystemGroupsOrder.ts` |
| Room list (classic) | `apps/meteor/client/sidebar/hooks/useRoomList.ts` |
| Category components | `apps/meteor/client/views/navigation/sidebar/categories/` |
| Drag-and-drop | `apps/meteor/client/views/navigation/sidebar/categories/CategoryDnDContext.tsx` |
| Create-menu entry | `apps/meteor/client/navbar/NavBarPagesGroup/hooks/useCreateNewMenu.ts` |
| Room-header grouping | `apps/meteor/client/views/room/Header/icons/RoomGroupingMenu.tsx` |
| Collapsers | `apps/meteor/client/{sidebar,views/navigation/sidebar}/RoomList/RoomListCollapser.tsx` |
| i18n | `packages/i18n/src/locales/en.i18n.json` |

## Tests

| Kind | File |
|------|------|
| API (preference persistence + validation) | `apps/meteor/tests/end-to-end/api/sidebar-custom-categories.ts` |
| E2E (Playwright) | `apps/meteor/tests/e2e/sidebar-custom-categories.spec.ts` |
| E2E page object | `apps/meteor/tests/e2e/page-objects/fragments/sidebar.ts` (custom-category helpers) |
