# Proposal: the message row is built on `Item`

## Status

Proposal with a working prototype on branch `poc/message-on-item`. Not reviewed visually yet; see "Handoff".

## Decision

The Fuselage `Message` row renders on the `Item` primitives. `Item` owns the row shell (padding, hover, selection, focus ring, the avatar column and the header line). The message body stays free content that `Item` does not style.

```tsx
<Item align='start' hoverable selected={isSelected} className='rcx-message …'>
	<ItemMedia>{/* avatar x36 | checkbox | status indicators (sequential) */}</ItemMedia>
	<ItemContent>
		<ItemRow>{/* name, username, roles, timestamp, indicators */}</ItemRow>
		{/* body, attachments, reactions, metrics: free content */}
	</ItemContent>
	{/* toolbar: absolutely positioned, outside the flow */}
</Item>
```

| Message part           | Becomes                       |
| ---------------------- | ----------------------------- |
| `Message`              | `Item align='start' hoverable` |
| `MessageLeftContainer` | `ItemMedia`                   |
| `MessageContainer`     | `ItemContent`                 |
| `MessageHeader`        | `ItemRow`                     |
| `MessageBody`, blocks  | unchanged, free content       |
| `MessageToolbar*`      | unchanged, overlay            |

The public API of the `Message*` components does not change, and the `rcx-message*` class names stay on the same elements, so app code, e2e locators and the keyboard selector keep working.

## Why

- One row model across the client. Lists already moved to `Item` (sidebar, side panel, menus, members, files, composer popups). Messages are the last big list with their own row shell, focus style and hover rules.
- Shared behavior instead of copies: hover and selected surfaces, focus ring, `pointer: coarse` density, RTL-safe slots.
- Less CSS once the follow-ups land (see "Next steps"). The prototype alone is neutral in size (+61/−63 lines, stories and specs excluded); the reduction comes from removing the duplicated row skeletons of `MessageSystem*` and `ThreadMessage*`.

## Changes to `Item`

Two generic variations, neither message-specific:

- `align?: 'center' | 'start'`, default `center`. Multi-line rows need the avatar at the top.
- `hoverable`: shows the hover surface without a click target, for rows whose content is interactive. `selected` and `disabled` still win.

### Why `align` is a prop and not always `start`

With `flex-start` everywhere, rows whose slots have different heights misalign: an x28/x36 avatar next to a single 20px line, or `ItemActions` icon buttons taller than the text line, would stick to the top instead of centering. This was decided from the CSS, not from screenshots; flipping the default in `Item.styles.scss` and diffing the `Item` stories settles it.

### Why messages do not use `ItemTitle` or `ItemIcon`

They register their ids in the parent `Item` through `setState` (`useIdRegistry`), which costs one extra render pass per batch of mounted rows. The room message list mounts and unmounts rows constantly while scrolling, and the registered ids are only consumed by `menuitem` rows. The message header also does not fit `ItemTitle`: the name is `h5`, and `ItemTitle` grows to push the timestamp to the row end, while the message keeps it next to the name.

## What stays message-specific

Kept as `rcx-message--*` modifiers on the `Item`:

- padding 8/4 × 20, `sequential` 4/4;
- `editing` (warning surface, now wins by specificity instead of `!important`), `pending` (dimmed body), `highlight` (fade animation), `clickable` (cursor without `onClick`, used by search results);
- the toolbar reveal, keyed on `.rcx-message:hover`.

## Compatibility

- Focus: the transparent 1px border is replaced by `Item`'s inset ring, so the row is 2px shorter.
- Radius: the row gets `Item`'s small radius; it was square.
- Theme variables `message-background-color-hover` and `message-background-color-selected` are removed in favor of `item-color-surface-hover` and `item-color-surface-selected`. Nothing in the repository overrides them; external themes that do lose the effect.
- `rcx-message--selected` is no longer emitted; the row carries `rcx-item--selected`. No app or e2e code references it.
- The props of `Message`, `MessageContainer`, `MessageHeader` and `MessageLeftContainer` omit the HTML `is` attribute, which clashed with `Item`'s `is`.
- Keyboard: `useMessageRowListNavigation` matches `.rcx-message[tabindex="0"]`, which still holds.

## Handoff

### Done (branch `poc/message-on-item`)

1. `feat(fuselage): add align and hoverable to Item`
2. `feat(fuselage): render Message on the Item primitives`
3. `chore(fuselage): add Message on Item stories` (`Message/MessageOnItem.stories.tsx`: default, sequential, selected, editing, pending, highlight, clickable, toolbar, long body, reactions and metrics, missing avatar, RTL)
4. This proposal.

Fuselage jest for `Item` and `Message` passed (73 tests, no snapshot change), `stylelint` was clean, and Storybook compiled. ESLint was not run.

### Not done

- **Visual review.** No screenshot was compared. Run the `storybook-ab` skill (or compare by hand) on the `Messages` and `MessageOnItem` stories, and the `Item` stories, against `develop`. Check `ThreadMessage` (`.rcx-message.rcx-message-thread` was left untouched and must still render as a compact column).
- **App checks.** `apps/meteor` e2e and unit snapshots (`DiscussionsList.spec.tsx.snap`), plus a pass over the room: sequential rows, thread previews, system messages, the toolbar and its menu, selection mode, editing, the highlight after a jump.
- **Changeset** for `@rocket.chat/fuselage` (minor: new `Item` props; note the removed theme variables).

### Next steps, in order

1. **Spacing by `gap` instead of margins** (about 40 lines less). The prototype zeroes `Item`'s gap and rebuilds it with margins: `gap: 0`, `> .rcx-message-container { margin-inline: 4 }`, `margin: -2` on the header and `%rcx-margins-header` (2px) on each header child. That nets 4px between avatar and text and 4px between header items, so `--rcx-item-gap: 4px` on the row plus `ItemRow`'s own 4px gap replaces all of it. Leave the vertical header/body margins until measured.
2. **Delete rules that `Item` already provides:** `display`, `flex-direction`, `flex-grow`, `flex-shrink` and `min-width` on `.rcx-message-container` (`ItemContent`), and the `flex` values on `--left` (`ItemMedia`).
3. **`MessageTimestamp` renders `ItemMeta`** with the message class; keep only the hover contrast rule.
4. **Drop `rcx-box rcx-box--full`** from `MessageContainer`, `MessageHeader` and `MessageLeftContainer`; verify visually.
5. **`MessageSystem*` on the same skeleton** (7 components, ~70 lines of SCSS): a `Message` with an x18 avatar and `c1` text. Consumers: `SystemMessage.tsx`, `ContactHistoryMessage.tsx`.
6. **`ThreadMessage*` on `Item`** (12 components, ~95 lines of SCSS): two compact truncated lines, the closest fit to a plain `Item` (`ItemMedia`/`ItemIcon` + `ItemContent` with two `ItemRow`s). Consumer: `ThreadMessagePreview.tsx`. Its `rcx-message` class makes it a keyboard row today; keep that or widen `messageRowSelector`.
7. Then the contextual bar rows that render `Box is={Message}` (`DiscussionsListItem`, `ThreadListMessage`, `VideoConfListItem`) can move to plain `Item` rows with `useItemListNavigation`.

Steps 1–4 are refactors of this branch; 5–7 are their own pull requests.

### Running the prototype

Fuselage resolves its workspace dependencies from their `dist`. If Storybook fails with `Can't resolve '@rocket.chat/fuselage-hooks'`, build them first:

```sh
yarn turbo run build --filter='@rocket.chat/fuselage^...'
cd packages/fuselage && yarn storybook
```

## Out of scope

- The toolbar stays an overlay. `ItemActions reveal='hover'` is inline; unifying them needs a new `Item` variation, which adds code.
- Message content components (body, attachments, reactions, metrics, previews) are unchanged.
