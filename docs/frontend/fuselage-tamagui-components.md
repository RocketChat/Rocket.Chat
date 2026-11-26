# Fuselage components on Tamagui

The single rulebook for moving a Fuselage component to Tamagui, compiled to static CSS by the app's zero-runtime build. It holds the workflow, the rules, the Definition of Done, the policies decided once, and the two tables that grow with the program: [Deviations](#deviations) and [Precedents](#precedents). For how to design a component in general, see [building-components.md](building-components.md); for the props a component accepts, [ADR-0011](../adr/0011-fuselage-components-take-no-styling-props.md); for the platform-neutral contract every migrated component follows, [ADR-0013](../adr/0013-fuselage-one-contract-web-and-native-renderers.md).

Each component is rewritten fresh from `develop`. API changes are accepted: every consumer in `apps/`, `packages/` and `ee/` moves in the same commit, with no deprecated shims. The one exception is `onClick`, kept on web as a `@deprecated` alias of `onPress` for one to two majors ([ADR-0013](../adr/0013-fuselage-one-contract-web-and-native-renderers.md)). The pilot (#42942, frozen at `7dc65c82954`) is a reference only, read against its own parent commit, never against `develop`.

## How a component is migrated

Components land in batches, one pull request per batch and one commit per component. Each pull request has one classification, as in [change-organization.md](../change-organization.md).

1. **Design note**, reviewed once per batch before it starts. Per component: the problem, Tamagui's documented way, the options (including an enabling refactor first, in its own unit), a recommendation, the consumers affected, and where the pilot differs from these rules.
2. **Characterization specs** (G0) in a `test(fuselage)` commit below the component, green against `develop`.
3. **The component**, written fresh. The specs pass unedited.
4. **Evidence**: the Definition of Done table below, in the pull request.
5. **Review** against this doc and the design note, then a human CODEOWNER review.

Where a family still needs `useStylingProps` or `StylingBox`, removing Box styling is its **own prerequisite unit** for that family, never inside the migration commit.

### Decision gate: stop and ask

Implementation stops and asks the [approver](#approval) when a component needs:

- a refactor to fit Tamagui's model, or an API redesign beyond mechanical typing;
- something Tamagui's documented way cannot express: a workaround, a patch hunk, CSS outside the allowed categories, a runtime island, a `style` exception;
- a visible change;
- any gate of the Definition of Done that cannot pass.

The answer is either a design note decision or a row in [Deviations](#deviations). Never patch around the gate.

## Rules

### Enforced by CI

| Rule | Enforcer |
| --- | --- |
| No frame bails to the runtime; no `@tamagui/*` reachable from the client | zero `enforce` mode in `build:vite`, and the zero graph receipt |
| Compiled output looks like the runtime output | visual regression, runtime and zero legs against the same baselines |
| `className` never in a render-element spread; no `{...props}` on a frame | lint rule `rocket.chat/render-element-spread` |
| Frame values name tokens and theme keys the Tamagui config has, never a CSS custom property, a length with a unit (a length is a number, see [policy 5](#policies)) or a `$` token in a font property; generated sections are in sync | `generate:frame-values --check`, run by `yarn lint` ([`generate-frame-values.mts`](../../packages/fuselage/scripts/generate-frame-values.mts)) |
| The Tamagui config's tokens and themes, plus the generated type scale, match `fuselage-tokens` | `generate:tamagui-tokens --check`, run by `yarn workspace @rocket.chat/fuselage test:verify` |
| Fuselage's stylesheet declares every token of the config, a size and a radius in `rem` | jest ([`tamagui.config.spec.ts`](../../packages/fuselage/src/tamagui.config.spec.ts)) |
| No token or theme key the config lacks reaches the zero stylesheet, and each theme class declares every theme key under the name a frame reads | [`zero-stylesheet.mjs`](../../packages/fuselage/scripts/verify/zero-stylesheet.mjs), called by `build:vite` and the livechat build |
| For each built-in palette, `PaletteStyleTag` writes every theme key of the config, with the palette's color, on the selector it writes the palette on; a custom palette that omits a color leaves it to the light fallback rule | jest ([`PaletteStyleTag.spec.tsx`](../../packages/fuselage/src/components/PaletteStyleTag/PaletteStyleTag.spec.tsx)) |
| No text node directly in a `View` | jest dev-mode check ([`textNodes.spec.tsx`](../../packages/fuselage/src/testing/textNodes.spec.tsx)) |
| Raw layout and style props don't grow | `scripts/scan-raw-layout.mjs`, `scripts/scan-style-props.mjs` ratchets |
| No new override of a migrated part without `[class]`; CSS hacks don't grow | selector inventory and CSS-hack ratchets ([`selector-inventory.mjs`](../../packages/fuselage/scripts/verify/selector-inventory.mjs), [`css-hacks.mjs`](../../packages/fuselage/scripts/verify/css-hacks.mjs)), run by `yarn lint` |
| `.d.ts` and accessibility tree changes are visible; class changes are reported as an internal regression net (G0) | the DoD script diffs ([`dod.mjs`](../../packages/fuselage/scripts/verify/dod.mjs), [`story-classes.mjs`](../../packages/fuselage/scripts/verify/story-classes.mjs), [`dts-diff.mjs`](../../packages/fuselage/scripts/verify/dts-diff.mjs)); each `.d.ts` or accessibility tree change is a G6 row |
| Size budget per batch | size-report CI job ([`sizeReport.mjs`](../../apps/meteor/vite/sizeReport.mjs)) |

### Enforced by review

- **A frame gets only variants, a named `className` (after the `rcx-*` classes) and `children`.** It is declared in the module that renders it. A fixed tag is `render: '<tag>'`; a closed set of tags is one branch per tag, each with a literal element.
- **Consumer attributes go on the literal render element:** `{...ariaAndDataAttributes(props)}` first, then each attribute **by name**, then any overriding default. The props type is the component's neutral contract (`<Component>.contract.ts`: declared variations, `children`, `role`, a declared subset of `aria-*`, `testID`, `ref`, and semantic events such as `onPress`) intersected with a typed platform extension; on web the extension adds `id`, `data-*`, `className`, `href`/`rel` and the closed `is` set. Shared code type-checks against the contract alone, and no DOM event type appears in it. The contract's `ref` is a `{ focus(), blur() }` handle, which the element the web hands out already satisfies; geometry is read with the platform-resolved `measure(ref)` utility, never from the handle. Handlers are forwarded only where callers need them.
- **A frame that acts when pressed is wrapped in `PressTarget`:** `<PressTarget press={props}><Frame render={<tag {...pickWebPressHandlers(props)} />} /></PressTarget>`. On the web it renders its children unchanged, with no element of its own, and the render element keeps the press. On React Native, where `render` is ignored, it renders a `Pressable` carrying the press, long-press, pointer-down and pointer-up handlers as `onPress`, `onLongPress`, `onPressIn` and `onPressOut`, plus `disabled`, `role`, `aria-*` and the matching `accessibilityRole` and `accessibilityState`. It costs one extra native node and cannot see the frame's hover, focus or pressed visuals. The frame never takes a prop spread or an `onPress` itself.
- **No consumer `style`.** The one exception is Tooltip under `Position`. An internal open value is a registered `@property` custom property on the component's own element.
- **Text frames are `Text`-based.** No `Box`, `StylingBox` or `useStylingProps` inside a migrated component.
- **Parent state is `group`.** `:has()` and sibling rules become variants. Plain CSS is allowed only in the categories below, commented.
- **App overrides through `[class]` are debt.** Each one found is a candidate variant; the ratchet keeps the count from growing.
- **A new patch hunk or deviation gets its own commit and a row in [Deviations](#deviations).**

## Definition of Done

Every component, with the evidence table in the pull request.

| Gate | Requirement | Checked by |
| --- | --- | --- |
| **G0** Characterization | Specs (forwarding, keyboard, handlers, accessibility snapshot) land in a commit below the component, green on `develop`. The migration passes them unedited; only an intended API change edits them, each edit a G6 row. `classContract` assertions are an internal regression net, here and wherever this doc mentions the class contract: the `rcx-*` classes are not a public contract, and a class diff informs the author without being a review gate. | Commit order; the specs run in jest and in the zero Storybook ([how to write one](../../packages/fuselage/src/testing/README.md)) |
| **G1** Zero-runtime | 0 bailed, 0 partial, 0 diagnostics for the component's modules; `build:vite` enforce passes; no `@tamagui/*` in the client; no new `.yarn/patches/@tamagui-*` hunk without a G6 decision and a Deviations row. | Zero stats file, enforce build, graph receipt |
| **G2** No CSS hacks | Ratchets green. No `!important` or specificity bump inside Fuselage; no `:has()`, sibling or parent-state rule for what the component renders itself; no raw px/rem, literal colour or literal z-index; no static inline `style`; no Box styling. | Ratchets and lint; review for the rest |
| **G3** A/B | Over every story that renders the component: pixel A/B develop to runtime and runtime to zero (light, desktop, LTR; hover, focus-visible, press and disabled via story args); computed-style A/B for dark, high contrast, RTL, and mobile width where the component has media queries; accessibility tree, tags and class contract identical or decided; real app on the main consumer screens in `build:vite` and `dev:next`. | [`dod.mjs <Component> --before <storybook-static> --after <storybook-static>`](../../packages/fuselage/scripts/verify/dod.mjs) runs the A/B checks ([`story-ab.mjs`](../../packages/fuselage/scripts/verify/story-ab.mjs) and [`story-computed.mjs`](../../packages/fuselage/scripts/verify/story-computed.mjs)) only when both builds are given, and otherwise reports them as not run. Computed-style checks cover dark and RTL; high contrast and mobile width are checked by hand until `dod.mjs` runs them. Visual regression CI; review for the app screens |
| **G4** Behaviour and API | G0 specs green in jest and zero Storybook; axe on every story (not run by `dod.mjs` or CI yet: pending, checked in review); `.d.ts` diff reviewed; consumer survey, spreading wrappers included; Fuselage typecheck, lint and jest; Meteor `tsc`; `ui-client`, `fuselage-ui-kit` and `ui-*` typecheck and jest. e2e runs per pull request, not per component; a class-contract change greps e2e, apps and docs. | CI, the DoD script |
| **G5** Budgets | Size inside the batch's share of +25 kB gzip JS; CSS reported, no growth beyond dedupe; Message and Sidebar benches within +10% of `develop`, from the first batch on. | Size-report CI, [`perf-bench.mjs`](../../packages/fuselage/scripts/verify/perf-bench.mjs), both read by [`dod.mjs`](../../packages/fuselage/scripts/verify/dod.mjs) |
| **G6** Diff decisions | Every non-zero result is a row: what, why, and **noise** (reproduces on two `develop` captures), **intended** (reason and approver) or **regression** (fixed before merge). Precedents go in [Precedents](#precedents), deviations in [Deviations](#deviations). | The evidence table, reviewed |
| **G7** Tamagui by the book | Frames follow the rules above. Frames, neutral prop types and values are portable: a frame reads `$tokens` and theme keys from the Tamagui config, never `var(--rcx-*)`. CSS stays in web-only files ([ADR-0013](../adr/0013-fuselage-one-contract-web-and-native-renderers.md)). | [`frame-platform.mjs`](../../packages/fuselage/scripts/verify/frame-platform.mjs) (`yarn workspace @rocket.chat/fuselage test:verify`): frame modules import no DOM types and no `react-dom`, and read no browser global; review |
| **G8** Review and release | Code review pass; human CODEOWNER review; changeset per [Releases](#releases); the program checklist updated. | Review, changeset check |

## Policies

Decided once, so no component reopens them.

1. **z-index is a layer token.** Use `zIndex` from `@rocket.chat/fuselage-tokens` (`raised` 1, `overlap` 2, `sticky` 10, `overlay` 100). A literal z-index is forbidden. A component adopts the tokens in its own migration commit.
2. **Plain CSS only in allowed categories, and only on properties the frame doesn't set.** The categories are what a frame can't express: `:invalid`, a disabled `fieldset`, `::placeholder` and the like. If the frame sets the property, it becomes a variant instead, because Tamagui's atomic rules are unlayered and win. Each rule carries a comment naming its category, and never uses `[class]`.
3. **Existing hacks go when their component migrates:** sibling `+` rules, `:has()`, `[class]` bumps, negative margins, `display: contents` compensation. One stays only with a [Deviations](#deviations) row.
4. **A container that holds text is `Text`-based** (`Tile`, `TableCell`, `TabsItem`, `CardBody`). A pure layout container is a `View`, and callers wrap their text. A frame that extends another frame (`FramedIcon` extends `IconFrame`) follows the same G1 accounting as the base.
5. **A length is a number of density-independent pixels, and a number stays what it is: pixels on the web.** A length reaches `rem` on the web only through a named source: the `radius` tokens, and `rem(n)`, which writes `n` pixels as `n / 16` `rem` for the rare value the stylesheet wrote in `rem` that is on no scale. The `space` tokens and every plain number (a padding, a margin, a gap, a border or outline width, and a size, an inset, a radius or a type length stated as a number) stay in pixels. A native section keeps every number (`literal(value, 'native')`). A numeric `lineHeight` is a length, written with `px` on the web where Tamagui would write the bare number as a multiplier: a multiplier is a string (`'1'`). Three lengths have a unit a number cannot state, and each has one explicit helper: `percent(n)` for a share of the parent (`'100%'`), `fraction(n)` for a grid track's share (`'1fr'`, web only), and `ch(n)` for a width in characters of the element's font (`'4ch'`). A frame never writes them as strings: the check rejects any other quoted unit (`vh`, `px`, `rem`) and a raw `'100%'`, `'4ch'` or `'1fr'`, and these three are not a way to state a length that has a token or a number.
6. **A size and the type scale have tokens.** A width or a height on the size scale is `size('x20')` (`$size.x20`): 1, 2 and the multiples of 4 up to 64, as `lengths.size()` took them, plus the icon steps 15, 18 and 22; one off the scale is a number of pixels, or `rem(n)` where the stylesheet wrote it in `rem`. `size()` is `rem` on the web; a plain number is not. A text frame spreads `fontScale('p2')`: the font size, line height, weight and letter spacing of a step of the `fuselage-tokens` type scale. A frame never states one of those four as a number of its own, and never a `$` token in a font property (`fontSize`, `lineHeight`, `fontWeight`, `letterSpacing`, `fontFamily`): Tamagui reads those only from font tokens, so `fontSize: '$size.x24'` would be written out as invalid CSS. A font size off the type scale is a number of pixels, or `rem(28)` for the rem of `size('x28')`.

## Program rules

- **Tamagui is version-frozen.** An upgrade is its own pull request and re-runs the full A/B over every migrated component.
- **Cold CI runs zero builds.** Never restore `.cache/tamagui`: the compiler cache is keyed on source only, so a stale one hides a compiler change.
- **Land batches early in a release cycle** so release candidates and QA catch problems.
- **Every pull request is atomic.** It matches [ADR-0013](../adr/0013-fuselage-one-contract-web-and-native-renderers.md) when it is reviewed and can be reverted alone; nothing merges to be corrected by a later one.
- **Design notes are reviewed once per batch.** The gate re-fires only on a surprise during implementation.

## Releases

- Changesets are **`minor`** on the affected package's current release line (the Fuselage packages are versioned independently of `@rocket.chat/meteor`), even though the packages are on npm.
- Each changeset has a **"Breaking for npm consumers"** section listing every API change (props removed, renamed or narrowed, `style` no longer accepted, tags changed), plus the visible changes.
- A removal of Box styling from a family ships as its own minor changeset, before that family's migration ([ADR-0011](../adr/0011-fuselage-components-take-no-styling-props.md)).

## Approval

`ggazzo` approves API changes and visible changes (the "intended" rows of G6). Visual regression baselines are regenerated only under the `visual-change-approved` label, in their own `test:` commit whose diff is reviewed against the commit that made the baselines stale.

## Deviations

Departures from the documented Tamagui way. Empty is the goal; every row is a decision someone approved.

| What | Why the documented way can't do it | Alternative considered | Decision | PR |
| --- | --- | --- | --- | --- |
| The Vite build dedupes the zero stylesheet (`dedupeTopLevelRules` in `apps/meteor/vite/vite.config.mts` keeps the last copy of each identical top-level rule) | Tamagui's compiler emits the same atomic rules once per module | No dedupe: about +7 kB gzip on the pilot (25.7 to 19.0 kB, 3851 to 1621 rules) | Keep; parity proven on all 581 pilot stories | On `develop` |
| `@tamagui/web` is patched so a theme or token variable keeps its full name (`createVariable`, `getThemeCSSRules`, `helpers/variables`) | Tamagui shortens the name a theme rule declares at 41 characters and the name a compiled class reads at 61, so a key in between is declared under a name nothing reads | Restrict theme keys to 41 characters or fewer: only keys of 42 to 61 characters hit the mismatch, but renaming them would stop them matching the token names. Left as a future task, which lets the patch go | Keep for now | With the dual-client foundation |
| The type scale is not a Tamagui font: `fontScale()` writes the values of a step into the frame | A font token (`fontSize: '$p2'`) compiles to `var(--f-size-p2)`, which Tamagui declares only under `.font_<name>`, the class its provider puts on the root. Fuselage renders no provider (the zero compiler rejects it), so the variable is undeclared, and the widget loads no Fuselage stylesheet that could declare it | One owner per app sets the font class, as a theme class owner would: [ADR-0013](../adr/0013-fuselage-one-contract-web-and-native-renderers.md) dropped that for the palette. Declaring the variables in Fuselage's stylesheet: the widget does not load it | Proposed with the size and type scale tokens; pending approval | With the dual-client foundation |
| `percent(n)`, `fraction(n)` and `ch(n)` write a quoted unit (`'n%'`, `'nfr'`, `'nch'`) into a frame | These values are neutral contract values: a share of the parent, a grid track and a width that follows the font have no token, and the zero build can only take a length from a token or a number | A token for each: a percentage and a character width are not lengths on a scale, so a token would be a number nothing else shares. Allowing any unit string: it would readmit the `px`, `rem` and `vh` that policy 5 sends to tokens | Keep, as three explicit helpers; the check rejects every other unit string. Not a general escape hatch | With the frame-values foundation |
| `Table`'s selection button rule carries `[class][class]` (`.rcx-table__selection-button` in `Table.styles.scss`) | The button is a `Button` frame now, and its `flex-shrink` is a compiled rule that comes last in the page, so the one-class rule of `Table` no longer wins | A `Button` variation that does not shrink: a new API for one caller. Migrating `Table` first, so the cell lays its button out with a frame | Proposed with the Button family; pending approval. It goes when `Table` migrates | L1 actions |
| A compiled `Tag` link is excluded from the global link rule in `normalize.scss` (`a:where(:not(..., .rcx-tag))`) | The global `a:focus-visible` rule of `%link` outranks the frame's own focus-visible styles, so a `Tag` with an `href` turned blue, got an outline and lost its radius | A `Tag` frame state that restates the focus styles with a higher specificity: a `[class]` bump on every consumer of the frame, and the link rule would still apply to the next compiled link | Keep, the same exclusion `.rcx-button`, `.rcx-item` and `.rcx-item__link` already have; each one goes when the link rule stops being global | Proposed, pending approval | With the `Tag` frame |

## Precedents

Results that recur and were decided once, so a G6 row can cite them.

- **`group-hover` is inside `@media (hover: hover)`.** A child revealed by a parent's hover is no longer revealed by a touch tap, as the plain `:hover` rule it replaces was. Applies to every `group` variant on hover.
- **Fuselage owns `box-sizing: border-box` in `@layer fuselage`.** Frames don't force `content-box`, and the app's reset is not assumed to be loaded (the Storybook doesn't load it), so a stylesheet gives every `rcx-*` part and its pseudo-elements `border-box` (pilot commit `c739532c640`).
