# Fuselage phase 0: inconsistencies to fix on `develop` before the Tamagui migration

The backlog for phase 0 of [the migration plan](fuselage-tamagui.md#plan). Every fix here makes sense without Tamagui, lands on `develop` in its own pull request, and turns the migration of each component into a mechanical change of how it is styled.

- **Audited:** `packages/fuselage/src` on `develop` (SCSS and the `Box` css-in-js). Paths are relative to it.
- **Pilot column:** whether the Tamagui pilot (`feat/fuselage-tamagui-pilot`) already handles the finding.
- **Consumer counts:** a regex over `apps/meteor/client`, `apps/meteor/ee/client` and `packages/*/src`, excluding Fuselage, stories and specs. A multi-line JSX match stops at the first `>`, so the counts are lower bounds.

Public surface: 284 components exported from `components/**/index.ts`.

## Status and priorities (2026-10-25)

### The target the fixes serve

These come from [the migration plan](fuselage-tamagui.md):

- **Frames stay static.** A `styled()` frame holds only static styles, variants and CSS states (`:hover`, `:focus`, custom properties). It has no logic, no context, no values computed at render time and no forced state. Behavior lives in plain React components that compose frames.
- **No user-perceptible cost.** Against `develop`:
  - JS at most +10 kB gzip;
  - mount and update of the long lists (messages, sidebar, members) at most +10%;
  - CSS may change as long as total bytes don't regress.
- **Nothing irreversible for React Native.** `styled()` stays the source, and values go through the typed token helpers.

A fix belongs to phase 0 when it moves `develop` toward that target without Tamagui.

### Done

| ID | What | Where |
|---|---|---|
| 4.1 | Fuselage components no longer accept `Box` styling props, a free `is`, `rcx-*` props or a css function as `className` | #43100 (merged); the scanner allows 0 |
| — | Use-sites migrated off styling props on components | #42974 (merged) |
| — | The spacing scale is declared and spacing resolves to px | #43021, #43047 (merged) |
| 1.8 (part) | The stray backtick in `MessageStatusPrivateIndicator`; the `undefined` class in `MessageReactionCounter` | The first two commits of the pilot, ready to extract into their own PR |

### Corrections to the findings below

**6.1, forced-state classes.** `states.scss` matches the bare words `hover`, `active`, `focus` and `disabled` as well as their `is-*` forms. On `develop`:

- the `is-*` forms are used outside Fuselage only by `AssetSettingInput` (`is-disabled` on a borrowed `rcx-button`; the pilot already replaces it with a real `Button`);
- `CloseChatModal` passes `active`;
- inside Fuselage, 4 stories (the state showcases) and their 4 SCSS rules use them;
- no app selector and no e2e test targets them.

Dropping them is therefore cheap once those two sites change. It also removes the reason the pilot needs `forceStyle` in 9 frames, the largest size cost of the pilot's build-time lowering.

### New findings since the inventory

| ID | Component(s) | What | Fix on `develop` |
|---|---|---|---|
| N.1 | `Message`, `Item` | Parts revealed on row hover or focus (toolbar, timestamp color, hover actions). In SCSS this is already a parent selector; the pilot first used Tamagui `group` clauses, and each subscriber re-renders the row on mount. | Keep it a parent rule. Nothing to change on `develop`, but no frame may reintroduce `group` for it. |
| N.2 | `Item` | Besides 5.1, `Item` finds out after mount whether it has two lines and a link, which costs a second render per row. | Let an `Item` declare `multiline` and `interactive` (a pilot commit that also works on `develop`). |
| N.3 | style token helpers | `borderRadius`, `fontScale`, colors and the rest take any value and return `undefined` for a typo, so the style silently disappears. | Type them by the `fuselage-tokens` lists (a pilot commit that also works on `develop`). |
| N.4 | `OwnerDocument` | Reads `window` when the module loads, which breaks evaluating Fuselage at build time. | Read it lazily (a pilot commit that also works on `develop`). |
| N.5 | `Box` | 1,800+ use-sites keep the css-in-js runtime in every render. | Named layout primitives (`Stack` and a few more) for screens, per `docs/frontend/layout.md`; the `scan-raw-layout` ratchet keeps the count going down. |

### Priorities

**0. Guardrails, first.**
- A bench and size baseline measured on `develop`, so the budgets above have something to compare against.
- Extract the pilot commits that already work on `develop`: 1.8 (part), N.2, N.3, N.4 and 5.1 (part: register titles only for menu items).

**1. Unblock static frames.** Without these, Tamagui needs its runtime.
- 6.1: forced-state classes out (Storybook pseudo-states addon; fix `CloseChatModal` and `AssetSettingInput` first).
- 4.3: runtime `css`/`keyframes` become static CSS with custom properties.
- 6.7: `patchChildren` becomes child selectors.
- 6.2–6.5: state through DOM classes becomes `:focus-visible`, `:has(:invalid)`, `aria-*` or BEM modifiers.
- 4.2: default looks set through styling props or `css` move into the component's class.
- 4.4: retire `Margins`, `Flex*` and `Scrollable` (BoxTransforms).

**2. Render cost on `develop`.**
- 5.1 and N.2: `Item` without registries or post-mount discovery.
- 5.2, 5.3: container and media queries instead of measuring.
- 5.4, 5.6: derived instead of mirrored state.

**3. API hygiene, at any time.** Small mechanical PRs:
- 1.x: `className` merged;
- 2.x: props forwarded;
- 3.x: one polymorphism rule;
- 7.x: target names next to the old ones, then a codemod;
- 8.x: small bugs.

**4. Breaking, for 9.0.0.**
- Remove the deprecated names (7.x).
- Retire BoxTransforms consumers (4.4) and unify polymorphism (3.x).
- Remove the `states.scss` class selectors (6.1) if they were only deprecated earlier.

## Summary

| # | Category | Findings | Non-breaking | Breaking / needs deprecation |
|---|---|---|---|---|
| 1 | `className` replaced or dropped | 9 | 9 | 0 |
| 2 | Props dropped / declared props without effect | 9 | 9 | 0 |
| 3 | Polymorphism and props landing on an inner element | 4 | 2 | 2 |
| 4 | Styling-only `BoxProps` / css-in-js runtime | 4 | 2 | 2 |
| 5 | State discovered after mount | 6 | 6 | 0 |
| 6 | Visual state and contracts carried by class names | 8 | 7 | 1 |
| 7 | Naming / API inconsistencies, deprecated props | 9 | 1 | 8 |
| 8 | Other (bugs, duplicates, typing) | 8 | 7 | 1 |
| | **Total** | **57** | **43** | **14** |

"Non-breaking" means the fix keeps every prop and keeps the behavior the app relies on (bug fixes with zero dependent app sites count as non-breaking). "Breaking" means renames, removals or moving where props land; those need an additive alias plus deprecation now, and removal in 9.0.0.

Headline numbers:
- **About 97 public components accept `BoxProps`** (directly, or through `IconProps`, `ButtonProps`, `IconButtonProps`, `InputBoxProps`, `LabelProps`, `DividerProps`, `TableProps`, `TagProps`). Three more accept `StylingProps` only (`Accordion`, `Skeleton`, `Chip` via `withBoxStyling`). Nine more render `<Box>` while typed as plain HTML attributes, so `width`/`height`/`color` silently act as styling props (`Card`, `CardBody`, `CardTitle`, `CardGroup`, `ProgressBar`, `FramedIcon`, `MessageStatusIndicatorItem`, `AutoComplete` root, `AudioPlayer`).
- **About 45 components place a constant `className` before `{...props}`**, so a consumer `className` replaces the `rcx-*` class. Seven more always drop the consumer `className`. No app site passes `className` to any of them today, so all of these fixes are non-breaking.
- **41 hand-written (non-`Box`) TSX files add `rcx-box rcx-box--full` by hand**, and that class switches `Margins` off for them (6.6).

---

## 1. `className` replaced or dropped

| ID | Component(s) | File | What's wrong | Proposed fix on develop | Consumer impact | Pilot |
|---|---|---|---|---|---|---|
| 1.4 | ~45 plain-DOM parts: `CardCol`, `CardHeader`, `CardRow`, `CardControls`; `MessageContainer`, `MessageContainerFixed`, `MessageHeader`, `MessageLeftContainer`, `MessageName`, `MessageNameContainer`, `MessageRoles`, `MessageRole`, `MessageTimestamp`, `MessageUsername`, `MessageSystem`, `MessageSystemBlock/Body/Container/Name/Timestamp`, `MessageGenericPreview`, `MessageGenericPreviewThumb`, `MessageGenericPreviewTitle`, `MessageMetrics` (inner), `MessageMetricsContentItem`, `MessageMetricsItemLabel`, `MessageStatusIndicator`, `MessageStatusIndicatorItem`, `MessageDivider`, `ThreadMessage` (loses `rcx-message-thread`), `ThreadMessageBody/Container/LeftContainer/Row`, `ThreadMessageIcon`; `NavBar`, `NavBarSection`, `NavBarGroup`; `Pagination`; `SidebarFooter`, `SidebarFooterContent`, `SidebarSection`, `SidebarCollapseGroup`, `SidebarAccordionItem`, `SidebarBanner`; `Bubble` (+ `BubbleButton`/`BubbleItem` via `contentProps`); `OptionAvatar`, `OptionColumn`, `OptionDescription`, `OptionDescriptionBlock`, `OptionInput` | `Card/*`, `Message/**`, `NavBar/*`, `Pagination/Pagination.tsx`, `Sidebar/**`, `Bubble/*`, `Option/*` | `className='rcx-…'` precedes `{...props}`, so a consumer `className` replaces the component class (Option* parts type `className` out, but it still replaces at runtime through spread). | Destructure `className` and merge it (`cx('rcx-…', className)` / `prependClassName`), the way `Message`, `Badge` and `Sidepanel*` already do. One mechanical PR. | none (0 app sites pass `className` to these) | partly: ~30 fixed by `asPublicFrame` + `variantClass` (Card parts, most Message/ThreadMessage parts, `NavBar`, `States*`, `Sidepanel*`, `SidebarAccordionItem`); not fixed: `MessageHeader`, `MessageNameContainer`, `MessageRole`, `MessageSystem`, `MessageGenericPreviewTitle`, `MessageMetrics`, `MessageMetricsContentItem`, `MessageStatusIndicatorItem`, `MessageDivider`, `ThreadMessage`, `ThreadMessageIcon`, `NavBarSection`, `NavBarGroup`, `Pagination`, `SidebarFooter`, `SidebarSection`, `SidebarCollapseGroup`, `SidebarBanner`, `Bubble` |
| 1.1 | `States`, `StatesTitle`, `StatesSubtitle`, `StatesSuggestion`, `StatesSuggestionList`, `StatesSuggestionListItem`, `StatesSuggestionText` | `States/*.tsx` | `{...props}` precedes a fixed `className`, so the consumer `className` is **always dropped**. | Merge `className`. | none (0 sites) | partly (5 of 7 fixed via `asPublicFrame`; `StatesSuggestionListItem`, `StatesSuggestionText` not) |
| 1.9 | `Select` (react-aria) | `Select/Select.tsx`, `Select/SelectAria.tsx`, `Select/SelectTrigger.tsx` | Typed `AllHTMLAttributes`, but `...props` only feeds `useSelectState`/`useSelect`; `SelectTrigger` gets only aria trigger props, so `className`, `style` and every non-`data-*` HTML attribute are dropped (`data-*` survives through react-aria `filterDOMProps`). | Forward `className`/`style` (and remaining DOM props) to the trigger root. | none today (0 `className`; 2 `data-testid` sites in `ExportMessages.tsx` work) | no |
| 1.2 | `StatesIcon` | `States/StatesIcon.tsx` | `className={variation && …}` comes after `{...props}`: consumer `className` dropped, and `className={undefined}` when there is no variation. | Merge. | none | no |
| 1.3 | `MessageBlock` (and so `MessageReactions`) | `Message/MessageBlock.tsx`, `Message/MessageReactions/MessageReactions.tsx` | Destructures `className: _className` and discards it. `MessageReactions` passes `className='rcx-message-reactions'`, which never renders. | Forward `className`. | none visually (the root class has no own rules); any consumer `className` is lost | no (pilot keeps `_className`) |
| 1.5 | `NavBarItem` | `NavBar/NavBarItem.tsx` | `patchChildren` returns `{ className: append(…,'rcx-navbar-item'), ...props }`, so a `className` in props replaces the appended class on the child. | Merge `props.className` into the appended class. | none | no |
| 1.6 | `InputBox` and all inputs (`TextInput`, `PasswordInput`, …) | `InputBox/InputBox.tsx` | With an addon, consumer `className` lands on **both** the wrapper `<label>` and the inner `<input>`; without an addon only on the input. | Choose one target (wrapper when present) and document it. | low: 1 site passes `className` (`CloseChatModal.tsx`, `'active'`, no addon) | no |
| 1.7 | `PositionAnimated` (→ `Position`) | `PositionAnimated/Position.tsx` | `className: _className` discarded although typed via `BoxProps`. | Forward to the cloned child. | none | no |
| 1.8 | `Bubble`, `MessageReactionCounter`, `StatusBullet` icons, `MessageStatusPrivateIndicator` | `Bubble/Bubble.tsx`, `Message/MessageReactions/MessageReactionCounter.tsx`, `StatusBullet/icons/*.tsx`, `Message/MessageStatusIndicator/MessageStatusPrivateIndicator.tsx` | Class strings built without filtering emit `undefined`/`false` tokens (`[…].join(' ')`, `` `${className}` ``). `PrivateIndicator` has a stray backtick (`'…__item `rcx-…__item--private'`), so the `--private` token is malformed (no SCSS rule targets it either). | Use `cx`/`filter(Boolean)`; fix the literal. | none | partly: `Bubble` filters in the pilot; the backtick and the `MessageReactionCounter` class are fixed by the first two pilot commits, ready to extract |

## 2. Props dropped, or declared props without effect

| ID | Component(s) | File | What's wrong | Proposed fix on develop | Consumer impact | Pilot |
|---|---|---|---|---|---|---|
| 2.1 | `TabsItem` | `Tabs/TabsItem.tsx` | `disabled` is destructured for styling and never forwarded: a "disabled" tab is still a focusable, clickable `<button>`. | Forward `disabled` (or `aria-disabled` + guard). | bug fix; 5 sites pass `disabled` and get the fix | no (pilot maps it to an `isDisabled` style variant only) |
| 2.2 | `Button` | `Button/Button.tsx` | `rel: _rel` is discarded; only `external` sets `rel`. | `rel={rel ?? (external ? 'noopener noreferrer' : undefined)}`. | none (0 sites pass `rel`) | no |
| 2.3 | `FramedIcon` | `FramedIcon/FramedIcon.tsx` | `size={20}` comes after `{...props}`, so `size` is accepted (typed) and ignored. | Add a `size` prop defaulting to 20. | **visible**: `ui-voip` `CallHistoryUnknownUser.tsx` / `CallHistoryExternalUser.tsx` pass `size={28}` and get 20 | no |
| 2.4 | `ContextualbarIcon` (`size`, `paddingInline`), `ContextualbarAction` (`small`, `flexShrink`), `ModalClose` (`small`, `icon`), `MessageMetricsFollowing` (`small`), `MessageMetricsReply` (`small`), `StatesIcon` (`size`) | `Contextualbar/*`, `Modal/ModalClose.tsx`, `Message/MessageMetrics/*`, `States/StatesIcon.tsx` | Wrapper defaults are placed after `{...props}`, so the typed props are silently overridden. | Move defaults before the spread. | none (0 sites override them) | no |
| 2.5 | `CardGroup` (`small`, `large`), `Chevron` (`top`, `bottom`), `TableRow` (`hasAction`), `MessageGenericPreviewFooter` (`clamp`), `SidebarCollapseGroup` (`actions`), `TableBody`/`TableHead`/`TableFoot`/`TableCell` (typed `TableProps`: `striped`/`sticky`/`fixed`) | `CardGroup/CardGroup.tsx`, `Chevron/Chevron.tsx`, `Table/*.tsx`, `Message/MessageGenericPreview/MessageGenericPreviewFooter.tsx`, `Sidebar/SidebarCollapseGroup.tsx` | Declared props with no effect. Most leak to the DOM as unknown attributes (`small`, `top`, `hasAction`, `striped` on `<tbody>`/`<td>`). | Implement or remove from the type (type-only change). | none (0 sites for every one) | no (all still declared in pilot) |
| 2.6 | `ModalFooter` (keeps only `children`, `justifyContent`), `ModalFooterAnnotation`, `ModalFooterControllers` (`children` only), `MessageGenericPreviewDescription`, `MessageGenericPreviewFooter`, `MessageGenericPreviewIcon` (drops the rest of `IconProps`), `MessageStatusIndicatorText`, `MessageStatusPrivateIndicator`, `ThreadMessageOrigin`, `OptionHeader`, `AudioPlayer` (no `className`/HTML props), `Slider` (no `className`/`style`; the root class is a runtime class), `ToastBar` (`id` consumed, never rendered) | `Modal/*`, `Message/**`, `Option/OptionHeader.tsx`, `AudioPlayer/AudioPlayer.tsx`, `Slider/Slider.tsx`, `ToastBar/ToastBar.tsx` | Props dropped at runtime (some typed `BoxProps`/`ButtonGroupProps`, so the types say they work). | Forward rest props and `className` to the root. | none (7 `ModalFooter` sites pass only `justifyContent`) | partly (`asPublicFrame` forwards for `ModalFooterAnnotation`, `MessageGenericPreviewDescription/Footer`, `MessageStatusIndicatorText`, `ThreadMessageOrigin`; `ModalFooter`, `ModalFooterControllers` and the others still drop) |
| 2.7 | `Accordion`, `AccordionItem`, `CardGrid`, `MessageDivider`, `MessageSystemBlock/Container/Timestamp`, `OptionAvatar/Column/Description/DescriptionBlock/Input/Title`, `Dropdown` | various | Runtime forwards props (or should), but the type allows only `children` (+ a few), so `id`/`aria-*`/`data-*` cannot be passed in TS. | Widen the types to the element's HTML attributes. | none (additive) | no (pilot keeps the narrow types) |
| 2.8 | `Chip` | `Chip/Chip.tsx` | `onMouseDown` is re-bound as `onClick` (`onDismiss = onClick \|\| onMouseDown`), and a Chip with neither renders a disabled `<button>`. | Keep handlers on their own events; express "dismissable" explicitly. | low (`MultiSelect` `SelectedOptions` relies on it internally) | no |
| 2.9 | `PaginatedMultiSelectFiltered` (→ `PaginatedMultiSelect`) | `PaginatedSelect/PaginatedMultiSelect.tsx` | `{...props}` then `ref={containerRef}`: consumer `ref` (typed via `BoxProps`) is overwritten. | Merge refs. | none | no |

## 3. Polymorphism, and props landing on an inner element

| ID | Component(s) | File | What's wrong | Proposed fix on develop | Consumer impact | Pilot |
|---|---|---|---|---|---|---|
| 3.1 | `Grid` (wrapper `rcx-grid__wrapper` unreachable), `Table` (`rcx-table__wrapper`), `OptionContainer` (rest → innermost `Tile`), `Options` (`id` → list, rest → outer), `ModalContent` (rest → inner wrapper), `MessageToolbar` (rest → `ButtonGroup`, outer div unreachable), `MessageMetrics`, `MessageGenericPreviewContent`, `SidebarSection`, `SidepanelHeader`, `SidebarMediaController` (`className` outer, rest inner), `SidebarCollapseGroup` (`ref` inner, rest outer), `LabelInfo` (rest → `Icon`), `OptionIcon`/`SidebarItemIcon`/`SidebarItemStatusBullet` (rest → inner icon; `ItemIcon` wrapper unreachable), `ModalHeroImage` (→ `<img>`), `AutoComplete` (rest → `<input>`; root takes no `className`) | `Grid/Grid.tsx`, `Table/Table.tsx`, `Options/*`, `Modal/*`, `Message/**`, `Sidebar/**`, `Sidepanel/SidepanelHeader.tsx`, `Label/LabelInfo.tsx`, `Option/OptionIcon.tsx`, `AutoComplete/AutoComplete.tsx` | No rule says which element receives `className`/`style`/`data-*`/`ref`; in multi-element components it is often the inner one. | Rule: the root receives `className`/`style`/`data-*`/`ref`; inner elements get an explicit `xxxProps` (as `Bubble.contentProps` and `AudioPlayer.trackProps` already do). Add `xxxProps` now; move root-bound props in 9.0.0. | **breaking** where it moves: `Grid` 4 sites, `Table` 5 sites with attributes; others ~0 | no (`Grid` wrapper unchanged) |
| 3.2 | `Box`/`Button`/`Badge`/`MessageHighlight`/`Option`/Item family (`is` = any element type), `Menu` (`is` = trigger component **and** `button` element prop), `Modal` (`wrapper` **and** `wrapperFunction`), `Label` (tag switched by context), `Tag` (tag from `href`), `SidebarItem` (`is`, default `a`) vs `SidebarLink` (fixed `a`), `ItemLink` (`is: 'a' \| 'button'`), `CardTitle` (`variant` sets tag and font), `Divider` (`hr` vs `div` by `children`) | `Menu/Menu.tsx`, `Modal/Modal.tsx`, `Label/Label.tsx`, `Tag/Tag.tsx`, `Sidebar/**`, `Item/ItemLink.tsx`, `Card/CardTitle.tsx`, `Divider/Divider.tsx` | Several polymorphism mechanisms, sometimes two in one component. | Decide one convention (`is` for intrinsic tags; one component-injection API). `Menu`: deprecate `is` or `button`. `Modal`: deprecate `wrapperFunction`. `CardTitle`: split tag and scale. | **breaking** via deprecation: 13 `is={Component}` sites (mostly `NavBar*`/`Menu`), `Modal wrapper*` 10 sites, `Menu is/button` 2 | no |
| 3.3 | `Button`, `IconButton` | `Button/Button.tsx`, `Button/IconButton.tsx` | Behavior depends on `is`: `rel`/`target` only when `is === 'a'`; `type='button'` is always set, so `<a type="button">` renders (`AudioPlayerControls` passes `is='a'`). | Set `type` only for `button`. | none | no |
| 3.4 | `CheckBox`, `RadioButton`, `ToggleSwitch`, `Avatar` | `CheckBox/CheckBox.tsx`, `RadioButton/RadioButton.tsx`, `ToggleSwitch/ToggleSwitch.tsx`, `Avatar/Avatar.tsx` | `className` goes to the outer `<label>`/`<figure>`, every other prop to the inner `<input>`/`<img>`. Consistent within these four, opposite to rule 3.1. | Keep, but document it as the "form control / media" exception (and add `labelProps`/`containerProps` if needed). | none | no |

## 4. Styling-only `BoxProps` and the css-in-js runtime

| ID | Component(s) | File | What's wrong | Proposed fix on develop | Consumer impact | Pilot |
|---|---|---|---|---|---|---|
| 4.2 | ~30 components set their **default** look through styling props or inline `css`: `Contextualbar` (13 styling props), `ContextualbarContent/Footer/Section/Title/Skeleton`, `ContextualbarHeader` (+ inline `css` for `gap`), `ContextualbarAction` (`flexShrink`), `ContextualbarIcon` (`paddingInline`); `ModalContent` (`marginInline`), `ModalIcon`, `ModalFooter` (`justifyContent`), `ModalThumb` (wrapper `Box`); `CardBody`, `CardGrid`; `AudioPlayer`, `AudioPlayerControls`; `SelectTrigger`, `SelectFocus`, `SelectAria`, `SelectLegacy`, `MultiSelect`, `PaginatedMultiSelect` (`display`/`margin`/`fontScale`/`color` + `FlexItem`/`Margins`/`FlexContainer`); `Options`/`OptionContainer` (`Tile` padding props, `maxHeight`); `DropdownDesktop`/`DropdownMobile`; `TableSelection`, `TableSelectionButton`; `Tile` (default `padding`); `Label` required mark, `LabelInfo`; `Button`/`BubbleItem` icon margins; `MessageMetricsFollowing` (`position`/`overflow`); `SidepanelHeader` divider margins; `TableCell` placeholder `hr` | `Contextualbar/*`, `Modal/*`, `Card/*`, `AudioPlayer/*`, `Select/*`, `MultiSelect/*`, `PaginatedSelect/*`, `Options/*`, `Dropdown/*`, `Table/**`, `Tile/Tile.tsx`, `Label/*`, `Button/Button.tsx`, `Bubble/BubbleItem.tsx`, `Message/MessageMetrics/*`, `Sidepanel/SidepanelHeader.tsx` | Every instance generates css-in-js rules at runtime for constant styles; the migration would have to translate each one by hand. | Move the constant styles into the component's SCSS class; keep accepting the same props for overrides. | none | yes (as part of the migration: pilot moves them into `styled` frames) |
| 4.3 | `AnimatedVisibility` (keyframes), `Scrollable`, `Margins` (`useStyle`), `Slider` (`Slider`, `SliderHead`, `SliderThumb`, `SliderTrack`), `ToastBar` (keyframes per render), `Throbber` (per-circle `css`), `ContextualbarHeader` | listed files | Runtime `css`/`keyframes` for styles that are static apart from one or two values. | Static SCSS plus CSS custom properties for the dynamic values (`--throbber-delay`, `--toast-time`, slider fill %). | none | partly (some converted; pilot `StatesIcon` adds a new runtime `css`) |
| 4.1 | ~97 public components typed with `BoxProps` (list in Summary) | `Box/Box.tsx` and dependents | Accepting every styling prop (and `is`) on every part keeps `Box` and its runtime as public API. | Decide the policy now (e.g. styling props only on layout primitives, `className`/`style` elsewhere), announce it, and remove in 9.0.0. | **breaking**: e.g. `Field*` 125 sites pass styling props, `Icon` 93, `Modal*` 29, `Contextualbar*` 26 | **done** on `develop` by #43100; the pilot no longer maps `BoxProps` |
| 4.4 | `FlexContainer`, `FlexItem`, `Margins`, `Scrollable`, `AnimatedVisibility` (and `PositionAnimated` through it) | `Flex/*`, `Margins/Margins.tsx`, `Scrollable/Scrollable.tsx`, `AnimatedVisibility/AnimatedVisibility.tsx` | Inject props into the nearest descendant `Box` through the `BoxTransforms` context: they only work on `Box` children and keep the transform pipeline in every `Box` render. | `Scrollable`/`AnimatedVisibility`: render their own element or add a class to the child. `Flex*`/`Margins`: deprecate in favor of `gap`/explicit props. | **breaking** via deprecation: `Margins` 96 sites, `FlexContainer`/`FlexItem` 27, `Scrollable` 8 | no (kept, `takesBoxTransforms`) |

## 5. State discovered after mount

| ID | Component(s) | File | What's wrong | Proposed fix on develop | Consumer impact | Pilot |
|---|---|---|---|---|---|---|
| 5.1 | `Item` + `ItemTitle`/`ItemIcon`; `ItemGroup` + `ItemGroupTitle` | `Item/Item.tsx`, `Item/useIdRegistry.ts`, `Item/ItemTitle.tsx`, `Item/ItemIcon.tsx`, `Item/ItemGroup.tsx`, `Item/ItemGroupTitle.tsx` | Children register their ids in a `useState` registry from `useEffect`, so every `Item` with an `ItemTitle` renders twice on mount (sidebar rows, options, menu items). The registered ids are used only for `menuitem` roles. | Derive ids: `Item` creates a base `useId` and passes `${id}-title`/`${id}-desc` through context, so `ItemTitle` reads it (no registration); or take explicit `titleId` props. | none | partly (pilot registers only when `role` is `menuitem*`) |
| 5.2 | `Banner` (icon hidden below 375px), `Callout` (`--large` at 420px or more) | `Banner/Banner.tsx`, `Callout/Callout.tsx` | Element width measured with ResizeObserver, then re-render: purely visual. | CSS container queries on the root. | none | no |
| 5.3 | `Card` (`horizontal` wraps on mobile) | `Card/Card.tsx` | `useBreakpoints()` in JS for a purely visual wrap. | CSS media query in `rcx-card__horizontal`. | none | no |
| 5.4 | `MultiSelect`, `AutoComplete`, `AnimatedVisibility` | `MultiSelect/MultiSelect.tsx`, `AutoComplete/AutoComplete.tsx`, `AnimatedVisibility/AnimatedVisibility.tsx` | Props mirrored into state via `useEffect(setState)`: an extra render on mount and on each change. | Derive during render (`value ?? internal`, as `PaginatedSelect` already does). | none | no |
| 5.5 | `SelectLegacy` (and `SelectFiltered`, built on it) | `Select/SelectLegacy.tsx` | `useState(value)` is never re-synced, so a controlled `value` change after mount is ignored. | `const current = value !== undefined ? value : internal`. | bug fix: 2 `SelectLegacy` sites plus `SelectFiltered` users | no |
| 5.6 | `AudioPlayer` | `AudioPlayer/AudioPlayer.tsx` | `const { ref: containerRef } = useResizeObserver()`: the size is never read, but the observer re-renders on every resize. | Remove. | none | no |

## 6. Visual state and contracts carried by class names

| ID | Component(s) | File | What's wrong | Proposed fix on develop | Consumer impact | Pilot |
|---|---|---|---|---|---|---|
| 6.1 | Every component using `styles/mixins/states.scss` (`on-hover`, `on-active`, `on-focus`, `on-disabled`): Button, inputs, links, SplitButton, Tabs, Sidebar items, Accordion (15 SCSS files) | `styles/mixins/states.scss` | The mixins also match `.hover`, `.is-hovered`, `.active`, `.is-active`, `.focus`, `.is-focused`, `.disabled`, `.is-disabled`, so any consumer class with those words forces visual state. | Drop the class selectors (keep pseudo-classes); use a Storybook pseudo-states addon for docs; where a component needs forced state, use a prop + `data-*`. | **breaking** for 2 sites: `CloseChatModal.tsx` passes `className='active'` to `TextInput`; `AssetSettingInput` uses `is-disabled` on a borrowed `rcx-button` (the pilot replaces it with a `Button`). No app selector or e2e test targets these classes | no (pilot keeps the contract through `forceStyle`) |
| 6.2 | `SelectTrigger` (via `Select`), `SelectLegacy`, `MultiSelect` | `Select/SelectTrigger.tsx`, `Select/SelectLegacy.tsx`, `MultiSelect/MultiSelect.tsx` | `SelectTrigger` writes `focus` into `className`. `SelectLegacy`/`MultiSelect` call `classList.add/remove('focus-visible')` imperatively, and `SelectLegacy` reads that class back as its open/closed toggle. | Use `:focus-visible` / `data-focus-visible`; keep open state in React. | none | no |
| 6.3 | `InputBox` (all inputs) | `InputBox/InputBox.tsx` | `parentElement.classList.toggle('invalid', …)` in a layout effect and in `onChange`: DOM mutation outside React. | `:has(:invalid)` on the wrapper, or `aria-invalid` from `error`. | none | partly (pilot uses state: no DOM mutation, but an extra render) |
| 6.4 | `AutoComplete`, `MultiSelect`, `PaginatedMultiSelect`, `SelectLegacy`, `PaginatedSelect` roots; `SelectTrigger` | listed files | Bare `invalid`/`disabled` words in `className` drive the SCSS (`&.invalid`, `&.disabled`), so they collide with consumer class names. | Use BEM modifiers (`rcx-select--invalid`) or attribute selectors (`[aria-invalid]`, `[aria-disabled]`). | none | no |
| 6.5 | `Options` | `Options/Options.tsx` | Scrolls the active option into view with `querySelector('.rcx-option--focus, .rcx-item--focused')`, so styling class names double as data. | Use the active option's id (already computed for `aria-activedescendant`) or a ref. | none | no |
| 6.6 | `Margins` vs 41 hand-written components (`Badge`, `Avatar`, `Bubble`, `Message*`, `Pagination`, `Sidebar*`, …) | `Margins/Margins.tsx`, `Box/Box.styles.scss` | `Margins` styles children with `&:not(.rcx-box--full)`. Non-`Box` components add `rcx-box rcx-box--full` by hand to get the reset, so inside `Margins` they get **no** margin (not `Box`, so no transform; CSS excluded). | Give hand-written components their own reset class (not `rcx-box--full`), or retire `Margins` (4.4). | low (silent: margins missing where `Margins` wraps those components) | no (same selector in pilot) |
| 6.7 | `CardGroup`, `FieldGroup`, `NavBarItem`, `Margins`, `SidebarItemMenu`, `SidebarCollapseGroupMenu`, `SidebarLink` (menu) | listed files | `patchChildren` (`cloneElement`) injects `rcx-*__item` classes into children, so children must accept and merge `className`. `NavBarItem` also spreads all its props into the child. | CSS child selectors (`.rcx-card-group > *`). | none | no |
| 6.8 | `MessageEmoji`, `MessageReactionEmoji`, `ThreadMessageEmoji` | `Message/MessageEmojiBase.tsx` | The `name` prop is used as a CSS class (emoji sprite contract) and concatenated as `` `${className \|\| ''} ${name}` ``. | Document it, or rename to an explicit `spriteClassName`. | none | no |

## 7. Naming / API inconsistencies, deprecated props

| ID | Component(s) | File | What's wrong | Proposed fix on develop | Consumer impact | Pilot |
|---|---|---|---|---|---|---|
| 7.1 | `Button`, `IconButton` | `Button/Button.tsx`, `Button/IconButton.tsx` | `Button` has `variant`/`size` plus 10 boolean flags (already `@deprecated`), still dominant in the app. `IconButton` has **no** `variant`/`size` props at all, and its `primary` maps to the `secondary-info` class. | Add `variant`/`size` to `IconButton` (additive, non-breaking); codemod the app; remove the booleans in 9.0.0. | **breaking** at removal: Button ≥225 variant-boolean and ≥72 size-boolean sites (vs 6 `variant=`, 4 `size=`); IconButton ≥48 variant-boolean and ≥106 size-boolean sites | no |
| 7.2 | `Badge` (`small`), `ButtonGroup`/`SidebarButtonGroup` (`small`/`large`), `Tag` (`medium`/`large`), `Bubble` (`small`), `InputBox`/`Select` (`small`), `Menu` (5 size booleans), `StatusBullet` (`size: 'small' \| 'large'`), `Chevron` (`size` = width), `Icon` (`size` = font-size) | listed files | Sizes are expressed through booleans in some components and through `size` (with different units) in others. | Add a `size` enum next to the booleans; deprecate the booleans. | **breaking** at removal: ButtonGroup 13 sites, Tag 5, Badge 4 | no |
| 7.3 | `Divider`, `StatesIcon`, `Tooltip` (`variation`); `Callout` (`type`) vs `Banner` (`variant`) | `Divider/Divider.tsx`, `States/StatesIcon.tsx`, `Tooltip/Tooltip.tsx`, `Callout/Callout.tsx` | Three names for the same concept. | Accept `variant` everywhere; deprecate `variation`/`type`. | **breaking** at removal: `StatesIcon variation` 38 sites, `Callout type` 84 | no |
| 7.4 | `FramedIcon` (`info`/`success`/`warning`/`danger`/`neutral`), `SplitButton` (`danger`/`warning`/`success`/`primary`), `Bubble` (`secondary`) | listed files | Variants as boolean flags. | Add `variant`; deprecate the flags. | **breaking** at removal: 4 sites | no |
| 7.5 | `Message` (`isSelected`, `isEditing`, `isPending`), `MessageSystem` (`isSelected`), `ToastBar` (`isPaused`) | `Message/Message.tsx`, `Message/MessageSystem/MessageSystem.tsx`, `ToastBar/ToastBar.tsx` | `is*` booleans next to `highlight`, `sequential`, `selected`, `disabled`. | Add `selected`/`editing`/`pending`/`paused`; deprecate `is*`. | **breaking** at removal: 3 direct sites | no |
| 7.6 | `Option` + every `renderItem` contract (`focus`), `SelectTrigger` (`focus`) vs `Item`/`SidebarItem` (`focused`, `focusVisible`) | `Option/Option.tsx`, `Options/Options.tsx`, `AutoComplete/AutoComplete.tsx`, `Item/Item.tsx` | Same state, two names; `Option` translates `focus` into `focused`. | Accept `focused` in `Option`/`renderItem`; deprecate `focus`. | **breaking** at removal: custom `renderItem` implementations | no |
| 7.7 | Exports: `Select` index, `Menu` index, `NavBar` index, `MessageMetricsItemAvatarRow` | `Select/index.ts`, `Menu/index.ts`, `NavBar/index.ts`, `Message/MessageMetrics/MessageMetricsItem/MessageMetricsItemAvatarRow.tsx` | `SelectProps` is `SelectLegacy`'s props, and the aria `Select` props are not exported. `Menu` re-exports `Option*` as `MenuItem*` (`MenuItemContent` = `OptionContent`) while `MenuItem` is the stately collection node. `NavbarItemProps`/`NavbarSectionProps` casing differs from `NavBar*`. `MessageMetricsItemAvatarRow` declares `MessageMetricsItemProps`. | Export correct names, keep the old ones as deprecated aliases. | **breaking** at removal (type names) | no |
| 7.8 | `AutoComplete` (deprecated, still exported), `SelectLegacy` / `SelectFiltered` (legacy engine) next to `Select` (aria) | `AutoComplete/AutoComplete.tsx`, `Select/*` | Deprecated or legacy components are still public, and the "filtered" variant only exists for the legacy engine. | Migrate the app off them, then remove in 9.0.0 (or rebuild `SelectFiltered` on the aria `Select`). | **breaking**: `AutoComplete` 14 sites, `SelectLegacy` 2 | no |
| 7.9 | Irregular BEM: `rcx-toastbar_inner`/`_icon`/`_content`/`_progressbar` (single underscore), `rcx-button--content` (modifier used as element), `rcx-tabs__item--selected--disabled`, `rcx-sidebar--divider`, `rcx-sidepanel--divider` | `ToastBar/ToastBar.tsx`, `Button/Button.tsx`, `Tabs/TabsItem.tsx`, `Sidebar/SidebarDivider.tsx`, `Sidepanel/SidepanelDivider.tsx` | Class names consumers might target don't follow the convention. | Add correct class names alongside the old ones; drop the old ones in 9.0.0. | non-breaking if both are emitted | no |

## 8. Other

| ID | Component(s) | File | What's wrong | Proposed fix on develop | Consumer impact | Pilot |
|---|---|---|---|---|---|---|
| 8.1 | `AccordionItem` | `Accordion/AccordionItem.tsx` | `expanded = propExpanded \|\| stateExpanded`: `expanded={false}` cannot collapse after a user toggle, and there is no change callback. It duplicates `Sidebar/hooks/useCollapse.tsx` with different key handling (`event.key` `' '`/`Enter` vs `event.code` `Enter`/`Space`). | Reuse `useCollapse` (move it to a shared hook). | none (0 sites pass `expanded`) | no |
| 8.2 | `Options` (and so `SelectLegacy`, `AutoComplete`, `MultiSelect`) | `Options/Options.tsx` | `aria-multiselectable={multiple \|\| true}` is always `true`, even for single selects. | `aria-multiselectable={multiple}`. | none (a11y fix) | no |
| 8.3 | Duplicates: `Menu/MenuOption.tsx` (unexported, only its `variant` type is used) vs `Option`; `Divider` with children vs `MessageDivider` (both render `rcx-message-divider`); `ContextualbarActions`, `ContextualbarButton`, `SidebarActions`, `StatesActions`, `TableSelectionButtonGroup`, `OptionDivider` (pure aliases that add a render layer) | listed files | The same thing is implemented twice, or wrapped without adding anything. | Delete `MenuOption` (move its type), point `Divider` children at `MessageDivider`, turn the aliases into re-exports. | none for `MenuOption`/aliases; **breaking** only if `Divider`'s children mode is removed | no |
| 8.4 | `FieldDescription`, `FieldError`, `FieldHint`, `FieldLabel`, `FieldLabelInfo`, `FieldLink`, `FieldRow` | `Field/*.tsx`, `helpers/WithErrorWrapper.tsx` | They throw when used outside `Field`, but only when `NODE_ENV === 'development'`, so dev and prod behave differently. | Warn (`console.error`) in dev instead of throwing, or enforce in both. | none | no |
| 8.5 | `SidebarLink`, `SidebarItemAction` | `Sidebar/SidebarLink.tsx`, `Sidebar/SidebarItem/SidebarItemAction.tsx` | `SidebarLink` is typed `LinkHTMLAttributes` (the `<link>` element) instead of `AnchorHTMLAttributes`. `SidebarItemAction.onClick` is typed `(e: Event) => void`. | Fix the types. | none | no |
| 8.6 | `StatusBullet` | `StatusBullet/*` | `size: 'small' \| 'large'`, but `large` has no class or style (same as default). | Drop `large` or implement it. | none | no |
| 8.7 | `Divider` | `Divider/Divider.tsx` | With `children`, it switches root (`div.rcx-message-divider`) and ignores `vertical` and `variation`. | Split into two components, or support the props in both modes. | low | no |
| 8.8 | Contextualbar family | `Contextualbar/*` | Every part is wrapped in `memo`, unlike the rest of the library. Most of them take `children`, which is a new element on every parent render, so the memo never skips anything and only adds a comparison. | Drop `memo` (children change every render anyway) or apply it consistently. | none | no |

---

## Suggested PR grouping (develop, one concern each)

Non-breaking first. Each item is one small PR; bug fixes that ship in a release get `fix:` + changeset. Take them in the order of [Status and priorities](#status-and-priorities-2026-10-25), not in the numbering below.

1. **fix(fuselage): merge consumer `className` instead of replacing it** — 1.1, 1.2, 1.4, 1.5, 1.7, 1.8 (+ the stray backtick). Mechanical; adds specs for "consumer class kept".
2. **fix(fuselage): forward `className`/`style` from `Select` and `MessageBlock`** — 1.3, 1.9.
3. **fix(fuselage): forward dropped props** — 2.6 (`ModalFooter*`, `MessageGenericPreview*`, status indicator parts, `OptionHeader`, `AudioPlayer`, `Slider`, `ToastBar id`), 2.9 (merge refs).
4. **fix(fuselage): don't override typed props in wrappers** — 2.3 (`FramedIcon size`: visible in ui-voip), 2.4.
5. **fix(fuselage): `TabsItem` disabled, `Button rel`, `aria-multiselectable`** — 2.1, 2.2, 8.2 (behavior/a11y bug fixes).
6. **fix(fuselage): `SelectLegacy` controlled value and `AccordionItem` expanded** — 5.5, 8.1 (reuse `useCollapse`).
7. **chore(fuselage): remove dead props and widen narrow types** — 2.5, 2.7, 8.5, 8.6, and delete the dead `MenuOption` (8.3, part).
8. **refactor(fuselage): derive `Item` title/description ids instead of registering them** — 5.1 (one fewer render per row).
9. **refactor(fuselage): derive mirrored state** — 5.4, 5.6.
10. **refactor(fuselage): CSS container/media queries for Banner, Callout, Card** — 5.2, 5.3.
11. **refactor(fuselage): stop driving state through DOM classes** — 6.2, 6.3, 6.4, 6.5 (use `:focus-visible`, `:has(:invalid)`, BEM modifiers, ids).
12. **refactor(fuselage): CSS child selectors instead of `patchChildren`** — 6.7; and give hand-written components their own reset class instead of `rcx-box--full` — 6.6.
13. **refactor(fuselage): move default styling props to SCSS** — 4.2, split per family (Contextualbar, Modal, Select/MultiSelect, Options/Dropdown, Card/Table/Tile, misc).
14. **refactor(fuselage): static CSS + custom properties instead of runtime `css`/`keyframes`** — 4.3.
15. **refactor(fuselage): `Button`/`IconButton` `type` only on buttons; Field context warning; consistent `memo`** — 3.3, 8.4, 8.8.
16. **feat(fuselage): add the target API names next to the old ones (additive)** — `IconButton` `variant`/`size` (7.1), `size` enums (7.2), `variant` for `variation`/`type`/boolean flags (7.3, 7.4), `selected`/`editing`/`pending`/`paused` (7.5), `focused` (7.6), correct export names (7.7), correct BEM classes emitted alongside the old ones (7.9), `xxxProps` for inner elements (3.1, additive part). Mark the old ones `@deprecated`.
17. **chore(meteor): codemod the app to the new names** — Button/IconButton booleans (~450 sites), `variation`, `Callout type`, ButtonGroup/Tag/Badge sizes, `CloseChatModal className='active'` (6.1).

Breaking, for 9.0.0 (or behind the deprecations above):

18. **Remove forced-state class selectors from `states.scss`** — 6.1 (after step 17 removes the single app use).
19. **Retire `BoxTransforms` consumers** — 4.4: `Scrollable`/`AnimatedVisibility` render their own element; deprecate `Margins`/`FlexContainer`/`FlexItem` (96 + 27 sites to migrate to `gap`).
20. **Unify polymorphism** — 3.2 (`Menu is`/`button`, `Modal wrapper`/`wrapperFunction`, `CardTitle`), 3.1 (move root-bound props to the root for `Grid`, `Table`, …).
21. **Remove deprecated APIs** — Button/IconButton booleans, size booleans, `variation`/`type`, `is*` booleans, `focus`, old export names, old BEM classes (7.1–7.7, 7.9); `AutoComplete`, legacy `SelectFiltered` (7.8); `Divider` children mode (8.3/8.7).
22. **Narrow `BoxProps` on non-layout components** — 4.1, once the policy is agreed (largest breaking surface: `Field*` 125 sites, `Icon` 93, …).
