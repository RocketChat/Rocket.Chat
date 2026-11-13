# Plan: Message attachments (from specs/message-attachments.md, 2026-11-12)

Status: approved.

The package half is copied from the frozen reference (`message-list-ref`): attachments and their
libraries from `e9f081a1aca`, exports from `c67e2992265`. The app half follows the reference's
consumer commits (`9b147962aea`, `45bc9690cbf`, `f4fdb69a149`, `8dbfb55101e`, `0e84a110315`,
`81cff7f233b`) adapted to the base, plus the media value from `78155034d47`. `develop` wins where
it differs from the reference: the quote's hover styling (`8e949dd8a55`), and the message
providers already mounted by the previous branch stay as they are.

Regressions in the reference that the plan does not copy:

- Its media value drops the title the desktop viewer receives for an encrypted PDF, and shares one
  blob and one request for all encrypted PDFs of the provider. The base kept both per attachment.
- It registers the service worker download once per click; the base once per mounted button. The
  per-click behaviour is the right one, so it lands first as a fix (R24) on the base's hook.

## Files that change

Package `packages/ui-message-list`:

- `package.json`, `yarn.lock`: `@rocket.chat/css-in-js`, added in the commit whose code imports it.
- `src/Message/content/Attachments.tsx`, `Attachments.stories.tsx`, `Attachments.spec.tsx`: new.
- `src/Message/content/attachments/**`: new, except the five download and size files that exist;
  `file/GenericFileAttachment.spec.tsx`, `file/AudioAttachment.spec.tsx`,
  `file/hooks/useReloadOnError.spec.ts`, `structure/AttachmentDownload.spec.tsx`,
  `structure/AttachmentRow.stories.tsx` and its spec arrive with them.
- `src/Message/lib/{getFileExtension,userAgentMIMETypeFallback,toPlainTextRoot}.ts` (+ spec): new.
- `src/Message/index.ts`, `src/index.spec.ts`: exports (R12).

App `apps/meteor`:

- `client/hooks/useDownloadFromServiceWorker.ts` (+ spec): registers per activation (R24).
- `client/providers/MessagesProvider/useOpenEncryptedPdf.ts` (+ spec): a blob and a request per file.
- `client/providers/MessagesProvider/useMessageMediaValue.ts`, `MessagesProvider.tsx`,
  `MessagesProvider.spec.tsx`: the media value (R14 to R20).
- `client/components/message/variants/{room,thread,system}/*MessageContent.tsx`,
  `views/admin/moderation/helpers/ContextMessage.tsx`,
  `views/omnichannel/contactHistory/MessageList/ContactHistoryMessage.tsx`, and the specs that mock
  the old `Attachments`: render `MessageAttachments` (R21, R22).
- `views/room/modals/{ForwardMessageModal,PinMessageModal}`, `composer/messageBox/MessageBoxReply.tsx`
  and their specs: `MessageQuoteAttachment` (R22).
- `views/room/ShareLocation/ShareLocationModal.tsx`: `MessageMapView` (R23).
  `providers/MediaPlayerProvider/MediaPlayerProvider.tsx`: `useMediaReloadOnError` (R25).
- Deleted: `components/message/content/{Attachments.tsx,Action.tsx,attachments,collapsible,location}`,
  `components/message/{MessageCollapsible.tsx}`,
  `components/message/hooks/{useCollapse,useIsCollapsibleToggled}.ts(+spec)`, and
  `lib/utils/userAgentMIMETypeFallback.ts` if nothing else reads it.
- `.changeset/*.md`: the fix (R24).
- The spec, `message-capabilities` Design notes and this plan: last.

## Order of work

Each step is one commit and builds and passes on its own.

1. Fix (R24): `useDownloadFromServiceWorker` asks the service worker under a new id on each
   activation and registers the result for that id. Spec first, failing on the base. Changeset
   `patch`.
2. Enabling refactor (R18): `useOpenEncryptedPdf` keeps its blob and its request per file and
   releases them all on unmount. Nothing visible: each attachment opened one file.
3. Package, attachments (R1 to R13): copy from the reference, with `develop`'s quote styling; add
   the libraries, `css-in-js`, the specs listed above (the base's generic file specs, ported to the
   media context, and its `useReloadOnError` spec), the exports and `index.spec.ts`.
4. App, media value (R14 to R20): `useMessageMediaValue` and its mount, proven through
   `MessagesProvider`. The viewer's `open` receives the title as the base passed it.
5. App, consumers of `Attachments` (R21, R22): variants, moderation, contact history render
   `MessageAttachments`; the specs mock nothing of the package.
6. App, quote consumers (R22): the forward and pin modals and the composer.
7. App, `MessageMapView` and `useMediaReloadOnError` (R23, R25).
8. App, delete the copies. Done when no file in the app imports a deleted part (typecheck and a search).
9. Docs: spec Design, `code`, `tests`, status; `message-capabilities` notes; plan `done`.

## Risks

- Every tick of the shared player changes the media value, which re-renders the attachments that read
  it (R20); they are small. If it shows in a profile, the player moves to its own context.
- A blob of an opened encrypted PDF now lives until the provider unmounts, not until its message does.
- Places that mount no `MessagesProvider` would show the default media (no player, no downloads): R22
  and R23 list them, and the previous branch mounted the provider at each.
- Look and behaviour of attachments in a room cannot be proven in jsdom: manual check.

## Proof

| Requirement | Proven by |
| ----------- | --------- |
| R1 | `src/Message/content/Attachments.spec.tsx`, "renders each kind of attachment (R1)" |
| R2 | `src/Message/content/Attachments.spec.tsx`, "loads an image at once or on demand by preference (R2)" |
| R3 | `src/Message/content/Attachments.spec.tsx`, "collapses, expands and remembers the state (R3)" |
| R4 | `src/Message/content/Attachments.spec.tsx`, "shows a description as markdown or as text (R4)" |
| R5 | `src/Message/content/attachments/file/GenericFileAttachment.spec.tsx`, "shows the title, size and extension (R5)" |
| R6 | `src/Message/content/Attachments.spec.tsx`, "renders a quoted message with its author and nested attachments (R6)" |
| R7 | `src/Message/content/Attachments.spec.tsx`, the action button tests (R7) |
| R8 | `src/Message/content/attachments/file/AudioAttachment.spec.tsx`, the player tests (R8) |
| R9 | `src/Message/content/attachments/file/hooks/useReloadOnError.spec.ts`, every test (R9) |
| R10 | `GenericFileAttachment.spec.tsx`, "downloads an encrypted file through the media context (R10)"; `structure/AttachmentDownload.spec.tsx`, the encrypted download tests (R10) |
| R11 | `GenericFileAttachment.spec.tsx`, the viewer tests (R11), and the "without the desktop viewer" tests |
| R12 | `src/index.spec.ts`, "exports the attachments (R12)" |
| R13 | the `stories` axe tests of the attachments specs (R13) |
| R14 | `apps/meteor/client/providers/MessagesProvider/MessagesProvider.spec.tsx`, "media: the shared player (R14)" |
| R15 | same file, "media: downloads an encrypted file through the service worker every time (R15)" |
| R16 | same file, "media: allows encrypted downloads only under a service worker (R16)" |
| R17 | same file, "media: the desktop viewer (R17)" |
| R18 | same file, "media: opens an encrypted PDF (R18)"; `useOpenEncryptedPdf.spec.ts`, the per-file tests (R18) |
| R19 | same file, "media: formats file sizes like the app (R19)" |
| R20 | same file, "media: the player's changes reach the attachments (R20)" |
| R21 | `apps/meteor/client/components/message/variants/RoomMessage.contexts.spec.tsx`, "shows attachments with the package parts (R21)" |
| R22 | `AuditMessageList.display.spec.tsx`, `PinMessageModal.display.spec.tsx`, `MessageBoxReply.spec.tsx`, each "(R22)" |
| R23 | `apps/meteor/client/views/room/ShareLocation/ShareLocationModal.spec.tsx`, "previews the location with the map (R23)" |
| R24 | `apps/meteor/client/hooks/useDownloadFromServiceWorker.spec.tsx`, "downloads again on a second activation (message-attachments R24)" |
| R25 | `apps/meteor/client/providers/MediaPlayerProvider/MediaPlayerProvider.spec.tsx`, "recovers an expired URL on the shared element (R25)" |
