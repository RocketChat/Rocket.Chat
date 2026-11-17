# Proposal: migrating the views to the isolation rules

## Purpose

Make the screens under `apps/meteor/client/views/` reusable on React Native and testable without Meteor or a browser, by following [view-isolation.md](../frontend/view-isolation.md): presentation takes props, each subpart with data has its own container, screen orchestration in named hooks, no `meteor/*` or `app/**` imports (a lint rule), browser APIs behind named hooks, web-only widgets behind app-owned components. React Native is planned work; every step pays off in tests today.

## Current state

All numbers are approximate (about 10% either way), from a grep that mirrors `scan-view-isolation.mjs` and `scan-raw-layout.mjs`. Verify with the real scans before acting on one.

| Area                      | browser | raw layout | Web-only widgets                                                                           |
| ------------------------- | ------- | ---------- | ------------------------------------------------------------------------------------------ |
| room/messages             | 40      | 144        | virtua `VList` in `MessageList`; Virtuoso in 5 lists; `GenericMenu` about 10; `FocusScope` |
| threads, discussions      | 1       | 22         | `ThreadList` Virtuoso, `ThreadMessageList` virtua, `Thread.tsx` portal                     |
| video conference          | 30      | 18         | `VideoConfList` Virtuoso, `FocusScope` in popups                                           |
| navigation                | 1       | 22         | `RoomList` and `SidePanelInternal` Virtuoso, `FocusScope`                                  |
| admin, audit              | 9       | 286 + 30   | `GenericMenu` about 10, `CodeMirrorBox` portal                                             |
| omnichannel               | 2       | 246        | Virtuoso in 5 files, `GenericMenu` about 6                                                 |
| marketplace               | 6       | 142        | `ScreenshotCarouselAnchor` portal                                                          |
| root, boot                | 80      | 13         | `AppRoot` portal                                                                           |
| directory, account, other | 4       | 116        | `TeamsChannels`, `OutlookEventsList` Virtuoso                                              |

Totals: browser 174, which is the CI ceiling. The 2 `app/**` imports are not in it: the lint rule covers them, each with a disable comment. Raw layout about 1,009 plus about 30 in the audit. Virtuoso has 16 value imports, `GenericMenu` about 35 view files, `createPortal` 4. 46 screens use the `*WithData` container split, which is the pattern to keep.

## What the scans do not see

- `client/components/message/**` (about 8 browser, 44 raw layout, gazzodown, a react-aria toolbar), `client/sidebar/**`, `client/navbar/**` and `client/portals/**` are not scanned.
- 608 imports from `client/lib` and `client/stores` across 380 view files are not counted. `MessageList` reaches the `RoomManager` singleton and `useChat` outside `ui-contexts`. This is the largest unmeasured blocker for React Native.
- The scan counts hooks inside `views/`, so wrapping a browser call in a hook there does not lower the number. It drops only when code is deleted or moves out of `views/`.

## Classifying the browser hits

| Class                          | Hits      | Examples                                                                                                | Fix                                                             |
| ------------------------------ | --------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Trivial                        | about 15  | `window.open` in 7 files, `location.search`, `getElementById`, `navigator.platform`                     | `useExternalLink`, `useSearchParameter`, refs, a shared `isMac` |
| Shared hook, native twin later | about 35  | draft storage, file pick, download, device permissions, app focus, global keydown, scroll               | named hook in `ui-client`                                       |
| Web-only by design             | about 115 | analytics, GTM, bugsnag, iframe auth, OAuth popup, cookies, call window, `IframeModal`, `CodeMirrorBox` | exempt or move out of `views/`                                  |

## Abstractions first

Reuse before writing.

1. `client/hooks/useExternalLink.ts` already exists with 7 consumers.
2. Two `ui-contexts` gaps: `loginWithSamlToken` on `AuthenticationContext`, the session id on `ConnectionStatusContext`. Removes the 2 lint disables on `app/**` imports.
3. `VirtualList`: promote `client/components/PaginatedVirtualList` (virtua; `items`, `renderItem`, `onEndReached` map to a React Native `FlatList`) and add a grouped variant. It covers 16 Virtuoso consumers, 2 of them grouped.
4. `Portal` in `ui-client`, plus a small `MainContentPortal` for `Thread` and `CodeMirrorBox`. 4 sites.
5. `GenericMenu` narrowed to its own props type instead of the web `Menu` props. 49 consumers, about 20 of the 35 in views pass Menu-only props. Needs a changeset.
6. Capability hooks in `ui-client`, each with a `.native.ts` later: `useDraftStorage`, `useFilePicker`, `useDownloadFile`, `useGlobalKeydown`, `useAppFocus`. Host-dependent ones (desktop bridge, notifications, call window) become `ui-contexts` providers, like `DeviceContext`.
7. Message body: the seam exists (`MessageContentBody`, `GazzodownText`, `MarkdownText`); the native twin lives in `client/components/message`.
8. `Select` (73 files) and `FocusScope` (7) belong to the Fuselage native entry. No app wrappers.

## Phases

| Phase | Scope                                                                                                                                                                                                                                                                                                                                                        | Ratchet drop                                                 | PR shape                               | Verification                                                                                                                                                | Effort |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 0     | `widget` scan category (report only); `useExternalLink` sweep; `useSearchParameter` and ref fixes; the 2 context methods, deleting their lint disables; exemption mechanism if chosen                                                                                                                                                                        | 174 to about 160; about 50 if root and conference are exempt | one PR per item, independent           | scans, unit tests                                                                                                                                           | S      |
| 1     | Message list: keep data subscriptions where they are used and extract only the orchestration (jump-to-message, scroll restore); a `MessageListHandle` contract (`scrollToIndex`, `findItemIndex`, `scrollOffset`, `viewportSize`) shared by `useTryToJumpToMessage`, `useStoreScrollPosition`, `ThreadMessageList`; `RoomManager` behind a context; composer storage, file and permission hooks to `ui-client`; `createComposerAPI` stays web-only | browser about 20, raw about 40                               | one PR per extraction | `MessageList.spec`, `useTryToJumpToMessage.spec`, `useKeepAtBottom.spec`, room e2e, room-render bench A/B (jump to message, unread divider, scroll restore) | L      |
| 2     | Threads, discussions: portal seam, `ThreadList` on `VirtualList`                                                                                                                                                                                                                                                                                             | raw 22, browser 1                                            | one PR                                 | thread e2e                                                                                                                                                  | M      |
| 3     | Navigation: `RoomList` and `SidePanelInternal` on grouped `VirtualList`; retire legacy `client/sidebar` rather than migrate it                                                                                                                                                                                                                               | raw 22                                                       | one PR per list                        | sidebar e2e                                                                                                                                                 | M      |
| 4     | Contextual-bar lists (8 Virtuoso consumers); `FileItemMenu` and export PDF on `useDownloadFile`                                                                                                                                                                                                                                                              | browser 9, raw about 30                                      | one PR per list                        | `TeamsChannels.spec` mocks `getComputedStyle` for Virtuoso                                                                                                  | M      |
| 5     | Video conference: exempt the call window; `useVideoConfOpenCall` as one named hook; `FocusScope` into a container                                                                                                                                                                                                                                            | browser about 19 by exemption                                | one PR                                 | video conf e2e                                                                                                                                              | M      |
| 6     | Account, directory: layout containers; pilot                                                                                                                                                                                                                                                                                                                 | raw 16                                                       | one PR per screen                      | Storybook A/B                                                                                                                                               | S      |
| 7     | Omnichannel: mostly raw layout (246), 5 Virtuoso                                                                                                                                                                                                                                                                                                             | browser about 8                                              | one PR per area                        | omnichannel e2e                                                                                                                                             | L      |
| 8     | Admin, marketplace: raw layout (286 + 142), `GenericMenu`, portals                                                                                                                                                                                                                                                                                           | browser about 9                                              | one PR per area                        | admin, marketplace e2e                                                                                                                                      | L      |

Extending the scan to `client/components/message` raises the ceiling by about 50 in wave 1, so lower the ceiling only after that PR is accounted for.

## Parallelism

- Phase 0 PRs are independent of each other.
- Waves 2 to 4 run in parallel once `VirtualList` lands.
- Waves 6 to 8 run alongside everything else.
- Wave 1 is the long pole.

## Risks

- Virtuoso to virtua changes the DOM: e2e locators and flakes.
- Narrowing `GenericMenu` is a semver break for `ee/` consumers.
- Exemptions hide regressions unless the exempt group has its own ceiling.
- The counts are approximate.

## Open decisions

Not decided.

1. Exempt root/boot and the conference window: an explicit list with its own ceiling, move them out of `views/`, or keep counting.
2. Split the scan output into component hits (target 0) and hook hits (a floor).
3. Capability hooks in `ui-client` with `.native.ts`, host-dependent ones as `ui-contexts` providers.
4. Pilot: `DiscussionsList` (S) before `MessageList` (L).
5. Which areas are in React Native scope. If admin, marketplace and omnichannel are out, waves 7 and 8 are layout only.
6. Extend the scans to `client/components/message` and `client/sidebar`, and start measuring `client/lib` and `client/stores` imports.
7. `VirtualList`: wrap Virtuoso (no behaviour change) or move to virtua (one library, scroll and e2e risk).
