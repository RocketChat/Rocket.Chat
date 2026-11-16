# Intent: Message attachments

Author: message list replacement stack (branch 04). Status: accepted.

## Problem

Files, images, audio, video, quoted messages and the attachments that carry fields or action
buttons are drawn by `apps/meteor/client/components/message/content/attachments`. Those parts
read the app directly: the shared audio player, the service worker that decrypts files, the
desktop app's document viewer, the chat, the router and the viewer's attachment preferences. They
cannot be rendered in a story or a jsdom test without booting most of the client, and their
behaviour (an encrypted file that must download decrypted, audio that keeps playing when the room
changes, an expired signed URL that must recover, a collapsed image that stays collapsed after it
scrolls away) can only be checked by running Rocket.Chat. `ui-message-list` renders the rest of a
message already, but no attachment.

## Proposed outcome

- The package renders every kind of attachment a message can carry: file, image, audio, video,
  generic file, encrypted file, PDF, markdown file, quoted message with nested attachments, and
  the default attachment with its fields and action buttons. It asks the app for what it needs
  through the contexts it already has, and works with no provider, so stories and package tests
  need none.
- The app supplies the media capabilities (the shared audio player, downloads of encrypted files
  through the service worker, the encrypted PDF opener, the desktop document viewer, file sizes)
  from the provider it already mounts wherever messages show.
- Everywhere the app shows an attachment (room, thread and system messages, the forward, pin and
  report modals, the composer's quote, contact history, moderation, the share-location preview)
  it shows the package's, and the app keeps no copy. Attachments look and behave as they do
  today, and the read-only places show them with no toolbar.

## Affected users and systems

Everyone who reads messages with attachments, in rooms, threads, modals, the composer's quote,
omnichannel contact history and moderation; users of the desktop app (document viewer); users of
end-to-end encrypted rooms (downloads); anyone listening to audio while switching rooms. A new
spec, `specs/message-attachments.md`, covers it; `specs/message-capabilities.md` loses the notes
that said attachments were to come. The toolbar value, the variants and the list engine are later
capabilities.

## Constraints

- The package imports nothing from `apps/meteor`.
- No behaviour of an attachment changes, except where a requirement of the spec names it. Where
  `develop` and the earlier implementation of this work disagree because `develop` changed,
  `develop` wins.
- The read-only places keep following the viewer's display and attachment preferences (decided in
  `message-capabilities` R36 to R38); no place gets a second provider.
- The shared audio player stays owned by the app above the room, so it outlives any message.

## Open questions

- **Q1** Whether the encrypted PDF opener keeps one blob and one request per file once the
  opener is shared by the whole provider, as it was per attachment. Assumed: yes, per file.
- **Q2** Whether a second download of the same encrypted file from the same button is a change
  to announce. Assumed: yes, as a fix, since the app's button only downloaded once.
- **Q3** Whether the quoted message keeps the app's hover styling. Assumed: yes, `develop`'s.
