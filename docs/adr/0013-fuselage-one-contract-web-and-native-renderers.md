# ADR 0013 — Fuselage is one platform-neutral contract with web and native renderers

- **Status:** accepted; extends [ADR 0011](0011-fuselage-components-take-no-styling-props.md) and replaces its
  "accepts DOM and ARIA attributes" wording with the neutral set below
- **Date:** 2026-11
- **Scope:** `packages/fuselage`, `packages/fuselage-tokens`, the Tamagui config, the web palette adapter
  (`PaletteStyleTag`), every package and app that renders Fuselage components, the future React Native client

## Context

Fuselage is moving to Tamagui ([fuselage-tamagui-components.md](../frontend/fuselage-tamagui-components.md)), and a
React Native client is planned on the same library. The migration as first cut treated a Fuselage component as a web
component with a native port beside it:

- **Frame values were `var(--rcx-*)`.** The Tamagui config had no tokens and no themes, so a native client needed a
  second, generated value set: two sources of rendered truth.
- **The contract was DOM-shaped:** `onClick`, HTML attributes, `is` tags. A `.native.tsx` sibling mapped `onClick` to
  `onPress`.
- **`rcx-*` classes and `--rcx-*` variables were treated as public API,** because workspace admins' Custom CSS targets
  them. Specs asserted on classes, and a class change required a `@rocket.chat/meteor` changeset.
- **The npm build was web-locked:** it bundled the Tamagui runtime and forced `TAMAGUI_TARGET=web`.

A review of the open migration batches found the first three in every layer, so the batches are regenerated on the
decisions below instead of being amended.

This repository has no React Native app and no `react-native` dependency. What this ADR says about native is a
contract to build against, not something measured here.

## Decision

The component contract is platform-neutral, and the web is one renderer of it.

### Layers

| Layer | Content | Shared |
| --- | --- | --- |
| L0 Tokens | Colour, space, size, radius, font scale, z-layer, motion; the light, dark and high-contrast themes | All |
| L1 Primitives | `View`, `Text`, `Stack`, `Pressable`, `Icon`, `Image`, `ScrollArea`, `Overlay`, `TextField`. The only layer that imports `@tamagui/*` | Frames shared; `Image`, `Icon`, `Overlay`, `ScrollArea`, `TextField` per platform |
| L2 Components | `Button`, `Tag`, `Avatar`, `Field`, `Item`, the Message parts | Shared, split only where structure differs (`Menu`, `Select`, `Modal`, `Tooltip`, `Dropdown`) |
| L3 Behaviour | Headless hooks: press, selection, disclosure, list navigation, focus management; `measure(ref)` | Interface shared; react-aria on web, React Native accessibility and gestures on native |
| L4 Containers | `Page`, `Contextualbar`, `FilterBar`, sheets, in `ui-client` or the app | Per platform, same names where the role exists on both |

A component imports L0, L1 and L3, never a platform API. Platform code lives in `*.web.tsx` and `*.native.tsx` leaves
of L1 and L3, and in the few L2 components that differ structurally.

### Decisions

1. **Tokens and themes live in the Tamagui config.** Frames reference `$tokens` and theme keys, never
   `var(--rcx-*)`. Units are unitless numbers; direction uses logical properties.
2. **The contract is neutral.** Props are the declared variations, `children`, and the neutral set: `role`, a
   declared subset of `aria-*`, `testID`, `ref`. Events are semantic: `onPress`, `onLongPress`, `onChange(value)`,
   `onOpenChange`, `onSelect`, `onDismiss`, with no DOM event object. Each component declares its contract in
   `<Component>.contract.ts`; platform extras are a typed extension (`ButtonProps = ButtonContract & PlatformProps`),
   and on web they add `id`, `data-*`, `className`, `href`/`rel` and the closed `is` set. Shared code type-checks
   against the contract alone. `onClick` stays on web only as a `@deprecated` alias of `onPress` for one to two
   majors, and a codemod ships with the release that starts the deprecation.
   The `ref` handle is only `{ focus(), blur() }`. A DOM element and a React Native host component both satisfy it
   as they are, so the web keeps handing out the element itself, with no imperative handle in between. Geometry is
   not part of the handle: `measure(ref)` is an L3 utility resolved per platform, reading `getBoundingClientRect`
   in its `.web` leaf and `ref.measure` in its `.native` leaf.
3. **`rcx-*` classes and `--rcx-*` variables are not public API.** They carry no guarantee and no alias. Custom CSS
   that targets them breaks silently, so the release that changes them carries a strong release note.
4. **One package.** `@rocket.chat/fuselage` holds `.web` and `.native` files beside a shared contract file. CI keeps
   graph receipts both ways: the web client contains no `@tamagui/*`, `react-native` or `*.native.*`; the native
   bundle contains no `react-dom`, `react-aria` or CSS import.
5. **The native theme is a static palette bundled in the app.** Native ignores the server's custom palette.
6. **Native scope is chat first,** starting from the Message row. The contract and L3 are designed for the whole app;
   `Menu`, `Select` and overlays come later, each with an explicit per-platform decision.
7. **Native delivery is unbundled ESM.** `@tamagui/core` is a peer dependency, so an app has one runtime. Export
   conditions: `react-native` points to unbundled ESM with `@tamagui/*` external, `source` serves monorepo apps that
   compile zero-runtime, `default` is the bundled web build. The native entry exports only what native implements,
   so a missing component is a compile error.
8. **Font scaling follows the OS on native and `rem` on web.**
9. **The Tamagui patches are accepted for now,** with no upstream plan and no exit criterion yet. The tokens add
   one: `@tamagui/web` keeps the full name of a theme variable, because Tamagui shortens a name a theme rule
   declares past 41 characters while a compiled class reads the full one. It is accepted for now like the others.
10. **Hover-only affordances belong to the application.** The message toolbar stays in the library as a plain
    visual component; the application decides when it appears (row hover and keyboard focus on web, long-press or
    swipe on native). Library primitives accept `onLongPress` and swipe gestures without depending on a gesture
    handler.
11. **Light, dark and high-contrast are build-time themes in the config.** Frames use `$keys`. On web,
    `PaletteStyleTag` stays the only run-time palette writer and emits both variable families on the scope selectors
    it uses today: the theme keys a frame reads, `--rcx-<key>`, and the palette variables the stylesheets read,
    `--rcx-color-<key>`. There is no run-time Tamagui theme object.

### Requirements from the spikes

- **Unresolved-token gate.** The zero build fails when its stylesheet contains `$`: an unknown token is otherwise
  emitted as written, with no bail.
- **Theme class owner.** With `addThemeClassName: false` a frame has no colour unless a theme class sits below
  `<html>`, so one owner sets it. The run-time path (Jest, npm consumers) needs the theme CSS shipped with the
  package.
- **Theme keys are prefixed in their own names.** `TAMAGUI_CSS_VARIABLE_PREFIX` does not work under zero-runtime.
- **`radius.none` is renamed.** Tamagui rejects it as a reserved CSS keyword.
- **Palette bridge.** The adapter writes both variable families on the same scope selector and does not rely on a
  `.t_*` class. Three variants fail: the adapter on the element that carries the theme class, keys that alias
  `var(--rcx-color-<key>)` where the class sits, and the prefix environment variable.
- **Direction is a variant,** `direction: { ltr, rtl }`, driven by a direction context. `--rcx-dir` goes.
- **Per-component style hooks disappear** (`--rcx-button-*-style` and the like), as decision 3 implies.

### Verification

The G0 characterization specs query role, name and state and fire semantic events, so the same specs can run on both
platforms. `classContract` assertions stay as an internal regression net: they are not a public contract and not a
review gate.

Every pull request of the migration is atomic: it matches this ADR when it is reviewed and can be reverted alone.
Nothing is merged provisionally to be corrected by a later one.

## Why

- **One value set.** With tokens in the config, web compiles them to CSS variables and native reads the same
  config, so no generator emits a second set that can drift.
- **A DOM-shaped contract cannot be shared.** `onClick` and a DOM event have no native meaning. `role` and `aria-*`
  are understood by React Native, so ARIA works as the shared accessibility vocabulary.
- **A class contract freezes the DOM.** As long as `rcx-*` is API, no component can change its structure, and
  native has no classes at all.
- **Two packages drift.** A component missing on native should fail the build, not fall back at run time.

### Evidence from the spikes

Both ran on draft branches that are not merged, on Tamagui 3.0.18.

- **Tokens under zero-runtime: go, with changes.** No bail on 16 frames in an enforce build; token and theme-key
  values compile inside variant tables and state objects; a theme switch is a class swap with no `ThemeProvider`,
  at about 3.8 kB of CSS per theme.
- **Run-time palette theme on web: go, after rewording decision 11.** The zero compiler rejects `updateTheme`,
  `ThemeUpdate` with dynamic values and `TamaguiProvider`. Build-time themes plus the adapter showed no measurable
  cost on 150 Message rows (mount +3.4%, update −9%, palette switch −10%). Only 149 of 1099 palette references were
  converted.
- **Why the bridge is required.** Without it, in dark mode a Message body read `--font-default: #2f343d` while
  `--rcx-color-font-default` on the same element was `#c1c7d0`.

### Alternatives rejected

- **react-strict-dom.** Immature.
- **NativeWind, Unistyles.** No variant model shared with a zero-runtime web output.
- **vanilla-extract, Panda.** Web only.
- **A separate `fuselage-native` package.** Guarantees drift between the two.
- **A run-time Tamagui theme object on web** (the first wording of decision 11). Rejected by the zero-runtime
  compiler. A full-runtime island would make it work at about +28.6 kB gzip, and is only worth it if a true
  run-time theme object becomes a requirement.
- **Finish the open batches and fix forward.** Every later batch would build on values, handlers and classes this
  ADR removes.

Tamagui stays, isolated behind L1, so leaving it later touches one layer.

## Consequences

- **Custom CSS breaks without warning** on instances that target `rcx-*` classes or `--rcx-*` variables. The release
  note is the only mitigation.
- **A custom theme differs between web and mobile,** because native uses the bundled palette.
- **The web A/B reopens once** for every migrated frame when its values become token references, proven by
  computed-style comparison.
- **npm consumers install `@tamagui/core` themselves** and move from `onClick` to `onPress` within the alias window.
- **Dense rows need a font-scale cap** on native (message row, composer), and layouts need testing at large sizes.
- **The patches are fork pressure.** Each needs a verdict on whether native still needs it.
- **When the message toolbar appears moves to the app,** and some native L3 work comes earlier to support
  long-press and swipe.

## Open

- The release that carries the Custom CSS release note and starts the `onClick` deprecation with its codemod: to be
  defined.
- Shorten theme keys below Tamagui's 41-character limit so the patch that keeps full variable names can be dropped.
- Cost and approach for the 950 palette references the spike did not convert, nested inside component variables and
  shadows.
- A native verdict for each Tamagui patch.
- Tamagui performance on Hermes with a long message list, and a native budget for it.
- Whether the full-runtime island is ever needed.
