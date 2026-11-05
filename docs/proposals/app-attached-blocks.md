# Proposal: apps attach blocks to someone else's message without editing it

Status: proposed, not implemented.

## Context

Apps want to enrich a message they did not write: a status card under a pull request link, a ticket summary under a
ticket number, a translation under a sentence. The PR Status app (CI, reviews and mergeability for a GitHub PR link,
kept current by GitHub webhooks) is the case that surfaced this.

Today the only way is the Apps-Engine message updater, which ends in `updateMessage`
(`apps/meteor/server/lib/messages/updateMessage.ts`). That path is built for an author editing their own message, and
every app update pays all of it:

- **It is an edit.** `editedAt` and `editedBy` are set to the app user, so the message shows the edited mark, attributed
  to the app (`updateMessage.ts:49`).
- **It writes history.** With `Message_KeepHistory` on, every update stores a copy (`updateMessage.ts:45`); a card that
  follows CI writes one per status change.
- **It runs every app's update hooks.** `IPreMessageUpdated*` and `IPostMessageUpdated` fire for all installed apps, which
  see an edit the author never made.
- **It re-runs `beforeSave` on the author's text** (`apps/meteor/server/services/messages/service.ts`): bad-words
  filtering, markdown, mentions, Spotify links, quote attachments; and, unless the app passes `parseUrls: false`,
  `urls` is rebuilt from the text, which drops fetched previews, refetches them and brings back previews the author
  dismissed.
- **Round-trips attachments** through the Apps-Engine converter, which can drop fields of file attachments.

And the result still renders wrong: when a message has `blocks`, the room and thread renderers show the blocks
**instead of** the text (`RoomMessageContent.tsx`, `ThreadMessageContent.tsx`), so the author's text disappears behind
the app's card. That rule is right for messages an app sends, where `msg` is only a fallback, and wrong for a message
someone else wrote.

### Prior art

- **Link previews already do this.** OEmbed enriches a sent message by writing `urls` straight through the model
  (`Messages.setUrlsById`, from `AfterSaveOEmbed.ts`): no edit mark, no history, no hooks, rendered under the text, and
  clients get it through the normal message change stream.
- **Slack separates the two.** An app cannot `chat.update` a message it did not post (`cant_update_message`). To add
  content to a user's message it uses link unfurling: `chat.unfurl` attaches blocks to the message per URL, rendered
  under the user's text, and calling it again with the same message replaces them, which is how unfurls stay current.

## Proposal

Give apps a second, separate place on a message for content they attach, written and read independently of the
author's message.

- **Data.** `IMessage.attachedBlocks?: Record<appId, MessageSurfaceLayout>`. Keyed by app, so apps never overwrite each
  other and an app's blocks can be removed as a unit.
- **Model.** `Messages.setAttachedBlocksByAppId(_id, appId, blocks)` and `Messages.unsetAttachedBlocksByAppId(_id,
  appId)`, a single `$set` / `$unset` on `attachedBlocks.<appId>`, the same shape as `setUrlsById`. No `editedAt`, no
  history, no `beforeSave`, no update hooks, no notifications.
- **Apps-Engine.** `IModifyUpdater.attachBlocks(messageId, blocks)` and `detachBlocks(messageId)`, backed by a new
  `MessageBridge` method, under the existing message write permission. The blocks go through the same validation and
  size limits as message blocks. The app never receives or rewrites the author's message, so nothing of it can be lost.
- **Rendering.** Room and thread messages render the author's content exactly as today, then each app's
  `attachedBlocks` in its own `UiKitMessageBlock`, between attachments and link previews. Interactions from those
  blocks reach their app the way message blocks do (the block's `appId`, the message's `mid`).
- **Lifecycle.** Editing the message keeps them (`updateMessage` merges onto the stored message); deleting the message
  removes them. Room `lastMessage`, search, notifications, exports and read receipts ignore them.
- **Other clients.** Clients that do not know the field ignore it and show the message as before.

With this, the PR Status app replaces its `updater.message(...).setBlocks(...)` with `attachBlocks`, and both problems
— the edited mark and the hidden text — go away for every app that enriches messages.

## Alternatives considered

- **Skip `editedAt` when an update only changes blocks.** Removes the mark but keeps history, hooks, `beforeSave` and the
  converter round trip, and the text stays hidden.
- **Render text and blocks together when an app set blocks on someone else's message** (a flag on the message). Fixes the
  hidden text only; every update is still a full edit.
- **The app posts its own message under the link.** Works today and is what PR Status first did; it adds a message per
  link and separates the card from the message it describes.
- **Legacy attachments instead of blocks.** Render under the text, but still go through `updateMessage` and lose UiKit
  interactivity.

## Open questions

- **Name.** `attachedBlocks` vs. an unfurl-style name; the content is not always about a URL.
- **Author control.** Should the author (or a moderator) be able to dismiss an app's blocks, as with link previews?
- **Uninstalled apps.** Remove an app's `attachedBlocks` on uninstall, or have the renderer skip apps that are not
  installed.
- **Encrypted rooms.** Apps cannot read end-to-end encrypted messages; whether they may attach blocks to them at all.
- **Limits.** Maximum blocks per app per message, and maximum apps per message.

## Order of work

1. `attachedBlocks` on `IMessage` and the model methods.
2. Apps-Engine definition and server bridge, with API version bump.
3. Room and thread renderers, plus the UiKit feature notes in `docs/features/uikit/`.
4. Switch the PR Status app to `attachBlocks`.
