# Converted Fuselage components: native vs web, and what each PR could already do

Observed on the iPhone 17 Pro simulator (iOS 26.5, dev client, RN 0.88) with the combined branch `feat/expo-lab-all` (the PRs #43668, #43674, #43653, #43658, #43671, #43679, #43693, #43706 cherry-picked on develop). Web reference: the same gallery props and order, light theme, 393 px wide, rendered by Chromium from the published `dist` (`fuselage.css`, `PaletteStyleTag theme='light'`, the Inter and `RocketChat` fonts served to it).

Not measured: press (the simulator has no touch tool here, nothing was tapped), dark theme, Android, and any component that is not in the gallery (see "Coverage"). The native column of the property diff is read from the frame definitions on each PR head plus pixel comparison of the composites, not from Tamagui's resolved style objects (not instrumented).

## How it was produced

- Web: `Gallery.web.tsx` (new, web only) renders the same `GalleryContent.tsx` with the dist; `metro.config.js` now applies the `src` alias and the empty CSS stub to native only. `EXPO_PUBLIC_GALLERY=1 npx expo export --platform web`, served statically, screenshotted and measured (`getComputedStyle`) with Playwright.
- Native: `EXPO_PUBLIC_GALLERY=1 npx expo start --dev-client --port 8085`, `xcrun simctl io <udid> screenshot`. `EXPO_PUBLIC_GALLERY_SCROLL=<px>` opens the gallery scrolled, since there is no touch tool.
- Native gallery changes made for this comparison: the three components that throw on a DOM tag (Avatar, Banner, Tag) are skipped on native by default (`EXPO_PUBLIC_GALLERY_PROBE=1` renders them again), because their error opens the full-screen dev overlay that `LogBox.ignoreAllLogs` does not suppress; and the gallery loads `rocketchat.ttf` as `RocketChat` with `expo-font` (the font is a dependency of `expo`; it is now declared by the app).
- The web CSS of the gallery is theme-less without `PaletteStyleTag`: an unthemed web render shows no button or badge fill, the same blank look the spike saw.

## Summary: component x root cause

Buckets: (a) css stubbed, (b) web-only value in a frame, (c) DOM render element or prop, (d) missing icon font or Inter, (e) no theme or tokens, (f) RN default (layout, no style inheritance), (g) press or handlers web-only, (h) other. `x` is observed on the simulator, `~` is read from the frame code but not visible in the gallery, `.` is none.

| Component (PR) | a | b | c | d | e | f | g | h | Observed difference |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Button (#43653) | . | x | ~ | . | . | x | ~ | . | Each button fills the row (web: shrink to content); label black and left-aligned (web: variant colour, centred) |
| Badge (#43653) | . | . | ~ | . | . | . | . | . | None visible: fill, radius, size and bold white digits match |
| Chip (#43653) | . | ~ | ~ | x | . | x | ~ | . | Label black (web: grey); dismiss glyph was an emoji until the font was loaded, then matches; default thumb is a `<div>` |
| CheckBox (#43653) | x | . | ~ | . | . | x | ~ | . | Box outline only, top edge missing, no checked or indeterminate mark (drawn by pseudo-elements) |
| Icon (#43674) | . | x | ~ | x | . | . | . | . | Emoji without the font; with it the x20 and x24 glyphs are cut at the bottom (x16 fine) |
| Callout (#43658) | . | ~ | ~ | x | . | x | . | x | Fills the row (web: shrink to content); needs a `ResizeObserver` stub; icon was an emoji without the font |
| Message parts (#43706, Timestamp #43671) | . | . | ~ | . | . | . | ~ | . | Name, username, timestamp and body match the web look; Avatar inside a Message still throws (not converted) |
| Item row (#43671) | . | ~ | ~ | x | . | x | ~ | . | Fills the row, meta pushed to the far end (web: row as wide as content); icon as above |
| SidebarItem (#43671) | x | . | ~ | . | . | . | ~ | . | Matches at rest; hover, selected and focus rules live in `.styles.scss` and cannot show |
| Avatar, Banner, Tag (not converted) | . | . | x | . | . | . | . | . | `View config getter callback for component 'img' / 'h6' / 'span'` on render |
| All text | . | . | . | x | . | . | . | . | Inter is a `woff2` variable font, native renders in the system font (SF) |

Theme: with `TamaguiProvider` and Fuselage's config mounted (the gallery does) every `$rcx-*` theme key resolved: fills, borders and text colours of Button, Badge, Callout and Chip match the web hex values. A consumer that does not mount the provider gets the `Can't find Tamagui configuration` error from the spike (bucket e): see "Foundation" below.

## Comparison

Left web, right native. The native side was captured with the font loaded; the web page background is the page grey, native is white (the gallery's own wrapper, not a Fuselage value).

- `docs/compare/actions.png`: Button, Badge, Chip, CheckBox
- `docs/compare/indicators.png`: Icon, Callout, Avatar, Banner, Tag
- `docs/compare/message.png`: Message parts, MessageName, MessageBody, MessageTimestamp, Item row, SidebarItem

Property level, web computed style against what the native frame states:

| Component | Property | Web computed | Native | Bucket |
| --- | --- | --- | --- | --- |
| Button | width | 82 / 103 / 80 px, content sized | row width | (b) `buttonContent.width: '100%'` (`Button.tsx:388` on #43653) inside an auto-width parent: Yoga resolves the percentage against the row |
| Button | label colour | `#fff`, `#1f2329`, `#fff` (variant) | black | (f) the frame sets `color` on the `View`; `ButtonContent` is a `Text` with no colour and RN `Text` does not inherit from a `View` |
| Button | label alignment | centred | left | (f) `textAlign: 'center'` is on the frame (`Button.tsx:34`), not on the `Text` |
| Button | min-width, font-size, line-height | `5rem`, `14px`, `20px` | `'5rem'`, `'0.875rem'`, `'1.25rem'` strings (`Button.tsx:28`, `:287`, `:332` `'4ch'`) | (b) not observable here (buttons are full width, text size reads as 14); no native-valid proof either way |
| Button | padding, height, radius, border | `8px 14px`, 40, 4, 1px | same numbers and tokens | none, matches |
| Button | press | `onClick` through `render={<button/>}` | `render` is ignored, handler lost | (g) `Button.tsx:483`, `:516` |
| Badge | all | `2px 4px`, radius pill, 10/12 700, fills | same (frame uses numbers and tokens, `'0.625rem'` text still reads right) | none |
| Chip | label colour | `#6c737a` | black | (f) colour only on `ChipFrame` (`Chip.tsx:35`), `ChipText` (`:100`) has none |
| Chip | padding, gap, fill, radius | `4px`, 8px, `#e4e7ea`, 4 | same | none |
| Chip | thumb | `<div class=rcx-avatar>` | would throw | (c) `Chip.tsx:105-106` |
| CheckBox | box | 20 x 20, 1px `#6c737a`, radius 2 | outline drawn, top edge missing | (f) `CheckBoxLabel` is a `Text` holding `View`s (`CheckBox.tsx` label, `Text`); cause of the clipped edge not isolated |
| CheckBox | checked mark | `::before`/`::after` | nothing | (a) `CheckBox.styles.scss:20-60` |
| Icon | font | `RocketChat` 24 px | system emoji, then glyph once `RocketChat` is loaded | (d) `Icon.web.tsx:121` already names the family; the app must load the font |
| Icon | line-height | computes to 18 px | glyph cut at x20 and x24 | (b) `Icon.web.tsx:125` `lineHeight: '1'`; root cause probable, not isolated |
| Callout | width | 181 / 210 px (shrink) | row width | (f) `calloutFrame` (`Callout.tsx:14-24` on #43658) states no width; cause of the native fill not isolated |
| Callout | measuring | `ResizeObserver` | `ReferenceError` | (h) `Callout.tsx:186` `useResizeObserver` (`fuselage-hooks`) |
| Callout | border, radius, padding, title weight | `1px` blue/red, 4, 12, 700 | same | none |
| Item row | width, meta | content width, meta after title | row width, meta at far end | (f) |
| Item row | padding, gap, colours | `4px`, 4px, `#2f343d` / `#6c737a` | same | none |
| MessageName/Body/Timestamp | size, weight, colour, padding | 14/700, 14/400 pad `2px 0`, 12 `#6c737a` | same | none |

## Per-PR suggestions

Each item: file:line is on the PR head; evidence is the composite image; "web" says whether the web render changes.

### #43668 prerequisites (`refactor/fuselage-l4-l6-prerequisites`, c742a5cc822)

No native-visible item. It moves styles between components; nothing in it is in the gallery.

### #43674 Icon (`feat/fuselage-tamagui-icon`, eac65af23a7)

- `Icon.web.tsx:121` already names `fontFamily: 'RocketChat'`. The README spike note that the glyph is written without a family is out of date; what is missing is the font. Add one line to the changeset or the story docs: a native consumer registers `@rocket.chat/icons/dist/font/rocketchat.ttf` under the family `RocketChat`. Evidence `indicators.png`: emoji without the font, glyphs with it. Cost small. Web: no change.
- `Icon.web.tsx:125` `lineHeight: '1'`: with the font loaded the x20 and x24 glyphs are cut at the bottom on iOS, x16 is not; the web computes 18 px for the 24 px icon, so the value is not the multiplier it reads as. Emit a length per size variant (the size already is a variant). Cost small, needs decision: it can move the web box by a pixel, and the cause is not isolated.

### #43653 L1 actions (`feat/fuselage-tamagui-l1`, 4a9e8ad63ab)

- `Button.tsx:380-396`, `buttonContent` (`ButtonContent = styled(Text, ...)` at `:420`): has no `color` and no `textAlign`. Give it the paint colour through the same `paint` variant as the frame and `textAlign: 'center'`. Evidence `actions.png`: black, left-aligned labels. Cost medium. Web: none (same colour the label inherited).
- `Button.tsx:388` `width: '100%'` on the content: every native button fills the row. Needs decision: dropping it changes truncation inside a `minWidth`/`maxWidth` button on web; the alternative is `flexShrink: 1; minWidth: 0` on the content.
- `Button.tsx:483`, `:516` (and `IconButton.tsx:795`, `:824`): `render={<button/a {...pickWebPressHandlers(props)} />}` keeps the handler inside the DOM element. Natively `render` is ignored (no error, a `View` is drawn), so `onPress` is never attached. Pass `onPress` to the frame as well on the platforms that need it. Needs decision (event path on web); press is not verified on a device.
- `Chip.tsx:100-110`, `ChipText`: add `color` (`$rcx-font-secondary-info`, as `:35` on the frame), and the disabled colour on its disabled look. Evidence `actions.png`: black label. Cost small. Web: none.
- `Chip.tsx:105-106` `defaultRenderThumb` returns a `<div>` around `Avatar`: throws natively as soon as `thumbUrl` is set. Use the same element Avatar's own root uses once it is converted, or a frame. Cost small once Avatar has a frame; web none.
- `Chip.tsx:68-69` `color: 'inherit'`, `fontFamily: 'inherit'` (and `:70-71` rem sizes): keywords RN has no meaning for; replace by the type scale the frame already has, or drop. Needs decision (web inherits the surrounding font).
- `CheckBox.tsx:44-60`, `CheckBoxFake`: the mark is `::before`/`::after` in `CheckBox.styles.scss:20-60`, so native shows no checked or indeterminate state. Needs decision: a native-valid mark is a child element and changes the web DOM.
- Badge: nothing to do, it matches (`actions.png`).

### #43658 L2 indicators (`feat/fuselage-tamagui-l2`, c8135345c65)

- `Callout.tsx:186` `useResizeObserver` throws `ReferenceError: Property 'ResizeObserver' doesn't exist` on native until a stub is installed (`src/polyfills.ts`). The guard belongs in `@rocket.chat/fuselage-hooks` (a separate small change, not in this PR); if the hook stays, say so in the PR. Alternative inside the PR: take the size from `onLayout` natively. Cost small for the guard; web none.
- `Callout.tsx:14-24` `calloutFrame` states no width: it fills the row natively and shrink-wraps on web. Add `alignSelf: 'flex-start'` only if shrink-wrapping is intended on both (it is today on web). Needs decision.
- `Callout.tsx:91-92`, `:111-112` rem sizes and line heights: same remark as Button, no observed effect here.
- `Callout.tsx:194-195` `render={<section ... ref={mergedRef} />}`: the measuring ref sits inside the DOM element passed as `render`; natively `render` is ignored, so check the ref is attached when the guard above lands.

### #43671 L3 forms and lists (`feat/fuselage-tamagui-l3`, c9bb3cf115d)

- `Item.tsx:457`, `:491`, `:528`, `:560` with `pickWebPressHandlers(press)` at `:462`, `:496`, `:533`, `:565`, and `:362` `pressable = !!props.onPress || !!props.onClick`: same press path as Button; 44 `pickWebPressHandlers(` calls in this PR. Decide the press pattern once, in the first PR that lands, so the rest do not need a rework. Needs decision.
- `Item.tsx:255` `ItemFrame` states no width: the row fills the container natively and the meta goes to the far end, where web sizes it to its content (`message.png`). Needs decision, same as Callout.
- `SidebarItem.tsx:41` `is = 'a'` default plus `href`/`target` at `:53`: natively the gallery had to pass `is='div'`; default to the container element (as `isContainer` already treats it) when no `href` is given. Cost small; web: an `a` without `href` becomes a `div` (needs decision).
- Item row and Message parts otherwise match the web look.

### #43679 L4 structure (`feat/fuselage-tamagui-l4`, a9c3480ba32) and #43693 L5 shell (`feat/fuselage-tamagui-l5`, 38076448cd0)

Nothing in them is in the gallery, so there is no native evidence for an item. By grep on the PR heads: L4 has 33 `render={`, 12 `pickWebPressHandlers(`, 28 rem or ch strings; L5 has 20, 3, 16. The press and rem remarks above apply to them as they do to L1 to L3. Suggestion for the author: add one cell for the component of each PR to `apps/expo-lab/src/GalleryContent.tsx` before the PR is merged, to get the evidence this section lacks.

### #43706 L6 messages (`feat/fuselage-tamagui-l6`, 2ced9828ea4)

- `MessageName.tsx:29`, `:34`, `:38`; `MessageBody.tsx:38`, `:58`, `:81`; `Message.tsx:30`: same `render={<tag/>}` plus `pickWebPressHandlers` pattern; rendering matches web (`message.png`), so the only open item is the press path above. 15 `pickWebPressHandlers(` calls in the PR.
- A `Message` with an `Avatar` still throws on native (`AvatarContainer.tsx:9`, `<img>`): Avatar is not converted by any of the eight PRs.

## Foundation (not one PR)

- Every converted frame needs a `TamaguiProvider` with Fuselage's config as ancestor on native (bucket e); the gallery mounts one. A small exported provider would spare each consumer the import of `src/tamagui.config`.
- Inter is a `woff2` variable font: native needs a `ttf`/`otf` of it to match the web typography.
- `rem`, `ch` and `fit-content` strings stay in the frames (`docs/frontend/fuselage-tamagui-components.md` already records a run-time value deviation); Badge, Message parts and Item show they cost nothing visible on iOS, Button and Callout show the layout ones (`'100%'`, no width) do.

## Comment drafts

Ready to post, one per PR (same text as in the sections above).

### Draft for #43668

> Native check of the combined L1-L6 stack. Observed on iOS simulator (iPhone 17 Pro, RN 0.88) with the combined branch feat/expo-lab-all; comparison images and the full list are in apps/expo-lab/NATIVE-GAP.md of that branch. Press was not exercised (no touch tool), so every press remark is from reading the code.
>
> Nothing from this PR shows up in the native gallery, so there is nothing to change on that account.

### Draft for #43674

> Native check of Icon. Observed on iOS simulator (iPhone 17 Pro, RN 0.88) with the combined branch feat/expo-lab-all; comparison images and the full list are in apps/expo-lab/NATIVE-GAP.md of that branch. Press was not exercised (no touch tool), so every press remark is from reading the code.
>
> - [ ] `Icon.web.tsx:121` already names `fontFamily: 'RocketChat'`, so the only thing native lacks is the font file. Worth one line in the changeset or the story docs: a native consumer registers `@rocket.chat/icons/dist/font/rocketchat.ttf` under that family. Without it every icon is a system emoji; with it the glyphs match the web. No web change.
> - [ ] `Icon.web.tsx:125` `lineHeight: '1'`: with the font loaded the x20 and x24 glyphs are cut at the bottom on iOS (x16 is fine), and web computes 18px for the 24px icon, so it is not the multiplier it reads as. Emitting a length per size variant would cover both. Needs a decision, it can move the web box by a pixel; the cause is probable, not isolated.

### Draft for #43653

> Native check of the L1 components. Observed on iOS simulator (iPhone 17 Pro, RN 0.88) with the combined branch feat/expo-lab-all; comparison images and the full list are in apps/expo-lab/NATIVE-GAP.md of that branch. Press was not exercised (no touch tool), so every press remark is from reading the code.
>
> Badge matches the web render (fill, radius, size, digits). Button, Chip and CheckBox have gaps the PR could close while the frames are open:
>
> - [ ] `Button.tsx:380-396` `buttonContent` (`ButtonContent` is a `Text`, `:420`) has no `color` and no `textAlign`: labels are black and left-aligned on every variant (web: variant colour, centred), because RN `Text` does not inherit from the `View`. Give it the paint colour through the same `paint` variant and `textAlign: 'center'`. No web change.
> - [ ] `Button.tsx:388` `width: '100%'` on the content makes each native button fill the row (web shrinks to content). Needs a decision: dropping it changes truncation in a `minWidth`/`maxWidth` button on web; `flexShrink: 1` and `minWidth: 0` is the alternative.
> - [ ] `Button.tsx:483`, `:516` (and `IconButton.tsx:795`, `:824`): the press handler is inside `render={<button {...pickWebPressHandlers(props)} />}`. Native ignores `render` (no error, a `View` is drawn), so `onPress` is never attached. Needs a decision (event path on web), best taken once for all the PRs.
> - [ ] `Chip.tsx:100-110` `ChipText` has no colour (only `ChipFrame`, `:35`): the label is black, web is `#6c737a`. Same token on the text. No web change.
> - [ ] `Chip.tsx:105-106` `defaultRenderThumb` returns a `<div>`: throws natively once `thumbUrl` is set. Small once Avatar has a frame.
> - [ ] `Chip.tsx:68-69` `color: 'inherit'` and `fontFamily: 'inherit'` mean nothing in RN. Needs a decision (web inherits the surrounding font).
> - [ ] `CheckBox.tsx:44-60`: the mark is `::before`/`::after` in `CheckBox.styles.scss:20-60`, so native shows no checked or indeterminate state (and the top edge of the box is missing, cause not isolated). Needs a decision: a native mark is a child element and changes the web DOM.

### Draft for #43658

> Native check of Callout. Observed on iOS simulator (iPhone 17 Pro, RN 0.88) with the combined branch feat/expo-lab-all; comparison images and the full list are in apps/expo-lab/NATIVE-GAP.md of that branch. Press was not exercised (no touch tool), so every press remark is from reading the code.
>
> Border, radius, padding, title weight and tone colours match the web render. Gaps:
>
> - [ ] `Callout.tsx:186` `useResizeObserver` throws `ReferenceError: Property 'ResizeObserver' doesn't exist` on native; the gallery installs a no-op stub. The guard fits better in `@rocket.chat/fuselage-hooks` (separate small change); inside this PR the alternative is `onLayout` natively. Web: none.
> - [ ] `Callout.tsx:194-195` the measuring `ref` sits inside the DOM element passed as `render`, which native ignores. Worth checking the ref is attached when the guard above lands.
> - [ ] `Callout.tsx:14-24` `calloutFrame` states no width: the callout fills the row natively, web shrinks to content (181px and 210px for the gallery text). Needs a decision on the intended width.
> - [ ] `Callout.tsx:91-92`, `:111-112` rem sizes and line heights: no visible effect on iOS in the gallery.

### Draft for #43671

> Native check of Item and SidebarItem. Observed on iOS simulator (iPhone 17 Pro, RN 0.88) with the combined branch feat/expo-lab-all; comparison images and the full list are in apps/expo-lab/NATIVE-GAP.md of that branch. Press was not exercised (no touch tool), so every press remark is from reading the code.
>
> Item rows and the Message timestamp match the web render in size, colour and spacing. Gaps:
>
> - [ ] `Item.tsx:457`, `:491`, `:528`, `:560` with `pickWebPressHandlers(press)` at `:462`, `:496`, `:533`, `:565`, and `:362`: the handler lives inside `render={<tag/>}`, which native ignores, so `onPress` is never attached. 44 `pickWebPressHandlers(` calls in this PR; deciding the press pattern once here saves reworking the later PRs. Needs a decision.
> - [ ] `Item.tsx:255` `ItemFrame` states no width: the row fills the container natively and the meta goes to the far end, web sizes the row to its content. Needs a decision.
> - [ ] `SidebarItem.tsx:41` defaults `is = 'a'` (with `href`/`target` at `:53`); natively the gallery had to pass `is='div'`. Defaulting to the container element when there is no `href` would avoid that, but turns an `a` without `href` into a `div` on web. Needs a decision.
> - [ ] `SidebarItem` hover, selected and focus rules stay in `.styles.scss`, so they cannot show natively.

### Draft for #43679

> Native check of the L4 components. Observed on iOS simulator (iPhone 17 Pro, RN 0.88) with the combined branch feat/expo-lab-all; comparison images and the full list are in apps/expo-lab/NATIVE-GAP.md of that branch. Press was not exercised (no touch tool), so every press remark is from reading the code.
>
> None of the L4 components is in the gallery yet, so there is no native evidence for an item. By grep on this head: 33 `render={`, 12 `pickWebPressHandlers(`, 28 rem or ch strings; the press path and the rem remarks on #43653 and #43671 apply the same way. A cell for one L4 component in `apps/expo-lab/src/GalleryContent.tsx` would give the evidence before merge.

### Draft for #43693

> Native check of the L5 components. Observed on iOS simulator (iPhone 17 Pro, RN 0.88) with the combined branch feat/expo-lab-all; comparison images and the full list are in apps/expo-lab/NATIVE-GAP.md of that branch. Press was not exercised (no touch tool), so every press remark is from reading the code.
>
> None of the L5 components is in the gallery yet, so there is no native evidence for an item. By grep on this head: 20 `render={`, 3 `pickWebPressHandlers(`, 16 rem or ch strings; the press path and the rem remarks on #43653 and #43671 apply the same way. A cell for one L5 component in `apps/expo-lab/src/GalleryContent.tsx` would give the evidence before merge.

### Draft for #43706

> Native check of the L6 message parts. Observed on iOS simulator (iPhone 17 Pro, RN 0.88) with the combined branch feat/expo-lab-all; comparison images and the full list are in apps/expo-lab/NATIVE-GAP.md of that branch. Press was not exercised (no touch tool), so every press remark is from reading the code.
>
> MessageName, MessageBody, MessageHeader and the Message row match the web render (size, weight, colour, spacing). Gaps:
>
> - [ ] `MessageName.tsx:29`, `:34`, `:38`; `MessageBody.tsx:38`, `:58`, `:81`; `Message.tsx:30`: same `render={<tag/>}` plus `pickWebPressHandlers` pattern; native ignores `render`, so the press path is the one open item (15 `pickWebPressHandlers(` calls here). Needs the decision taken for #43653 and #43671.
> - [ ] Not this PR: a `Message` holding an `Avatar` still throws on native (`AvatarContainer.tsx:9`, `<img>`), since Avatar is not converted by any of the eight PRs.
