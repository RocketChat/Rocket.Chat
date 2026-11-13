# Message list

The message list shows a conversation, a room or a thread, as an infinite list that opens on the latest message, loads older and newer pages as the viewer scrolls, and jumps to any message. It lives in `@rocket.chat/ui-message-list` and knows nothing about where messages come from: the consumer passes the messages it has and the capabilities it offers, and the list reports back what the viewer sees. The requirements are in [the package's spec](../../../packages/ui-message-list/docs/specs/message-list.md), the decision behind the design in [ADR 0001](../../../packages/ui-message-list/docs/adr/0001-message-list-virtua-and-scroll-reducer.md); the ids `B1` to `B21` below are the behaviours the spec cites, with `B20` (the states of a message) in [message-components.md](message-components.md) and `B21` in Paging.

## What it does

- **Opens at the latest message**, unless it was left elsewhere and that position is restored, or it opens on a jump target. (B1)
- **Stays at the bottom while the viewer is there** (within `bottomThreshold` pixels of it, 1 by default): as messages arrive, as content grows (reactions, images, embeds, collapsibles), as the composer grows, and as the window or a panel resizes. (B2)
- **Follows the viewer's own messages**, from anywhere. From an older part of the conversation it first goes back to the latest messages. (B3)
- **"New messages"** shows when someone else writes while the viewer is reading further up; it takes them down and clears once they reach the bottom. (B4)
- **Loads older messages** as the viewer approaches the top, without moving what is on screen. (B5)
- **Loads newer messages** at the bottom after a jump into history, and **"Jump to recent messages"** goes straight back to the latest. (B6)
- **Jumps to any message**, centered and briefly highlighted, loading the messages around it first when needed, and keeps it centered while images around it load. The unread banner jumps to the first unread message the same way. (B7, B8)
- **Day and unread dividers** mark the first message of each day and the first unread message, combined when they fall on the same message. (B9)
- **A floating date** shows the day at the top of the list on every scroll and fades a second after the last one; it stands in for the day divider under it, which hides meanwhile, and the next day's divider pushes it up. (B10)
- **Groups consecutive messages** of the same author (see Grouping). (B11)
- **A header** above the first message once nothing older remains: the room foreword and retention warning in a room. (B12)
- **Loading indicators** for the first page and for older and newer pages. (B13)
- **Remembers where it was left** when switching conversations; in a room, unread messages take precedence: the room does not pass the position, so the list opens at the bottom. (B14)
- **Keeps live embeds mounted** (players, URL previews, iframes) so they do not reload when scrolled away and back. (B15)
- **Reports what is visible**: the topmost message, whether the first unread message is on screen, whether the viewer is at the bottom, as soon as the list is placed and after every scroll, change of the messages and resize. (B16)
- **Keyboard**: a single tab stop; Up and Down move between messages, scrolling unrendered ones into view; Tab walks the controls of the focused message, then leaves the list; the first entry lands on the latest message. (B17)
- **Selection mode**: checkboxes on every message; a click, Space or Enter toggles one; selecting all scrolls to the top. (B18)
- **Accessible**: a labelled `list`, busy while loading, every message a `listitem` with a role description and a name. (B19)

## Model

### Rows

The list renders typed rows, built from the messages in one pass:

| Row          | When                                                                                                     |
| ------------ | -------------------------------------------------------------------------------------------------------- |
| older loader | first, while older messages remain to load                                                               |
| header       | first, once no older messages remain and the consumer gives one (the room foreword, a retention warning) |
| message      | one per message, oldest first                                                                            |
| newer loader | last, while newer messages remain to load                                                                |

A message row carries everything it displays: the message, the one before it, whether it continues the previous message (grouping), whether it starts a new day (day divider) and whether it is the first unread message (unread divider). Dividers belong to their message row; they are never rows of their own.

The rows are the only place that maps a message id to its position. Nothing else adds or subtracts offsets for the loader or the header.

The header and the loaders are rows, not siblings of the list: when the older loader is swapped for the header, or the header grows late (avatars, an asynchronous warning), the list keeps the visible messages where they are, as it does for a page of older messages.

### Grouping

A message is grouped with the one before it (rendered without its own author line) when both share the author and the alias, they were sent within the grouping period (`Message_GroupingPeriod`) on the same day, the message is groupable and neither is a system message.

In a room, thread replies show as previews of their thread: a reply is grouped with the message right before it when that message is the thread or another reply of it, whoever wrote it, and a message that follows a reply is never grouped. Inside a thread every message is a reply, so this rule is off and grouping follows the author.

### Data changes

Each time the messages change, the list compares the new row keys with the previous ones and classifies the change by where it happened:

| Change        | Examples                                               | What happens to the scroll position                                                   |
| ------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| at the start  | a page of older messages, the oldest message deleted   | the visible messages stay where they are                                              |
| at the end    | a new message, the newest message deleted              | the visible messages stay where they are; at the bottom, the list stays at the bottom |
| at both ends  | a new message arrives while an older page loads        | committed in two steps, start first, so both rules apply                              |
| in the middle | a filter, a message reordered by its server timestamp  | the topmost visible message is pinned at its offset                                   |
| everything    | a jump to an unloaded message, back to the latest page | the position comes from what caused it: the jump target, or the bottom                |

### Position

A list reports where it was left: whether it was at the bottom, the message at the top of the viewport and how far into it the viewport was, plus the virtualizer's measurements. Restoring goes to the bottom when the list was left there, to that message at that offset when it is among the first messages listed, however late they arrive after the list mounts, and to the bottom otherwise. The measurements are reused only when the rows they describe are still the first rows, in the same order, at the same width.

### Scrolling

The list keeps one **anchor**, what it holds in view:

- **bottom**: the latest message stays at the bottom while messages arrive and content, the viewport or the composer change size;
- **message**: a message stays at the same place, centered after a jump or at its saved offset after a restore, while the rows around it are measured;
- **none**: the viewer is reading somewhere and nothing is pinned.

Only the viewer's own input (wheel, touch, scroll keys, dragging the scrollbar, moving between messages with the keyboard) releases an anchor. A scroll that the list or the browser makes can take the list back to the bottom when it lands there, but never away from it. Everything the viewer does between the first gesture and the moment scrolling stops is one **user-scrolling window**: a scroll inside it is the viewer's.

A held message is released after a few seconds without its surroundings changing size, since images resolve well after the first layout.

The list has two **phases**. While **positioning** (opening, restoring, and again when its first messages arrive late while it showed nothing but a spinner, or when its viewport gets a size), it does not load pages and keeps its rows out of sight, so the viewer never sees it moving into place, and the list says it is busy meanwhile; a list the viewer already saw is never hidden again. It counts as placed once nothing moved for a few frames, or after a timeout. Then it is **idle**, and its rows show; they also show at the viewer's first input, when the focus enters the list, or after half a second when the content keeps resizing.

The viewer's own messages always take the list to the bottom. When the list shows an older window of the conversation, it first asks the consumer for the latest page, then goes to the bottom once that page is in.

A message from someone else that arrives while the viewer is away from the bottom raises the "New messages" indicator, which clears once the bottom is reached.

### Paging

Older messages load when the viewport comes within a third of its height from the first message; newer messages load at the bottom (B21). One page loads at a time. The check runs after every scroll and once more after every data change, so a viewport taller than a page keeps loading until it is full, and it never runs while the list is positioning or holding a message in view. With `deferPagingUntilInput`, no page loads before the viewer's first input in the list (a scroll gesture, a scroll key, a pointer press), so a first page shorter than the viewport waits for it too, and the same holds again once the window of the conversation is replaced.

## The data contract

The consumer gives the list:

- the messages it has, **sorted oldest first**, and whether older and newer messages remain;
- loading flags for the first page and for older and newer pages;
- callbacks that **return a promise settling once the page is in the messages** (or failed): load older, load newer, and jump to the latest page;
- which message is the first unread one, and which one to jump to, if any; when the jump target is not loaded, the consumer loads the messages around it and the list jumps once they arrive;
- how to tell the viewer's own messages, including their optimistic copies;
- a saved position to restore, and the list must be keyed by conversation for it to take effect; whether unread messages override it is the consumer's decision, which it makes by not passing the position;
- optionally, how near the bottom counts as the bottom (`bottomThreshold`);
- optionally, that no page loads before the viewer's first input in the list (`deferPagingUntilInput`), as in a room;
- optionally, space above the first row and below the last one (`startSpacing`, `endSpacing`), which the list counts as part of those rows, so it rests at the bottom with the space in view;
- a renderer for each message row and, optionally, a header.

The list reports back when a jump target was reached, where it was left (an opaque position to store and hand back), and what is visible. The latest visibility can also be read at any time from the list's handle, for callers that ask instead of listening, and the handle scrolls to the bottom, the top or a message on demand.

The list never decides what is unread, never selects and never counts messages: "Select all" scrolls to the top through the handle and selects what the consumer has loaded.

Overlays (the floating date, "New messages", "Jump to recent messages") are composed by the consumer as children of the list, so a thread can show only the date while a room shows all three. The overlay buttons scroll the list themselves; what else a click does, such as focusing the composer, stays with the consumer.

How each message renders, and the capabilities it needs from the app, is in [message-components.md](message-components.md).
