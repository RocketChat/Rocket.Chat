---
status: planned
adrs: []
code: []
tests: []
---

# Spec: Message attachments

## Summary

The package renders the attachments of a message (file, image, audio, video, generic file,
encrypted file, PDF, markdown file, quoted message with nested attachments, and default
attachments with fields and action buttons) through `MessageAttachments` and
`MessageQuoteAttachment`, asking the app for what it needs through the message contexts.
`apps/meteor` supplies the media context (the shared audio player, downloads of encrypted files
through the service worker, the encrypted PDF opener, the desktop document viewer, file sizes) from
`MessagesProvider`, and shows its attachments with the package's parts everywhere.

## Motivation

See [the intent](../intents/message-attachments.md). Attachments are the part of a message the
package cannot render yet, and the one that depends most on the app: audio, downloads, the
desktop viewer and signed URLs.

## Behaviour

**Rendering**

- **R1** `MessageAttachments` MUST render one item per attachment, by kind: file (image, audio,
  video or generic), quoted message, or default (pretext, author, title, text, fields, image,
  thumbnail, actions), and MUST render nothing for none.
- **R2** An image attachment MUST show its image at once when the viewer's attachment
  preferences load embedded media automatically, and otherwise MUST show a control that names
  loading the image and loads it when activated.
- **R3** An attachment with a collapsible body MUST start collapsed or expanded as the attachment
  or the viewer's preference asks, MUST toggle from its button, and, when the message is known, MUST
  keep that state across mounts (scrolling it out of view and back), with a quote's nested
  attachments keyed apart from the quote's own.
- **R4** A file attachment's description MUST be shown as markdown when it carries parsed
  markdown, and as the source text otherwise.
- **R5** A generic file MUST show its title as a link, its size formatted by the media
  context's `formatFileSize`, and its extension as the icon.
- **R6** A quoted message MUST show the author's name (as a link when it has one), the avatar
  only when the viewer displays avatars, the time, a link to the message, its nested
  attachments and its text.
- **R7** The action buttons of a default attachment MUST show only buttons with text or an image
  and a link or an in-chat message. A link button MUST call `openExternalLink`; a message button MUST
  call `sendMessage`, `replyWith` or `quoteMessageById` as its processing type says, disabled
  while it runs, with an error toast when it fails.

**Audio, video and signed URLs**

- **R8** An audio attachment MUST play through the media context's player: activating its play
  control MUST call `play` with a track whose id is the message id and the file url, whose url is
  resolved against the server, and which names the room, message and author; while it is the
  active track the control MUST toggle, seek and change the speed through the player instead.
- **R9** The URL of a video, or of the shared audio element, whose signed URL has expired MUST be
  recovered when playback errors or stalls: it asks the server for a fresh URL, keeps the playback
  position, resumes playback if it was playing, and does not ask again while the URL is still valid.
  `useMediaReloadOnError` MUST be exported for the app's shared audio element.

**Downloads and viewers**

- **R10** A title or download button of an encrypted file (its link contains `/file-decrypt/`)
  MUST NOT navigate; it MUST call `downloadEncrypted` with the link and the title, and the
  download button MUST be disabled when `canDownloadEncrypted` is false.
- **R11** With a desktop document viewer, a PDF's title MUST open it in the viewer with an inline
  URL instead of navigating, and an encrypted PDF MUST call `openEncryptedPdf` with the link, title,
  size and format; a markdown file MUST open the same way only when the viewer supports markdown and
  the file is not encrypted. Without a viewer, nothing but an encrypted file is intercepted. A
  failure MUST show an error toast named by `FileUpload_Error_Trying_To_Open_File`.
- **R12** The package MUST export `MessageAttachments`, `MessageQuoteAttachment`,
  `MessageMapView` and `useMediaReloadOnError`.
- **R13** Every story of the attachments MUST pass an axe check with no violations.

**The app's media value**

- **R14** `MessagesProvider` MUST give the media context the app's shared audio player, so that
  audio that started in one room keeps its state in another list, and a message in a place that
  mounts a new provider reads the same player.
- **R15** `downloadEncrypted` MUST ask the service worker to fetch and decrypt the file, and MUST
  save the result under the title, or the translation of `Download` without one, every time it is
  called, also when the same file is downloaded again.
- **R16** `canDownloadEncrypted` MUST be true only while a service worker controls the page.
- **R17** `documentViewer` MUST be absent without the desktop app; with it, `supportedFormats` MUST
  be what the desktop app reports and `open` MUST call its `openDocumentViewer` with the url and the
  format.
- **R18** `openEncryptedPdf` MUST open a PDF within the desktop app's preview size limit (10 MB
  without one) in the viewer from a blob of the decrypted file, titled by the attachment, and MUST
  download a larger one or one of unknown size instead. Opening a second file MUST NOT revoke the
  first file's blob; opening the same file again MUST replace its blob.
- **R19** `formatFileSize` MUST format as the app does elsewhere (`kB`, `MB`).
- **R20** A change of the shared player (playing, position) MUST reach every attachment under the
  provider.

**Places**

- **R21** The room's, a thread's and a system message MUST show their attachments with the package's
  parts and look and behave as before; where the place does not allow interaction, the action buttons
  of a default attachment act only when a chat is open, as before.
- **R22** The forward and pin modals and the composer's quote MUST show a quoted message with the
  package's quote, and the audit, moderation's reported messages and contact history MUST show
  attachments with no toolbar, applying the viewer's attachment preferences as `message-capabilities`
  R38 says.
- **R23** The share-location modal MUST preview the location with the package's map.
- **R24** Activating the download button of an encrypted attachment, or of an encrypted file in
  the room's files list, a second time MUST download the file a second time. Before, only the first
  activation of a mounted button downloaded it.
- **R25** The signed-URL recovery of the shared audio element, and of the sidebar's player card that
  drives it, MUST behave as before the move.

## Design

Decided in the plan.

## Out of scope

- The toolbar value, the variant shells and the list engine: later capabilities.
- Rendering of file attachments in the room's files list: it does not use attachments.
- Changing what the media context's default offers (`message-capabilities` R5).

## Known defects

None; not implemented.

## Open questions

- **Q1** Whether the encrypted PDF opener keeps one blob and one request per file once the opener
  is shared by the whole provider, as it was per attachment. Assumed: yes (R18).
- **Q2** Whether a second download of the same encrypted file is a change to announce. Assumed: yes
  (R24).
- **Q3** Whether the quoted message keeps the app's current hover styling. Assumed: yes.
- **Q4** Whether every audio tick re-rendering the attachments that read the media context is
  acceptable (R20). Assumed: yes; they are small.

## References

- [Intent](../intents/message-attachments.md)
- [message-capabilities](message-capabilities.md): R5, R23, R38
- WCAG 2.1 AA, for R13
