# Fuselage on Tamagui: how much zero runtime the compiler can reach

Tamagui stays, because it is the path to React Native. This measures how far its compiler (`@tamagui/vite-plugin` and `@tamagui/static` 3.0.18) can take Fuselage on web, starting from the pilot (PR #42942), where every component renders through the runtime.

## Verdict

- **Zero runtime holds per element, not per bundle.** The compiler turns a JSX element into a plain DOM element with static atomic classes only when all of these hold:
  - the tag is a Tamagui frame visible at that use-site;
  - the element spreads no props of unknown shape;
  - every style and variant prop is a literal;
  - the frame has no `context`, is not a HOC, and gets no `forceStyle`.

  Everything else keeps the runtime, so the runtime (about 41 kB gzip) never leaves the bundle. `experimental.zeroRuntime: true` would need every frame in the graph to flatten.
- **Ceiling:**
  - about **35-45%** of the Tamagui frames in the room message list;
  - about **0%** of the sidebar rows;
  - about **9%** of all app use-sites that render Tamagui.

  The rest are components with logic: hooks, `BoxProps`, context and nested structure (Field*, Button, Icon, Message/Body/Header, Sidebar items).
- **Measured on the Message row: −58% mount time** (29.2 → 12.4 ms for 150 rows), pixel and computed-style identical to the pilot. That is still 6.5x `develop`, because the frames that can't flatten dominate.
- **The bundle does not shrink.** Compiling adds +3.7 kB gzip of JavaScript and +2.5 kB of CSS: flattened elements carry their class strings, and the runtime stays.

## What the compiler does with our code

| Finding | Evidence |
|---|---|
| Inside the library, only use-sites with no spread can flatten. Every component root forwards `{...props}`, so roots never flatten there (`local/unsafe-style-spread`). | baseline library build: 32 candidates, 20 flattened |
| Local `styled()` configs must be literal in the AST. `spacing()`, `toCSSValue()` and fragment spreads all fail (`local/dynamic-style-value`). | same build |
| `importsWhitelist` exists only in the types. The v3 compiler never reads it. | `grep` of `@tamagui/static/src` |
| Configs of an imported **package** are evaluated for real, so token helpers work there. | app build: 4 of 4 flattened |
| `styled(Base, 'class', {...})` treats the string as style input for frontends (Tailwind), not as a DOM class. The `rcx-*` class has to be a default `className` prop. | computed-style diff lost the `rcx-*` class |
| The compiler only recognizes named imports (`import { MessageName }`), not `F.MessageName`. | 0 candidates with a namespace import |
| The package is evaluated through Vite's ESM module runner. Fuselage and its dependencies (`@rocket.chat/icons`, …) are CJS, and `OwnerDocument` read `window.document` at import, so loading failed. | `exports is not defined`, `module is not defined`, `window is not defined` |
| `group-hover` clauses flatten into real CSS. | MessageTimestamp flattened, hover diff clean |

## Two levers, measured

1. **In the library** (`TAMAGUI_PREVAL=1 TAMAGUI_EXTRACT=1` on the Fuselage build):
   - `prevalStyled.mts` evaluates each component module at build time, with `@tamagui/web` stubbed, and rewrites the `styled()` options as JSON literals before the compiler runs. It only rewrites frames rendered somewhere without a spread; rewriting every frame costs +6.5 kB gzip for nothing.
   - Result: candidates 32 → 96, **flattened 20 → 61**. The rest bail on dynamic props passed at the use-site (26) or spreads (8).
   - That matches the 59 internal spread-free use-sites the inventory predicted.
2. **In the app:**
   - Pure wrappers (`(props) => <XFrame className='rcx-x' {...props} />`) become exported frames: `export default styled(Text, { className: 'rcx-x', … })`.
   - The app's bundler runs the compiler with Fuselage as a component package, so `<MessageName>{name}</MessageName>` flattens in Rocket.Chat's own code.
   - Prototyped for MessageName, MessageUsername, MessageTimestamp and MessageContainer (plus its Fixed and Left variants).

### Bench

Warm mount, root provider, median of 7 runs ([bench-compiler-7runs.md](bench-compiler-7runs.md)):

| | `develop` | pilot | library | app | library + app |
|---|---|---|---|---|---|
| Message ×150 | 1.8 ms | 29.2 | 27.2 | 13.8 | **12.4** |
| Button ×300 | 2.8 | 19.6 | **16.7** | 19.6 | 16.9 |
| Tag ×300 | 1.8 | 14.6 | **12.2** | 14.4 | 12.2 |
| Item ×200 | 5.7 | 58.6 | 57.9 | 63.6 | 58.2 |

- **Update** (re-render) improves less: Message 20.2 → 17.0 ms.
- **Item gains nothing.** Its roots have spreads and context, and its leaves have logic.
- **Equivalence:** `perf/computed-ab.mjs` diffs the tag, `rcx-*` classes, every computed style and the bounding box of each element, with and without hover. Message, Item, Button and Tag all show **0 differences** against the pilot in every variant above.

### Bundle (`fuselage.production.js` / `fuselage.css`, gzip)

| | JS | CSS |
|---|---|---|
| pilot | 95.4 kB | 8.6 kB |
| library compile, every config rewritten | 104.3 | 11.2 |
| library compile, only flattenable configs rewritten | 99.1 | 11.1 |

## Ceiling (TypeScript AST over the library and every app package that imports Fuselage)

- **Public components (285):**
  - 40 are pure frame wrappers, which can become exported frames;
  - 13 map props to variants but also build `rcx-*--modifier` classes, which a frame can't add;
  - 232 have logic (101 hooks or `useTamaguiBoxProps`, 38 wrap other logic components, 30 have their own children structure, …);
  - 31 render no Tamagui at all (`Box`, `Margins`, `Flex`, …).
- **App use-sites:**
  - 7,421 use Fuselage components; 5,341 of them render Tamagui;
  - 498 of those could flatten (9.3%), and only 23 pure or variant sites can't (spread, dynamic variant, `style`).
- **Room message list:**
  - A full message is about 12 frames. About 4 flatten as exported frames, 5 with `MessageHeaderWrapper` compiled in the library, and 6 if `MessageNameContainer`'s `forceStyle`/`role` logic is redesigned: **35-50%**.
  - A sequential message is about 40%.
- **Sidebar and navbar rows:** every per-row component has logic, so about **0%**.
- **Most used, all with logic:** Field, FieldRow, FieldLabel, Button, Skeleton, Icon, TextInput, IconButton. Going past the ceiling means redesigning their APIs (dropping `BoxProps`/`useTamaguiBoxProps` and context hooks), not a mechanical conversion.

## What it takes to ship

1. **Library compile:**
   - `prevalStyled.mts` plus `tamaguiPlugin` in `vite.config.mts`, both prototyped here;
   - the Storybook A/B, which must run against the compiled `dist` because Storybook and Jest run `src`;
   - extracted CSS that lands in the `fuselage` layer (to check: the spike saw it unlayered by default).
2. **Exported frames:**
   - the 40 pure wrappers become `styled()` exports with a default `className`;
   - a typed helper for the `className` default, since `styled`'s string overload is untyped;
   - `isTamaguiComponent` accepts `staticConfig` (done here);
   - these lose the `withFuselageProvider` fallback, so tests, Storybooks and other roots need a `FuselageProvider` when one renders on the runtime path.
3. **App compile:**
   - an ESM Fuselage build whose whole dependency graph loads under Node (ESM `@rocket.chat/icons`, `fuselage-hooks`, …; `OwnerDocument` is fixed here);
   - the compiler in Rocket.Chat's bundler (`tamagui-loader` 3.0.18 exists for webpack/rspack; the Meteor rspack migration is the entry point);
   - named imports at use-sites.
4. **For React Native:** the same `styled()` sources compile natively, but the web-only parts need platform files: `rcx-*` classes, cascade layers, css-in-js `BoxProps`, `render` tags.

## `Box` styling props as Tamagui tokens

Tamagui v3 tokens take no `$` prefix (the runtime even warns about `$x8`), and they resolve per category (`space`, `size`, `radius`). That matches the `x<n>` grammar of `Box` styling props, so `marginBlockEnd='x8'` can be a Tamagui prop as is.

**Prototype:**

- `tamagui.config.ts` declares `space`, `size` and `radius` tokens computed by the same `spacing()`, `size()` and `borderRadius()` helpers, so every value is the one `Box` produces.
- `useTamaguiBoxProps` sends margin, padding, gap, inset, sizes and the plain layout props (`display`, `flex*`, `align*`, `overflow`, `position`) to the frame. Colors, `fontScale`, borders, `elevation` and `size` keep the css-in-js path, because Tamagui has a single `color` category while Fuselage resolves `color`, `backgroundColor` and `borderColor` against different palettes.

**Constraints found:**

- **Every token becomes a `:root` custom property, and nothing turns that off.** Enumerating `x0`-`x1280` injected 208,000 characters of CSS at runtime. The prototype only declares `x0`-`x64` plus the 39 larger measures Rocket.Chat uses: 16,900 characters, about 3-4 kB. The hook resolves any other `x<n>` itself.
- **`none` is a reserved CSS keyword, and Tamagui rejects it as a token name.** `Box` reads `none` as `0px`, so props set to `none` stay on css-in-js.
- **`!important` is lost.** css-in-js emitted `!important` and unlayered rules. Equal computed styles in every check here, but an unlayered app rule on the same property would now win.

**Results:**

| | pilot | tokens |
|---|---|---|
| 300 `Button`s with 4 styling props, warm mount | 21.8 ms | 20.3 ms (−7%) |
| 300 `Button`s without styling props | 18.9 ms | 19.3 ms (±noise) |
| Exported frames with styling props, compiled in the app (300 rows) | 14.1 ms | **0.9 ms (−94%)** |

Checks:

- **Fuselage tests:** 669 of 669 pass. 69 snapshots changed, all on `class` lines only (the `rcx-css-*` class goes away); no tag, attribute or text changed.
- **Typecheck:** `tsc` is clean.
- **Computed styles:** identical to the pilot on `Button` with styling props.
- **Exported frames with styling props:** they now apply where the pilot dropped them. In the pilot, `MessageTimestamp marginInlineStart='x12'` reached Tamagui as the unknown token `x12` and was ignored.

**What this means:**

- On its own, tokens shave about 7% off components that receive styling props, by skipping css-in-js.
- Their real value: they make a styling prop a literal the compiler can flatten. An exported frame with `marginBlockEnd='x8'` at an app use-site now flattens (7 of 7 in the bench).
- They are also required for React Native, which has no css-in-js.
- They don't change the ceiling for `Button` or `SidebarItem`. Both stay runtime components:
  - `Button` normalizes deprecated props, reads two contexts and renders an inner `rcx-button--content` span that no frame can produce.
  - `SidebarItem` renders `Item`, which has contexts and measures its layout.

  Flattening them means changing their DOM and API (step 4). The most that keeps today's DOM is one runtime frame per `Button`, with its inner span compiled in the library.

## The runtime that stays

Most frames in a room view keep the runtime, so its per-frame cost still matters. The earlier profile ([REPORT.md](REPORT.md)) puts 24-32% of the JavaScript in `getSplitStyles`. Remaining levers, none of them measured here:

- **Merge nested frames:** `MessageHeader` + wrapper, `ItemRow`s.
- **Fewer per-leaf `withFuselageProvider` wrappers:** a context read plus an extra component per element.
- **Fewer `group` subscriptions:** every child with a `group-*` clause re-renders on the parent's hover.
- **Upstream: memoize `getSplitStyles`** by (static config, props signature, theme, media).
