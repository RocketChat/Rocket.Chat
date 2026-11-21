# Writing a G0 characterization spec

A G0 spec records what a component does on `develop` before it is rewritten. The rewrite must pass it unedited, so the spec
asserts behavior a consumer can observe, never how the component is built.

The spec is a Storybook `play` function, so one source runs twice:

| Where                                | Command                                                                                   |
| ------------------------------------ | ----------------------------------------------------------------------------------------- |
| jsdom, runtime build                 | `yarn workspace @rocket.chat/fuselage jest src/testing` (or the whole suite)              |
| Chromium, any Storybook build        | `yarn workspace @rocket.chat/fuselage test:stories <storybook-static dir>`                |

For the zero-runtime build, build it first: `FUSELAGE_ZERO_RUNTIME=1 yarn build-storybook --output-dir <dir>`.

## The story file

Put the specs in `<Component>.characterization.stories.tsx` next to the component. Tag the file `['g0', '!autodocs']`: both
runners pick the `g0` stories only, and the visual regression job skips them. See
[Button.characterization.stories.tsx](../components/Button/Button.characterization.stories.tsx) for the reference.

Import the helpers from `../../testing/g0`, and `expect` and `fn` from `storybook/test`. Await every assertion.

| Helper                                                 | Asserts                                                                                            |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `expectForwards(canvas, part, props)`                  | `id`, `title`, `data-*`, `aria-label` reach the element, `className` follows the `rcx-*` classes, the `ref` is set, handlers fire |
| `ariaSnapshot(root)`                                   | the accessibility tree: role, name, states; compare it to a literal                                |
| `classContract(root)`                                  | the `rcx-*` classes of each element by path; compare it to a literal                               |
| `expectKeyboardActivation`, `expectTabOrder`           | Enter and Space on a control; the Tab order                                                        |
| `expectCompositeList`, `expectCombobox`, `expectMenu`  | the three keyboard models of [list-keyboard-navigation.md](../../../../docs/frontend/list-keyboard-navigation.md) |

A computed style is read in the browser only: guard it with `isJsdom()`. `forcePseudo(element, 'hover')` applies a state that a `play`
function cannot drive with the pointer (storybook-addon-pseudo-states rewrites every `:hover` rule to a `.pseudo-hover` one), and
`expectComputed(element, property, value)` waits for the style to settle. `atViewport(width, storyId, read)` renders another story in an
iframe of that width, for the media queries of a narrower viewport.

## What a spec covers

- **Forwarding**: render the component with `className`, `id`, `title`, `data-qa`, `data-anything`, `aria-label`, a `ref` and the handlers, for
  every part the consumer can reach (root, and each slot that takes props).
- **Handlers and states**: a disabled or loading control fires nothing.
- **Keyboard**: the model that fits the component.
- **Accessibility tree and class contract**: one story rendering every variation, compared to a literal in the spec. End-to-end tests locate
  elements by these classes, so a change to the contract is an intended API change.

## Rules

- No sleeps and no timing assumptions: assert what the user sees after the event.
- Do not assert implementation: no hashed `rcx-css-*` classes, no inline styles, no mock of an internal hook.
- Keep literals readable: build a multi-line expected value with `[...].join('\n')`.
- `play` runs in jsdom without the Storybook decorators and in the browser with them, so the helpers take the story root
  (`canvasElement`) and never `document.body`.
- Two more checks need no spec: `textNodes.spec.tsx` renders every story and fails on a text node under a `View`, and
  `yarn workspace @rocket.chat/fuselage test:verify` covers `scripts/verify/frame-platform.mjs`, which fails a Tamagui frame that
  imports `react-dom` or names a DOM-only type.
