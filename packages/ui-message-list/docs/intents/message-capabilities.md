# Intent: Message capabilities and non-attachment message content

Author: message list replacement stack (branch 03). Status: accepted.

## Problem

The message components live in `apps/meteor/client/components/message` and read everything
they need from the app directly: settings, preferences, the router, the chat and its
composer, modals, REST calls and stores. They cannot be reused by anything but the app,
cannot be rendered in a story or a jsdom test without booting most of the client, and their
behaviour (markdown, reactions, URL previews, locations, action links, thread, discussion
and broadcast metrics) can only be checked by running Rocket.Chat. `ui-message-list` is the
package that is meant to render every conversation, but it has no way to receive what a
message needs from the app, and it renders no message content yet.

## Proposed outcome

- A component of `ui-message-list` that needs something from the app asks for it by
  intent (how messages look for the viewer, where a click goes, what the viewer does to a
  message, what a message shows about other things, how content is turned into what is
  displayed, which renderers draw markdown, UiKit and emoji, the media capabilities, the
  selection, the message being edited, the toolbar's actions) and works without any
  provider, so stories and package tests need none.
- The app supplies those capabilities from one provider, mounted in every place that shows
  messages, read-only places included. Read-only places show messages without their
  toolbar or thread metrics.
- The package renders the non-attachment content of a message: markdown body and its
  fallback, ignored content, reactions with their tooltip, URL previews, a shared location,
  action links, thread, discussion and broadcast metrics, and collapsible parts. Messages
  in the app look and behave as they do today, except in the read-only places and in the threads
  list, where messages now follow the viewer's display settings (decided by the user at review).
- The app's own message variants render those package parts, and the app no longer carries
  a copy of them.

## Affected users and systems

Everyone who reads messages in a room, a thread, the pinned, starred and mentions tabs,
search, audits, moderation, contact history, modals and the composer's quote. Package
consumers get a new public surface: the contexts and the content parts. A new spec,
`specs/message-capabilities.md`, covers it. Attachments, the toolbar value, the variants
and the list itself are later capabilities and are not touched.

## Constraints

- The package imports nothing from `apps/meteor`; it depends on `ui-client`, never the
  reverse.
- No behaviour of a rendered message changes, except in the read-only places (audit, moderation,
  contact history, the forward, pin and report modals, the composer's quote) and in the threads
  list's previews, where it now follows the viewer's display settings as the lists do. Where `develop` and the earlier
  implementation of this work disagree because `develop` changed, `develop` wins.
- The old message list and its variants stay until later branches replace them, so the old
  list's context must stay in agreement with the new display context.
- Attachments, the toolbar value, the variant shells and the list engine arrive in their
  own branches.

## Open questions

- **Q1** Whether the media context is provided by the app in this round, or stays at its
  default until attachments arrive. Assumed: it stays at its default; no content part in
  this round needs more than the default.
- **Q2** Whether the selection and editing contexts are provided by the app in this round.
  Assumed: selection is provided as an adapter over the room's store, editing is not, until
  the variants that read them arrive.
- **Q3** Where the generic download and size controls that the collapsible needs live while
  attachments are absent. Assumed: they ship with the collapsible and attachments adopt them.
- **Q4** Whether the thread list (the contextual bar listing threads) switches to the
  package's follow, unread badge and participants parts in this round or with the variants.
  Assumed: in this round, since the app's copies are deleted here.
