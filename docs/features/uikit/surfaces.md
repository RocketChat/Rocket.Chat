# Surfaces

A surface is a place in the client where a list of blocks is drawn. Each one has its own layout union and parser in `packages/ui-kit/src/surfaces/`, and its own renderer in `packages/fuselage-ui-kit/src/surfaces/`. Which blocks each surface accepts, and where the layers disagree, is in [support-matrix.md](support-matrix.md). View fields are in [reference.md](reference.md#views).

| Surface | Opened by | Mounted in | Renderer |
| --- | --- | --- | --- |
| **Message** | The app sends a message with `blocks` | [`UiKitMessageBlock`](../../../apps/meteor/client/components/message/uikit/UiKitMessageBlock.tsx), used by room, thread, moderation and contact-history messages | `messageParser` (`FuselageMessageSurfaceRenderer`); Livechat uses its own `MessageParser` |
| **Modal** | `modal.open` | [`UiKitModal`](../../../apps/meteor/client/views/modal/uikit/UiKitModal.tsx), which renders `ModalBlock` | `modalParser` (`ModalSurfaceRenderer`) |
| **Contextual bar** | `contextual_bar.open` | [`UiKitContextualBar`](../../../apps/meteor/client/views/room/contextualBar/uikit/UiKitContextualBar.tsx), shown on the room route `tab=app&context=<viewId>` | `contextualBarParser` (`ContextualBarSurfaceRenderer`) |
| **Banner** | `banner.open`; also cloud announcements | [`UiKitBanner`](../../../apps/meteor/client/views/banners/UiKitBanner.tsx) inside `BannerRegion` | `bannerParser` (`BannerSurfaceRenderer`), with `mrkdwn` overridden to inline markdown |
| **Attachment** | — | Nowhere | None. `UiKitParserAttachment` is declared but unused. |

## Notes per surface

- **Message**: blocks are static content plus `blockAction`. There is no view state, so elements in `input` blocks have nothing to submit to. Interactions carry `mid`, `rid` and, in threads, `tmid`. `video_conf` and `info_card` exist for core features (video conference, media calls) rather than for apps.
- **Modal**: displays `errors` from the app. `close` and `submit` are `ButtonElement`s; `showIcon` shows the app's icon in the header. There is no view stack: `modal.open` goes through `imperativeModal.open`, which replaces any open modal. The modal store already has a `push`, but UiKit does not use it.
- **Contextual bar**: like a modal docked to the room, with `rid` added to interactions. Like a modal, it stays open after `viewSubmit` when the app answers with `errors` or an update, and closes its room tab otherwise. It closes the tab right away on `viewClosed`. It is the only surface that renders `tab_navigation`.
- **Banner**: drawn in `BannerRegion` with Fuselage's `Banner`. `variant`, `icon`, `title` and `inline` are passed to it as props. Every `blockAction` from a banner closes it afterwards.

## Internal surfaces

The host also renders UiKit for features that are not apps, using app IDs that end in `-core` (for example `videoconf-core`, `media-call-core`, `cloud-announcements-core`). Their interactions go to core handlers in `apps/meteor/server/services/uikit-core-app/` instead of the apps-engine. Texts on those surfaces are translated with the default Rocket.Chat namespace (see [text-objects.md](text-objects.md#i18n)).
