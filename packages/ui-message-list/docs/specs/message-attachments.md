---
status: implemented
adrs: []
code:
  [
    src/Message/content/Attachments.tsx,
    src/Message/content/attachments,
    src/Message/lib/getFileExtension.ts,
    src/Message/lib/toPlainTextRoot.ts,
    src/Message/lib/userAgentMIMETypeFallback.ts,
    src/Message/index.ts,
    apps/meteor/client/providers/MessagesProvider/useMessageMediaValue.ts,
    apps/meteor/client/providers/MessagesProvider/useOpenEncryptedPdf.ts,
    apps/meteor/client/providers/MessagesProvider/MessagesProvider.tsx,
    apps/meteor/client/providers/MessagesProvider/useMessageRelatedDataValue.ts,
    apps/meteor/client/providers/MediaPlayerProvider/MediaPlayerProvider.tsx,
    apps/meteor/client/hooks/useDownloadFromServiceWorker.ts,
    apps/meteor/client/views/admin/moderation/helpers/ContextMessage.tsx,
    apps/meteor/client/views/omnichannel/contactHistory/MessageList/ContactHistoryMessage.tsx,
    apps/meteor/client/views/room/modals/ForwardMessageModal/ForwardMessageModal.tsx,
    apps/meteor/client/views/room/modals/PinMessageModal/PinMessageModal.tsx,
    apps/meteor/client/views/room/composer/messageBox/MessageBoxReply.tsx,
    apps/meteor/client/views/room/ShareLocation/ShareLocationModal.tsx,
  ]
tests:
  [
    src/Message/content/Attachments.spec.tsx,
    src/Message/content/attachments/default/hooks/usePerformActionMutation.spec.tsx,
    src/Message/content/attachments/file/GenericFileAttachment.spec.tsx,
    src/Message/content/attachments/file/hooks/useReloadOnError.spec.ts,
    src/Message/content/attachments/structure/AttachmentRow.spec.tsx,
    src/index.spec.ts,
    apps/meteor/client/providers/MessagesProvider/MessagesProvider.spec.tsx,
    apps/meteor/client/providers/MessagesProvider/useOpenEncryptedPdf.spec.ts,
    apps/meteor/client/providers/MessagesProvider/useMessageRelatedDataValue.spec.ts,
    apps/meteor/client/providers/MediaPlayerProvider/MediaPlayerProvider.spec.tsx,
    apps/meteor/client/hooks/useDownloadFromServiceWorker.spec.tsx,
    apps/meteor/client/providers/MessagesProvider/MessageVariants.contexts.spec.tsx,
    apps/meteor/client/views/audit/components/AuditMessageList.display.spec.tsx,
    apps/meteor/client/views/admin/moderation/helpers/ContextMessage.spec.tsx,
    apps/meteor/client/views/omnichannel/contactHistory/MessageList/ContactHistoryMessage.spec.tsx,
    apps/meteor/client/views/room/modals/PinMessageModal/PinMessageModal.spec.tsx,
    apps/meteor/client/views/room/modals/ForwardMessageModal/ForwardMessageModal.spec.tsx,
    apps/meteor/client/views/room/composer/messageBox/MessageBoxReply.spec.tsx,
    apps/meteor/client/views/room/ShareLocation/ShareLocationModal.spec.tsx,
  ]
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
  loading the image and loads it when activated. The image MUST be what the app's image gallery
  opens from: it carries the class `gallery-item`, the id of the file as `data-id` and the URL of
  the full image as `data-src`.
- **R3** An attachment with a collapsible body MUST start collapsed or expanded as the attachment
  or the viewer's preference asks, MUST toggle from its button, and, when the message is known, MUST
  keep that state across mounts (scrolling it out of view and back), with a quote's nested
  attachments keyed apart from the quote's own.
- **R4** A file attachment's description MUST be shown as markdown when it carries parsed
  markdown, and as the source text otherwise. The markdown renderer MUST be given the parsed
  markdown alone, never the source text of a description or a quote: a block it does not know shows
  nothing, and an auto-translated description or quote is drawn from its translation, not cut from
  the original text.
- **R5** A generic file MUST show its title as a link, its size formatted by the media
  context's `formatFileSize`, and its extension as the icon. An image, a video and an audio file
  MUST show their size, formatted the same way, in parentheses beside their title.
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

- **R14** `MessagesProvider` MUST give the media context the app's shared audio player, as a store its
  readers subscribe to, so that audio that started in one room keeps its state in another list, and a message in a place that
  mounts a new provider reads the same player.
- **R15** `downloadEncrypted` MUST ask the service worker to fetch and decrypt the file, and MUST
  save the result under the title, or the translation of `Download` without one, every time it is
  called, also when the same file is downloaded again.
- **R16** `canDownloadEncrypted` MUST be true only while a service worker controls the page, read
  each time a download button renders, so a service worker that takes control later enables the
  buttons that render after it.
- **R17** `documentViewer` MUST be absent without the desktop app; with it, `supportedFormats` MUST
  be what the desktop app reports and `open` MUST call its `openDocumentViewer` with the url, the
  format and the title (empty without one). `openEncryptedPdf` MUST decide between the viewer and a
  download from this value alone: without a viewer it downloads the file.
- **R18** `openEncryptedPdf` MUST open a PDF within the desktop app's preview size limit (10 MB
  without one) in the viewer from a blob of the decrypted file, titled by the attachment, and MUST
  download a larger one or one of unknown size instead. Each download MUST be asked for and saved
  under its own id, so two downloads that are pending together are each saved once, under their
  own titles. Opening a second file MUST NOT revoke the first file's blob; opening the same file
  again MUST replace its blob. Only the blobs of the five most recently opened files MUST be kept;
  opening a sixth releases the one opened longest ago.
- **R19** `formatFileSize` MUST format as the app does elsewhere (`kB`, `MB`).
- **R20** A change of the shared player (playing, position) MUST reach every audio attachment
  under the provider, and MUST NOT render any other attachment again: the media context's value
  does not change with the player's progress.

**Places**

- **R21** The room's, a thread's and a system message MUST show their attachments with the package's
  parts and look and behave as before; the action buttons of a default attachment act through the
  chat of the conversation, and do nothing where no chat is open.
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

The package owns the attachment parts (`src/Message/content/attachments`), one component per kind and a
structure folder of the shared pieces (author, title, size, download, image box). They read the
viewer's attachment preferences from `ui-contexts`, what the app does from the interactions and
navigation contexts, and the shared player, downloads and viewers from the media context. The media
context's default keeps them working in stories and jsdom.

The app owns the media value (`useMessageMediaValue`), built from the shared audio player, the
service worker download module, the encrypted PDF opener and the desktop bridge, and mounted by
`MessagesProvider` beside the other contexts. The player reaches the context as a store that only
audio attachments subscribe to (`useMessageMediaPlayer`), so the value does not change with the
player's progress and the other attachments do not render again. Each activation of a download asks
the service worker under its own id; the opener keeps one blob and one request per file, the blobs of
the five most recently opened files only, and asks for its downloads under their own ids.
`documentViewer` is the one source for whether the desktop viewer is there: its `open` takes the url,
the format and the title, and without it an encrypted PDF is downloaded. `canDownloadEncrypted` is
read when a button renders. The collapse state of a message part is kept in the opened room's store
by the related-data value (R3).

Known departure for a later branch: the package's `useReloadOnError` calls `fetch` on the media URL
directly, where AGENTS.md asks for a context capability. The forward and pin modals render under the
modal region, outside `MediaPlayerProvider`, so audio in their quotes cannot play, as before.

The app's variants, moderation, contact history, the modals and the composer render the package's
parts, and the app keeps no copy: `MessageCollapsible`, `CollapsibleContent`, `Action`, the collapse
hooks, the attachment components and the location map are deleted. The shared audio element keeps
living above the room in `MediaPlayerProvider`, which recovers expired URLs with the package's hook.

## Out of scope

- The toolbar value, the variant shells and the list engine: later capabilities.
- Rendering of file attachments in the room's files list: it does not use attachments.
- Changing what the media context's default offers (`message-capabilities` R5).

## Known defects

None.

## Open questions

- **Q1** Whether the encrypted PDF opener keeps one blob and one request per file once the opener
  is shared by the whole provider, as it was per attachment. Assumed: yes (R18).
- **Q2** Whether a second download of the same encrypted file is a change to announce. Assumed: yes
  (R24).
- **Q3** Whether the quoted message keeps the app's current hover styling. Assumed: yes.
- ~~**Q4** Whether every audio tick re-rendering the attachments that read the media context is
  acceptable (R20). Assumed: yes; they are small.~~ Answered: no. R20 requires that only the audio
  attachments render again with the player's progress.

## References

- [Intent](../intents/message-attachments.md)
- [message-capabilities](message-capabilities.md): R5, R23, R38
- WCAG 2.1 AA, for R13
