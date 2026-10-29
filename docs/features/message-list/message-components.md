# Message components

The components that render a message live in `@rocket.chat/ui-client`, next to the [message list](README.md). They render; everything they need from the app (settings, navigation, actions, data about other things, markdown) reaches them through contexts named for what the user does or sees. A place that shows messages provides the contexts; stories and tests get working defaults.

## Variants

| Variant | Where | What it renders |
| --- | --- | --- |
| Room message | room, search and contextual-bar lists | avatar, author line (name, roles, time, status indicators), content, toolbar |
| System message | room, thread | the author and the text of the message type (joins, renames, ...), plus any attachments and action links |
| Thread message | inside a thread | as a room message, with the thread's toolbar actions |
| Thread message preview | a thread reply shown in the room | a link to the thread: what the thread started with, then the reply |

Every variant renders these states:

- **sequential**: grouped with the previous message, without avatar and author line; status indicators move to the left column;
- **pending**: an optimistic copy not confirmed by the server yet (busy, dimmed);
- **editing**: the composer edits it, or a jump just landed on it; both use the same look;
- **selected** and **selecting**: selection mode, with a checkbox instead of the avatar;
- **ignored**: its author is ignored by the viewer (or the message itself is marked ignored); a placeholder hides the content until the viewer reveals it;
- **encrypted, not decrypted yet**: a placeholder instead of the body;
- **thread markers**: whether the thread under a message has unread replies, mentions the viewer, or mentions everyone;
- **failed**: content that throws while rendering is replaced by a short notice, and only that message is affected.

## Capabilities

| Context | What it gives the message components |
| --- | --- |
| display | How messages look: roles, real names, usernames, colors, avatars, read receipts, embeds, highlighted words, KaTeX, auto-linked domains, date and time formats, whether a message is translated, starred or followed, and whether the viewer can act on messages at all. |
| navigation | Where a click takes the viewer: a room, a thread, a message, a direct conversation, an external link; a message's permalink; running a legacy action link. |
| interactions | What the viewer does to a message: react, quote, reply, edit, delete, pin, star, follow its thread, mark it unread, translate, forward, report, start a discussion; the dialogs listing reactions and read receipts. |
| toolbar | The actions of the toolbar menus, already built and filtered by the app (permissions, settings, layout, apps), and the quick reactions. The toolbar renders them and its own inline buttons. |
| renderers | The components that render content the package cannot depend on: message markdown, the markdown of a thread preview, UiKit blocks, emoji. |
| related data | Data a message shows about other things: its author's roles, the message it replies to, a message by id, its room and subscription, and the remembered state of its collapsible parts. |
| content | Turning a message into what is displayed: markdown parsed with the viewer's options, attachments decrypted, translations applied; emoji data for reactions. |
| media | The shared audio player, downloads that need decrypting, encrypted PDFs, the desktop document viewer, file sizes. |
| selection | Selection mode. Each provider owns its store, so a thread never registers into the room's selection. |
| editing | The message the composer is editing. |

The highlight of a jump target belongs to the message list, not to these contexts, so a jump and an edit never clear each other.

## Who provides them

| Place | Notes |
| --- | --- |
| room and thread lists | every context, with interactions and toolbar wired to the room |
| contextual-bar tabs (pinned, starred, mentions, search, threads) | the same, with the toolbar items of their context |
| read-only places (audit, moderation, contact history) | display with interaction turned off, so neither the toolbar nor the thread metrics show |
| stories and tests | the defaults: no-op capabilities, plain-text markdown, a placeholder for UiKit blocks |
