# Handoff: rebuild the Fuselage Tamagui migration, compiled by the app, one component at a time

This is a plan for restarting the Fuselage → Tamagui migration from `develop`. The pilot (#42942, branch `feat/fuselage-tamagui-pilot`) proved the components can be written with Tamagui and stay pixel-identical. But it migrated every component first, then compiled and lowered them inside the library afterwards, so its size can't be attributed to a component and the budget was only checked at the end.

The restart changes where compilation happens: **the app compiles Fuselage's sources with Tamagui's own zero-runtime mode**, the way Tamagui recommends. The library-level lowering is dropped. The build, the measurements and the checks exist before the first component moves, so every component pull request shows what it costs.

## Goal and constraints

- Tamagui stays the authoring tool and the compiler: components are written with `styled()`, which keeps a React Native build possible.
- Tamagui's runtime does not ship to the web: the app's Vite build compiles every Fuselage `styled()` definition and use-site to static classes and CSS.
- Users see no change. Props, `rcx-*` class names, `ref` forwarding and the DOM stay as they are.
- Budgets against `develop`, measured on the app's client bundle: JS at most +10 kB gzip; mounting and updating lists (messages, sidebar, members) at most +10% slower; CSS is free as long as total bytes don't regress.
- `Box` and `@rocket.chat/css-in-js` are a separate track and are out of scope.

## Why the app compiles, not the library

- Tamagui's [design systems guide](https://tamagui.dev/docs/guides/design-systems) ships a component package as source and lets the app compile it.
- Only [zero-runtime mode](https://tamagui.dev/docs/guides/zero-runtime) removes the runtime, and it works on an app:
  - it supports Vite, Next with webpack, or Metro;
  - it needs an HTML entry;
  - it transforms the app's `.tsx` sources;
  - it fails the build if any `@tamagui/*` module is still reachable.
- `develop` already has that app: the standalone web client, `apps/meteor/vite/vite.config.mts`, with its own `index.html`. It runs as `yarn dev:next` in development and as `yarn build:vite` for production. It already compiles most workspace packages from source; Fuselage is in `distOnlyWorkspacePackages` today and moves out of it.
- The pilot needed its own lowering plugin only because it assumed a Meteor/rspack production build that zero-runtime can't run in. With the Vite client as the build that matters, that assumption is gone, and so are the workarounds built for it. See "Pilot workarounds and what happens to them".

What this costs:

- **Zero-runtime is `experimental.zeroRuntime` in Tamagui 3.x.** Pin one exact version and upgrade deliberately.
- **Everything outside the app runs Fuselage uncompiled, with the Tamagui runtime.** This covers other apps installing `@rocket.chat/fuselage` from npm, Jest, and other packages' Storybooks. Fuselage's `dist` stays a plain runtime build, with no compiler and no lowering. The budget applies to the app's client only. Two things follow:
  - **Patches:** the `@tamagui/web` runtime patches stay wherever the runtime runs. They cover React 19 ref cleanups, `forceStyle`/`onLayout` leaking to the DOM, and frames used without a provider (or a `TamaguiProvider` at the consumer's root).
  - **Same output both ways:** a component must render the same compiled or uncompiled. The verification compares the app's compiled output with the runtime one.

## Where things stand

|                                 | `develop` | Pilot (runtime bundled, lowering on) |
| ------------------------------- | --------- | ------------------------------------ |
| `fuselage.production.js` (gzip) | 34.4 kB   | 112.3 kB                             |
| `fuselage.css` (gzip)           | 26.7 kB   | 31.1 kB                              |

- The pilot bundles the Tamagui runtime, about 31 kB gzip. Without it, the pilot would still be around +45 kB JS over `develop`, from component code and the lowered recipes. The restart measures this on the first component.
- The pilot's approach and lessons are in `docs/proposals/fuselage-tamagui.md` (decisions, the checklist) and `docs/proposals/fuselage-lowered-styled.md` (the lowering plugin, now a fallback only).

## Steps

### Step 0: the pipeline on `develop`, no component changed

Each item is its own develop-compatible pull request.

- **Fuselage from source in the app.** Remove `@rocket.chat/fuselage` from `distOnlyWorkspacePackages`, so `dev:next` and `build:vite` compile it from `src` like the other workspace packages. Check: the app's client bundle is pixel-identical on the real-app A/B, and `build:vite` passes.
- **Storybook on Vite.** `@storybook/react-webpack5` → `@storybook/react-vite`, so Storybook can run the same Tamagui plugin as the app. Check: every story pixel-identical to the webpack Storybook.
- **Cascade layers.** The `reset` and `fuselage` layers and the moved global element rules; #43167 already contains them. Land them before any Tamagui code.
- **Size report in CI, on the app.** For each PR, post the JS and CSS gzip of the `build:vite` client against `develop`, and a per-module breakdown (a `rollup-plugin-visualizer` JSON or source-map attribution) filtered to `packages/fuselage/src` and `@tamagui/*`. Measuring the app instead of Fuselage's `dist` matters: compiled use-sites move cost from the library into the app.
- **Verification scripts in the repo.** Commit `story-ab.mjs`, `story-computed.mjs`, `computed-ab.mjs` and `pseudo-check.mjs` (untracked in the pilot worktree's `perf/` today) under `packages/fuselage/scripts/verify/`. `story-computed` must run over every story; the pilot showed the pixel A/B misses real bugs, such as a dropped `order` or the `PureItem` frames losing their styles.
- **Bench pages.** Commit the bench (`perf/bench`) with fixed scenarios: 150 messages, 200 sidebar rows, 300 button groups and the members list. Run it as a Vite app with the same plugin, against `develop`.

### Step 1: the zero-runtime spike, then the plugin, still no component changed

- **Spike first.** Before committing to the plan, prove zero-runtime works on Fuselage source compiled by an app. Use the pilot's `Button` and a small Vite app whose root includes `packages/fuselage/src`, with `experimental.zeroRuntime`. The spike answers:
  - does `Button` compile with no `@tamagui/*` module left?
  - what do `checkZeroGraph` and the rule violations report for it?
  - what root or include setting makes Fuselage's sources, which sit outside `apps/meteor/vite`, count as app sources?
  - are the computed styles and DOM identical to the pilot's runtime `Button`, at rest, hovered, focused and pressed?
  - what does the compiled `Button` cost in JS and CSS?

  If zero-runtime can't compile Fuselage from the app, the pilot's lowering plugin is the fallback; its plan is in `docs/proposals/fuselage-lowered-styled.md`.

- **Then the plugin in the app.** Add `@tamagui/vite-plugin` with `experimental.zeroRuntime` to `apps/meteor/vite/vite.config.mts`, Storybook and the bench app, with Fuselage's sources in its transformed set. Pin `@tamagui/*` to one exact version.
- **`tamagui.config.ts`** lives in Fuselage: no tokens, one static theme, media queries only if a component needs them.
- **The gate is Tamagui's own.** Zero-runtime fails the build if any `@tamagui/*` module stays reachable, which replaces the pilot's `count-unlowered` ratchet. Keep a CI ratchet only on the number of Fuselage components still on SCSS.
- Check: with no component migrated, the app bundle has 0 bytes of Tamagui and `build:vite` passes.

### Step 2: the first component, chosen to answer the budget question

Pick one leaf with variants and states, for example `Button`. The PR moves it and nothing else, and reports:

- the app bundle's JS and CSS deltas, split into component code and generated CSS;
- the bench numbers for 300 button groups;
- `story-computed` over every story that renders a Button, at rest, hovered, focused and pressed.

If the component code or the CSS is the large part, fix the component pattern here, before the other 60 components copy it.

### Step 3 onwards: component by component

Order by dependency, leaves first: `Icon`, `Button`/`IconButton`, `ButtonGroup`, `Tag`/`Chip`/`Badge`, `InputBox` family, `CheckBox`/`RadioButton`/`ToggleSwitch`, `Field`, `Select` family, `Item`, `Sidebar`/`NavBar`, `Message` family, containers (`Modal`, `Card`, `Table`, `Tile`, `Contextualbar`), the rest.

Each component PR:

1. Writes the frames with `styled()`, static styles and variants only. Behavior, the `rcx-*` class names and the consumer `className` stay in a plain React component that composes the frames. Values are literal `'var(--rcx-…, fallback)'` strings from `as const` maps rather than helper calls, so the compiler can read them.
2. Follows the per-component rules below, so it compiles with zero runtime on the first try.
3. Moves the component's SCSS out; anything Tamagui can't express stays plain CSS in the component's `.styles.css`.
4. Passes the checks: `build:vite` with the zero-runtime gate, `tsc`, jest, the Storybook pixel A/B and `story-computed` over every story of every component that renders it, the bench for list components, and the size report inside the remaining budget.

## Per-component rules

Tamagui's [zero-runtime rules](https://tamagui.dev/docs/guides/zero-runtime) come first. On top of them, what the pilot learned:

- **Pass props explicitly.** Zero-runtime rejects spreads onto frames. The wrapper destructures what it supports and passes each prop; the element is a string `render` (`render='a'`). A JSX element in `render` deopts ([styled](https://tamagui.dev/docs/core/styled)).
- **No runtime-only features in a frame:**
  - no `context`/`createStyledContext`: use descendant rules or a plain React context ([docs](https://tamagui.dev/docs/core/create-styled-context));
  - no `animation:` for keyframes or loops: use plain `@keyframes`; a CSS `transition` is fine ([animations](https://tamagui.dev/docs/core/animations));
  - no `forceStyle`;
  - no `container`, `componentName` or `$` props at call sites;
  - `group` compiles to CSS on web: allow it once one component proves it compiles with zero runtime, and use parent rules in the `fuselage` layer until then.
- **No value computed at render in a style prop.** A closed set is a variant. An open value is a custom property passed through `style` and read by a static style. Register it with `@property { syntax: '*'; inherits: false; }` so it doesn't reach nested components.
- **Fold variants that only combine one way.** `ButtonFrame`'s generated CSS went from 160.5 kB to 58.9 kB once `kind`, `pressed` and `inactive` became one `look` variant holding only the combinations callers produce.
- **Don't rely on `BoxTransforms`.** `FlexItem` and `Margins` hand props to `Box` through a context, which Tamagui frames never read. Style the child from the parent's stylesheet instead.
- **A prop named `disabled` on a frame becomes `aria-disabled`.** Give internal variants another name, such as `muted`.
- **The wrapper owns the `rcx-*` classes**, joining them with the consumer `className`.
  - Code outside Fuselage styles its own elements with `rcx-*` classes. Keep those rules in `styles/consumer-classes.css`, and check for them before moving a component's CSS.
- **Use cascade layers.** Tamagui's generated CSS goes in `@layer fuselage`, using the compiler's `wrapExtractedCSS` or the generated stylesheet's import. Unlayered element rules beat it, which is why the reset and the global element rules sit in `@layer reset`.
- **No Tamagui tokens or themes for colors and sizes.** Values stay on the `--rcx-*` custom properties. Tamagui names its variables by hash or path, and would declare them in competition with the app's palettes, dark mode, high contrast and admin custom themes.

## Verification, per pull request

| Check                                                            | What it catches                                                                                       |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `build:vite` with zero-runtime (CI)                              | Any `@tamagui/*` module left in the client, and the zero-runtime rule violations                      |
| Storybook pixel A/B against `develop`, `STORY_AB_WAIT=2000`      | Visual changes; the pseudo-states addon needs the wait                                                |
| `story-computed` over every story, against `develop`             | Style changes the screenshot doesn't show (order, grow, hidden states)                                |
| `story-computed`, zero-runtime Storybook against the runtime one | A component that renders differently compiled than uncompiled, which npm consumers and Jest would see |
| Bench, list components                                           | Mount and update cost                                                                                 |
| Size report on the app bundle (CI)                               | The component's JS and CSS cost and the running total against the budget                              |
| Real-app A/B, per family                                         | Consumer classes, layer order, the app's own CSS                                                      |

Known flaky stories that differ between two captures of the same build: `PositionAnimated`, `Tooltip` arrow positioning, `Dropdown`, `OptionsPaginated`, and animated values (spinner, skeleton shine, progress bar).

## Pilot workarounds and what happens to them

| Pilot workaround                                                                                         | In the restart                                                                                                                                          |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build-time lowering (`lowerStyled.ts`, recipes, `check-lowered`, `count-unlowered`)                      | Dropped; zero-runtime in the app replaces it. Kept on the pilot branch as the fallback if the spike fails                                               |
| `prevalStyled.ts`                                                                                        | Dropped; values are literal strings the compiler reads                                                                                                  |
| `@tamagui/static` patches (default attributes, dynamic variants, `render` element, computed `className`) | Re-check each against the pinned version. The default attributes one looks like an upstream bug worth filing; the others are avoided by the rules above |
| `@tamagui/web` patches (React 19 refs, `forceStyle`/`onLayout` leaks, frames without a provider)         | Kept for the uncompiled `dist` (npm, Jest, other Storybooks); unused in the app's compiled client                                                       |
| `variantClass`, `asPublicFrame`                                                                          | Dropped; the wrapper owns the classes                                                                                                                   |
| Replacing `group`                                                                                        | Possibly avoidable; prove it compiles first                                                                                                             |
| Replacing `createStyledContext`, keyframe `animation:`                                                   | Still needed                                                                                                                                            |
| `render={<Tag {...domProps} />}`                                                                         | Dropped; string `render` plus explicit props                                                                                                            |
| Cascade layers, `consumer-classes.css`, `--rcx-*` values, `@property` for open values                    | Kept                                                                                                                                                    |

## What to reuse from the pilot

- Each component's pilot version as a reference, with its fixes: the Button `look` variant, the Sidebar parent rules, the `@property` sizes, the ItemGroup container styles, the multi-select filter input rule.
- `styles/consumer-classes.css`, the layer order prelude, and the token lists in `styleTokens` (as literal maps, not helper functions).
- The untracked verification scripts and bench in the pilot worktree's `perf/`: commit them in step 0.

## Traps in the workflow

- The Tamagui compiler's cache (`node_modules/.cache/tamagui`) is not invalidated when a patch changes; delete it after changing one.
- `dev:next` caches pre-bundled dependencies in `apps/meteor/node_modules/.vite`; delete it after changing how Fuselage is resolved.
- Stale workspace `dist`s cause false `tsc`, jest and Storybook failures; run `yarn turbo run build --filter=@rocket.chat/fuselage^...` first.

## Open questions

- **Does zero-runtime compile Fuselage from the app?** The step 1 spike answers it. If not, fall back to the pilot's library-level lowering.

- **Where the JS goes.** The pilot was about +45 kB JS over `develop` without the runtime. The first component tells whether that was the lowering's recipes, which zero-runtime doesn't need, or the components' own code.
- **What happens to the pilot.** Keep #42942 open as the reference while the component PRs land, then close it. #43167, the develop-compatible preparation, can merge independently.
