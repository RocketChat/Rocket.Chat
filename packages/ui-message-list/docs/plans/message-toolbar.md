# Plan: Message toolbar (from specs/message-toolbar.md, 2026-11-12)

Status: approved.

The package half is copied from the frozen reference (`message-list-ref`): the toolbar from `badbfb52108`. The app
half follows `78155034d47` (`useMessageToolbarValue`) and the reference's consumer commits, adapted to the base.
`develop` wins where it differs: the guard of `useNewDiscussionMessageAction` (#43539) stays, the emoji picker comes
from `@rocket.chat/ui-emoji-picker` (#43308), `useTranslation` comes from react-i18next (#43627), and `--emoji-size`
sizes the quick reactions (#43234).

Regressions in the reference that the plan does not copy:

- A quick reaction counted toward nothing, so it no longer ranked among the frequent emoji that choose the quick
  reactions. The base counted it toward the frequent emoji and the recent list; the user decided that it keeps the first
  and drops the second (R21). The toolbar context gets `useCountQuickReaction` for it, and `@rocket.chat/ui-emoji-picker`
  gets `addFrequentEmoji`, which the picker provider already did inside `addRecentEmoji`.
- "Reply in thread" went through `openThread`, which keeps the URL's search parameters; the base's toolbar dropped
  them, so a `?msg=` jump would follow the viewer into the thread. A navigation capability of its own, `replyInThread`,
  keeps the base's navigation (R23).
- A hold on the toolbar was taken before the picker opened and never released when it could not open (R23).
- The menu's layout filter also hid the actions of apps; the base's did not (R13).
- The quick reactions were sized with `font-size`, which the emoji sizes of `develop` override; the base used
  `--emoji-size` (R9). Quick reactions that the app cannot render showed an empty button; the base showed none (R21).
- The read receipts entry read the old list context; it takes its settings as a parameter (R19).
- Its toolbar value depended on the display value as a whole; it depends on the two settings, the quick reactions and
  whether a chat is open, and nothing else (R22).
- The reaction items showed where no chat is open; the base hid them there, and its spec asserts it. The toolbar
  context's `useQuickReactions` can say that a place offers no reactions, and the app says so without a chat (R6, R21).

Departures:

- The package's specs and stories build the room and the subscription inline: the reference's fixtures of `mock-providers` are shared infrastructure that this branch does not add.
- `useIsVisible` is the one of `@rocket.chat/ui-client`, not a copy in the package.
- The package slices nothing: the app chooses how many quick reactions to offer (three).

## Files that change

Package `packages/ui-message-list`:

- `src/Message/MessageToolbarHolder.tsx` (+ spec): new (R1 to R3).
- `src/Message/toolbar/**`: new: `MessageToolbar`, the two menus, `MessageToolbarItem`,
  `MessageToolbarVisibilityContext`, `items/*`, `items/actions/*`, stories and specs (R4 to R18, R28).
- `src/Message/contexts/MessageNavigationContext.ts`: `replyInThread`; `contexts.spec.tsx` follows.
- `src/Message/index.ts`, `src/index.spec.ts`: exports (R27).

Package `packages/ui-emoji-picker` and its provider:

- `src/contexts/EmojiPickerContext.ts`, `src/components/EmojiPicker.stories.tsx`: `addFrequentEmoji`.
- `apps/meteor/client/providers/EmojiPickerProvider/EmojiPickerProvider.tsx` (+ spec): provides it.

App `apps/meteor`:

- `client/providers/MessagesProvider/actions/useReadReceiptsDetailsAction.tsx` (+ spec): takes its settings.
- `client/providers/MessagesProvider/useMessageToolbarValue.ts` (+ spec), `MessagesProvider.tsx`,
  `useMessageNavigationValue.ts`, `useMessageInteractionsValue.tsx`, `MessagesProvider.spec.tsx` (R19 to R24).
- `client/components/message/variants/{RoomMessage,ThreadMessage}.tsx` and their specs: the package's holder (R25, R26).
- Deleted: `client/components/message/toolbar/**`, `client/components/message/MessageToolbarHolder.tsx`.
- `.changeset/*.md`: two, with the switch (R14, R21). `ui-emoji-picker` is private: no changeset for it.
- The spec, `message-capabilities` R28 and this plan: last.

## Order of work

Each step is one commit and builds and passes on its own.

1. Enabling refactor: `useReadReceiptsDetailsAction` takes `{ enabled, storeUsers }`; the old toolbar's menu passes the
   list context's. Nothing visible. Its spec follows.
2. Enabling feature, `@rocket.chat/ui-emoji-picker` and its provider: `addFrequentEmoji` raises an emoji's frequency count
   and re-ranks the quick reactions without touching the recent list; `addRecentEmoji` keeps doing both. Nothing visible:
   nobody calls it yet. Spec: the provider's, failing first.
3. Package, toolbar (R1 to R13, R15 to R18, R27, R28), with `useCountQuickReaction` in the toolbar context (R9) and a `useQuickReactions` that can offer no reactions at all (R6): copy from the reference with the departures above; `replyInThread`
   in the navigation context, and its app side in `useMessageNavigationValue` (R23) so that the app still builds; stories,
   specs, exports. Spec `code` and `tests` grow.
4. App, toolbar value (R19 to R24): `useMessageToolbarValue`, `replyInThread`, `openReactionPicker` telling its close, no reactions without a chat,
   mounted in `MessagesProvider`; un-narrow `message-capabilities` R28. Spec `code` and `tests` grow.
5. App, switch (R14, R21, R25, R26): the variants render the package's holder. Two `minor` changesets, one for R14 and
   one for R21.
6. App, delete the copies. Done when no file imports a deleted part.
7. Docs: spec Design, `code`, `tests`, status; plan `done`.

## Risks

- Hover, focus and the layout of the toolbar cannot be proven in jsdom: manual check.
- The proof renders the real holder through `MessagesProvider` with a stubbed `IntersectionObserver` in the spec.
- Between steps 4 and 5 the package toolbar is built but not shown; the old one keeps working.
- `pin`, `star`, `unstar`, `unpin`, `markUnread`, `translate` and `showOriginal` of the interactions context stay
  unused by the package: the menu's entries use the app's hooks (Out of scope).
- A quick reaction is counted as frequent but no longer as recent (R21): the two lists are separate data in the picker
  provider, so the picker's own picks and the quick reactions' ranking are unchanged.
- Hovering a quick reaction no longer previews it in an open emoji picker.

## Proof

| Requirement | Proven by                                                                                                                                                                                                                                          |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1          | `src/Message/MessageToolbarHolder.spec.tsx`, "renders nothing where messages do not allow interaction (R1)"                                                                                                                                        |
| R2          | `src/Message/MessageToolbarHolder.spec.tsx`, "renders the toolbar once the room is known and waits for it (R2)" and "renders no toolbar while the message is off screen (R2)"                                                                      |
| R3          | `src/Message/MessageToolbarHolder.spec.tsx`, "keeps the toolbar while a popup is open and lets go when it closes (R3)"; `src/Message/toolbar/MessageToolbar.spec.tsx`, "holds the toolbar open while the reaction picker is (R3)"                  |
| R4          | `src/Message/toolbar/MessageToolbar.spec.tsx`, "shows the inline items of the %s place (R4)" and "shows the jump of a direct room only to a viewer who is subscribed (R4)"                                                                         |
| R5          | `src/Message/toolbar/MessageToolbar.spec.tsx`, "infers the place from the message and the room, and lets a given place win (R5)"                                                                                                                   |
| R6          | `src/Message/toolbar/MessageToolbar.spec.tsx`, the "reactions" tests (R6), among them "are hidden where the toolbar context offers no reactions (R6)"                                                                                              |
| R7          | `src/Message/toolbar/MessageToolbar.spec.tsx`, "hides quote and reply in thread where they do not apply (%s, %s) (R7)", "hides reply in thread when threads are disabled (R7)" and "leaves out the conversation items without a subscription (R7)" |
| R8          | `src/Message/toolbar/items/actions/ForwardMessageAction.spec.tsx`, the (R8) tests                                                                                                                                                                  |
| R9          | `src/Message/toolbar/MessageToolbar.spec.tsx`, "toggles a quick reaction and counts it, and opens the picker with a way to learn it closed (R9)" and "shows every quick reaction it is offered (R9)"                                               |
| R10         | `src/Message/toolbar/MessageToolbar.spec.tsx`, "quotes and replies in a thread through the contexts (R10)" and "jumps to the message (R10)"                                                                                                        |
| R11         | `src/Message/toolbar/MessageToolbar.spec.tsx`, "hides the items the layout hides (R11)"                                                                                                                                                            |
| R12         | `src/Message/toolbar/MessageToolbarActionMenu.spec.tsx`, "orders the entries by their order and puts the apps last, in a section of their own (R12)" and "leaves out the entries meant for other places (R12)"                                     |
| R13         | `src/Message/toolbar/MessageToolbarActionMenu.spec.tsx`, "leaves out the entries the layout hides but keeps the actions of apps (R13)"                                                                                                             |
| R14         | `src/Message/toolbar/MessageToolbarActionMenu.spec.tsx`, "renders nothing without actions (R14)" and "shows the menu when only apps offer an action (R14)"                                                                                         |
| R15         | `src/Message/toolbar/MessageToolbarActionMenu.spec.tsx`, "replaces the apps of an encrypted message with an unavailable item (R15)" and "replaces the apps of an encrypted message in the AI menu too (R15)"                                       |
| R16         | `src/Message/toolbar/MessageToolbar.spec.tsx`, "renders the AI actions in their own menu (R16)" and "leaves out the AI menu when no AI action is offered (R16)"                                                                                    |
| R17         | `src/Message/toolbar/MessageToolbarActionMenu.spec.tsx`, "tells when it opens and closes, and runs the entry chosen (R17)"                                                                                                                         |
| R18         | `src/Message/toolbar/MessageToolbar.spec.tsx`, "runs the menu entry chosen (R18)"                                                                                                                                                                  |
| R19         | `apps/meteor/client/providers/MessagesProvider/useMessageToolbarValue.spec.tsx`, the "(R19)" tests                                                                                                                                                 |
| R20         | same file, "appends the actions of apps and offers the AI ones apart (R20)"                                                                                                                                                                        |
| R21         | same file, the "(R21)" tests, among them "say that the place offers no reactions where no chat is open (R21)"                                                                                                                                      |
| R22         | same file, "keeps its identity while ... (R22)"                                                                                                                                                                                                    |
| R23         | `MessagesProvider.spec.tsx`, "(message-toolbar R23)" tests                                                                                                                                                                                         |
| R24         | `MessagesProvider.spec.tsx`, "(message-toolbar R24)" tests and `useMessageToolbarValue.spec.tsx`, "carries out ... (R24)"                                                                                                                          |
| R25         | `RoomMessage.contexts.spec.tsx`, "(message-toolbar R25)" tests, and a thread message test                                                                                                                                                          |
| R26         | `RoomMessage.contexts.spec.tsx`, "shows no toolbar where interaction is off (message-toolbar R26)"                                                                                                                                                 |
| R27         | `src/index.spec.ts`, "exports the toolbar holder and the toolbar context (message-toolbar R27)"                                                                                                                                                    |
| R28         | the `stories` axe tests of `src/Message/toolbar/MessageToolbar.spec.tsx` (R28)                                                                                                                                                                     |
