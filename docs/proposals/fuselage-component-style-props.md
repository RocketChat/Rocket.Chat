# Proposal: Fuselage components take no styling props

## Status

Proposal. Measured on `develop` at `36b596b453`.

## Decision

A Fuselage component accepts:

- **DOM and ARIA attributes:** `id`, `role`, `aria-*`, `data-*`, event handlers, `ref`.
- **The variations it declares itself:** `size`, `variant`, `small`, `color` on `Icon`, `width` on `Skeleton`, and so on.

Nothing else. Its props type no longer includes `BoxProps`, and it no longer forwards styling props to the `Box` it renders. That means no `margin*`, `width`, `flexGrow`, `fontScale`, `color`…, no free `is`, no `rcx-*` props and no `className` as a `cssFn`.

`Box` stays the styling primitive (see "Out of scope").

This lands on `develop` first. The Tamagui pilot (PR #42942) is then rebased on top of it.

## Why

On `develop`, almost every component renders `<Box {...props}>`. Any `Box` styling prop therefore works on any component, whether its type declares it or not.

| Problem                                                                                                                                                                                                     | Today                                                                                                   |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **No API boundary.** A component's look is whatever the caller passes.                                                                                                                                      | 804 use-sites outside Fuselage set 57 components' margins, sizes, flex behavior, colors and typography. |
| **Ambiguous props.** `Box`'s `size` sets width and height with `!important`, but `size` on `Icon`, `Avatar` or `Button` means the component's own size. `color`, `width` and `height` collide the same way. | Callers can't tell from the name which one they get.                                                    |
| **Implicit layout.** `Margins` and `Scrollable` inject props into the first `Box`-based element below them, through `BoxTransforms`, out of sight at the use-site.                                          | 86 elements are laid out this way.                                                                      |
| **Huge prop types.** `BoxProps` carries 103 styling props plus every HTML and SVG attribute.                                                                                                                | Slow typechecks, and `aria-*` typed `Booleanish`.                                                       |

On the Tamagui pilot it gets worse, which is why this lands before it:

- **The compiler can't flatten components.** A component that takes styling props spreads `{...props}` of unknown shape onto its frame. Tamagui's compiler can't prove the spread holds no style, so it bails (`local/unsafe-style-spread`). And because `Box` styling props are not Tamagui props, the component can't be exported as a frame either: a hook (`useTamaguiBoxProps`) has to turn them into a css-in-js class at render time.
- **Two styling engines per element.** Tamagui plus css-in-js. The css-in-js rules are unlayered and `!important`, so they fight the cascade layers the pilot relies on. Removing css-in-js from a `Button` with four styling props saved 7% of its mount time.
- **No React Native path.** css-in-js doesn't exist there, and the `Box` grammar (`fontScale`, `elevation`, `withTruncatedText`, `size` as width and height) has no native equivalent.

Spreading `...props` stays fine. A component still forwards DOM and ARIA attributes to its root. What changes is that those props no longer include styling.

## What the code does today

`scripts/scan-style-props.mjs` scans every `.tsx`/`.jsx` file in `apps/`, `ee/` and `packages/` (stories and specs excluded) with an AST.

It reports each JSX use of a Fuselage component that passes:

- a `Box` styling prop the component doesn't declare itself;
- an `is` prop it doesn't declare;
- an `rcx-*` prop.

It also reports every element `Margins` or `Scrollable` lays out. `Box`, `Margins`, `Scrollable` and the `Flex*` primitives are not reported, since they are where styling props belong.

|                                                                     | Use-sites |
| ------------------------------------------------------------------- | --------- |
| Outside Fuselage (apps and other packages) passing undeclared props | **804**   |
| Inside Fuselage (one component styling another)                     | 45        |
| Laid out by `Margins`/`Scrollable`, outside / inside Fuselage       | 75 / 11   |
| Components receiving them                                           | 57        |

Prop uses by what replaces them:

| Category                 | Props                                                                         | Uses |
| ------------------------ | ----------------------------------------------------------------------------- | ---- |
| Dimensions               | `width`, `height`, `size`, `min*`, `max*`                                     | 381  |
| Spacing between siblings | `margin*`                                                                     | 343  |
| Own content layout       | `display`, `padding*`, `align*`, `justify*`, `position`, `inset*`, `overflow` | 169  |
| Flex child               | `flexGrow`, `flexShrink`, `flexBasis`, `alignSelf`, `order`                   | 146  |
| Visual                   | `color`, `backgroundColor`, `fontScale`, `border*`, `elevation`, `text*`      | 143  |
| Polymorphism             | `is` on a component that doesn't declare it                                   | 41   |
| `rcx-*` class props      |                                                                               | 26   |

Components that receive the most:

| Component    | Sites | Mostly                                                                   |
| ------------ | ----- | ------------------------------------------------------------------------ |
| `Skeleton`   | 179   | `width` 130, `height` 97, `marginBlockEnd` 32                            |
| `Icon`       | 119   | `color` 50, `marginInlineEnd` 49, `alignSelf` 9                          |
| `Button`     | 71    | `width` 15, `marginInlineStart` 12, `marginBlockStart` 11, `flexGrow` 11 |
| `Callout`    | 44    | margins only                                                             |
| `FieldLabel` | 44    | `is` 14, `alignSelf` 11, `flexGrow` 8, `fontScale` 6                     |
| `IconButton` | 41    | margins 18, `position` 6, `flexGrow`/`flexShrink` 8                      |
| `Field`      | 33    | `marginBlockStart` 10, `flexShrink` 10                                   |
| `TableCell`  | 26    | `is` 19, `width` 8                                                       |
| `Divider`    | 23    | margins 25                                                               |
| `TextInput`  | 20    | `flexGrow` 16                                                            |
| `Tile`       | 20    | `padding*` 20, `width` 9, `overflow` 8                                   |
| `Label`      | 20    | `fontScale` 9, margins 11                                                |
| `FieldRow`   | 16    | `justifyContent` 10                                                      |

Elements laid out by `Margins`, by component: `Callout` 12, `Icon` 12, `Field` 11, `Skeleton` 6, `Button` 5, `InputBox` 5, `Tag` 5, `Throbber` 4. `Scrollable` lays out three `FieldGroup`s.

**Not covered by the scan:**

- props passed through a spread (`{...props}`), and props computed at runtime;
- styling applied with `className` strings or app CSS.

The declared-prop check reads each component's own source (typed members, `Pick<BoxProps, …>` and destructured parameters), so a prop declared somewhere else is reported as undeclared.

## Replacing each category

| Category                     | Replacement                                                                                                                                                                                                                                                                                                                             |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Spacing between siblings** | The container spaces its children: `gap` on `ButtonGroup`, `FieldGroup`, a `Box`, or the component that owns the layout. Values follow the space scale (docs/proposals/fuselage-spacing-scale.md, PR #42973). A margin that isn't spacing between siblings (focus-ring room, an optical nudge) is a bug in the component that needs it. |
| **Dimensions**               | A declared variation where the component has one: `Skeleton` `width`/`height`, `Icon`/`Avatar`/`Throbber` `size` (already declared), a full-width variation on `Button`. Otherwise the container sizes the slot (`Box` around it, or a grid column). Values are plain pixels, not `x<n>` (spacing-scale proposal).                      |
| **Flex child**               | The parent decides: `alignItems`/`justifyContent` on the container, or a `Box` around the child for `flexGrow`. `TextInput flexGrow` (16) is a full-width input in a row: a declared variation, or the row's layout.                                                                                                                    |
| **Own content layout**       | A variation when the layout is a real option of the component (`FieldRow` alignment, `ModalFooter` alignment). Otherwise the caller is overriding the component's internals, which needs a design review.                                                                                                                               |
| **Visual**                   | A variation when it is part of the component's design (`Icon` `color` from the text and icon color tokens, `Label`/`ModalContent` text scale). Otherwise a design review.                                                                                                                                                               |
| **Polymorphism**             | A declared, closed set where the component needs it (`TableCell` as a header cell, `FieldLabel` as `span`/`legend`). `Button`'s `is='a'` is already declared.                                                                                                                                                                           |
| **`rcx-*` props**            | Removed. A class a caller needs is a `className`.                                                                                                                                                                                                                                                                                       |
| **`Margins`/`Scrollable`**   | `Margins` is deprecated in favor of `gap` on the container. `Scrollable` renders its own scroll container instead of injecting a class into its child.                                                                                                                                                                                  |

## Plan

Each step is its own pull request, revertible on its own.

1. **Scanner** (#43056): `node scripts/scan-style-props.mjs [out.json]` lists every site with its `file:line`. Each migration step uses it to find its sites and to prove it found them all.

   CI runs it with `--max <n>` in the lint job (`.github/workflows/ci-code-check.yml`), failing when a change adds a finding. The count grows with `develop` otherwise: 26 sites appeared in the 55 commits of the day after the measurement above. Each migration pull request lowers `n` to its new count.

2. **Declare the legitimate variations** the data shows, as additive API with no behavior change:
   - `Icon` `color`;
   - a full-width variation on `Button` and `TextInput`;
   - a header variation on `TableCell`;
   - alignment on `FieldRow` and `ModalFooter`;
   - a text scale where design confirms one.

   Each needs a design decision on its values.

3. **Migrate the app, one category per pull request:**
   - spacing first (`gap` instead of margins, `Margins` removed), together with the spacing-scale work;
   - then dimensions, flex child, own layout, visual and `is`;
   - `Skeleton` last, as its own step: its `width`/`height` variation and its 185 sites, once every other component is migrated.

   Every pull request runs the pixel A/B against `develop`. `gap` and a wrapping `Box` can change layout at the edges (wrapping, collapsing margins).

4. **Fuselage's own compositions:** the 45 inside sites and the 11 `Margins`/`Scrollable` ones (for example `Button` passing `marginInlineEnd` to its `Icon`).
5. **Breaking change (9.0.0):**
   - remove `BoxProps` from component prop types, and stop forwarding styling props to the inner `Box`;
   - remove `Margins` and `BoxTransforms`.

   From then on TypeScript rejects any styling prop on a component, and the scanner's count must stay at zero.

6. **Rebase the Tamagui pilot.** `useTamaguiBoxProps` and `withFuselageProvider({ takesBoxTransforms })` go away. Components become exported frames that Tamagui's compiler can flatten at app use-sites (see the pilot's `perf/TAMAGUI-COMPILER.md`).

## Out of scope

- **`Box` itself** keeps its styling props: 1,844 use-sites, and the escape hatch for layout in the app. Whether `Box` should be narrowed too (to tokens, or replaced by layout primitives such as a stack with `gap`) is a separate decision.
- **The values of the new variations.** Each one in step 2 needs a design call.

## Open questions

- Which of the step-2 variations does design accept, and which sites should instead lose the override?
- Should a full-width variation be one shared prop name across components?
- Does `Scrollable` become a component that renders its own element (a DOM change for its three `FieldGroup` users), or go away?
