# Room Tabs (PoC)

## Overview

Room tabs put the room's views side by side as tabs under the room header, instead of hiding them behind
toolbar buttons. The proof of concept ships two tabs:

- **Chat** — the room's conversation, unchanged, including its contextual bar.
- **Threads** — the room's threads in a list on the left, and the selected thread on the right, at full room
  width rather than squeezed into the contextual bar.

Files, Pinned and Discussions tabs, and the "+" to add tabs, are in the design but not built yet.

It is **always on** in this branch, with no feature preview or other server-side switch: the PoC is a client
change only, so this UI runs against any server, including production. English strings ship in the client bundle,
so the new keys show even where the server's own translations predate them.

## When the tabs show

Every condition must hold:

| Condition | Why |
| --- | --- |
| `Threads_enabled` setting on | Without threads, Chat would be the only tab. |
| Not an embedded layout or room | The embedded layout has no room header to sit under, and the conference window's room is embedded. |
| Not an omnichannel room | Livechat rooms have their own header and no threads action. |
| Room not waiting for E2EE setup | The room body is the E2EE setup screen then, with nothing to switch between. |

While the tabs show:

- the **Threads** button leaves the header toolbar and its kebab menu: the tab replaces it, and carries the same
  unread badge (danger when a thread mentions the user, warning for a group mention);
- the header drops its bottom divider, so the header and the tab bar read as one block.

## The contextual bar belongs to the Chat tab

The contextual bar (thread, Room info, Members, Search…) is part of the Chat tab. It stays open there while the
user is on another tab — hidden, not closed — and is back as it was on returning to Chat.

That is why the tabs do not use the route's `tab`/`context` parameters, which are the contextual bar's. The active
tab lives in search parameters instead:

| URL | Shows |
| --- | --- |
| `/channel/general` | Chat — though opening the room this way moves it to the Threads tab, see below |
| `/channel/general/thread/:tmid` | Chat, with the thread in the contextual bar |
| `/channel/general?view=threads` | Threads tab, with the room's own conversation (Main room) |
| `/channel/general?view=threads&thread=:tmid` | Threads tab, with the thread open |
| `/channel/general/thread/:a?view=threads&thread=:b` | Threads tab with `b` open; back on Chat, `a` is still in the contextual bar |

A header toolbar action (Members, Room info…) opens its contextual bar through the toolbox, which drops the search
parameters, so using one from the Threads tab switches back to Chat with that contextual bar open.

### Opening a room lands on Threads

A room opens on the Threads tab: on opening — when the room changes, not on every navigation — a URL with no tab
of its own is replaced with `?view=threads`. It is left alone when it already says what to show: a contextual bar
(`thread/:tmid`, `members-list`…), a message to jump to (`msg`), or an explicit `view`. Since this only happens on
opening, choosing Chat afterwards sticks until the user opens another room.

## Threads from a message

A thread opened from a message — **View thread** under a message with replies, **Reply in thread** in the message
toolbar — opens in the Chat tab's contextual bar, exactly as without tabs. So do notifications and links to a
thread: they all navigate to `thread/:tmid`.

With the Threads button gone from the header, the contextual bar is served by a *core room route* (a contextual
bar with no header button), registered only while the tabs show.

The thread's contextual bar gains two ways to the Threads tab:

- **View in threads** (a text button in the header) opens the Threads tab with this thread selected, and leaves
  the contextual bar open in Chat.
- **Back** goes to the Threads tab on the Main room, and closes the thread in the contextual bar — the list of
  threads it used to go back to is now the tab.

## Threads tab

- **Main room** — the first item, above the threads and pinned there, is the room itself: its avatar, name, a
  "Main room" tag, and the time and preview of its last message (the sidebar's own preview, drafts and E2EE
  included). It is what the tab opens on, and selecting it shows the room's conversation next to the list, composer
  included.
- **Threads from the conversation** — in that conversation, a thread opened from a message (View thread, Reply in
  thread, a reply preview) is selected in the list rather than opened in the contextual bar, which this tab does not
  show. The conversation provides `OpenThreadContext`, which `useGoToThread` and the Reply in thread action defer
  to; everywhere else they navigate to `thread/:tmid` as before.
- **List** — the same data and filters as the contextual bar's thread list (All / Following / Unread, kept in the
  same `thread-list-type` local-storage key, so the choice is shared) plus message search, behind a search button
  next to the filter. Closing the search (the button again, or Escape) also clears it, so the list is never
  narrowed by a term the user can no longer see. Items are the
  contextual bar list's own `ThreadListItem`, which takes a `selected` state for the thread open in the tab. Its
  compact layout — avatar, name, date and the follow toggle (carrying the unread badge) on the first line, a
  one-line preview, then the replies with the participants right after them — applies to both lists.
- **Thread** — a header with the reply count and a follow/unfollow toggle, then the same message list and
  composer as the contextual-bar thread, including "Also send to channel". Escape on an empty composer goes back
  to the list.
- **Mobile** — only one side at a time: the list, or the open thread with a back button. Main room switches to the
  Chat tab there, since the room's conversation is all it would show.

Switching tabs remounts the room's conversation, so it comes back at the bottom (or at the unread mark), not where
the user left it.

## Not built yet

- The design's "New thread" button: a thread always hangs off a room message, so this needs a decision on what
  creating one from the Threads tab posts to the room.
- "Open in room" on the thread header. Jumping to a thread's root message from the room body currently redirects
  to the thread, so it needs a way to ask for the room position explicitly.
- Files, Pinned, Discussions tabs and user-added tabs.

## Key Files

| Layer | Path |
| --- | --- |
| Tab bar | `apps/meteor/client/views/room/RoomTabs/RoomTabs.tsx` |
| Enablement, active tab, navigation | `apps/meteor/client/views/room/RoomTabs/hooks/` |
| Threads tab, Main room item | `apps/meteor/client/views/room/RoomTabs/ThreadsView/` |
| Threads opened from the conversation in the Threads tab | `apps/meteor/client/views/room/contexts/OpenThreadContext.ts`, read by `apps/meteor/client/views/room/hooks/useGoToThread.ts` and `apps/meteor/client/components/message/toolbar/items/actions/ReplyInThreadMessageAction.tsx` |
| Room wiring (tab bar, body, hiding the contextual bar) | `apps/meteor/client/views/room/Room.tsx`, `apps/meteor/client/views/room/layout/RoomLayout.tsx` |
| Thread contextual bar without a header button | `apps/meteor/client/views/room/providers/hooks/useCoreRoomRoutes.ts` |
| View in threads / Back | `apps/meteor/client/views/room/contextualBar/Threads/Thread.tsx` |
| Threads toolbar action (hidden while tabs show) | `apps/meteor/client/hooks/roomActions/useThreadRoomAction.tsx` |
| Header divider | `packages/ui-client/src/components/Header/Header.tsx` (`divider`), passed from `Room.tsx` through `Header/Header.tsx` and `Header/RoomHeader.tsx` |
| Shared with the contextual-bar threads | `apps/meteor/client/views/room/contextualBar/Threads/hooks/useThreadsListOptions.ts`, `apps/meteor/client/views/room/hooks/useThreadsUnreadBadge.ts`, `ThreadListItem` (`selected`) |
| Last-message preview, shared with the sidebar | `apps/meteor/client/lib/utils/normalizeMessagePreview/getMessagePreview.ts` |
