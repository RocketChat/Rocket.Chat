# ADR 0008 — Fuselage components take no styling props

- **Status:** accepted
- **Date:** 2026-10
- **Scope:** `packages/fuselage`, every package and app that renders Fuselage components, `scripts/scan-style-props.mjs`, the lint job in `.github/workflows/ci-code-check.yml`

## Decision

A Fuselage component accepts DOM and ARIA attributes (`id`, `role`, `aria-*`, `data-*`, event handlers, `ref`) and
the variations it declares itself. Nothing else: no `Box` styling prop (`margin*`, `width`, `flexGrow`, `fontScale`,
`color`…), no free `is`, no `rcx-*` prop.

- **The container owns layout.** Spacing between siblings is `gap` on the parent (`Stack`, `ButtonGroup`,
  `FieldGroup`, a `Box`). Sizing and flex-child behavior belong to the parent's layout. Spacing a component needs
  for itself, such as the icon inside a `Button`, lives in that component's styles.
- **An override that is a real option of the component becomes a declared variation**, with a closed set of values:
  `Button` `compact`, `ButtonGroup` `stretch='equal'`, `Divider` `flush` and `variation='light'`, `Icon` `color` restricted to the
  semantic tokens, `FieldRow` `justify`, `Skeleton` `width`/`height`/`inverted`, and so on. The full list is the
  changeset of #42974.
- **`is` is a closed set where the component needs one:** `Button`/`IconButton` render as `'button' | 'a'`,
  `TableCell` as `'td' | 'th'`.
- **`Stack` and `PopoverSurface`** are the components that replace the most common `Box`-props compositions: a
  flex row or column spaced by `gap`, and the raised scrolling surface of a dropdown.
- **`Box` keeps its styling props.** It stays the styling primitive and the escape hatch for layout in the app.
- **CI holds the line.** `scripts/scan-style-props.mjs` counts JSX use-sites: each use of a component that passes it
  a styling, `is` or `rcx-*` prop it doesn't declare, and each element laid out by `Margins`/`Scrollable`, is one
  finding however many props it passes. The lint job fails when the count exceeds `--max 1`. The one
  finding left, the ContactInfo conflicts `Callout`, stays until `Callout` has an API to centre its icon. The check
  is on the total, so a change that removes that finding and adds another one still passes.

The migration landed in #42974 (scanner count 914 → 1); the scanner and the CI step in #43056. The data behind
the decision, per component and per prop category, is in
[docs/proposals/fuselage-component-style-props.md](../proposals/fuselage-component-style-props.md).

## Why

Almost every component rendered `<Box {...props}>`, so any `Box` styling prop worked on any component whether its
type declared it or not.

- **No API boundary.** 804 use-sites outside Fuselage set the margins, sizes, flex behavior, colours and
  typography of 57 components. A component's look was whatever its callers passed, so no change to a component
  could be checked against its own stories alone.
- **Ambiguous props.** `Box`'s `size` sets width and height with `!important`; `size` on `Icon`, `Avatar` or
  `Button` is the component's own size. `color`, `width` and `height` collide the same way.
- **Implicit layout.** `Margins` and `Scrollable` injected props into the first `Box`-based element below them,
  out of sight at the use-site. 86 elements were laid out that way.
- **Huge prop types.** `BoxProps` carries 103 styling props plus every HTML and SVG attribute: slow typechecks, and
  `aria-*` typed as `Booleanish`.
- **It blocks the Tamagui pilot (#42942).** A component spreading props of unknown shape onto its frame can't be
  flattened by Tamagui's compiler, needs a second styling engine (css-in-js, unlayered and `!important`) at render
  time, and has no React Native equivalent. Landing this first lets the pilot drop `useTamaguiBoxProps` and export
  components as frames.

### Alternatives rejected

- **Keep the margins, move them to a wrapper `Box` at each use-site.** Mechanical and pixel-identical, but it moves
  the same layout decisions one element up and doubles the DOM. Spacing between siblings is the container's job;
  `gap` says it once.
- **Declare every used `Box` prop on the component's type.** Turns 800 overrides into public API, with all the
  ambiguities above, and leaves the Tamagui spread problem as it is.
- **Narrow `Box` too, in the same change.** 1,844 use-sites and a different question (tokens only, or layout
  primitives instead of `Box`). It is tracked separately; [docs/frontend/layout.md](../frontend/layout.md) is the
  current rule for raw `Box` in screens.
- **Remove `BoxProps` from the types first and fix what breaks.** One unreviewable change across every app.
  Migrating per component, each proven by a Storybook A/B, kept every visual change visible and decided one by one.

## Consequences

- A layout need that a component doesn't cover is a new declared variation, reviewed with design, or layout on
  the container. Passing a styling prop to a component fails CI even where TypeScript still allows it.
- Component prop types still include `BoxProps`, and `Margins`/`BoxTransforms` are still exported. Removing them
  is the breaking step planned for 9.0.0; from then on TypeScript rejects styling props and the scanner's count
  must stay at zero.
- The scanner doesn't see props passed through a spread, props computed at runtime, or styling applied through
  `className` and app CSS. Those stay a review concern.
- The migration added 82 wrapper `Box`es in the app, accepted on purpose; `scripts/scan-raw-layout.mjs` was raised
  to `--max 1248` for them. Replacing them with named layout containers or `Stack` brings that count back down.
- A few layouts changed by up to a couple of pixels. They are listed in the changeset of #42974 and covered by the
  updated visual regression baselines.
