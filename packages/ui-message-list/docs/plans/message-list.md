# Plan: Message list (from specs/message-list.md, 2026-11-13)

Status: approved.

The list is copied from the frozen reference (`message-list-ref`), commits `9b408f0a57d` (row model), `83e7cfd5af3` (reducer and
scroller), `1007b6e5fa2` (components, stories, keyboard), `a32cdc39835` (conversation stories), `2da05ca0415` and `66abbe1eea7`
(enabling commits) and `36bc5e0db92` (docs and ADR 0010), then adapted to the base. `develop` wins where it differs. The spec's
questions are answered: the three defects of Q1 are fixed in their own commits, `bottomThreshold` exists (Q2), the held row stays mounted
and `REVIEW.md` and `AGENTS.md` say so (Q3), the keyboard hook is the package's own copy of `develop`'s (Q4), and `useFormatDate` is in
`@rocket.chat/ui-client` (Q5). Nothing in `apps/meteor` uses the list in this branch, so no meteor file changes except through the
rebuilt `ui-client`.

What the plan does not copy from the reference:

- `useMergedRefsV2` is imported from `@rocket.chat/ui-client`, not `@rocket.chat/fuselage-hooks`.
- `MessageRowStateContext` lives in `src/Message/contexts/` (the variants' `useIsMessageEmphasized` reads it, so `Message/` must not
  import from `MessageList/`); `MessageList/` re-exports `useIsMessageHighlighted`.
- The keyboard hook is `develop`'s current `useItemListNavigation` (media Tab, Left and Right, move-row shortcut) plus the options
  `scrollToAdjacentRow` and `onMoveBetweenRows`, without the fallback that writes `scrollTop`; `useMessageRowListNavigation` is not
  copied (the app keeps its own); `useMessageListNavigation` returns the callback ref as the reference does, and the app's
  `useMessageListNavigation.spec.tsx` is ported, because the reference dropped that proof.
- The adjacent row of a keyboard move is found by the row model (`adjacentMessageIndex`), not by `index ± 1` in `MessageList.tsx`.
- `tests/utils/listContract.ts` carries `expectListKeyboard` only (no `listWrapper`, so no `react-virtuoso`).
- The date and the divider format the day with `useFormatDate` of `@rocket.chat/ui-client` (Q5).
- `isAtBottom` of the report is the position, the first report needs no scroll and a resize reports (Q1); the position resolves when the
  first messages are listed (Q1); the bottom has a threshold (Q2); row rendering is bounded (intent Q4). Each is its own commit.

## Files that change

Other packages:

- `packages/ui-client/src/hooks/useFormatDate.ts` (+ spec), `src/hooks/index.ts`: new (R79).
- `packages/ui-client/src/components/CustomScrollbars/useViewportScrollbars.ts` (+ spec), `index.ts`: new (R78, R79).
- `packages/mock-providers/src/fixtures/{createFakeUser,createFakeRoom,createFakeSubscription}.ts`, `createFakeMessage.ts`,
  `index.ts`, `src/tests/fixtures.spec.ts`: new and extended (R79).
- `.changeset/*.md`: one for ui-client, one for mock-providers (`minor`).

Package `packages/ui-message-list`:

- `package.json`, `yarn.lock`: `virtua`, `date-fns`, `@rocket.chat/message-types`, `@react-aria/focus`.
- `src/MessageList/lib/{buildMessageListRows,isSequentialMessage,isSameDay,diffMessageKeys,geometry,position,index}.ts` (+ specs): new (R2, R6 to R11, R17, R36 to R39, R59 to R63, R80).
- `src/MessageList/scroll/{constants,messageListScrollReducer,planRowsCommit,useMessageListScroller}.ts` (+ specs): new (R12 to R47, R54 to R56, R69, R80).
- `src/MessageList/{MessageList,MessageListVirtualizer,MessageListRows,MessageListRow,MessageListDivider,MessageListLoader}.tsx`,
  `{MessageListDateBubble,MessageListOverlayButton,MessageListNewMessagesButton,MessageListJumpToLatestButton}.tsx`,
  `MessageListScrollContext.ts`, `hasLiveEmbed.ts`, `index.ts` (+ specs): new (R1 to R9, R41 to R53, R57 to R59, R64, R65, R69, R70, R77, R78).
- `src/Message/contexts/MessageRowStateContext.ts`: new; `src/Message/hooks/useIsMessageEmphasized.ts`: also reads it (R48, R50).
- `src/hooks/{useItemListNavigation,useMessageListNavigation,messageRow}.ts` (+ specs): new (R66 to R68); `tests/utils/listContract.ts`: new.
- `src/MessageList/MessageList.stories.tsx`, `MessageListConversation.stories.tsx`, `stories/*` (the playground, the fake source, the
  play helpers, the conversation rows): new (R13 to R76).
- `src/index.ts`, `src/index.spec.ts`: exports (R77).
- `docs/adr/0010-message-list-virtua-and-scroll-reducer.md`: moves in, paths updated; `REVIEW.md`, `AGENTS.md`: the held row (Q3).
- This plan and the spec (Design, `code`, `tests`, defects, status): in every commit that adds to them, and last.

Repository `docs/`: `features/message-list/{README,message-components}.md`, `frontend/message-list.md`,
`frontend/list-keyboard-navigation.md` (the note on the package's copy), and the two index entries in `CLAUDE.md`.

## Order of work

Each step is one commit and builds and passes on its own; the checks of every commit are the package's typecheck, testunit, lint, build,
test-storybook and `sdlc:check`, and, where `ui-client` or `mock-providers` change, theirs. Enabling commits are first.

1. Enabling, `ui-client` (R78, R79): `useFormatDate` and the viewport mode of the scrollbars (`useViewportScrollbars`,
   `viewportScrollbarsHostStyle`, with the content `ResizeObserver` that calls `instance.update()`). Specs. Changeset.
2. Enabling, `mock-providers` (R79): `createFakeUser`, `createFakeRoom`, `createFakeSubscription`, `createFakeMessageWithAttachment`,
   `createFakeConversation` next to the existing `createFakeMessage`. Spec. Changeset.
3. Enabling, dependencies: `virtua`, `date-fns`, `@rocket.chat/message-types`, `@react-aria/focus` in the package, with the lockfile.
4. Package, the row model (R2, R6 to R11, R17, R30, R36, R38, R59 to R63): `lib/`, copied, with `adjacentMessageIndex` added so the
   keyboard never does index arithmetic. Specs.
5. Package, the scroll reducer and the scroller (R12 to R47, R54 to R56, R69): `scroll/`, copied. The reducer's table spec is
   the reference's, plus a row that shows or drops the suspected paging defect (spec Known defects, fourth item): if it shows,
   the table row is skipped and pinned as `D` in this commit and fixed in step 14.
6. Package, the keyboard (R66 to R68): `hooks/` and `listContract.ts`, from `develop`'s hook; the app's specs for the hook and for
   `useMessageListNavigation` are ported. Specs.
7. Package, the list (R1 to R9, R12, R21, R24, R41 to R53, R57 to R59, R64 to R66, R69, R70, R77, R78): the components, the overlays, the
   contexts, `useIsMessageEmphasized`, the exports. Component specs run through the jest seam
   (`jest.mock('./MessageListVirtualizer', () => jest.requireActual('./MessageListRows'))`). The known defects `D1` (an own message
   followed by another in the same update), `D2` (a newer page ending in an own message) and `D3` (a failed `onJumpToLatest`) get
   skipped tests pinned in the spec; the spec's `D` entries are written here.
8. Package, the stories (R13 to R40, R44, R47, R51 to R57, R60, R61, R64, R66, R69, R74, R75, R80 in part): the playground, the fake source,
   the play helpers and the list's stories with their play tests; the missing proofs of the scope's corrections are written here
   (`FloatingDateNeverDoublesADay`, `KeepsLiveEmbedsMounted`, `KeyboardIntoUnrenderedRows`, `UserInputReleasesTheBottom`,
   `FailedLoadSettles`, `HeaderReplacesTheLoader`, `LiveMessageWhileOlderLoads`, `ReorderedMessage`, `FillsATallViewport`,
   `ScrollToTop`, `OpensOnATarget`). Stories that prove a defect-fix of a later step are written there. The list's play tests run twice.
9. Package, the conversation stories (R76, R75): `MessageListConversation.stories.tsx` and the rows. Spec.
10. Fix, the position is applied when the first messages are listed (R61, Q1): a play test and a reducer row that fail first.
11. Fix, `isAtBottom` follows the position (R56, Q1): a reducer row and a play assertion that fail first.
12. Fix, a resize refreshes the report (R55, Q1): a reducer row that fails first.
13. Feature, `bottomThreshold` (R17, R31, R80, Q2): the option, the reducer rows and the play test at a non-default value.
14. Fix, the paging check after a load settles (R34), only if step 5 showed it: its pinned row is un-skipped and the `D` entry removed.
15. Refactor, bounded rendering (R71 to R73, intent Q4): rows are compared by their data and the highlight is read by id; a
    render-counting spec that fails first.
16. Docs, the repository docs and ADR 0010 (the references of the spec to them): the feature docs, the frontend guide, the note in
    `list-keyboard-navigation.md`, the `CLAUDE.md` entries, the ADR moved into `docs/adr/`.
17. Docs, `REVIEW.md` and `AGENTS.md` (Q3): the held row.
18. Docs, the spec's Design, `code`, `tests`, defects and `implemented`; this plan `done`.

## Risks

- virtua cannot lay out in jsdom, so what scrolls or measures is proven only by play tests, in a real browser: they must be
  deterministic. The helpers wait for the list to settle (`data-anchor` and `data-phase`), latencies are controlled by the fake
  source, and every play test is run twice at the tip. A flake means a missing wait, never a retry.
- The threshold (R80) touches the reducer's "at the bottom" in three places: acquiring the bottom, the paging at the newer edge and the
  report. The anchor's own re-application keeps the exact bottom (within 1px), so a threshold never leaves the list short. Only user input
  still releases an anchor, and nothing writes `scrollTop`. If the threshold cannot be added without breaking these, the spec keeps 1px
  and records the difference.
- Copying the reference brings its three known defects (`D1` to `D3`) and its suspected fourth; each is pinned or fixed first.
- The package copy of the keyboard hook duplicates the app's, which serves the sidebar and the side panels: a fix to one must reach the
  other until the follow-up that moves the hook to `@rocket.chat/ui-client`, after branch 09.
- `REVIEW.md` and `AGENTS.md` say "keepMounted holds no UI-state rows": step 17 rewords them for the held row, so a reviewer does not
  flag R65.
- `ui-client` changes (the scrollbars, `useFormatDate`): the meteor typecheck and the whole client suite run at the tip, with
  the dists rebuilt.
- Stopping after step 9 leaves the list complete, with the three Q1 defects and no threshold, and unused.

## Proof

Paths are package-relative (`src/MessageList/...`) unless a package is named. "Reducer spec" is
`src/MessageList/scroll/messageListScrollReducer.spec.ts`, "stories" is `src/MessageList/MessageList.stories.tsx`. Titles end with the requirement
they prove.

| Requirement | Proven by                                                                                                                                                                                                 |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1          | `src/MessageList/MessageList.spec.tsx`: "renders a labelled list, busy while any page loads (R1)"                                                                                                         |
| R2          | `src/MessageList/lib/buildMessageListRows.spec.ts`; `MessageList.spec.tsx`: "orders the loader or header, the messages and the newer loader (R2)"; "shows the header once no older messages remain (R2)"  |
| R3          | `MessageList.spec.tsx`: "draws the header as a list item and a loader as presentation, spinning only while its page loads (R3)"                                                                           |
| R4          | `MessageList.spec.tsx`: "shows only a spinner while the first page loads (R4)"                                                                                                                            |
| R5          | `MessageList.spec.tsx`: "renders an empty list, with the header when no older messages remain (R5)"                                                                                                       |
| R6          | `MessageList.spec.tsx`: "renders each message through renderMessage with its row data and id (R6)"                                                                                                        |
| R7          | `MessageList.spec.tsx`: "draws a day divider before the first message of each day, in the viewer's date format (R7)"                                                                                      |
| R8          | `MessageList.spec.tsx`; `buildMessageListRows.spec.ts`: "combines the unread divider with the day divider (R8)"; "keeps a divider with its message (R8)"                                                  |
| R9          | `MessageList.spec.tsx`: "ignores a first unread id that is not listed and does not scroll for it (R9)"                                                                                                    |
| R10         | `src/MessageList/lib/isSequentialMessage.spec.ts`: the author, alias, groupable, period, day and system message cases (R10)                                                                               |
| R11         | `isSequentialMessage.spec.ts`: the thread reply cases with and without `groupsThreadReplies` (R11)                                                                                                        |
| R12         | `MessageList.spec.tsx`: "exposes what it holds and its phase (R12)"                                                                                                                                       |
| R13         | `src/MessageList/scroll/messageListScrollReducer.spec.ts`; stories: "opens at the newest message (R13)"; `Default` play                                                                                   |
| R14         | `MessageList.stories.tsx`: `ShortList` play (R14)                                                                                                                                                         |
| R15         | reducer spec; stories: "follows new messages and growing content while at the bottom (R15)"; `LiveIncomingAtBottom`, `LateResizingContent` play                                                           |
| R16         | reducer spec; stories: "follows a viewport that resizes (R16)"; `ContainerAndComposerResize` play                                                                                                         |
| R17         | `src/MessageList/lib/geometry.spec.ts`; reducer spec: "counts the end of the latest messages, within the threshold, as the bottom (R17)"; "does not take the end of an older window for the bottom (R17)" |
| R18         | reducer spec; stories: "does not follow an arrival while the viewer reads away (R18)"; `LiveIncomingScrolledUp` play                                                                                      |
| R19         | reducer spec; stories: "goes to the bottom for the viewer's own message (R19)"; `SendOwnMessageWhileDetached` play                                                                                        |
| R20         | reducer spec; `MessageList.spec.tsx`: "asks for the latest page first from an older window (R20)"; "asks for the latest page when an own message arrives while detached (R20)"                            |
| R21         | stories; reducer spec: `LiveIncomingScrolledUp` play (R21); "raises the indicator for someone else's message while away (R21)"                                                                            |
| R22         | reducer spec: "raises no indicator at the bottom, for an own message or for a page of newer messages (R22)"                                                                                               |
| R23         | stories; reducer spec: `LiveIncomingScrolledUp` play (R23); "clears the indicator at the bottom (R23)"                                                                                                    |
| R24         | stories; `MessageList.spec.tsx`: `JumpToLatest` play (R24); "shows Jump to recent messages only while newer messages remain (R24)"                                                                        |
| R25         | reducer spec; `MessageList.stories.tsx`: "releases the bottom only on the viewer's input (R25)"; `UserInputReleasesTheBottom` play (R25)                                                                  |
| R26         | reducer spec: "takes the bottom back when a scroll lands on it and never leaves it by itself (R26)"                                                                                                       |
| R27         | reducer spec; stories: "keeps the user-scrolling window open until scrolling stops (R27)"; `FloatingDate` play                                                                                            |
| R28         | reducer spec; stories: "releases a held message on input or after its surroundings stop resizing (R28)"; `JumpSurvivesLateMeasurement` play                                                               |
| R29         | reducer spec: "does not page while positioning and checks once placed (R29)"                                                                                                                              |
| R30         | reducer spec; `geometry.spec.ts`; stories: "loads older messages within a third of the viewport (R30)"; `InfiniteOlderHistory` play                                                                       |
| R31         | reducer spec; stories: "loads newer messages only at the bottom (R31)"; `LoadNewerAtBottom` play                                                                                                          |
| R32         | reducer spec; `MessageList.spec.tsx`: "loads one page at a time (R32)"; "does not call a loader while its flag is true (R32)"                                                                             |
| R33         | reducer spec: "does not page while positioning or holding a message (R33)"                                                                                                                                |
| R34         | reducer spec; stories: "checks again after a data change and fills a tall viewport (R34)"; `FillsATallViewport` play                                                                                      |
| R35         | stories: `FailedLoadSettles` play (R35)                                                                                                                                                                   |
| R36         | `planRowsCommit.spec.ts`; `diffMessageKeys.spec.ts`; stories: "shifts for a change at the start (R36)"; `InfiniteOlderHistory` play                                                                       |
| R37         | stories: `HeaderReplacesTheLoader` play (R37)                                                                                                                                                             |
| R38         | `planRowsCommit.spec.ts`; stories: "commits a change at both ends in two steps (R38)"; `LiveMessageWhileOlderLoads` play                                                                                  |
| R39         | reducer spec; stories: "keeps the topmost message in place when the middle changes (R39)"; `ReorderedMessage` play                                                                                        |
| R40         | reducer spec; stories: "goes to the bottom of a window replaced for no reason (R40)"; `JumpToLatest` play                                                                                                 |
| R41         | reducer spec; stories; `MessageList.spec.tsx`: "centers a loaded message, highlights it and reports it reached (R41)"; `JumpToLoadedMessage` play; "reports a loaded target once (R41)"                   |
| R42         | stories; `MessageList.keepMounted.spec.tsx`: `JumpToLoadedMessage` play with the header among the rows (R42); "keeps the right rows mounted with a loader among them (R42)"                               |
| R43         | reducer spec; stories: "waits for an unloaded target without following arrivals (R43)"; `JumpToUnloadedMessage` play                                                                                      |
| R44         | reducer spec; stories: "keeps the target centered as rows around it change (R44)"; `JumpSurvivesLateMeasurement` play                                                                                     |
| R45         | reducer spec; stories: "opens centered on the target (R45)"; `OpensOnATarget` play                                                                                                                        |
| R46         | `MessageList.spec.tsx`: "acts on a target when it changes, and scrollToMessage does the same (R46)"                                                                                                       |
| R47         | stories: `JumpToFirstUnread` play (R47)                                                                                                                                                                   |
| R48         | `MessageList.spec.tsx`: "draws the target with the editing look for two seconds (R48)"                                                                                                                    |
| R49         | `MessageList.spec.tsx`: "keeps the highlight of each list apart (R49)"                                                                                                                                    |
| R50         | `MessageList.spec.tsx`; `src/Message/hooks/useIsMessageEmphasized.spec.tsx`: "draws the edited message and the jumped-to one emphasized (R50)"                                                            |
| R51         | `MessageListDateBubble.spec.tsx`; stories: "shows the day only while the viewer scrolls and a second after (R51)"; `FloatingDate` play                                                                    |
| R52         | stories; `MessageListDateBubble.spec.tsx`: `FloatingDateNeverDoublesADay` play (R52); "hides over a covering divider (R52)"                                                                               |
| R53         | `MessageListDateBubble.spec.tsx`; `MessageList.spec.tsx`: "throws outside a MessageList (R53)"; "composes the date alone (R53)"                                                                           |
| R54         | stories; `MessageList.spec.tsx`: `ReportsWhatIsVisible` play (R54)                                                                                                                                        |
| R55         | stories; reducer spec: `ReportsWhatIsVisible` play (R55); "asks for a report after a resize (R55)"                                                                                                        |
| R56         | stories; reducer spec: `ReportsWhatIsVisible` play (R56); "reports being at the bottom right after a jump to the last message (R56)"                                                                      |
| R57         | `MessageList.spec.tsx`; stories: "answers getVisibility synchronously and with undefined before any report (R57)"                                                                                         |
| R58         | `MessageList.spec.tsx`: "reports nothing while the first page loads or without messages (R58)"                                                                                                            |
| R59         | `MessageList.spec.tsx`; `position.spec.ts`: "reports its position when it unmounts and not without messages (R59)"                                                                                        |
| R60         | `position.spec.ts`; stories: "restores the bottom, the message at its offset or the bottom (R60)"; `RestorePosition` play                                                                                 |
| R61         | stories; reducer spec: `RestorePositionOfAListThatMountsEmpty` play (R61); "applies the position of the first messages listed (R61)"                                                                      |
| R62         | `MessageList.spec.tsx`; stories: "opens at the bottom without a position (R62)"; `RestorePosition` play                                                                                                   |
| R63         | `position.spec.ts`: "reuses the measurements only for the same first rows at the same width (R63)"                                                                                                        |
| R64         | `MessageList.keepMounted.spec.tsx`; stories: "keeps messages with a live embed mounted and no other (R64)"; `KeepsLiveEmbedsMounted` play                                                                 |
| R65         | `MessageList.keepMounted.spec.tsx`: "keeps the held row mounted and no row for other state (R65)"                                                                                                         |
| R66         | `src/hooks/useMessageListNavigation.spec.tsx`; `MessageList.spec.tsx`; stories: "follows the keyboard model of a list of rows (R66)"; `KeyboardIntoUnrenderedRows` play                                   |
| R67         | `useMessageListNavigation.spec.tsx`; `useItemListNavigation.spec.ts`: "leaves to the composer and to the top of the room (R67)"                                                                           |
| R68         | `useItemListNavigation.spec.ts`: the video and audio Tab, Left and Right, move-row shortcut, Escape and text field tests (R68)                                                                            |
| R69         | reducer spec; stories: "scrolls to the top and stays there (R69)"; `ScrollToTop` play                                                                                                                     |
| R70         | `MessageList.spec.tsx`: "does not touch a selection (R70)"                                                                                                                                                |
| R71         | `MessageList.renders.spec.tsx`: "does not render rows for a change of its own scroll state (R71)"                                                                                                         |
| R72         | `MessageList.renders.spec.tsx`: "renders only the new row when a message arrives (R72)"                                                                                                                   |
| R73         | `MessageList.renders.spec.tsx`: "renders each row at most once more when a highlight starts and ends (R73)"                                                                                               |
| R74         | `MessageList.spec.tsx`: "has a story for each behaviour of the list (R74)"                                                                                                                                |
| R75         | `MessageList.spec.tsx`; `MessageListConversation.spec.tsx`: "has no accessibility violations (R75)" for each story                                                                                        |
| R76         | `MessageListConversation.stories.tsx`; `MessageListConversation.spec.tsx`: `Room`, `SelectionMode` play (R76); axe over the six stories                                                                   |
| R77         | `src/index.spec.ts`: "exports the list (R77)"                                                                                                                                                             |
| R78         | `MessageList.spec.tsx`; ui-client `useViewportScrollbars.spec.tsx`: "renders with no provider (R78)"; "updates the scrollbars when the content grows (R78)"                                               |
| R79         | ui-client `useFormatDate.spec.ts`, `useViewportScrollbars.spec.tsx`; mock-providers `fixtures.spec.ts`: "formats with the date setting (R79)"; "returns the same values for the same input (R79)"         |
| R80         | `geometry.spec.ts`; reducer spec; stories: "counts the threshold (R80)"; "keeps the bottom within a non-default threshold and returns to the true bottom (R80)"; `BottomThreshold` play with 60 (R80)     |
