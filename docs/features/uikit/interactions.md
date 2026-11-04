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
| `blockSuggestion` | The user types in an `external_select` or `multi_external_select`. `value` is the query. Needs the options back in the response; see below. | `executeBlockSuggestionHandler` (optional; defaults to no options) |
| `viewSubmit` | The modal or contextual bar submit button is pressed. Carries the whole view plus `state`. | `executeViewSubmitHandler` |
| `viewClosed` | A modal, contextual bar or banner is closed. `isCleared` is `true` for the close (X) button, `false` for cancel. | `executeViewClosedHandler` (optional; defaults to success) |
| `actionButton` | An app action button is clicked: message box, message menu, room toolbar or user dropdown. Not tied to blocks. | `executeActionButtonHandler` |

### When an element sends `blockAction`

Decided in [`useUiKitState`](../../../packages/fuselage-ui-kit/src/hooks/useUiKitState.ts):

- **Elements in `actions` or as a `section` accessory** send on every change and show a loading state.
- **Elements inside an `input` block** only update local state; their values travel with `viewSubmit`. Two exceptions:
  - `dispatchActionConfig: ['on_item_selected']` makes the element send on selection.
  - `dispatchActionConfig: ['on_character_entered']` on `plain_text_input` sends on typing, without a loading state so the field keeps focus. Modal and contextual bar debounce it by 700 ms; message and banner do not.

### Options for external selects

`external_select` and `multi_external_select` ask the app for their options while the user types. The client waits 300 ms after the last keystroke, then sends `blockSuggestion` only once the query has at least `min_query_length` characters (3 by default). The request carries `actionId`, `blockId`, `appId`, `value` (the query) and a `container` (`view` with `viewId`, or `message` with `mid` and `rid`).

Unlike the other interactions, the response is not a `ServerInteraction`: it is `{ options?: Option[], option_groups?: OptionGroup[] }`, and the client does not pass it to `handleServerInteraction`. In apps-engine, build it with `UIKitBlockSuggestionInteractionContext.getInteractionResponder().optionsResponse(...)`. Option groups are shown as a flat list. The client gives up after 3 seconds and shows no options. A suggestion request has no `triggerId` lifecycle and shows no busy state. Only modals, contextual bars and messages can ask; a banner or a surface without a `suggest` function shows no options.

Once the user picks an option, the element behaves like any other select: its value is the option's `value`, sent as `blockAction` or with `viewSubmit` as usual.

### View state

`state` in `viewSubmit` and `viewClosed` is `{ [blockId]: { [actionId]: value } }`. It starts from the initial values in the layout, and every element change updates it. Only elements with a `blockId` are included, so an input block without `blockId` never reaches the app.

## Server interactions

The app returns one of these from its handler, usually built with `UIKitInteractionResponder` in apps-engine. The server passes the result through unchanged.

| `type` | Client effect |
| --- | --- |
| `modal.open` | Opens a modal. |
| `modal.update` | Replaces the open modal's view (matched by `view.id`). |
| `modal.close` | Closes the modal named by `view.id` (what apps-engine sends) or `viewId` (what core apps send). With neither, nothing happens. |
| `banner.open` | Opens a banner. The view fields are spread at the top level of the payload instead of under `view`. |
| `banner.update` / `banner.close` | Replaces or disposes the banner (matched by `viewId`). |
| `contextual_bar.open` | Stores the view and navigates the room to `tab=app&context=<view.id>`. |
| `contextual_bar.update` / `contextual_bar.close` | Replaces or disposes the contextual bar. |
| `errors` | Marks fields as invalid. `errors` maps `actionId` to a message. **Only modals display them**; the contextual bar and banner contexts do not pass errors down to their elements. |

After a `viewSubmit`, the view is disposed unless the response is `errors`, `modal.update` or `contextual_bar.update`. After a `viewClosed`, it is disposed unless the response is `errors`.

## Trigger IDs

Each `emitInteraction` creates a `triggerId` that the client remembers for 5 seconds. `handleServerInteraction` ignores any interaction whose `triggerId` the client did not issue or that has expired. If the request itself takes longer than 5 seconds, the client shows a timeout toast and disposes the view.

## Views pushed by the app

Apps can also open or update views outside an HTTP response, through `UIController` (`openSurfaceView`, `updateSurfaceView`, `setViewError`). The host broadcasts `notify.uiInteraction`, which reaches the user's clients on the `notify-user` stream as `<uid>/uiInteraction`. [`useAppUiKitInteraction`](../../../apps/meteor/client/hooks/useAppUiKitInteraction.ts) hands the interaction to `handleServerInteraction`.

The same trigger ID check applies. A pushed view is shown only when it carries a `triggerId` the client issued in the last 5 seconds, so in practice apps push views in reaction to a recent interaction and cannot open one unprompted.

## Livechat

The Livechat widget sends `blockAction` for message blocks to the same endpoint, authenticated with the `x-visitor-token` header. On the server this becomes the `IUIKitLivechatInteractionHandler` event. The widget ignores the response, so apps cannot open modals or show errors there.

## Validation

Neither the endpoint nor the push path validates payloads. User interactions, app responses and app-pushed views reach the other side as sent; the endpoint ends with a `TODO: validate payloads per type`. `@rocket.chat/ui-kit` exports typia guards for every view and interaction (`isModalView`, `isServerInteraction`, ...), but no host code calls them.
