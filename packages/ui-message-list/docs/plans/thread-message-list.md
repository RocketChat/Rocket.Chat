# Plan: The thread's message list (from specs/thread-message-list.md, 2026-11-13)

Status: approved.

The thread switches to the package's list, and what the old lists leave behind goes. The reference's thread (`cae3b5390c6`:
`ThreadMessageList`, `ThreadMessageRow`, `useThreadJumpTarget`) is copied and then corrected against `develop`'s thread; its deletion
(`9572a7ddfae`), editing store (`56ef744ebd5`) and documents (`0a1da7d63c9`) are taken in the pieces the base still needs. Every answer
of the gate is in the intent (Q1 to Q7) and the spec (Q1 to Q3). `develop` wins where it differs, and the room (branch 08) does not
change: its specs pass at every commit.

What the plan corrects against the reference's thread, each with a test that fails when the correction is undone:

- Main message alone during the first load: `messages` is empty while `isLoading` (R4).
- No `bottomThreshold`: the thread passes 20 (R9).
- A link to the main message of a long thread never loads: no special case for the main message, so the replies around it load
  (`aroundId` = the thread's id) whenever it is not among the messages (R28).
- The request for the replies around a message once for good: the request key is cleared when the target is reached and when `msg`
  is cleared, and kept after a failure (R29, R30).
- An inline `renderMessage` that closes over the subscription: a module-level function, with `ignoredUser` read from the markers store
  (R48, R49).
- `useTranslation` from `ui-contexts`: the base's `react-i18next` (no requirement; checked by typecheck).

## Files that change

Package `packages/ui-message-list`:

- `src/MessageList/scroll/useMessageListScroller.ts`: a rejected `onJumpToLatest` dispatches `jumpToLatestUnavailable` (R35).
- `src/MessageList/MessageList.spec.tsx`: the D3 test loses its skip and its comment (R35).
- `src/MessageList/MessageList.stories.tsx`: new stories `ThreadMainMessageReplacesLoader` (R11) and `ThreadLongWord` (R51).
- `src/MessageList/MessageList.stories.spec.tsx` if the stories are listed in a spec (only if one lists them; checked in step 3).
- `src/Message/contexts/MessageInteractionsContext.ts`: the fourteen capabilities leave the type and the default value (R53).
- `src/MessageList/stories/conversation/ConversationPlayground.tsx`, `src/Message/contexts/contexts.spec.tsx`,
  `tests/utils/mockMessageProviders.tsx` if it names them: stop naming `canDelete` and the others (R53).
- `docs/specs/message-list.md`: the `D3` entry goes with its mentions; `docs/specs/room-message-list.md`: the same mentions.
- `docs/specs/message-variants.md`: R18's note, R47, the Design bridge, D1 and its Out of scope lines (steps 3 and 6); `docs/specs/message-capabilities.md`
  R28 and `docs/specs/message-toolbar.md`'s notes (step 7); `docs/specs/thread-message-list.md` (Design, `code`, `tests`, status) and this
  plan (status) last.
- `docs/adr/0001-message-list-virtua-and-scroll-reducer.md`: the consequences (not merged to `develop`, so editable).

App `apps/meteor`:

- `client/providers/MessagesProvider/MessageMarkers.tsx`: moved from `client/views/room/body/RoomMessageList/MessageMarkers.tsx` (new
  path); `RoomMessageList.tsx`, `RoomMessageRow.tsx` and their specs follow (step 2).
- `client/views/room/contextualBar/Threads/components/ThreadMessageList.tsx`: rewritten to feed the package list (steps 3).
- `.../ThreadMessageRow.tsx`, `.../useThreadJumpTarget.ts` (new), their specs, and `ThreadMessageList.spec.tsx` (rewritten),
  `ThreadChat.spec.tsx` (new).
- `.../ThreadChat.tsx`: no `DateListProvider`, no `shouldJumpToBottom`, the list keyed by the main message.
- `.../hooks/useThreadMessagesQuery.spec.ts`: `jumpToRecent` proofs (R35).
- Deleted (step 4): `Threads/components/ThreadMessageItem.tsx` and its spec, `threads.css`, `views/room/BubbleDate/*`,
  `views/room/hooks/useDateScroll.ts`, `views/room/providers/DateListProvider.tsx` and its mount in `views/room/Room.tsx`,
  `views/room/MessageList/hooks/useKeepAtBottom.ts` and its spec, `useKeepMountedMessages.ts`, `views/room/body/LoadingMessagesIndicator.tsx`,
  `views/room/hooks/useMessageListNavigation.ts` and its spec. Step 5: the `onResize` prop types of `composer/ComposerMessage.tsx` and
  `composer/messageBox/MessageBox.tsx`, and `tests/mocks/utils/FakeResponse.ts`.
- Step 6: `client/lib/chats/editingMessageSubscription.ts` and its spec (moved from
  `views/room/MessageList/providers/messageHighlightSubscription.ts` and its spec); `ChatMessages.ts`, `CurrentEditingMessage.ts`,
  `providers/MessagesProvider/useMessageEditingValue.ts`, `MessagesProvider.spec.tsx` (D1's test replaced),
  `views/room/body/RoomMessageList/useRoomJumpTarget.spec.tsx` (the import).
- Step 7: `providers/MessagesProvider/useMessageInteractionsValue.tsx` and `MessagesProvider.spec.tsx`.
- Changesets in `.changeset/`: `message-list-fix-failed-jump-to-latest.md` (patch, package), `thread-message-list-ui-message-list.md`
  (minor, meteor), `message-editing-store.md` only if the rename is visible (it is not, once the thread no longer writes the store),
  `message-interactions-drop-unused.md` (patch, package).
- Documents: `docs/features/message-list/message-components.md`, `docs/frontend/message-list.md` (step 8).

E2E page objects: none changes (see Risks); QA gets the list of locators that depend on the thread's DOM.

## Order of work

Every step is one commit that builds and passes on its own; steps 1 and 2 sit below the feature. Documents change in the commit that
changes what they describe.

1. **`fix(ui-message-list): stop waiting for a latest page that failed to load`** (R35, `message-list` D3). The test is un-skipped
   first and shown failing; then the one-line dispatch in the `catch` of `jumpToLatest` in `useMessageListScroller.ts`. The `D3`
   entry, its test comment and its mentions in `message-list.md` and `room-message-list.md` (R42, Q5, Out of scope, References) go; `message-list`
   stays `implemented`. Patch changeset for the package. Commit body: `message-list D3: ...`.
2. **`refactor: keep the markers of a message's row where every list can read them`**. Move `MessageMarkers.tsx` to
   `providers/MessagesProvider/`, update the imports of the room's list, row and specs, the `code` path in `room-message-list.md`. No
   behaviour changes: the room's specs pass unchanged.
3. **`feat: render a thread's messages with the message list of ui-message-list`** (R1 to R14, R15 to R31, R33 to R52). Copy the
   reference's `ThreadMessageList`, `ThreadMessageRow`, `useThreadJumpTarget`, then apply the corrections above:
   - `ThreadMessageList`: `useThreadMessagesQuery`; `messages` = `[]` while loading, else the replies, with the main message in front once
     `!hasPreviousPage`; `MessagesProvider` with the room and subscription, no selection; `MessageMarkers` around the list;
     `MessageList` with `aria-label` `Thread_message_list`, the flags and loaders (`fetchPreviousPage`, `fetchNextPage`), `onJumpToLatest`
     = `jumpToRecent`, `firstUnreadMessageId`, the target, `isOwnMessage` = the author is the viewer, `groupingPeriodSeconds`,
     `groupsThreadReplies` false, `bottomThreshold` 20, a module-level `renderMessage`, and `MessageListDateBubble` as the only child. No
     header, no position, no visibility callback.
   - `ThreadMessageRow`: `SystemMessage` or `ThreadMessage` (`unread` = first unread, `ignoredUser` from `useMessageMarkers`), no
     `subscription` prop.
   - `useThreadJumpTarget`: as the reference, minus the special case of the main message, with the request key cleared on reach and on
     `msg` cleared, kept after a failure; `msg` cleared on reach for a reply, never for the main message.
   - `ThreadChat`: drop `DateListProvider`, `shouldJumpToBottom` and `setShouldJumpToBottom`; `key={mainMessage._id}` on the list. The
     composer, the `readThread` on arrival and the error boundary stay.
   - Package stories `ThreadMainMessageReplacesLoader` (R11) and `ThreadLongWord` (R51).
   - Specs: rewrite `ThreadMessageList.spec.tsx`; new `ThreadMessageRow.spec.tsx`, `useThreadJumpTarget.spec.tsx`, `ThreadChat.spec.tsx`;
     `useThreadMessagesQuery.spec.ts` gains the `jumpToRecent` proofs. The old `ThreadMessageList.spec.tsx` behaviours: paging after a
     pointer interaction (R19, R22), accessibility (R1), kept-mounted rows with the loader first and the top message reported (R31, R38;
     proven in the package by `message-list` R42, R64), the hidden day divider (R40; package `FloatingDateNeverDoublesADay`) and no
     selection (R44) are each proven again in the new specs or the package stories; none is dropped.
   - `message-variants.md`: the thread-list lines ("until branch 09") of R47's Out of scope and the places paragraph. Changeset (minor)
     naming the differences of intent Q1 to Q3 and the ended highlight of a closing thread.
   - Review round 1: the list waits for the viewer's input before it pages (`deferPagingUntilInput`, R22), the floating date follows
     `develop`'s rules from the engine (R40), and a thread opened again restores and records no position (R7).
   - Old files stay, unused, until step 4.
4. **`refactor: delete the thread's old message list and what only it used`**. Delete the files of step 4 above, and the `Room.tsx` mount
   of `DateListProvider`. For each deleted file prove "no reader" by a search over `apps/meteor` (client, ee, tests) and a clean
   typecheck; list the proof in the commit body. `ThreadMessageItem.spec`'s and `useMessageListNavigation.spec`'s proofs live on in
   `ThreadMessageRow.spec` and the package's `useMessageListNavigation.spec.tsx`. The app's `useItemListNavigation` and
   `useMessageRowListNavigation` stay (the sidebar and many lists read them).
5. **`refactor: delete the dead props and helpers the old lists left in the app`**. The `onResize` prop types, `FakeResponse.ts`, each
   proved unread by search and typecheck; `RoomBody.spec`'s check that the room passes no `onResize` stays.
6. **`refactor: let the highlight store be the editing store`** (R46, R47, fixes `message-variants` D1). Move the store and its spec to
   `client/lib/chats/editingMessageSubscription.ts` with `setEditingMessage` and `clearEditingMessage`; `ChatMessages`,
   `CurrentEditingMessage`, `useMessageEditingValue` and the specs follow; `views/room/MessageList` no longer exists. Replace the pinned
   test of `message-variants` D1 (the orchestrator's authorisation under the user's delegation, as `Pinned-test-change:
message-variants D1` in this commit, with the reason "D1 is fixed by the editing store; the old test's subject no longer exists")
   by the proofs of R32 and R47 in `ThreadMessageList.spec.tsx` and `useRoomJumpTarget.spec.tsx`, and delete the `D1` entry; `message-variants`
   R18's note, R47, its Design bridge and its Out of scope lines are rewritten. No changeset: nothing a viewer sees changes in this
   commit (the thread stopped writing the store in step 3).
7. **`refactor(ui-message-list): drop the capabilities of the interactions context that nothing reads`** (R53). Remove the fourteen from
   the type, default value, the playground, the contexts spec and `useMessageInteractionsValue` (with the imports and hooks only they
   used), and the specs of `MessagesProvider` that exercised them (the app's action hooks keep their own specs). `message-capabilities` R28 and
   `message-toolbar`'s notes change. Patch changeset for the package.
8. **`docs: describe how the app provides the message contexts and what the thread feeds`**. `message-components.md` (the editing
   context carries editing only; the provider table), `docs/frontend/message-list.md`, the ADR's consequences; `room-message-list.md` and
   `message-list.md` lose the "branch 09" wording. `thread-message-list.md`: Design, `code`, `tests`, status `implemented`; this plan
   `done`.

Code and tests lists of the spec grow in the commit that adds the file (steps 3, 6, 7); the status moves in step 8.

## Risks

- **The jsdom seam hides the engine.** The thread's specs replace the virtualizer by the list's row renderer and mock `useThreadMessagesQuery`, so
  they prove what the thread gives the list, not how it scrolls. Scrolling, paging, jumping and the date are proven by the package's play
  tests, which already prove them for any source; R11 gets its own story. The plan runs `test-storybook` at steps 1 and 3 and checks the
  stories that cover R15 to R18, R23, R25, R33, R34, R38 and R40 are the ones cited below.
- **The reference's regressions come back in a copy.** Each has a test named in the list above; each is mutation-checked (the
  correction undone, the test seen to fail) before the work is reported.
- **A deleted file has a reader the search missed** (a dynamic import, a mock path in a spec). Typecheck and the full client suite run on each
  deleting commit; `jest.mock` paths are searched too.
- **The thread's rows re-render for the subscription** if `MessageMarkers` is not mounted above the list: R49 has a render-counting test.
- **Conference panels.** They have no `FocusScope`, room body or selection provider; `ThreadChat.spec.tsx` renders the thread without them.
  The real panel is QA's.
- **`Pinned-test-change`.** The trailer is used once, for D1's test, with the orchestrator's authorisation named in the body; `sdlc:check
--base` must accept the commit, otherwise the replacement is reconsidered.
- **E2E locators.** `threadMessageList` (role `list`, name `Thread message list`), `threadMessageListItems` (`[role="listitem"]
[aria-roledescription="thread message"]`) and the item by id are kept by the same variants and label; `threadMessageListScroller`
  (`[data-overlayscrollbars]` that has the list) is the room's locator and is untouched; nothing selects `.thread-list` or
  `js-scroll-thread`. They are listed for QA with `messaging-scroll-to-bottom` and `thread-persistence-on-navigation`, which e2e cannot
  run here.
- **If work stops after step 3,** the app has both lists' remains (dead files) but works; after step 5 the store still carries only
  editing; after step 7 the context is smaller. Nothing is half-switched.
- **Existing requirements that could regress:** `room-message-list` (step 2 moves a file), `message-variants` R24 to R26 (selection), R47
  (editing), `message-capabilities` R28 (step 7).

## Proof

Engine behaviours are proven by the package's tests of `message-list`, which the thread's specs name; the thread's specs prove what the
thread gives the list. `ThreadMessageList.spec.tsx` is `TML`, `ThreadMessageRow.spec.tsx` is `TMR`, `useThreadJumpTarget.spec.tsx` is `TJT`,
`ThreadChat.spec.tsx` is `TC`, all under `apps/meteor/client/views/room/contextualBar/Threads/components/`; `MessageList.stories.tsx` is
`stories` under `packages/ui-message-list/src/MessageList/`.

| Requirement | Proven by                                                                                                                                                                                                                                                                                |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1          | `TML`, "renders a labelled list of the thread's messages (R1)" with axe; `TC`, "renders the list inside the error boundary and without the room's providers (R1, R52)"                                                                                                                   |
| R2          | `TMR`, "draws a system message and any other message, the main one included, with the variant of its type (R2)"; "passes unread and ignoredUser (R2)"                                                                                                                                    |
| R3          | `TML`, "marks the list busy exactly while a page loads (R3)"                                                                                                                                                                                                                             |
| R4          | `TML`, "gives the list no message while the first page loads, not even the main message (R4)"                                                                                                                                                                                            |
| R5          | `TML`, "shows the main message alone when the first page failed (R5)"                                                                                                                                                                                                                    |
| R6          | `TC`, "shows another thread at its own opening position, with nothing carried over (R6)" (the list is remounted)                                                                                                                                                                         |
| R7          | `TML`, "gives the list no header, no position and no visibility callback (R7)"; `TML`, "opens a thread again at the bottom, giving the list no position back and taking none from it (R7)"; `message-list` R84 (`OpensWhereItLands` play)                                                |
| R8          | `TML`, "composes only the floating date (R8)": no "New messages", no "Jump to recent messages" for a window with newer replies                                                                                                                                                           |
| R9          | `TML`, "gives the list the thread's threshold, grouping period and grouping rule (R9)"                                                                                                                                                                                                   |
| R10         | `TML`, "puts the main message first once no older reply remains, and the older loader first while some do (R10)"                                                                                                                                                                         |
| R11         | `stories`, `ThreadMainMessageReplacesLoader` (play test, real browser)                                                                                                                                                                                                                   |
| R12         | `TML`, "shows the main message alone for a thread with no reply (R12)"; `stories` `LiveIncomingAtBottom` for the first reply following                                                                                                                                                   |
| R13         | `TML`, "groups the main message with the first reply as any two messages (R13)"                                                                                                                                                                                                          |
| R14         | `TML`, "draws a changed main message in place (R14)" (render count of the other rows)                                                                                                                                                                                                    |
| R15         | `stories` `Default`, `ThreadLayout`, `JumpToFirstUnread` (`message-list` R13, R14, R9); `TML`, "gives no target and no position to a thread opened without msg (R15)"                                                                                                                    |
| R16         | `stories` `LiveIncomingAtBottom`, `LateResizingContent`, `ContainerAndComposerResize` (`message-list` R15, R16)                                                                                                                                                                          |
| R17         | `stories` `LiveIncomingScrolledUp` (`message-list` R18, R22)                                                                                                                                                                                                                             |
| R18         | `stories` `ReportsNotBeingAtTheBottomOfAnOlderWindow` (`message-list` R17)                                                                                                                                                                                                               |
| R19         | `TML`, "maps the older page and its loader to the previous page of the query (R19)"; `stories` `InfiniteOlderHistory`, `LoadingStates`                                                                                                                                                   |
| R20         | `TML`, "maps the newer page to the next page of the query and the 20 px distance (R20)"; `stories` `LoadNewerAtBottom`, `BottomThreshold`                                                                                                                                                |
| R21         | `TML`, "settles a page that fails and asks again only on a new check (R21)"; `stories` `FailedLoadSettles`                                                                                                                                                                               |
| R22         | `TML`, "tells the list to wait for the viewer before it pages (R22)"; `TML`, "asks for no previous or next page of replies once the thread has opened, until the viewer acts in the list (R22)"; `stories` `PagingWaitsForInput`, `PagingWaitsForInputOnAShortPage` (`message-list` R82) |
| R23         | `stories` `LiveMessageWhileOlderLoads`, `InfiniteOlderHistory` (`message-list` R36, R38)                                                                                                                                                                                                 |
| R24         | `useThreadMessagesQuery.spec.ts`, "lists only the visible messages of its own thread, the main message once (R24)"                                                                                                                                                                       |
| R25         | `TJT`, "gives a loaded reply as the target and clears msg when it is reached (R25)"; `stories` `JumpToLoadedMessage`, `HighlightedMessage`                                                                                                                                               |
| R26         | `TJT`, "gives the main message as the target and never clears msg (R26)"                                                                                                                                                                                                                 |
| R27         | `TJT`, "asks once for the replies around a reply that is not loaded, after the first page (R27)"                                                                                                                                                                                         |
| R28         | `TJT`, "asks for the replies around the main message while older replies remain (R28)"                                                                                                                                                                                                   |
| R29         | `TJT`, "asks again for the same reply once it was reached and the reply left the window (R29)"; `TJT`, "asks again for the same reply after msg was cleared and set again (R29)"                                                                                                         |
| R30         | `TJT`, "does not ask again for a reply that could not be loaded until a new link names it (R30)"                                                                                                                                                                                         |
| R31         | `stories` `JumpToUnloadedMessage`, `KeepsLiveEmbedsMounted`, `ReportsWhatIsVisible` with the loader among the rows (`message-list` R42)                                                                                                                                                  |
| R32         | `TML`, "does not write the editing store for a jump, and leaves no highlight when it closes (R32)"                                                                                                                                                                                       |
| R33         | `stories` `SendOwnMessageWhileDetached` (`message-list` R19); `TML`, "tells the list the viewer's own messages (R33)"                                                                                                                                                                    |
| R34         | `stories` `JumpToLatest` (`message-list` R20); `TML`, "asks the thread for its latest replies as the list's onJumpToLatest (R34)"                                                                                                                                                        |
| R35         | `MessageList.spec.tsx`, "does not go to the bottom by itself after a failed jump to the latest page (R20)" (un-skipped, D3); `useThreadMessagesQuery.spec.ts`, "resolves and clears the replies when the latest page fails (R35)"                                                        |
| R36         | `stories` `LiveIncomingScrolledUp`; `TML`, "does not count a reply of someone else as the viewer's (R36)"                                                                                                                                                                                |
| R37         | `useThreadMessagesQuery.spec.ts`, same as R24 test; `TML`, "does not list a message of the main channel (R37)"                                                                                                                                                                           |
| R38         | `stories` `KeepsLiveEmbedsMounted` (`message-list` R64); `TML`, "keeps the list's rule of rows kept mounted and adds none (R38)"                                                                                                                                                         |
| R39         | `TML`, "writes the day dividers in the viewer's date format and the unread divider (R39)"                                                                                                                                                                                                |
| R40         | `TML`, "composes only the floating date, also while newer replies remain (R8, R40)"; `stories` `FloatingDate` (`message-list` R51: every scroll, faded a second after the last), `FloatingDateNeverDoublesADay` (`message-list` R52: the divider under the date hidden)                  |
| R41         | `TML`, "marks the first unread message of the room's read state and nothing else moves (R41)"                                                                                                                                                                                            |
| R42         | `useThreadMessagesQuery.spec.ts`, "marks the thread as read when the first page loads (R42)"; `TC`, "marks the thread as read when a reply arrives (R42)"; `TML`, the visibility callback test of R7                                                                                     |
| R43         | `useMessageListNavigation.spec.tsx` of the package (`message-list` R66 to R68); `TC`, "leaves the list's edges to the browser without a focus scope (R43)"                                                                                                                               |
| R44         | `TMR`, "keeps the messages of the thread out of the room's selection, whatever state it is in (message-variants R24, R25, R44)"; `TML`, "gives the messages provider no selection (R44)"                                                                                                 |
| R45         | `TML`, "draws the message being edited with the editing look (R45)"                                                                                                                                                                                                                      |
| R46         | `editingMessageSubscription.spec.ts`, "notifies every subscriber of the message being edited (R46)"; `MessagesProvider.spec.tsx`, "is the message being edited and follows it where interaction is allowed (R46)"; the searches of step 6                                                |
| R47         | `TML`, "keeps the editing look on the message being edited while a jump highlights another (R47)"; `useRoomJumpTarget.spec.tsx`, "does not write the editing store for a jump (R47)"; `message-list` R50 in `useIsMessageEmphasized.spec.tsx`                                            |
| R48         | `TML`, "gives the list the same function to draw a message across renders (R48)"                                                                                                                                                                                                         |
| R49         | `TML`, "does not render a row again for a change of the subscription that does not touch its author (R49)"                                                                                                                                                                               |
| R50         | `TML`, "renders only the row of an arriving reply and the rows whose grouping it changed (R50)"                                                                                                                                                                                          |
| R51         | `stories` `ThreadLayout`, `ContainerAndComposerResize` (fills the container, composer resize) and `ThreadLongWord` (no horizontal scroll)                                                                                                                                                |
| R52         | `TC`, "renders the thread without the room's body, selection provider or focus scope (R1, R52)"                                                                                                                                                                                          |
| R53         | `contexts.spec.tsx`, "offers only the capabilities the package reads (R53)"; `src/index.spec.ts`; `MessagesProvider.spec.tsx`, "provides the eleven capabilities (R53)"; typecheck and the searches of step 7                                                                            |

`D3` of `message-list` is fixed in step 1 (its test un-skipped); `D1` of `message-variants` in step 6 (its test replaced, with the trailer).
Before the work is reported, each of the corrections above and each of R4, R9, R20, R28, R29, R30, R35, R44, R47, R48, R49 is
mutation-checked: the line is changed, the named test is seen to fail, the line is restored.
