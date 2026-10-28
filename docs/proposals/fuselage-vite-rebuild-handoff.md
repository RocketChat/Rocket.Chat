# Handoff: rebuild the Fuselage Tamagui migration on a Vite pipeline, one component at a time

This is a plan for restarting the Fuselage → Tamagui migration from `develop`. The pilot (#42942, branch `feat/fuselage-tamagui-pilot`) proved the approach works, but it migrated every component first and added the compiler and the build-time lowering afterwards. As a result, its size can't be attributed to a component, and the budget was checked only at the end. The restart sets up the build, the measurements and the checks before the first component moves, so every component pull request shows what it costs.

## Goal and constraints (unchanged)

- Tamagui stays the authoring tool and the compiler: components are written with `styled()`, which keeps a React Native build possible.
- Tamagui's runtime does not ship to the web. Every `styled()` definition is lowered at build time to class tables and static CSS.
- Users see no change. Props, `rcx-*` class names, `ref` forwarding and the DOM stay as they are.
- Budgets against `develop`: JS at most +10 kB gzip; mounting and updating lists (messages, sidebar, members) at most +10% slower; CSS is free as long as total bytes don't regress.
- `Box` and `@rocket.chat/css-in-js` are a separate track and are out of scope.

## Where things stand

| | `develop` | Pilot, lowering off | Pilot, lowering on |
|---|---|---|---|
| `fuselage.production.js` (gzip) | 34.4 kB | 102.6 kB | 112.3 kB |
| `fuselage.css` (gzip) | 26.7 kB | 16.0 kB | 31.1 kB |

- The pilot lowers all 239 definitions (`count-unlowered` is 0). It still bundles the Tamagui runtime, about 31 kB gzip across 99 `@tamagui/*` modules, because the frames are still imported from `@tamagui/web`.
- The JS budget is the open risk. Without the runtime, the pilot would still be around +45 kB over `develop`: component code plus the lowered recipes, which are about 26 kB gzip together. The restart must find out where that weight comes from on the first component, not the last.
- Everything about the approach is recorded in `docs/proposals/fuselage-tamagui.md` (decisions, lessons, the checklist) and `docs/proposals/fuselage-lowered-styled.md` (the lowering plugin).

## What the restart changes

1. **The pipeline exists before any component moves.** Step 0 sets up the Vite build, the compiler, the lowering, Storybook on Vite and the size report on `develop`, with no component changed. Its output matches today's `dist`.
2. **One component per pull request.** Each PR moves one component (or one small family) from SCSS to `styled()`, lowered from the start. CI posts its size and render cost against `develop`.
3. **No runtime from the first component.** `@tamagui/web` is aliased to a stub in the web build from step 1. A component that can't lower can't land, so the pilot's phase 3 work (no `group`, `context`, `animation:`, `forceStyle`, values computed at render) becomes a rule for each component instead of a cleanup.
4. **The budget is a running total.** Each PR records its delta; the sum must stay inside +10 kB JS. If it doesn't, the cause is visible on the component that broke it.

## Steps

### Step 0: the pipeline on `develop`, no component changed

Each item is its own develop-compatible pull request.

- **Storybook on Vite.** `@storybook/react-webpack5` → `@storybook/react-vite`, so Storybook runs the same plugins as the library build. Check: every story pixel-identical to the webpack Storybook.
- **ESM output next to the current one.** The lib build emits ESM with `preserveModules` so an app compiler and tree shaking can work later. Check: the `dist` exports and `.d.ts` files are unchanged for consumers; `fuselage-ui-kit` and Meteor typecheck and build.
- **Cascade layers.** The `reset` and `fuselage` layers and the moved global element rules. #43167 already contains them; land them before any Tamagui code.
- **Size report in CI.** Turn `packages/fuselage/scripts/compare-with-develop.mjs` into a CI job that posts, for each PR, the JS and CSS gzip of `dist` against `develop` and a per-module breakdown from the Vite bundle (a `rollup-plugin-visualizer` JSON or source-map attribution). The breakdown is what makes "where did the weight come from" answerable.
- **Verification scripts in the repo.** Commit `story-ab.mjs`, `story-computed.mjs`, `computed-ab.mjs` and `pseudo-check.mjs` (they live untracked in the pilot worktree's `perf/` today) under `packages/fuselage/scripts/verify/`. `story-computed` must be able to run over every story; the pilot showed that the pixel A/B misses real bugs, such as a dropped `order` or the `PureItem` frames losing their styles.
- **Bench pages.** Commit the bench (`perf/bench`) with fixed scenarios: 150 messages, 200 sidebar rows, 300 button groups and the members list. Mount and update times are measured against `develop` in the same script.

### Step 1: Tamagui, the compiler and the lowering, still no component changed

- Add `@tamagui/web`, `@tamagui/vite-plugin` and `@tamagui/static` 3.0.18 with the pilot's yarn patches. Only the compiler patches matter here: default attributes, dynamic variant to class table, the `render` element, and computed `className`. The runtime patches (React 19 refs, frames without a provider) stay out, because the runtime never loads.
- Bring `lowerStyled.ts`, `src/lowered/recipe.ts`, `check-lowered`, `count-unlowered` and `measure-lowered` from the pilot as they are now, including the extended-frame scan (`styled(` and `part(` calls), the call-site guard for runtime-only props, the cache keyed on the `yarn.lock` entries, and the single stylesheet per bundle.
- Alias `@tamagui/web` to a stub in the web build. The stub exports only what lowered output still imports (markers and types). CI fails if any `@tamagui/*` module reaches the web `dist`.
- `tamagui.config.ts` keeps the tokens and media for the resolver and the native build only.
- Check: the empty pipeline adds nothing to `dist` (0 bytes of Tamagui), and `check-lowered` runs green with no definitions.

### Step 2: the first component, chosen to answer the budget question

Pick one leaf with variants and states, for example `Button`. The PR moves it and nothing else, and reports:

- JS and CSS deltas, split into component code, recipe and CSS;
- the recipe's encoded size against the variant combinations it serves;
- the bench numbers for 300 button groups;
- `story-computed` over every story that renders a Button, at rest, hovered, focused and pressed.

If the recipe or the component code is the large part, fix the encoding or the component pattern here, before the other 60 components copy it.

### Step 3 onwards: component by component

Order by dependency, leaves first: `Icon`, `Button`/`IconButton`, `ButtonGroup`, `Tag`/`Chip`/`Badge`, `InputBox` family, `CheckBox`/`RadioButton`/`ToggleSwitch`, `Field`, `Select` family, `Item`, `Sidebar`/`NavBar`, `Message` family, containers (`Modal`, `Card`, `Table`, `Tile`, `Contextualbar`), the rest.

Each component PR:

1. Writes the frames with `styled()`, static styles and variants only. Behavior stays in a plain React component that composes the frames. Values come only through the typed token helpers.
2. Follows the per-component rules below, so the definition lowers on the first try.
3. Adds the definitions to the lowering allowlist and lowers the `count-unlowered` ratchet in the same commit.
4. Moves the component's SCSS out; anything Tamagui can't express stays plain CSS in the component's `.styles.css`.
5. Passes the checks: `check-lowered`, `tsc`, jest, the Storybook pixel A/B and `story-computed` over every story of every component that renders it, the bench for list components, and the size report inside the remaining budget.

## Per-component rules (what the pilot learned the hard way)

- **No runtime-only features in a frame:** no `group` (use parent rules in the `fuselage` layer), no `context`/`createStyledContext` (descendant rules or a plain React context), no `animation:` (plain `@keyframes`), no `forceStyle`, no `container`/`componentName`/`$` props at call sites.
- **No value computed at render in a style prop.** A closed set is a variant; an open value is a custom property passed through `style`, read by a static style, and registered with `@property { syntax: '*'; inherits: false; }` so it doesn't reach nested components.
- **No style props through a spread.** A lowered frame drops a style prop it gets through `{...props}`, silently; the call-site guard does not see spreads. HTML attributes go on a `render={<Tag {...domProps} />}` element; style decisions become variants.
- **Fold variants that only combine one way.** `ButtonFrame`'s CSS went from 160.5 kB to 58.9 kB once `kind`, `pressed` and `inactive` became one `look` variant holding only the combinations callers produce. Check `measure-lowered` for any definition far above what the runtime would insert.
- **Don't rely on `BoxTransforms`.** `FlexItem` and `Margins` hand props to `Box` through a context; Tamagui frames never read it. Style the child from the parent's stylesheet instead.
- **A prop named `disabled` on a frame becomes `aria-disabled`.** Name internal variants otherwise (`muted`).
- **Keep `rcx-*` classes as always-on variants**, so a consumer `className` adds to them. Code outside Fuselage styles its own elements with `rcx-*` classes: keep those rules in `styles/consumer-classes.css` and check for them before moving a component's CSS.
- **Use cascade layers.** Tamagui rules live in `@layer fuselage`; unlayered element rules beat them, which is why the reset and the global element rules sit in `@layer reset`.

## Verification, per pull request

| Check | What it catches |
|---|---|
| `check-lowered` (CI) | A lowered definition that differs from Tamagui's own resolution: classes, inline style, attributes; every variant value, every pair, 300 random combinations |
| Call-site guard (build) | A lowered definition given a runtime-only prop at a JSX call site |
| `count-unlowered --max N --max-modules 0` (CI) | Definitions not lowered; any `@tamagui/*` module in the web bundle |
| Storybook pixel A/B against `develop`, `STORY_AB_WAIT=2000` | Visual changes; the pseudo-states addon needs the wait |
| `story-computed` over every story, against `develop` | Style changes the screenshot doesn't show (order, grow, hidden states) |
| Bench, list components | Mount and update cost; a `group` clause or a context subscription shows up here first |
| Size report (CI) | The component's JS and CSS cost and the running total against the budget |
| Real-app A/B, per family | Consumer classes, layer order, the app's own CSS |

Known flaky stories that differ between two captures of the same build: `PositionAnimated`, `Tooltip` arrow positioning, `Dropdown`, `OptionsPaginated`, and animated values (spinner, skeleton shine, progress bar).

## What to reuse from the pilot

- `packages/fuselage/lowerStyled.ts`, `src/lowered/recipe.ts`, `scripts/check-lowered.mts`, `scripts/count-unlowered.mts`, `scripts/measure-lowered.mts`, `scripts/measure-button-reachable.mts`.
- `.yarn/patches/@tamagui-static-npm-3.0.18-*.patch` (compiler hunks only).
- `prevalStyled.ts` and the `@tamagui/vite-plugin` setup in `vite.config.mts`.
- `styles/consumer-classes.css`, the layer order prelude, `helpers/variantClass`, `helpers/asPublicFrame`, the typed token helpers in `styleTokens`.
- Each component's pilot version as a reference, with its phase 3 and phase 5 fixes: the Button `look` variant, the Sidebar parent rules, the `@property` sizes, the ItemGroup container styles, the multi-select filter input rule.
- Untracked verification scripts in the pilot worktree's `perf/` (`story-ab.mjs`, `story-computed.mjs`, `computed-ab.mjs`, `pseudo-check.mjs`, `bench/`): commit them in step 0.

## Traps in the workflow

- The Tamagui compiler's plan cache (`node_modules/.cache/tamagui`) is not invalidated by a patch change; delete it after changing a patch. The lowering cache keys on `yarn.lock`, so it is.
- Parallel batches editing the lowering allowlist conflict on the same object literal. A union resolution can bring back an older entry for the same module, and in an object literal the later key wins and silently drops definitions. Check for duplicate keys after every merge, and watch `git rerere` replaying a wrong resolution. One component per PR avoids this.
- `dev:next` caches the Fuselage `dist` JS; after a rebuild, `rm -rf apps/meteor/node_modules/.vite`.
- Stale workspace `dist`s cause false `tsc`, jest and Storybook failures; run `yarn turbo run build --filter=@rocket.chat/fuselage^...` first.

## Open questions

- **Where the pilot's JS goes.** Before step 2, attribute the pilot's lowered `dist` per module (component code, recipes, helpers) to know whether the budget is reachable with the recipe encoding as it is.
- **Recipe or classes in JSX.** A lowered component keeps a small recipe runtime that picks classes from the variant props. Where an app compiler flattens a use-site, the classes are inlined and the recipe isn't needed. Decide whether the library ships recipes only, or recipes plus the ESM build for apps that compile.
- **When the app compiles.** Rocket.Chat doesn't run the Tamagui compiler today (it needs an ESM Fuselage build and the compiler in the app's bundler). Until it does, the library's lowering is what removes the runtime.
- **What happens to the pilot.** Keep #42942 open as the reference while the component PRs land, then close it; #43167 (the develop-compatible preparation) can merge independently.
