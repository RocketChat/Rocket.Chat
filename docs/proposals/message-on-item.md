# Proposal: the message row is built on `Item`

## Status

Implemented on branch `poc/message-on-item` (PR #43139). Every visual change was compared before and after in Storybook and either measured identical or accepted on its own; the visual regression baselines are regenerated. What is left is listed under "Handoff".

## Decision

The Fuselage `Message` row renders on the `Item` primitives. `Item` owns the row shell (padding, gap, hover, selection, focus ring, the avatar column and the header line). The message body stays free content that `Item` does not style.

```tsx
<Item align='start' multiline hoverable interactive={clickable} selected={isSelected} className='rcx-message …'>
	<ItemMedia>{/* avatar x36 | checkbox | status indicators (sequential) */}</ItemMedia>
	<ItemContent>
		<ItemRow>{/* name, username, roles (ItemRow), timestamp (ItemMeta), indicators */}</ItemRow>
		{/* body, attachments, reactions, metrics: free content */}
	</ItemContent>
	{/* toolbar: absolutely positioned, outside the flow */}
</Item>
```

| Message part                         | Becomes                                   |
| ------------------------------------ | ----------------------------------------- |
| `Message`                            | `Item align='start' inset='lg' multiline hoverable` |
| `MessageLeftContainer`               | `ItemMedia`                               |
| `MessageContainer`                   | `ItemContent`                             |
| `MessageHeader`, `MessageRoles`      | `ItemRow`                                 |
| `MessageTimestamp`                   | `ItemMeta`                                |
| `MessageSystem`                      | `Item inset='lg' multiline`               |
| `MessageSystemContainer` / `…Block`  | `ItemContent` / `ItemRow`                 |
| `MessageSystemTimestamp`             | `ItemMeta`                                |
| `ThreadMessage`                      | `Item inset='lg'` (no longer a `Message`) |
| `ThreadMessageRow`                   | `ItemRow`                                 |
| `ThreadMessageUnfollow`              | wrapped in `ItemActions reveal='hover'`   |
| `MessageBody`, blocks, content parts | unchanged, free content                   |
| `MessageToolbar*`                    | unchanged, overlay                        |

The `rcx-message*` class names stay on the same elements, so app code, e2e locators and the keyboard selector keep working.

## Why

- One row model across the client. Lists already moved to `Item` (sidebar, side panel, menus, members, files, composer popups). Messages were the last big list with their own row shell, focus style and hover rules.
- Shared behavior instead of copies: hover and selected surfaces, focus ring, `pointer: coarse` density, RTL-safe slots.
- Less CSS: the message stylesheets went from 781 lines on `develop` to 627 (non-blank, non-comment), mostly from the row shell, `MessageSystem`, `ThreadMessage` and dead content rules.

## Changes to `Item`

Two generic variations, neither message-specific:

- `align?: 'center' | 'start'`, default `center`. Multi-line rows need the avatar at the top.
- `hoverable`: shows the hover surface without a click target, for rows whose content is interactive. `selected` and `disabled` still win.

### Why `align` is a prop and not always `start`

With `flex-start` everywhere, rows whose slots have different heights misalign: an x28/x36 avatar next to a single 20px line, or `ItemActions` icon buttons taller than the text line, would stick to the top instead of centering.

### Why messages do not use `ItemTitle` or `ItemIcon`

They register their ids in the parent `Item` through `setState` (`useIdRegistry`), which costs one extra render pass per batch of mounted rows. The room message list mounts and unmounts rows constantly while scrolling, and the registered ids are only consumed by `menuitem` rows. The message header also does not fit `ItemTitle`: the name is `h5`, and `ItemTitle` grows to push the timestamp to the row end, while the message keeps it next to the name.

## What stays message-specific

- **The 24px inset** is `inset='lg'` on every row. `Item` applies its inset as padding on the row itself, so the absolutely positioned toolbar wrapper, the thread preview's column and the conference panel's trimmed start padding don't need their own rules.
- **The avatar column**: a fixed 36px `ItemMedia` that right-aligns narrow children (checkbox, sequential status indicators), and a block size of header plus first line, so the avatar centers on them however long the body grows.
- **States**: `editing` (warning surface; `Item` has none) and `pending` (dimmed body).
- **The author name**: underline on hover, and a focus ring drawn with `outline` and `box-shadow` so it takes no room; a border-based ring made the header 2px taller and was invisible in forced colors.
- **The toolbar**: an absolutely positioned overlay with its own reveal. `ItemActions reveal='hover'` does not fit it: it reveals on `:focus-within`, so a clicked message would keep its toolbar showing; it always reveals on `hover: none` devices, where every toolbar would overlap the previous message and stop gating the lazy mount; and its collapse does nothing for an overlay. A hidden toolbar takes no pointer events.
- **The divider**: equal-width bars keep the date centered; the unread label sits in the flow, so the line ends before it and no background is needed.

## Compatibility

Visual deltas against `develop`, all reviewed:

- The row inset is 24px (it was 20px plus a 2px margin), with `Item`'s small radius and inset focus ring.
- Headers are 2px shorter (name focus ring), and headers with status indicators no longer grow 4px.
- System messages and thread previews line up with the message text column; thread preview rows sit flush.
- Long author names end in an ellipsis instead of overflowing the header.
- The user's own reactions show their dark border; titled status icons are announced to screen readers.
- Message and reaction emoji are sized by `--emoji-size` (defaults 20px, 48px big, 14px in reactions), which the client already set.
- Role tags in the header are plain labels; the author name still opens the user card.
- The web client's `body` sets `font-variant-numeric: tabular-nums`, which message bodies used to get from `rcx-box`.

API and markup:

- Theme variables `message-background-color-hover` and `message-background-color-selected` are removed in favor of `item-color-surface-hover` and `item-color-surface-selected`; `message-system-background-color-selected` is removed too. The editing text color now reads `message-color-editing`. Nothing in the repository overrides these keys.
- `rcx-message--selected` and `rcx-message--clickable` are no longer emitted; the row carries `rcx-item--selected` and `rcx-item--interactive`. No app or e2e code references them.
- The props of the `Item`-based parts omit the HTML `is` attribute, which clashed with `Item`'s `is`.
- Keyboard: `messageRowSelector` also matches `.rcx-message-thread[tabindex="0"]`, since thread previews no longer carry `rcx-message`.
- Removed, as nothing rendered them: `MessageStatusIndicatorText`, `ThreadMessageFollow`, the `MessageSystemLeftContainer` and `ThreadMessageLeftContainer` aliases of `MessageLeftContainer`, the `variant` prop of the status indicators, the `highlight` prop of `Message`, the `is` prop of `MessageHighlight`, and the `name` and `counter` props of `MessageReaction`.

## Handoff

### Done (branch `poc/message-on-item`)

Each change is its own commit, with a changeset when it changes published behavior; `git log origin/develop..poc/message-on-item` lists them. In short:

1. `Item` gains `align` and `hoverable`; `Message` renders on `Item`.
2. Row, header, system and thread parts move to `Item` slots and variations; rules and `rcx-box` classes that restated `Item` or the client body go away.
3. Fixes found on the way: header height, long names, reaction border, editing color key, nested list markers, `clamp={4}`, empty preview title, status icon labels, thread unfollow by keyboard, system timestamp contrast, hidden toolbar catching the pointer, divider label backgrounds, follow badge in RTL, non-interactive role tags.
4. Dead content rules removed; reactions and avatar rows spaced with `gap`; emoji sized by `--emoji-size`.
5. Visual regression baselines regenerated with the Playwright Docker image (`yarn workspace @rocket.chat/fuselage visual-regression-update`).

Verified: Fuselage jest, `tsc`, oxlint and stylelint; the `apps/meteor` message specs and `tsc`; Storybook screenshots of every `Message*` story at 800px and 400px in Chromium, light theme, before and after each change.

### Not done

- **App e2e** (`apps/meteor/tests/e2e`) has not run against the branch.
- **Dark theme and WebKit** were only spot-checked.
- **Hover and focus states** were checked by computed style at a few points, not by screenshot across stories.
- **`tabular-nums` on `body`**: which client screens outside a `Box` change their digits was not measured.
- **Divider font**: `.rcx-message-divider` sets no `font-family` and inherits it; without an inherited sans font (as in a bare Storybook story) the date renders in serif. One line, `font-family: font-family('sans')`, fixes it.

### Next steps

1. The divider `font-family` above.
2. The contextual bar rows that render `Box is={Message}` (`DiscussionsListItem`, `ThreadListMessage`, `VideoConfListItem`) can move to plain `Item` rows with `useItemListNavigation`.
3. `MessageContainerFixed` (two consumers) can become a layout container or `ItemActions`.
4. Spacing the metrics wrapper with `gap` needs the follow button to become a metrics item first; as is, it adds 4px before the button.

### Running the branch

Fuselage resolves its workspace dependencies from their `dist`. If Storybook fails with `Can't resolve '@rocket.chat/fuselage-hooks'`, build them first:

```sh
yarn turbo run build --filter='@rocket.chat/fuselage^...'
cd packages/fuselage && yarn storybook
```

## Out of scope

- The toolbar stays an overlay (see "What stays message-specific").
- Message content components (body, attachments, reactions, metrics, previews) keep their own styles; only dead rules and margin gutters were removed.
