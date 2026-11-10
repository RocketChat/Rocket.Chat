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
| `className` never in a render-element spread; no `{...props}` on a frame | lint rule `rocket.chat/render-element-spread` (arrives with L1, not yet available) |
| Values come from `fuselage-tokens`; generated sections are in sync | `generate:frame-values --check` (arrives with L1, not yet available) |
| No text node directly in a `View` | jest dev-mode check ([`textNodes.spec.tsx`](../../packages/fuselage/src/testing/textNodes.spec.tsx)) |
| Raw layout and style props don't grow | `scripts/scan-raw-layout.mjs`, `scripts/scan-style-props.mjs` ratchets |
| No new override of a migrated part without `[class]`; CSS hacks don't grow | selector inventory and CSS-hack ratchets ([`selector-inventory.mjs`](../../packages/fuselage/scripts/verify/selector-inventory.mjs), [`css-hacks.mjs`](../../packages/fuselage/scripts/verify/css-hacks.mjs)), run by `yarn lint` |
| Class contract, `.d.ts` and accessibility tree changes are visible | the DoD script diffs ([`dod.mjs`](../../packages/fuselage/scripts/verify/dod.mjs), [`story-classes.mjs`](../../packages/fuselage/scripts/verify/story-classes.mjs), [`dts-diff.mjs`](../../packages/fuselage/scripts/verify/dts-diff.mjs)); each change is a G6 row |
| Size budget per batch | size-report CI job ([`sizeReport.mjs`](../../apps/meteor/vite/sizeReport.mjs)) |

### Enforced by review

- **A frame gets only variants, a named `className` (after the `rcx-*` classes) and `children`.** It is declared in the module that renders it. A fixed tag is `render: '<tag>'`; a closed set of tags is one branch per tag, each with a literal element.
- **Consumer attributes go on the literal render element:** `{...ariaAndDataAttributes(props)}` first, then each attribute **by name**, then any overriding default. The props type lists exactly what the component supports, built from the `ElementAttributes` groups with `Omit` in the type. Handlers are forwarded only where callers need them.
- **No consumer `style`.** The one exception is Tooltip under `Position`. An internal open value is a registered `@property` custom property on the component's own element.
- **Text frames are `Text`-based.** No `Box`, `StylingBox` or `useStylingProps` inside a migrated component.
- **Parent state is `group`.** `:has()` and sibling rules become variants. Plain CSS is allowed only in the categories below, commented.
- **App overrides through `[class]` are debt.** Each one found is a candidate variant; the ratchet keeps the count from growing.
- **A new patch hunk or deviation gets its own commit and a row in [Deviations](#deviations).**

## Definition of Done

Every component, with the evidence table in the pull request.

| Gate | Requirement | Checked by |
| --- | --- | --- |
| **G0** Characterization | Specs (forwarding, keyboard, handlers, accessibility snapshot, class contract) land in a commit below the component, green on `develop`. The migration passes them unedited; only an intended API change edits them, each edit a G6 row. | Commit order; the specs run in jest and in the zero Storybook ([how to write one](../../packages/fuselage/src/testing/README.md)) |
| **G1** Zero-runtime | 0 bailed, 0 partial, 0 diagnostics for the component's modules; `build:vite` enforce passes; no `@tamagui/*` in the client; no new `.yarn/patches/@tamagui-*` hunk without a G6 decision and a Deviations row. | Zero stats file, enforce build, graph receipt |
| **G2** No CSS hacks | Ratchets green. No `!important` or specificity bump inside Fuselage; no `:has()`, sibling or parent-state rule for what the component renders itself; no raw px/rem, literal colour or literal z-index; no static inline `style`; no Box styling. | Ratchets and lint; review for the rest |
| **G3** A/B | Over every story that renders the component: pixel A/B develop to runtime and runtime to zero (light, desktop, LTR; hover, focus-visible, press and disabled via story args); computed-style A/B for dark, high contrast, RTL, and mobile width where the component has media queries; accessibility tree, tags and class contract identical or decided; real app on the main consumer screens in `build:vite` and `dev:next`. | [`dod.mjs <Component>`](../../packages/fuselage/scripts/verify/dod.mjs) (runs [`story-ab.mjs`](../../packages/fuselage/scripts/verify/story-ab.mjs) and [`story-computed.mjs`](../../packages/fuselage/scripts/verify/story-computed.mjs)), visual regression CI |
| **G4** Behaviour and API | G0 specs green in jest and zero Storybook; axe on every story; `.d.ts` diff reviewed; consumer survey, spreading wrappers included; Fuselage typecheck, lint and jest; Meteor `tsc`; `ui-client`, `fuselage-ui-kit` and `ui-*` typecheck and jest. e2e runs per pull request, not per component; a class-contract change greps e2e, apps and docs. | CI, the DoD script |
| **G5** Budgets | Size inside the batch's share of +25 kB gzip JS; CSS reported, no growth beyond dedupe; Message and Sidebar benches within +10% of `develop`, from the first batch on. | Size-report CI, [`perf-bench.mjs`](../../packages/fuselage/scripts/verify/perf-bench.mjs), both read by [`dod.mjs`](../../packages/fuselage/scripts/verify/dod.mjs) |
| **G6** Diff decisions | Every non-zero result is a row: what, why, and **noise** (reproduces on two `develop` captures), **intended** (reason and approver) or **regression** (fixed before merge). Precedents go in [Precedents](#precedents), deviations in [Deviations](#deviations). | The evidence table, reviewed |
| **G7** Tamagui by the book | Frames follow the rules above. React Native readiness is narrow: frames and neutral prop types are portable; values and CSS are web-only, by decision. | [`frame-platform.mjs`](../../packages/fuselage/scripts/verify/frame-platform.mjs) (`yarn workspace @rocket.chat/fuselage test:verify`): frame modules import no DOM types and no `react-dom`; review |
| **G8** Review and release | Code review pass; human CODEOWNER review; changeset per [Releases](#releases); `@rocket.chat/meteor` changeset or release note when the class contract changes (Custom CSS impact); the program checklist updated. | Review, changeset check |

## Policies

Decided once, so no component reopens them.

1. **z-index is a layer token.** Use `zIndex` from `@rocket.chat/fuselage-tokens` (`raised` 1, `overlap` 2, `sticky` 10, `overlay` 100). A literal z-index is forbidden. A component adopts the tokens in its own migration commit.
2. **Plain CSS only in allowed categories, and only on properties the frame doesn't set.** The categories are what a frame can't express: `:invalid`, a disabled `fieldset`, `::placeholder` and the like. If the frame sets the property, it becomes a variant instead, because Tamagui's atomic rules are unlayered and win. Each rule carries a comment naming its category, and never uses `[class]`.
3. **Existing hacks go when their component migrates:** sibling `+` rules, `:has()`, `[class]` bumps, negative margins, `display: contents` compensation. One stays only with a [Deviations](#deviations) row.
4. **A container that holds text is `Text`-based** (`Tile`, `TableCell`, `TabsItem`, `CardBody`). A pure layout container is a `View`, and callers wrap their text. A frame that extends another frame (`FramedIcon` extends `IconFrame`) follows the same G1 accounting as the base.

## Program rules

- **Tamagui is version-frozen.** An upgrade is its own pull request and re-runs the full A/B over every migrated component.
- **Cold CI runs zero builds.** Never restore `.cache/tamagui`: the compiler cache is keyed on source only, so a stale one hides a compiler change.
- **Land batches early in a release cycle** so release candidates and QA catch problems.
- **Fix forward.** Once a later batch builds on an earlier one there is no rollback.
- **Design notes are reviewed once per batch.** The gate re-fires only on a surprise during implementation.

## Releases

- Changesets are **`minor`**, staying on 9.x, even though the packages are on npm.
- Each changeset has a **"Breaking for npm consumers"** section listing every API change (props removed, renamed or narrowed, `style` no longer accepted, tags changed), plus the visible changes.
- A removal of Box styling from a family ships as its own minor changeset, before that family's migration ([ADR-0011](../adr/0011-fuselage-components-take-no-styling-props.md)).
- A change to the `rcx-*` class contract also gets a `@rocket.chat/meteor` changeset or release note, because workspace admins' Custom CSS targets those classes.

## Approval

`ggazzo` approves API changes and visible changes (the "intended" rows of G6). Visual regression baselines are regenerated only under the `visual-change-approved` label, in their own `test:` commit whose diff is reviewed against the commit that made the baselines stale.

## Deviations

Departures from the documented Tamagui way. Empty is the goal; every row is a decision someone approved.

| What | Why the documented way can't do it | Alternative considered | Decision | PR |
| --- | --- | --- | --- | --- |
| The Vite build dedupes the zero stylesheet (`dedupeTopLevelRules` in `apps/meteor/vite/vite.config.mts` keeps the last copy of each identical top-level rule) | Tamagui's compiler emits the same atomic rules once per module | No dedupe: about +7 kB gzip on the pilot (25.7 to 19.0 kB, 3851 to 1621 rules) | Keep; parity proven on all 581 pilot stories | On `develop` |

## Precedents

Results that recur and were decided once, so a G6 row can cite them.

- **`group-hover` is inside `@media (hover: hover)`.** A child revealed by a parent's hover is no longer revealed by a touch tap, as the plain `:hover` rule it replaces was. Applies to every `group` variant on hover.
- **Fuselage owns `box-sizing: border-box` in `@layer fuselage`.** Frames don't force `content-box`, and the app's reset is not assumed to be loaded (the Storybook doesn't load it), so a stylesheet gives every `rcx-*` part and its pseudo-elements `border-box` (pilot commit `c739532c640`).
