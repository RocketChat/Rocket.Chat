# Message components

The components that render a message live in `@rocket.chat/ui-message-list`, next to the [message list](README.md). They render; everything they need from the app (settings, navigation, actions, data about other things, markdown) reaches them through contexts named for what the user does or sees. A place that shows messages provides the contexts; stories and tests get working defaults. What each variant must do is in the package's specs: [message-variants](../../../packages/ui-message-list/docs/specs/message-variants.md), [message-capabilities](../../../packages/ui-message-list/docs/specs/message-capabilities.md), [message-attachments](../../../packages/ui-message-list/docs/specs/message-attachments.md) and [message-toolbar](../../../packages/ui-message-list/docs/specs/message-toolbar.md).

## Variants

| Variant                | Where                                            | What it renders                                                                                          |
| ---------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Room message           | room, search and contextual-bar lists, the audit | avatar, author line (name, roles, time, status indicators), content, toolbar                             |
| System message         | room, thread                                     | the author and the text of the message type (joins, renames, ...), plus any attachments and action links |
| Thread message         | inside a thread                                  | as a room message, with the thread's toolbar actions                                                     |
| Thread message preview | a thread reply shown in the room                 | a link to the thread: what the thread started with, then the reply                                       |

Every variant renders these states (`B20`):

- **sequential**: grouped with the previous message, without avatar and author line; status indicators move to the left column;
- **pending**: an optimistic copy not confirmed by the server yet (busy, dimmed);
- **editing**: the composer edits it, or a jump just landed on it; both use the same look;
- **selected** and **selecting**: selection mode, with a checkbox instead of the avatar;
- **ignored**: its author is ignored by the viewer (or the message itself is marked ignored); a placeholder hides the content until the viewer reveals it;
- **encrypted, not decrypted yet**: a placeholder instead of the body;
- **thread markers**: whether the thread under a message has unread replies, mentions the viewer, or mentions everyone;
- **failed**: content that throws while rendering is replaced by a short notice, and only that message is affected.

## Capabilities

| Context      | What it gives the message components                                                                                                                                                                                                                                          |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| display      | How messages look: roles, real names, usernames, colors, avatars, read receipts, embeds, highlighted words, KaTeX, auto-linked domains, date and time formats, whether a message is translated, starred or followed, and whether the viewer can act on messages at all.       |
| navigation   | Where a click takes the viewer: a room, a thread, a message, a direct conversation, an external link; a message's permalink; running a legacy action link.                                                                                                                    |
| interactions | What the viewer does to a message: react, quote, reply, edit, delete, pin, star, follow its thread, mark it unread, translate, forward, report, start a discussion; the dialogs listing reactions and read receipts.                                                          |
| toolbar      | The actions of the toolbar menus, already built and filtered by the app (permissions, settings, layout, apps), the quick reactions, and what counts a quick reaction toward the emoji used most. The toolbar renders them and its own inline buttons.                         |
| renderers    | The components that render content the package cannot depend on: message markdown, the markdown of a thread preview, UiKit blocks, emoji.                                                                                                                                     |
| related data | Data a message shows about other things: its author's roles (resolved once for the place that lists them, or looked up for another room's message), the message it replies to, a message by id, its room and subscription, and the remembered state of its collapsible parts. |
| content      | Turning a message into what is displayed: markdown parsed with the viewer's options, attachments decrypted, translations applied; emoji data for reactions.                                                                                                                   |
| media        | The shared audio player, downloads that need decrypting, encrypted PDFs, the desktop document viewer, file sizes.                                                                                                                                                             |
| selection    | Selection mode. Each provider owns its store, so a thread never registers into the room's selection.                                                                                                                                                                          |
| editing      | The message the composer is editing.                                                                                                                                                                                                                                          |

The highlight of a jump target belongs to the message list, not to these contexts (`useIsMessageHighlighted`), so a jump and an edit never clear each other. Until the room's and the thread's lists are built on `MessageList` (branches 08 and 09 of the replacement), the editing context also carries the jump target of those two lists.

## Who provides them

The app provides every context from `MessagesProvider` (`apps/meteor/client/providers/MessagesProvider`), one hook per context (`useMessageDisplayValue`, `useMessageInteractionsValue`, ...). It reads the chat of the conversation when there is one, so the composer, the emoji picker and message editing are reached only where a conversation is open.

| Place                                                                                                                          | Notes                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| room list                                                                                                                      | the room and its subscription, and the room's selection                                                                    |
| thread list                                                                                                                    | the room and its subscription, and no selection: a thread's messages never join the room's                                 |
| contextual-bar tabs (pinned, starred, mentions, search, the thread list)                                                       | the room and its subscription; the toolbar shows the items of the tab's context                                            |
| read-only places (audit, moderation, contact history, the message in the forward, pin and report modals, the composer's quote) | `allowsInteraction={false}`, so neither the toolbar nor the thread metrics show; they follow the viewer's display settings |
| stories and tests                                                                                                              | the defaults: no-op capabilities, plain-text markdown, a placeholder for UiKit blocks                                      |
