# Interactions

How a user action on a UiKit surface reaches the app, and how the app's answer changes the UI. Payload types are `UserInteraction` (client → app) and `ServerInteraction` (app → client) in [`packages/ui-kit/src/interactions/`](../../../packages/ui-kit/src/interactions).

## Round trip

```
element (useUiKitState)
  → surface UiKitContext.action          apps/meteor/client/uikit/hooks/use*ContextValue.ts
  → ActionManager.emitInteraction         apps/meteor/client/lib/ActionManager.ts
  → POST /api/apps/ui.interaction/:appId  apps/meteor/ee/server/api/apps/uikit.ts
  → app handler (apps-engine)             executeBlockActionHandler / executeViewSubmitHandler / ...
  ← ServerInteraction in the HTTP response
  → ActionManager.handleServerInteraction opens, updates or closes a view, or shows errors
```

## User interactions

| `type` | Sent when | App handler |
| --- | --- | --- |
| `blockAction` | An interactive element fires (see below). `container` says whether it came from a `message` (`mid`, `rid`) or a `view` (`viewId`). | `executeBlockActionHandler` |
| `viewSubmit` | The modal or contextual bar submit button is pressed. Carries the whole view plus `state`. | `executeViewSubmitHandler` |
| `viewClosed` | A modal, contextual bar or banner is closed. `isCleared` is `true` for the close (X) button, `false` for cancel. | `executeViewClosedHandler` (optional; defaults to success) |
| `actionButton` | An app action button is clicked: message box, message menu, room toolbar or user dropdown. Not tied to blocks. | `executeActionButtonHandler` |

### When an element sends `blockAction`

Decided in [`useUiKitState`](../../../packages/fuselage-ui-kit/src/hooks/useUiKitState.ts):

- **Elements in `actions` or as a `section` accessory** send on every change and show a loading state.
- **Elements inside an `input` block** only update local state; their values travel with `viewSubmit`. Two exceptions:
  - `dispatchActionConfig: ['on_item_selected']` makes the element send on selection.
  - `dispatchActionConfig: ['on_character_entered']` on `plain_text_input` sends on typing, without a loading state so the field keeps focus. Modal and contextual bar debounce it by 700 ms; message and banner do not.

### View state

`state` in `viewSubmit` and `viewClosed` is `{ [blockId]: { [actionId]: value } }`. It starts from the initial values in the layout, and every element change updates it. Only elements with a `blockId` are included, so an input block without `blockId` never reaches the app.

### Files in views

A `file_input` uploads each file when the user picks it, through `rooms.media/:rid`, as a temporary file of the room the view was opened from (the open room for a modal, the room of the contextual bar). The element keeps the file IDs in the view state, and the surface keeps the submit disabled while an upload is in flight.

On `viewSubmit` the server confirms the files named by the `file_input` values of the view state that belong to the submitting user (`Uploads.confirmTemporaryFile`), so they stop expiring. Ids of files owned by someone else are ignored, and no more ids than the element's `max_files` are read. The app then reads each file with `IUploadRead.getById` / `getBufferById`; the apps-engine needs no change. Files of a view that is never submitted stay temporary and are removed by the temporary-uploads cron. Core apps (`UiKitCoreApp`) do not confirm files.

## Server interactions

The app returns one of these from its handler, usually built with `UIKitInteractionResponder` in apps-engine. The server passes the result through unchanged.

| `type` | Client effect |
| --- | --- |
| `modal.open` | Opens a modal, closing the app's other open modals. |
| `modal.push` | Opens a modal on top of the app's open ones. An app keeps at most 3 stacked; beyond that the top one is replaced. |
| `modal.clear` | Closes every modal of the app. |
| `modal.update` | Replaces the open modal's view (matched by `view.id`). |
| `modal.close` | Closes the modal named by `view.id` (what apps-engine sends) or `viewId` (what core apps send). With neither, nothing happens. |
| `banner.open` | Opens a banner. The view fields are spread at the top level of the payload instead of under `view`. |
| `banner.update` / `banner.close` | Replaces or disposes the banner (matched by `viewId`). |
| `contextual_bar.open` | Stores the view and navigates the room to `tab=app&context=<view.id>`. |
| `contextual_bar.update` / `contextual_bar.close` | Replaces or disposes the contextual bar. |
| `errors` | Marks fields as invalid. `errors` maps `actionId` to a message. **Only modals display them**; the contextual bar and banner contexts do not pass errors down to their elements. |

After a `viewSubmit`, the view is disposed unless the response is `errors`, `modal.update`, `modal.push` or `contextual_bar.update`. After a `viewClosed`, it is disposed unless the response is `errors`.

## View lifecycle

Apps drive multi-step forms by answering a `viewSubmit` with `modal.push` (the next step on top, the previous one stays under it) or `modal.update`, and by finishing with `modal.clear` or `modal.close`. Closing or cancelling a pushed view returns the user to the one below.

`UIKitInteractionResponder` has `pushModalViewResponse(view)`, `clearModalViewsResponse()` and `closeModalViewResponse(viewId?)`; `UIController` has `pushModalView`, `closeModalView` and `clearModalViews` for the same effects outside a response.

Per view, set by the app:

- `private_metadata`, `callback_id` and `external_id` ride on the view. The server keeps the app's copy of each view (`UiKitViews`), and `viewSubmit` and `viewClosed` hand the app that copy with only the `state` taken from the client, so `private_metadata` always comes back as the app set it. A value the client adds is dropped.
- `external_id` lets `updateSurfaceView` (or a `modal.update` response) address a view without its `id`: the server finds the user's view with that `external_id` and rewrites the update to its `id`. An update naming an unknown `external_id` is dropped.
- `hash` is a random string the server sets on every save and returns in the view. An update that carries a `hash` different from the saved one is stale and is dropped, so a slow handler cannot overwrite a newer view. Updates without a `hash` always apply.
- `submit_disabled` disables the submit button.
- `notifyOnClose` (default `true` when absent) decides whether closing the view sends `viewClosed`. `clearOnClose` makes closing a modal close all of the app's modals. The contextual bar honors `notifyOnClose` only.

`viewClosed` carries the `triggerId` of the close, so the app may answer with `modal.open` or `modal.push`.

## Trigger IDs

Each `emitInteraction` creates a `triggerId` that the client remembers for 5 seconds. `handleServerInteraction` ignores any interaction whose `triggerId` the client did not issue or that has expired. If the request itself takes longer than 5 seconds, the client shows a timeout toast and disposes the view.

## Views pushed by the app

Apps can also open or update views outside an HTTP response, through `UIController` (`openSurfaceView`, `updateSurfaceView`, `setViewError`). The host broadcasts `notify.uiInteraction`, which reaches the user's clients on the `notify-user` stream as `<uid>/uiInteraction`. [`useAppUiKitInteraction`](../../../apps/meteor/client/hooks/useAppUiKitInteraction.ts) hands the interaction to `handleServerInteraction`.

The same trigger ID check applies. A pushed view is shown only when it carries a `triggerId` the client issued in the last 5 seconds, so in practice apps push views in reaction to a recent interaction and cannot open one unprompted.

## Livechat

The Livechat widget sends `blockAction` for message blocks to the same endpoint, authenticated with the `x-visitor-token` header. On the server this becomes the `IUIKitLivechatInteractionHandler` event. The widget ignores the response, so apps cannot open modals or show errors there.

## Validation

Payloads are not validated per type: user interactions and app responses reach the other side as sent. Only the blocks apps send are checked, by `validateLayoutBlocks` in `@rocket.chat/ui-kit` (a typia validator for `LayoutBlock[]` plus the [size limits](reference.md#size-limits)). The server runs it in `reportInvalidBlocks` for `sendMessage`, `updateMessage`, the `ui.interaction` endpoint response and views pushed through the `uiInteraction` bridge.

What happens to invalid blocks depends on the admin setting `UiKit_Reject_Invalid_Blocks` (Apps section, default off):

| Path | Off | On |
| --- | --- | --- |
| Message sent or updated | Logged as a warning (`UiKit`), message saved | `error-invalid-blocks` is thrown with the first three errors; the message is not saved |
| `ui.interaction` response with a view | Logged, view sent to the client | Logged; the response is replaced with `{}`, so the user sees nothing new |
| View pushed by the app | Logged, view broadcast | Logged; the view is not recorded or broadcast |

Rendering never checks the limits. Blocks that exceed them still render when the setting is off.
