# Handoff: rebuild the Fuselage Tamagui migration, compiled by the app, one component at a time

This is a plan for restarting the Fuselage → Tamagui migration from `develop`. The pilot (#42942, branch `feat/fuselage-tamagui-pilot`) proved the components can be written with Tamagui and stay pixel-identical. But it migrated every component first, then compiled and lowered them inside the library afterwards, so its size can't be attributed to a component and the budget was only checked at the end.

The restart changes where compilation happens: **the app compiles Fuselage's sources with Tamagui's own zero-runtime mode**, the way Tamagui recommends. The library-level lowering is dropped. The build, the measurements and the checks exist before the first component moves, so every component pull request shows what it costs.

## Goal and constraints

- Tamagui stays the authoring tool and the compiler: components are written with `styled()`, which keeps a React Native build possible.
- Tamagui's runtime does not ship to the web: the app's Vite build compiles every Fuselage `styled()` definition and use-site to static classes and CSS.
- Users see no change. Props, `rcx-*` class names, `ref` forwarding and the DOM stay as they are.
- Budgets against `develop`, measured on the app's client bundle: JS at most +25 kB gzip (raised from +10 kB on 2026-10-29; to be re-checked at the end); mounting and updating lists (messages, sidebar, members) at most +10% slower; CSS is free as long as total bytes don't regress.
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

## Status (2026-10-29)

Branch `feat/fuselage-zero`, on top of #43055 (`feat/serve-vite-client`, the Vite-built web client served by the server).

- **Every Fuselage component with its own styles is migrated**, one commit per component or family: Button, IconButton, ButtonGroup, SplitButton, Bubble, CheckBox, RadioButton, ToggleSwitch, Tag, Badge, Chip, the Item family, Tabs, Accordion, Table, Pagination, Skeleton, Throbber, ProgressBar, Avatar, StatusBullet, Tooltip, Divider, Tile, Callout, CardGrid, CardGroup, Card, Modal, InputBox and its inputs, Field, FieldGroup, Label, the Select family, Option, Options, Menu, Sidebar, NavBar, Sidepanel, the Message family, Contextualbar, Banner, ToastBar, Chevron, CodeSnippet, FramedIcon, States, Grid, Icon and Dropdown (the last three as plain CSS).
- **The web client compiles them with zero runtime:** `yarn build:client` passes and no `@tamagui` code reaches `public/bundle` (246 frames lowered, 0 bailed).
- **Checks on the integrated branch:** `yarn generate:frame-values --check`, Fuselage `tsc`, the full Fuselage Jest suite (538 tests) and oxlint (0 errors) pass. The Fuselage Storybook, which now loads the app's CSS reset, is pixel-identical to `develop` in 552 of 566 stories; the 14 others force states by class, which are dropped on purpose.
- **Size so far:** each component's lot reported its own delta; the running total is estimated at +13 to +15 kB gzip JS against `develop`, not yet measured as a whole.
- **Out of scope and still SCSS:** `Box` and `Text` (the css-in-js track), plus small `Field` and `States` remainders kept for an `@extend` of the rich-text placeholder, and the shared `styles/` mixins and variables.

The pilot (#42942, `feat/fuselage-tamagui-pilot`) lowered every definition in the library instead; its decisions and lessons are in `docs/proposals/fuselage-tamagui.md` and `docs/proposals/fuselage-lowered-styled.md` on that branch. The lowering plugin is the fallback if zero-runtime stops fitting.

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

- **The spike passed** (branch `spike/fuselage-zero-runtime`, app in `packages/fuselage/zero-spike/`).
  - **Build:** on `@tamagui/*` 3.0.18 a Vite app compiled the pilot's `Button` and `IconButton` from Fuselage's source with `experimental.zeroRuntime`. The zero graph reports no `@tamagui/*` module, and the JS contains no Tamagui code.
  - **Not by the book:** the spike ran on the pilot's branch and inherited its yarn patches on `@tamagui/static`, `@tamagui/web` and `@tamagui/compose-refs`. The first Button attempt on `feat/fuselage-zero`, with the documented setup only, could not pass the caller's HTML attributes and `ref` through a frame:
    - zero rejects a spread on a frame (rule 1);
    - the `render={<Tag {...attributes} ref={ref} />}` element fails with "Style prop render could not be evaluated".
  - **Decision (2026-10-28):** port the spike's patches that make the inline render element compile, each in its own commit and listed as a deviation from the docs. No upstream PR for now. The alternative, an explicit prop contract, stays open; see "Open questions".
  - **Output:** the DOM and the computed styles of 35 instances, at rest, hovered, focused and pressed, are identical to the pilot's runtime `Button`.
  - **Size:** the page's JS went from 119.1 kB to 82.7 kB gzip (−36.4 kB). CSS went from 11.3 kB to 20.1 kB (+8.8 kB): Tamagui's zero stylesheet repeats rules per module, and deduplicated it would be about 6.3 kB.
  - **Left in the JS:** about 12.6 kB gzip of Button code, mostly the variant lookup maps. That is the cost to bring down before other components copy the pattern.
  - **Fallback:** if a component can't compile, the pilot's library-level lowering plugin remains, documented in `docs/proposals/fuselage-lowered-styled.md`.
- **Then the plugin in the app.** Add `@tamagui/vite-plugin` with `experimental.zeroRuntime` to `apps/meteor/vite/vite.config.mts`, Storybook and the bench app. Pin `@tamagui/*` to one exact version. The spike showed what the app config needs:
  - **Fuselage's `src` inside the transformed set.** Zero transforms only `.tsx` under the Vite `root`, and the app's root is `apps/meteor/vite`. Either the root moves up to the monorepo, or a yarn patch on the vite plugin adds an include list. The include list is smaller: moving the root nests the built HTML and transforms every app module.
  - **A yarn patch for member-expression elements.** Zero reports every `<Ctx.Provider value>` in a transformed module as a theme change, even without a Tamagui import, because `jsxNameOf` returns `null` for `<A.B>` and compares equal to the theme local. The fix is one condition (`!!name &&`) in `static/src/zero/transform.ts`; file it upstream.
  - **Literal `styled()` options, or `prevalStyled` in the app.** Zero reads only literals: no function calls, no spread of a call, no `Object.fromEntries`.
  - **`TAMAGUI_CSS_LAYER='fuselage'`.** Without it the zero stylesheet writes its base `:where(.is_View)` rules unlayered, and they beat every layered rule.
  - **`base: '/'`.** With a relative base and a nested HTML entry, the zero stylesheet's link resolves next to the HTML and 404s.
  - **`@rocket.chat/fuselage` out of `distOnlyWorkspacePackages`.**
- **Zero-runtime is all or nothing for the entry graph,** since any reachable `@tamagui/*` module fails the build. This doesn't block migrating one component at a time: components not yet migrated stay on SCSS and import no Tamagui, and each migrated one must compile clean. Fuselage must not keep a Tamagui `ThemeProvider` in a module the app reaches.
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

Tamagui's [zero-runtime rules](https://tamagui.dev/docs/guides/zero-runtime) come first. The spike showed how they apply to Fuselage:

- **No spread on a frame.** Zero rejects it, and the use-site is skipped without a message: the error only shows later, as an unerased definition. Debug with `TAMAGUI_COMPILER_STATS_FILE`. Caller attributes go on an inline render element, `render={<Tag {...attributes} ref={ref} />}`, which compiles to `jsx(Tag, { ...attributes, className })`. The render element must be written inline, not held in a variable, and the `ref` goes on it rather than on the frame.
- **No `style` on a frame or on its render element, and no runtime value in a style prop.** A component that needs either is a plain element styled by its `.styles.css`, as `Icon` became in the spike (an `<i>` with `.rcx-icon`).
- **Declare a frame in the module that renders it.** Zero erases a `styled()` declaration only when every reference is in its own module, so a frame exported to another module is never erased. Shared style data (the variant objects) can live in another module; the `styled()` call can't. A frame another frame extends (as `FramedIcon` extends `IconFrame`) needs its own module and every importer transformed.
- **One runtime-chosen variant per CSS property.** Zero rejects two conditionals that set the same property on an element ("Multiple conditionals contribute minWidth…"). Variants that used to overlap and resolve by prop order become one precomputed combined variant per group of properties (the spike's `sizing`, `layer` and `paint`), merged state by state.
  - **Decision: these stay `styled()` variants.** One frame definition serves web and React Native, even though the combined variants cost bundle size on web. The web-only optimization below is documented, not applied.
  - Keep each combination set as small as the callers allow: IconButton's `paint` has about 450 keys, and each key is a string in the JS lookup map.
- **No `ThemeProvider` or `tamagui.config` import in a module the app reaches.** The spike moved `withFuselageProvider` into its own module with no Tamagui import.
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
- **Tamagui's zero stylesheet can't be put in a cascade layer.** `TAMAGUI_CSS_LAYER` only layers runtime-inserted CSS, and Tamagui's base rules (`:where(.is_View)…`) stay unlayered even with `wrapExtractedCSS`. The zero stylesheet loads after the component stylesheets, and some atomic classes are doubled (`._x._x`), so a one- or two-class rule that overrides a frame property loses. Write such rules with `[class]` or doubled classes, inside Fuselage and in the app, and add a `[hidden]` rule for frames that can be hidden. The reset and the global element rules still sit in `@layer reset`.
- **State Tamagui `View`'s defaults explicitly where develop relied on the browser's:** `display: flex`, `flex-direction: column`, `flex-shrink: 0`, `min-width`/`min-height: 0`, `position: relative`. Don't force `box-sizing: content-box`: the app's reset makes everything `border-box`, and the Fuselage Storybook loads that reset so it matches the app.
- **Values come from `@rocket.chat/fuselage-tokens` through `scripts/generate-frame-values.mts`.** It writes a delimited `generated … do not edit` section into each frame module (and into `.styles.css` files for rules that need plain CSS), as literal `var(--rcx-…, fallback)` strings; `--check` runs in lint. Add a component to its typed `components` list.
- **No Tamagui tokens or themes for colors and sizes.** Values stay on the `--rcx-*` custom properties. Tamagui declares its token variables once on `:root`, and a custom property's `var()` resolves where it is declared, so tokens aliasing `--rcx-*` ignore the palettes the app scopes below `:root` (the dark sidebar, `.rcx-content--main`, the image gallery). Tested and rejected.
- **Pass `className` to the frame and `children` to the frame explicitly.** The zero compiler bails when `className` is on the render element, and uncompiled runtime drops children put on the render element.
- **State classes (`.is-hovered`, `.hover`, `.focus`, `.active`, `.disabled`…) are dropped on purpose.** Stories that force states by class differ from `develop`; convert them to the pseudo-states addon.

## Optimization strategy for the variant maps (documented, not applied)

The combined variants are kept as `styled()` variants so one frame definition serves web and React Native. This is the strategy to shrink them on web if the bundle budget demands it. It was measured on branch `spike/fuselage-zero-variants`.

**Why the maps grow.** Zero emits one lookup table per runtime-chosen variant: each key maps to a string of atomic classes, one class per CSS property and covering all its pseudo-states (`compilerHost.ts:4180-4190` in `@tamagui/static` 3.0.18). A CSS property may be set by only one conditional (`compilerHost.ts:4072-4078`), so variants that overlap must be pre-combined. Their sizes multiply: Button's `look` (31) × `ghost` (6) × `glyphColor` (3) gives IconButton's `paint` 469 keys. Neither 3.0.18 nor 3.1.6 has a way around it: no precedence between conditionals, no compact encoding, no build option, and custom properties set inside a `styled()` variant are dropped without a diagnostic.

**The optimization: overlapping variants as generated CSS, selected by data attributes.**

- Keep the variant style objects in TypeScript, one object per dimension (`look`, `ghost`, `glyphColor`, size), not pre-combined. They stay the single source.
- On web, a script (the spike's `scripts/build-button-css.mjs`) turns them into `Button.variants.css`:
  - in `@layer fuselage`, at specificity (0,2,0) so it beats the frame's atomic classes;
  - one rule per value, selected by `data-look`, `data-ghost` and `data-glyph`, which the component already computes;
  - order in the file gives precedence: look, then ghost, then glyph.

  Lint runs the script with `--check` so the CSS can't drift from the objects.

- The frame keeps `styled()` for its static base and for variants that don't overlap (such as `segment`).
- On React Native, the same objects feed `styled()` variants in a `.native.tsx` frame. The runtime, which native always has, resolves overlap by prop order, so native needs no combining.

**Measured on the spike page** (Button and IconButton, 35 instances, identical DOM and computed styles to the runtime in every state, apart from the new `data-*` attributes):

|                               | Combined variants (kept) | Data-attribute CSS |
| ----------------------------- | ------------------------ | ------------------ |
| Button + IconButton JS (gzip) | 8.9 kB                   | 2.5 kB             |
| Keys in lookup maps           | 694                      | 13                 |
| CSS (gzip)                    | 20.2 kB                  | 16.3 kB            |

**What it costs:**

- **Two frame files.** The web and native frames are separate files reading the same objects, instead of one frame for both.
- **A second place to keep in sync.** The generator's selectors must follow the states `getButtonStates` produces.
- **Alternatives tried and rejected:**
  - Plain classes per value: same size, but needs a specificity ladder.
  - CSS custom properties per dimension: same size, but React Native has no `var()`.

**When to apply it:** only when the size report shows the running total over the +10 kB JS budget. Start with the components whose combined variants are largest (`IconButton`, `Button`, then whichever the report ranks next).

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
| `prevalStyled.ts`                                                                                        | Dropped once `styled()` options are literal; until then it runs in the app (the spike needed it)                                                        |
| `@tamagui/static` patches (default attributes, dynamic variants, `render` element, computed `className`) | Re-check each against the pinned version. The default attributes one looks like an upstream bug worth filing; the others are avoided by the rules above |
| `@tamagui/web` patches (React 19 refs, `forceStyle`/`onLayout` leaks, frames without a provider)         | Kept for the uncompiled `dist` (npm, Jest, other Storybooks); unused in the app's compiled client                                                       |
| `variantClass`, `asPublicFrame`                                                                          | Dropped; the wrapper owns the classes                                                                                                                   |
| Replacing `group`                                                                                        | Possibly avoidable; prove it compiles first                                                                                                             |
| Replacing `createStyledContext`, keyframe `animation:`                                                   | Still needed                                                                                                                                            |
| `render={<Tag {...domProps} />}`                                                                         | Kept, inline: under zero it is how caller attributes and the `ref` reach the element, since a frame takes no spread                                     |
| Cascade layers, `consumer-classes.css`, `--rcx-*` values, `@property` for open values                    | Kept                                                                                                                                                    |

## What to reuse from the pilot

- Each component's pilot version as a reference, with its fixes: the Button `look` variant, the Sidebar parent rules, the `@property` sizes, the ItemGroup container styles, the multi-select filter input rule.
- `styles/consumer-classes.css`, the layer order prelude, and the token lists in `styleTokens` (as literal maps, not helper functions).
- The untracked verification scripts and bench in the pilot worktree's `perf/`: commit them in step 0.

## Traps in the workflow

- The Tamagui compiler's cache (`node_modules/.cache/tamagui`) is not invalidated when a patch changes; delete it after changing one.
- `dev:next` caches pre-bundled dependencies in `apps/meteor/node_modules/.vite`; delete it after changing how Fuselage is resolved.
- Stale workspace `dist`s cause false `tsc`, jest and Storybook failures; run `yarn turbo run build --filter=@rocket.chat/fuselage^...` first.

## Remaining work

Tick an item in the commit that completes it.

**Correctness**

- [x] Box sizing in the app: the Storybook loads the app's reset and frames no longer force `content-box`.
- [ ] `States`' link renders 0×0 when Fuselage runs uncompiled (npm consumers, Jest); the compiled build is right.
- [ ] Cascade order: the app's CSS and the admin's Custom CSS now lose to the zero stylesheet for any one- or two-class override of a Fuselage part. Try loading the zero stylesheet before the component and app stylesheets (the server injects stylesheets from the Vite manifest, so the order is ours); otherwise document the `[class]` rule for consumers.

**Verification**

- [ ] Make the verification scripts fast: stories in parallel, animations frozen (`getAnimations()` paused at 0, or Playwright's `animations: 'disabled'`), an id filter. Never run them unfiltered and sequential: the 566 stories take close to an hour.
- [ ] Pixel and computed-style A/B over every story against `develop`, and compiled against uncompiled. Each lot was only checked on its own stories.
- [ ] Real-app A/B against `develop`: home, a room, members, a modal, preferences, the marketplace and the dark sidebar. Also the consumers never seen in a browser: OutlookSettingItem, VideoConfListItem, ui-composer, the marketplace `CategoryDropDownAnchor`.
- [ ] Bench the lists (150 messages, 200 sidebar rows, members): mount and update within +10% of `develop`. Commit the pilot's bench (`perf/bench`) with it.
- [ ] Measure the whole client bundle against `develop` (JS and CSS gzip).
- [ ] Meteor `tsc`, the e2e suite, and the uncompiled consumers: `fuselage-ui-kit`, the ui-client Storybook, the app packages' Jest.

**Cleanup**

- [ ] Remove the SCSS nothing uses any more: the `styles/` mixins, variables and primitives, `InputBox/mixins.scss`, and variables such as `--rcx-button-empty-*` and `--rcx-button-off-*`.
- [ ] Review the infrastructure's deviations against the Tamagui docs (absolute dev `base`, loading the zero stylesheet, the `<Ctx.Provider>` and include patches) and keep only the ones the docs can't replace.
- [ ] CI: fail the build on any reachable `@tamagui/*` module from the zero graph receipt, and a ratchet on components still on SCSS.
- [ ] Convert the stories that force states by class to the pseudo-states addon.

**Decisions**

- [ ] `style` passed inside the render element's attributes object (Throbber, ProgressBar, ToastBar) to give a frame a custom property: keep, or fall back to `Box` styling props (css-in-js at runtime, as on `develop`).
- [ ] The Option `success`/`warning`/`primary` text colours, which the branch had silently lost, were fixed inside the Option commit; split it into its own `fix` commit or keep.
- [ ] Behaviour changes to record in changesets: state classes removed; a consumer `className` now adds to the component's classes instead of replacing them (Pagination, Bubble, Card parts, Sidebar, MessageSystem, MessageContainer); several Message prop types moved from `HTMLAttributes` to `ElementProps`.

**Delivery**

- [ ] Changesets and the pull request strategy: this branch depends on #43055; one pull request per component, as planned, or per lot. Jira ticket and milestone.
- [ ] Delete the agents' and spikes' temporary worktrees and branches.

## Open questions

- **An explicit prop contract instead of the render-element patch (to evaluate).** Zero-runtime, as documented, expects props to reach a frame explicitly; it has no way for a component to forward arbitrary HTML attributes and a `ref`. Instead of patching the compiler, Fuselage components could accept a closed list of props: the events, `type`, `disabled`, `aria-*` and `data-*` attributes each component documents, passed one by one.
  - **Cost:** it breaks consumers that pass other attributes, and arbitrary `aria-*` and `data-*` names can't be listed statically.
  - **To decide:** count the attributes the app and the other packages actually pass to each component, and whether a closed list covers them.
  - **What it would remove:** the `@tamagui/static` render-element patch.

- **Where the JS goes.** The pilot was about +45 kB JS over `develop` without the runtime. In the spike, zero-runtime `Button` and `IconButton` still carry about 12.6 kB gzip against near zero for `develop`'s SCSS buttons. About 5.9 kB of it is the combined variant maps, which stay by decision (see the optimization strategy below), and 2.9 kB is Icon's inline colour data. Track the running total per component; if it passes the +10 kB budget, apply the optimization below to the components with the largest maps first.
- **What happens to the pilot.** Keep #42942 open as the reference while the component PRs land, then close it. #43167, the develop-compatible preparation, can merge independently.
