# The message list keeps virtua, renders typed rows in its own viewport, and scrolls from a pure reducer

- **Status:** proposed
- **Date:** 2026-10
- **Scope:** `packages/ui-client/src/components/MessageList`, `packages/ui-client/src/components/Message`, and in Part 2 the
  room and thread lists in `apps/meteor`

## Decision

One message list, in `@rocket.chat/ui-client`, serves the room, threads and every other list of messages
([features/message-list](../features/message-list/README.md)):

- **virtua stays the virtualizer.** The list renders virtua's `Virtualizer` into a viewport element it renders itself,
  so the scroll element exists at the first layout, and attaches the overlay scrollbars to that element afterwards.
- **The header and the loaders are rows.** One pass builds typed rows (older loader or header, messages, newer loader)
  and is the only place that maps a message id to a row index.
- **Scrolling is decided by a pure reducer**: events in (user input, scroll, resize, data committed, jump target, load
  settled), state and commands out (scroll to a row, load a page, highlight). A thin hook feeds it from the DOM and
  carries out its commands on virtua. Its state is an anchor (bottom, a message, none) and a phase (positioning, idle);
  only user input releases an anchor.
- **Data changes are classified by where they happened** (start, end, both, middle, everything) and decide virtua's
  shift mode before the render that commits them; a change at both ends is committed in two steps.
- **Message components are presentational.** Every capability of the app reaches them through intent-named contexts;
  markdown, UiKit and emoji renderers are injected, since `gazzodown` and `fuselage-ui-kit` depend on ui-client.

## Why

- The room and thread lists were two copies of the same idea, each with mutable refs recomputed by hand (`isAtBottom`
  with different thresholds), prepend mode guessed from an offset, re-centering loops over animation frames and
  timers, and index arithmetic spread over several files. Each of those produced bugs that fixed the symptom in one
  copy only.
- A reducer turns every scroll rule into a row of a table test. The rules that matter are about intent (did the viewer
  scroll, or did the list?), which refs and timers could only approximate.
- virtua already does the hard part — measuring, shift mode, re-resolving a scroll target until sizes settle — and
  both lists used it.

Rejected alternatives:

- **Header and loaders as siblings with `startMargin`.** The header changes height late (avatars, an asynchronous
  retention warning) and replaces the loader when history runs out; virtua's shift mode corrects for rows, not for a
  margin, so the visible messages jumped.
- **IntersectionObserver sentinels for paging.** A sentinel that stays in view does not fire again, so a short page
  in a tall viewport never filled it. A geometry check after every scroll and every commit does.
- **An arithmetic fake of virtua for tests.** virtua's behavior lives in its jump timing, shift mode and its 150ms
  re-resolve loop; a fake would only test itself. The reducer is tested as a table, and anything that measures is
  tested in a real browser through story play functions.
- **Restoring by offset only.** Offsets saved against one set of measurements land elsewhere once rows are measured
  again or messages are added; restoring the top message at its offset, with the measurement cache only as an
  accelerator when it still describes the same rows, does not.
- **Writing `scrollTop` to keep an anchor.** virtua reverts it in the same frame while it re-resolves its own target;
  every re-application goes through `scrollToIndex`.

## Consequences

- Part 1 copies the message components into ui-client; until Part 2 replaces the meteor lists, a fix to
  `apps/meteor/client/components/message` must be ported to the copy.
- jsdom cannot render the virtualized list, so component specs replace the module that wraps virtua with a renderer
  of every row, and `ui-client` runs story play tests in CI (`test-storybook`).
