# Fuselage components on Tamagui

The single rulebook for moving a Fuselage component to Tamagui, compiled to static CSS by the app's zero-runtime build. It holds the workflow, the rules, the Definition of Done, the policies decided once, and the two tables that grow with the program: [Deviations](#deviations) and [Precedents](#precedents). For how to design a component in general, see [building-components.md](building-components.md); for the props a component accepts, [ADR-0011](../adr/0011-fuselage-components-take-no-styling-props.md).

Each component is rewritten fresh from `develop`. API changes are accepted: every consumer in `apps/`, `packages/` and `ee/` moves in the same commit, with no deprecated shims. The pilot (#42942, frozen at `7dc65c82954`) is a reference only, read against its own parent commit, never against `develop`.

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
| No spread on a frame; a render-element spread only of a safe call, so `className` never reaches it | lint rule `rocket.chat/render-element-spread` ([semantics](#the-render-element-spread-rule)) |
| Values come from `fuselage-tokens`; generated sections are in sync; no raw px or rem in a generator module or a migrated stylesheet | `generate:frame-values --check`, run by `yarn lint` ([the generator](#the-frame-values-generator)) |
| No text node directly in a `View` | jest dev-mode check ([`textNodes.spec.tsx`](../../packages/fuselage/src/testing/textNodes.spec.tsx)) |
| Raw layout and style props don't grow | `scripts/scan-raw-layout.mjs`, `scripts/scan-style-props.mjs` ratchets |
| No new override of a migrated part without `[class]`; CSS hacks don't grow | selector inventory and CSS-hack ratchets ([`selector-inventory.mjs`](../../packages/fuselage/scripts/verify/selector-inventory.mjs), [`css-hacks.mjs`](../../packages/fuselage/scripts/verify/css-hacks.mjs)), run by `yarn lint` |
| Class contract, `.d.ts` and accessibility tree changes are visible | the DoD script diffs ([`dod.mjs`](../../packages/fuselage/scripts/verify/dod.mjs), [`story-classes.mjs`](../../packages/fuselage/scripts/verify/story-classes.mjs), [`dts-diff.mjs`](../../packages/fuselage/scripts/verify/dts-diff.mjs)); each change is a G6 row |
| Size budget per batch | size-report CI job ([`sizeReport.mjs`](../../apps/meteor/vite/sizeReport.mjs)) |

### Enforced by review

- **A frame gets only variants, a named `className` (after the `rcx-*` classes) and `children`.** It is declared in the module that renders it. A fixed tag is `render: '<tag>'`; a closed set of tags is one branch per tag, each with a literal element.
- **Consumer attributes go on the literal render element:** `{...ariaAndDataAttributes(props)}` first, then each attribute **by name or through a typed pick helper** (`pickWebPressHandlers`, `pickWebRowHandlers`, `pickWebTextInputHandlers`, `pickWebDropHandlers`, `pickWebCaptureHandlers`), then any overriding default. A pick helper is the one way to forward a group of handlers without naming each: the group's key list is one `as const` array in `ElementAttributes.ts` that builds both the type and the helper, so the list stays closed and typed. The props type lists exactly what the component supports, built from the `ElementAttributes` groups with `Omit` in the type. Handlers are forwarded only where callers need them.
- **No consumer `style`.** The one exception is *Position's contract*: a part that `Position` places (Tooltip, later the Options lists) accepts `PositionedAttributes`, a `style` typed to exactly the keys `usePosition` returns (`position`, `top`, `left`, `bottom`, `zIndex`, `opacity`, `visibility`, `overflowY`) and the resolved `placement`, forwarded by `pickPositionStyle`. The other is *the virtualizer's contract*: the list a virtualizer renders (the Sidepanel's) accepts `VirtualizedListAttributes`, a `style` typed to `boxSizing`, `marginTop`, `paddingTop`, `paddingBottom` and `visibility`, and each row it renders accepts `VirtualizedItemAttributes`, a `style` typed to `overflowAnchor`; `pickVirtualizerStyle` forwards them, and their `data-index`, `data-known-size` and `data-item-index` travel as any `data-*` does. Without them the rows misplace once the list is scrolled. An internal open value is a `--rcx-*` custom property set through `customProperties()` on the part's own render element, read by a static frame value `var(--rcx-x, fallback)` and registered in the part's stylesheet with `@property { syntax: '*'; inherits: false }` (`inherits: true` only where a pseudo-element alone reads it). Never set one inside a variant: the compiler drops it silently.
- **Text frames are `Text`-based.** No `Box`, `StylingBox` or `useStylingProps` inside a migrated component.
- **Parent state is `group`.** `:has()` and sibling rules become variants. Plain CSS is allowed only in the categories below, commented.
- **A group key sits at the frame's base, never inside a variant.** A variant that restates the property replaces the whole value, group keys included, so a frame whose states differ in what a group does is two frames (`ItemActions`' hover reveal is its own frame), and a state that only swaps the value (`disabled`, `pinned`) is a variant.
- **App overrides through `[class]` are debt.** Each one found is a candidate variant; the ratchet keeps the count from growing.
- **A new patch hunk or deviation gets its own commit and a row in [Deviations](#deviations).**

## Definition of Done

Every component, with the evidence table in the pull request.

| Gate | Requirement | Checked by |
| --- | --- | --- |
| **G0** Characterization | Specs (forwarding, keyboard, handlers, accessibility snapshot, class contract) land in a commit below the component, green on `develop`. The migration passes them unedited; only an intended API change edits them, each edit a G6 row. | Commit order; the specs run in jest and in the zero Storybook ([how to write one](../../packages/fuselage/src/testing/README.md)) |
| **G1** Zero-runtime | 0 bailed, 0 partial, 0 diagnostics for the component's modules; `build:vite` enforce passes; no `@tamagui/*` in the client; no new `.yarn/patches/@tamagui-*` hunk without a G6 decision and a Deviations row. | Zero stats file, enforce build, graph receipt |
| **G2** No CSS hacks | Ratchets green. No `!important` or specificity bump inside Fuselage; no `:has()`, sibling or parent-state rule for what the component renders itself; no raw px/rem, literal colour or literal z-index; no static inline `style`; no Box styling. | Ratchets and lint; review for the rest |
| **G3** A/B | Over every story that renders the component: pixel A/B develop to runtime and runtime to zero (light, desktop, LTR; hover, focus-visible, press and disabled via story args); computed-style A/B for dark, high contrast, RTL, and mobile width where the component has media queries; accessibility tree, tags and class contract identical or decided; real app on the main consumer screens in `build:vite` and `dev:next`. | [`dod.mjs <Component> --before <storybook-static> --after <storybook-static>`](../../packages/fuselage/scripts/verify/dod.mjs) runs the A/B checks ([`story-ab.mjs`](../../packages/fuselage/scripts/verify/story-ab.mjs) and [`story-computed.mjs`](../../packages/fuselage/scripts/verify/story-computed.mjs)) only when both builds are given, and otherwise reports them as not run. Computed-style checks cover dark and RTL; high contrast and mobile width are checked by hand until `dod.mjs` runs them. Visual regression CI; review for the app screens |
| **G4** Behaviour and API | G0 specs green in jest and zero Storybook; axe on every story (not run by `dod.mjs` or CI yet: pending, checked in review); `.d.ts` diff reviewed; consumer survey, spreading wrappers included; Fuselage typecheck, lint and jest; Meteor `tsc`; `ui-client`, `fuselage-ui-kit` and `ui-*` typecheck and jest. e2e runs per pull request, not per component; a class-contract change greps e2e, apps and docs. | CI, the DoD script |
| **G5** Budgets | Size inside the batch's share of +25 kB gzip JS; CSS reported, no growth beyond dedupe; Message and Sidebar benches within +10% of `develop`, from the first batch on, on the zero stylesheet deduped as the web client serves it (the bench does it). | Size-report CI, [`perf-bench.mjs`](../../packages/fuselage/scripts/verify/perf-bench.mjs), both read by [`dod.mjs`](../../packages/fuselage/scripts/verify/dod.mjs) |
| **G6** Diff decisions | Every non-zero result is a row: what, why, and **noise** (reproduces on two `develop` captures), **intended** (reason and approver) or **regression** (fixed before merge). Precedents go in [Precedents](#precedents), deviations in [Deviations](#deviations). | The evidence table, reviewed |
| **G7** Tamagui by the book | Frames follow the rules above. React Native readiness is narrow: frames and neutral prop types are portable; values and CSS are web-only, by decision. | [`frame-platform.mjs`](../../packages/fuselage/scripts/verify/frame-platform.mjs) (`yarn workspace @rocket.chat/fuselage test:verify`): frame modules import no DOM types and no `react-dom`; review |
| **G8** Review and release | Code review pass; human CODEOWNER review; changeset per [Releases](#releases); `@rocket.chat/meteor` changeset or release note when the class contract changes (Custom CSS impact); the program checklist updated. | Review, changeset check |

## Policies

Decided once, so no component reopens them.

1. **z-index is a layer token.** Use `zIndex` from `@rocket.chat/fuselage-tokens` (`raised` 1, `overlap` 2, `sticky` 10, `overlay` 100, `drag` 9996). A literal z-index is forbidden. `drag` is the layer above every overlay for what a drag creates; the stacking of its parts is `drag + n`, which the generator emits through `zIndexAbove`. A component adopts the tokens in its own migration commit.
2. **Plain CSS only in allowed categories, and only on properties the frame doesn't set.** The categories are what a frame can't express: `:invalid`, a disabled `fieldset`, `::placeholder`, the state of a native form control (below) and the like. If the frame sets the property, it becomes a variant instead. Component CSS is unlayered today (`components/index.scss` loads it outside any `@layer`; only `styles/box-sizing.css` and `styles/direction.css` are layered), so specificity decides between it and a frame's atomic rules, and the load order differs between `dev:next` and the production build: a rule that touches a property the frame sets would win in one and lose in the other. Each rule carries a comment naming its category, and never uses `[class]`.
   - **Six more categories**, each with the same guard (never a property the frame sets, never `[class]`, a comment naming the category):
     - **Pseudo-elements a part draws itself:** the Tooltip arrow, the ProgressBar shine, the ToastBar stripe and progress bar, Skeleton's `:empty::before`, the Divider bar's `::after`.
     - **Keyframe animation:** `animation-*` and `@keyframes`, as the Button spinner.
     - **`@property` registrations** of the part's `--rcx-*` custom properties.
     - **Properties Tamagui has no key for:** `-webkit-font-smoothing`, and `list-style*` where the frame has no key for it.
     - **Consumer rich text:** element selectors under the part's own class, styling descendants the part does not render.
     - **Single-class rules on a non-frame `Icon` the part renders:** a modifier class such as `rcx-callout__icon--info`, which keeps the theme custom properties. Colour of a parent's state on an icon goes here, never `<Icon color>` or a wrapper element.
   - **More categories for forms and lists**, with the same guard:
     - **Component-scoped custom property inputs:** `--rcx-<part>-*` custom properties that a frame value reads through `var()` (Item's `--rcx-item-inset-inline` and `--rcx-item-gap`), set per `rcx-*` modifier class or inside a container query (zero has no CSS container queries). Tamagui 3.0.18 silently drops a custom property set inside a variant, so the frame never sets them; the CSS never touches a property the frame sets.
     - **Pseudo-elements on the part's own element:** generated content (`::before`, `::after`, a stretched-link overlay, a divider line) and `::-webkit-scrollbar*`, with every property set on the pseudo-element only. A frame can't style them, and a real child element would change what assistive technology sees.
     - **Elements created outside React:** the layers an app hook builds imperatively or toggles by class (the drag drop line, drop box, shield, preview, announcer, and `rcx-item--dropped`). They can't be frames, so they stay plain CSS, with `drag + n` z-indexes and the same guard.
     - **Properties Tamagui 3.0.18 drops** (`transition` is one): plain CSS on the part's own element, with a comment naming the category, and `none` under `prefers-reduced-motion`. The frame never sets the property, so the guard holds.
     - **Media queries a frame has no key for** are not a category: a frame value names a configured `media` key (see the precedents), never a CSS `@media` rule on a property it sets.
   - **State of a native form control.** This widens the category below from the hidden input of a selection control to every part that follows a native form control: `:invalid`, `:disabled`, `fieldset:disabled` (`*:disabled &`), `::placeholder`, the `::-webkit-*` internals of date, time and number inputs, the part's own wrapper through `:has(> input:<pseudo>)`, an addon after the input through `input:<pseudo> + addon`, and an addon before it through `addon:has(+ input:<pseudo>)`. Native `:invalid` also fires with no `error` prop (required, `type=email`, `min` and `max`), so it is followed as is. The frame of an input-like box sets **layout and typography only**; every colour-bearing property (`color`, `caret-color`, `border-color`, `background-color`, `box-shadow`, `-webkit-text-fill-color`) and the disabled `cursor` and `pointer-events` come from CSS generated by `inputPalettes`, resting, hover and focus included, because one property can't be split between a frame and a rule. The CSS selects only on the part's own modifier classes and attributes (`rcx-select--invalid`, `[aria-expanded='true']`) or on native state.
   - **State of a hidden native input: `input:<pseudo> + fake`.** CheckBox, RadioButton and ToggleSwitch keep a visually hidden native `input` and draw a fake element after it, which can follow the input's `:checked`, `:focus`, `:disabled` and the like only through a sibling selector. That selector is the allowed category. The fake's frame then sets **layout only**; every colour, the resting state included, comes from the generated CSS, so no property is set both by the frame and by the sibling rule. Tracking `checked` in React instead would break uncontrolled use and react-hook-form's `register`.
3. **Existing hacks go when their component migrates:** sibling `+` rules, `:has()`, `[class]` bumps, negative margins, `display: contents` compensation. One stays only with a [Deviations](#deviations) row. The exception is a negative margin that is a design or optical value of the part's **own frame** (the Throbber's dots, the overlap of stacked avatars, an inline Banner's icon): it is allowed as a value from `offScale(-n)`. A negative margin in a rule that targets another component is never allowed.
4. **Right-to-left mirroring uses `--rcx-dir`.** `styles/direction.css` sets `--rcx-dir` to `1` on `:root` and under `[dir='ltr']`, and to `-1` under `[dir='rtl']`, in `@layer fuselage` with zero specificity. A frame value that mirrors uses it in `calc(...)`, for example `rotate(calc(90deg * var(--rcx-dir)))`. `:dir(rtl)` rules and specificity bumps are out: they touch a property the frame sets.
5. **A container that holds text is `Text`-based** (`Tile`, `TableCell`, `TabsItem`, `CardBody`). A pure layout container is a `View`, and callers wrap their text. A frame that extends another frame (`FramedIcon` extends `IconFrame`) follows the same G1 accounting as the base.

## Program rules

- **Tamagui is version-frozen.** An upgrade is its own pull request and re-runs the full A/B over every migrated component.
- **Cold CI runs zero builds.** Never restore `.cache/tamagui`: the compiler cache is keyed on source only, so a stale one hides a compiler change.
- **Land batches early in a release cycle** so release candidates and QA catch problems.
- **Each batch has a byte budget inside the program's +25 kB gzip JS.** L1 (actions) has 6 kB. In the pilot the variant tables alone cost about 2 kB for Button, IconButton and Tag.
- **Fix forward.** Once a later batch builds on an earlier one there is no rollback.
- **Design notes are reviewed once per batch.** The gate re-fires only on a surprise during implementation.

## The frame-values generator

`yarn workspace @rocket.chat/fuselage generate:frame-values` writes the style values of a component's frames between markers in the module that declares them. With `--check` (run by `yarn lint`) it fails when a section is stale, and it rejects a raw px or rem length (a spacing or font value that isn't `spacing()`, `fontScale()` or `offScale()`) in a generator module and in a stylesheet that has a generated section. The compiler reads a `styled()` from its module's source, so the values can't be computed or imported there.

- **One module per component** in `packages/fuselage/scripts/frame-values/`, default-exporting `Target[]` (`{ file, generate, css?, section? }`). The runner globs the directory, with no index. Shared code lives in `scripts/frame-values/lib/`: markers, `literal`, `offScale` and the token readers, the button palettes, the selection palettes, the status palettes (`statusPalettes`: font and background of `info`, `success`, `warning` and `danger`), the input palettes (`inputPalettes`, and `inputBoxStates`, `inputTextStates`, `inputTextFillStates` and `inputAddonStates`, which emit the native-state CSS of an input-like box, its text and its addons for the selectors and the extra invalid and disabled conditions a part gives them), the item palettes (`itemPalettes` and `itemCustomProperties`, the inset and gap inputs), `zIndexAbove` over the z-index tokens, `elevation` (the shadow and border of levels `0`, `1`, `2`, `1nb` and `2nb`) and `textFrameDefaults`.
- **The generated section holds value constants only.** The `styled()` call is written by hand below it and uses the constants; a `styled(Text, …)` frame restates the View defaults it needs through `textFrameDefaults`.
- A generated CSS section is for rules a frame can't express (the categories of policy 2).

## The render-element spread rule

`rocket.chat/render-element-spread` (`packages/lint-config/rules/render-element-spread.js`) is an error in `packages/fuselage/src/**/*.tsx`.

- **A frame takes no spread.** Any `{...x}` on an element whose name is bound in the same module to `styled(...)` is reported.
- **A render element takes a spread only of a `safeCalls` call.** `render={<button {...ariaAndDataAttributes(props)} />}` passes; a spread of a variable, an object or any other call fails, even one that cannot carry a `className`.
- The `safeCalls` (in `.oxlintrc.json`, and the rule's test) are `ariaAndDataAttributes`, `customProperties` (returns only `{ style }` of `--rcx-*` keys), `pickPositionStyle` (only the `PositionStyle` keys), `pickVirtualizerStyle` (only the `VirtualizerStyle` keys), `positionedCustomProperties` (both of those in one `style`, for a part that `Position` places and that also carries open values) and the `pick…Handlers` helpers (`pickWebPressHandlers`, `pickWebRowHandlers`, `pickWebTextInputHandlers`, `pickWebDropHandlers`, `pickWebCaptureHandlers`, `pickWebAnimationHandlers`). A new one is a function that returns a closed list of attributes without `className`.
- `style` is left alone: the compiler refuses a frame whose render element sets its own `style`, so nothing overwrites it.

## Releases

- Changesets are **`minor`** on the affected package's current release line (the Fuselage packages are versioned independently of `@rocket.chat/meteor`), even though the packages are on npm.
- Each changeset has a **"Breaking for npm consumers"** section listing every API change (props removed, renamed or narrowed, `style` no longer accepted, tags changed), plus the visible changes.
- A removal of Box styling from a family ships as its own minor changeset, before that family's migration ([ADR-0011](../adr/0011-fuselage-components-take-no-styling-props.md)).
- A change to the `rcx-*` class contract also gets a `@rocket.chat/meteor` changeset or release note, because workspace admins' Custom CSS targets those classes.

## Approval

`ggazzo` approves API changes and visible changes (the "intended" rows of G6). Visual regression baselines are regenerated only under the `visual-change-approved` label, in their own `test:` commit whose diff is reviewed against the commit that made the baselines stale.

## Deviations

Departures from the documented Tamagui way. Empty is the goal; every row is a decision someone approved.

| What | Why the documented way can't do it | Alternative considered | Decision | PR |
| --- | --- | --- | --- | --- |
| `.rcx-item:has(> .rcx-item__content > :nth-child(2))` sets `--rcx-item-gap` to 8px when an Item has two lines, as `multiline` does | Detecting it in React costs an extra render per row (`ItemContent` counting its children into the context), and requiring `multiline` shifts every undeclared two-line row by 4px | `multiline` required after a consumer audit; `ItemContent` registering its children | Keep the rule, which sets only the custom property (policy 2, component-scoped custom property inputs) and no property of a frame | L3 Item |
| `Item`'s `focused` paint keeps `'group-hover/options'` inside its variant: the cursor's row goes transparent while the pointer is over the options list, unless it is on that row | The key only applies to a focused row, and a base-level key would also repaint every selected, hovered and disabled row, because a variant that restates `backgroundColor` replaces the base value whole | A second frame for focused rows (remounts the row when the cursor moves); a `focused`-only frame in `Option` | Kept in the variant, pending approval | |
| The Vite build dedupes the zero stylesheet (`dedupeTopLevelRules` in `apps/meteor/vite/vite.config.mts` keeps the last copy of each identical top-level rule) | Tamagui's compiler emits the same atomic rules once per module | No dedupe: about +7 kB gzip on the pilot (25.7 to 19.0 kB, 3851 to 1621 rules) | Keep; parity proven on all 581 pilot stories | On `develop` |

## Precedents

Results that recur and were decided once, so a G6 row can cite them.

- **`group-hover` is inside `@media (hover: hover)`.** A child revealed by a parent's hover is no longer revealed by a touch tap, as the plain `:hover` rule it replaces was. Applies to every `group` variant on hover.
- **L1 frames keep the `rcx-box rcx-box--full` classes.** The characterization specs assert them and nothing in the cascade changes. They are removed program-wide in one later unit, so the class contract doesn't change piecemeal.
- **`disabled` stays on the element, never on a frame.** A frame's `disabled` state compiles to `[aria-disabled="true"]`, and the zero build also writes `disabled=""` on a link, which the runtime does not: the two builds differ. A frame follows a disabled control through its own variant keys (`kind` and `kind-disabled`), the element carries `disabled` (a button) or `aria-disabled` (a link), and a frame's `disabled` prop is never set.
- **`group-press` compiles.** `group: 'button'` on the parent frame and `transform: { default: 'none', 'group-press/button': 'translateY(1px)' }` on a child frame give `:where(.t_group_button:active *)`, the same in the runtime and zero builds, with nothing bailed. It replaces the `:active > *` parent-state rule; hover inside it follows the `@media (hover: hover)` precedent above.
- **Fuselage owns `box-sizing: border-box` in `@layer fuselage`.** Frames don't force `content-box`, and the app's reset is not assumed to be loaded (the Storybook doesn't load it), so a stylesheet gives every `rcx-*` part and its pseudo-elements `border-box` (pilot commit `c739532c640`).
- **No `[hidden]` rules.** A part that accepts `hidden` follows it through a frame variant (`display: none`) plus the native attribute; a rule for it would touch `display`, which the frame sets. A part that does not accept `hidden` has nothing to follow.
- **`rcx-box rcx-box--full` stays where `develop` had it**, on the parts that rendered a `Box`, and is not added to a part that was plain DOM. A pseudo-element under `.rcx-box--full` (the Tooltip arrow, the ProgressBar shine) depends on the reset it gives.
- **z-index: nothing is adopted in L2.** No L2 part sets one, and adopting the layer tokens would change stacking (Tooltip's is the inline `zIndex` `usePosition` returns). Replacing that value with the `overlay` token is outside the Fuselage frames.
- **`group-focus-within` compiles.** `group: 'item'` on the parent frame and `'group-focus-within/item': …` as a key of a child frame's value give `:where(.t_group_item:focus-within *)`, with nothing bailed and the same computed value in the runtime and zero builds when a descendant of the parent has focus.
- **Media keys are configured once and named without `$`.** `src/tamagui.config.ts` has `media` entries `pointerCoarse` (`pointer: coarse`), `hoverNone` (`hover: none`) and `reducedMotion` (`prefers-reduced-motion: reduce`). A frame value uses one as a key, `paddingBlock: { default: 4, pointerCoarse: 12 }`, and zero compiles it to an `@media` rule, with nothing bailed and the same computed values as the runtime build under emulated media. Tamagui 3 reads `$pointerCoarse: {…}` as a removed v2 prop and drops it silently, so that form never works.
- **A part's colour of a native control's state is generated, not set by its frame.** L3 settled it for every input-like box (policy 2, state of a native form control); the date-range pickers that rely on native `:invalid` with no `error` prop keep working.
- **A shared text part carries Box's rich-text class instead of its own rules.** The Field description, hint, error and link add `rcx-box--with-inline-elements`, which `Box.styles.scss` already styles for `a`, `code`, `strong` and the rest, so `Field.styles.scss` is gone.
- **A part that spaces its children does it with `gap`, never a class added to them.** `FieldGroup` has `gap: x24` and no `rcx-field-group__item`; the Field parts keep their own `margin-block` as frame values, so a later move to `gap` is a separate design change.
- **A browser's own widget is handled by a module-level check, not a `@supports` rule.** The date input's calendar addon is not rendered where `CSS.supports('-moz-orient', 'inline')` says Firefox draws its own; the check is guarded for jsdom.
- **An app's own input-like box keeps `rcx-input-box__wrapper` for the colours and lays itself out.** The generated native-state stylesheet selects on that class (border, background, focus ring, cursor), so the composer, the canned response preview, the file preview and the multi-select anchor get them from it and set their own box (position, border width, radius, padding, font) through their own props or class.
- **A generated stylesheet is exempt from stylelint's ordering and duplicate-selector rules.** Its rules come in the order the native-state emitters produce them, which the cascade depends on, so `InputBox.styles.css` is in `.stylelintignore`; `yarn generate:frame-values --check` keeps it in sync.
