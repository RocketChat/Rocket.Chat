# Proposal: the toast is a set of parts on `Item`

## Status

Implemented on branch `toastbar-composable-item-7d6870`. The visual changes below were measured before and after in Storybook and wait for design to settle them; the visual regression baselines are regenerated with them. What is left is listed under "Handoff".

## Decision

The Fuselage `ToastBar` becomes a set of parts that render on the `Item` primitives. `ToastBarSurface` is the toast's root and holds what makes it a toast; the slots inside are `Item` slots. App toasts and previews build from the same pieces, and `ToastBar` stays as the default composition with its current props.

```tsx
<ToastBarSurface variant='success' onPointerEnter={pause} onPointerLeave={resume}>
	<ToastBarIcon />                            {/* or ItemMedia with any media */}
	<ToastBarMessage>{children}</ToastBarMessage> {/* or ItemTitle, ItemLink, ItemDescription inside it */}
	<ToastBarClose label='Dismiss alert' onClose={close} />
	<ToastBarProgress time={5} paused={isPaused} />
</ToastBarSurface>
```

| Part               | Renders                                                                                   | Optional                          |
| ------------------ | ----------------------------------------------------------------------------------------- | --------------------------------- |
| `ToastBarSurface`  | `Item` with `rcx-toastbar rcx-toastbar--{variant}`; `is: 'div' \| 'li'`, `inset`, `insetBlock`, `align`, `multiline` | root |
| `ToastBarIcon`     | `ItemMedia variant='icon'` with the variant's `Icon`                                       | yes, or `ItemMedia`               |
| `ToastBarMessage`  | `ItemContent` with `role='alert'` on an `error` surface, `role='status'` otherwise          | yes, or `ItemContent`             |
| `ToastBarClose`    | `ItemActions` with a tiny cross `IconButton`; `label`, `onClose`                           | yes                               |
| `ToastBarProgress` | `rcx-toastbar_progressbar(--paused)`, absolutely positioned on the bottom edge; `time`, `paused` | yes                         |

The parts read the variant from the surface through `ToastBarContext`, as `Item` parts read `ItemContext`. `ToastBar` is:

```tsx
<ToastBarSurface {...props} variant={variant} id={id}>
	<ToastBarIcon />
	<ToastBarMessage>{children}</ToastBarMessage>
	{onClose && <ToastBarClose label={buttonLabel} onClose={() => onClose(toastId)} />}
	<ToastBarProgress time={time} paused={isPaused} />
</ToastBarSurface>
```

The surface defaults to `inset='md'`, `insetBlock='lg'` and `align='start'`, so a composed toast looks like `ToastBar` without extra props.

## Why

- Toasts that show more than a line of text (a message preview with the sender's avatar, a link to open the room) had no Fuselage part to build from, so each one would restyle a `Box` into a toast.
- One row model: the toast's icon, text and actions get `Item`'s slots, RTL-safe layout and stretched-link behavior instead of their own flex row.
- Less CSS: `ToastBar.styles.scss` goes from 18 rules to 13, and the root no longer takes Box styling props.

## Changes to `Item`

None. Every slot the toast needs already exists, and the toast's padding comes from `Item`'s declared `inset` and `insetBlock`.

### Why `ToastBarIcon` is not `ItemIcon`

`ItemIcon` registers its id in the parent `Item` through `setState`, which costs an extra render on mount, and the id is only read by `ItemLink` and menu items. The toast icon is decorative, so `ItemMedia variant='icon'` gives the same 20px box without the registration.

## What stays toast-specific

- **The surface**: tinted background, level-2 elevation without border, the medium radius (4px, over `Item`'s small 2px), the minimum and maximum width and the enter animation. `ToastBar.styles.scss` loads after `Item.styles.scss`, so the toast's radius wins at the same specificity.
- **The stripe**: a 4px bar on the top edge in the variant's color, drawn by `::before` from `rcx-toastbar--success` and `--error`. A surface without a variant has none.
- **The icon color**: `rcx-toastbar__icon--success` and `--error` on the icon's media slot.
- **The progress bar**: absolutely positioned on the bottom edge, outside the flow, so it takes no gap and doesn't change the height. Its duration is the `--toast-time` custom property.
- **The announcement role**: `alert` for errors and `status` otherwise, on the message slot.

## Compatibility

Visual deltas against `develop`, measured in Storybook at 800px, light theme, and checked in dark and RTL. They wait for design:

- **Inline padding** is 12px (`inset='md'`, 4 + 8) instead of 16px. `Item` offers 8, 12 or 24; 16 would need a new inset value.
- **Gaps** between the icon, the message and the close button are 4px instead of 16px. A message with two children, or a surface with `multiline`, gets 8px. The text column is 36px wider, so long messages take fewer lines (the "With close button" story is 112px tall instead of 132px).
- **Block padding on touch screens**: `Item` sets `padding-block: 8px` under `pointer: coarse`, which overrides `insetBlock`, so toasts are 16px shorter on touch devices (52px to 36px for one line).
- **Radius** stays 4px: no change.
- **Hover and focus with an `ItemLink`**: a toast that holds a stretched link shows `Item`'s hover surface (`surface-hover` instead of `surface-tint`) under the pointer, and while the link has keyboard focus `Item`'s inset focus ring replaces the elevation shadow. Toasts without a link are unchanged.
- The root no longer gets `rcx-box`, so its content loses `font-variant-numeric: tabular-nums` and font smoothing.

API and markup:

- `ToastBar`'s props are unchanged. New exports: the five parts, their props types and `ToastBarVariant`.
- `rcx-toastbar`, `rcx-toastbar--{variant}` and `rcx-toastbar_progressbar(--paused)` stay on the same elements, so the e2e locators (`apps/meteor/tests/e2e/page-objects/fragments/toast-messages.ts`) and the `fuselage-toastbar` spec keep working. The root also carries `rcx-item` and its modifiers.
- Removed, as nothing outside `ToastBar` referenced them: `rcx-toastbar_inner`, `rcx-toastbar_content`, `rcx-toastbar_icon--{variant}` and `rcx-toastbar-close`.
- The `--rcx-toastbar-color` theme variable is no longer read; the text color is `--rcx-item-color-font-default`, the same value. Nothing in the repository overrides it.

## Handoff

### Done

1. `refactor(fuselage)`: the root's `elevation` and `borderRadius` Box props move into `ToastBar.styles.scss` with the same computed values.
2. `feat(fuselage)`: the parts, and `ToastBar` as their default composition.
3. `test(fuselage)`: one story per composition (icon + message + close + progress; message only; avatar + stretched `ItemLink` title + large description + close, with and without progress), and a spec with axe for each, also as list items, plus forwarding, `is='li'`, roles, close and paused progress for each part.
4. This proposal and the changeset.
5. `test`: the visual regression baselines, regenerated with `yarn workspace @rocket.chat/fuselage visual-regression-update`: the five `ToastBar` stories change, and the four composition stories get their first baseline.

Verified: `ToastBar.spec.tsx` and `ToastBar.characterization.stories.tsx` pass unedited, in jest and in Chromium against a Storybook build (`test:stories`); Fuselage jest, `tsc`, oxlint, stylelint, `verify:css-hacks:check` and `verify:selectors:check`; `fuselage-toastbar` jest against the new Fuselage; Storybook screenshots of every `ToastBar` story before and after in light, dark and RTL.

### Not done

- **Design review** of the deltas under "Compatibility": inline padding, gaps, touch padding and the hover surface with a link. If design changes any of them, regenerate the baselines again.
- **App e2e** (`apps/meteor/tests/e2e`) has not run against the branch.
- **Tamagui L1 batch** (#43653) adds `ToastBar.classContract.stories.tsx` on the old inner classes, so it needs a rebase after this lands.

### Gaps

- The part names, the 12px inline inset and the kept 4px radius are proposals until confirmed.
- Whether `ToastBar` should pass `multiline` (8px gaps) when its message wraps.
- Whether `Item`'s `pointer: coarse` padding should respect `insetBlock`; that would be an `Item` change, outside this proposal.

## Out of scope

- `fuselage-toastbar` (`ToastBarProvider`, `ToastBarTimed`, `ToastBarZone`) keeps rendering `ToastBar`; moving app toasts to the parts is follow-up work.
- The toast's timing, pause on hover and dismissal logic stay in `fuselage-toastbar`.
