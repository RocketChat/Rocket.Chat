# Layout in the app

Screens compose named layout containers. They don't lay themselves out with `Box`, with raw HTML elements, or with styling props passed to Fuselage components.

- A **screen** (anything under `apps/meteor/client/views/`) builds its UI from containers whose name says what they are: `Page`, `PageContent`, `Contextualbar`, `GenericModal`, `GenericTable`, `FieldGroup`, `Stack`, `Card`…
- **`Box` is for building containers**, inside their implementation. A raw `Box` in a screen means a container is missing. CI counts the raw `Box`, `div`, `span` and `section` elements screens render (`node scripts/scan-raw-layout.mjs`) and fails when that count rises above the limit it sets. Files in a `layout/` folder are containers and are not counted.
- A Fuselage component decides how it looks; its container decides where it sits. Nobody passes it a styling prop it doesn't declare as a variation (`margin*`, `width`/`height`/`size`, `flexGrow`/`alignSelf`, `color`, `fontScale`, `padding*`, `display`, `is`) or an `rcx-*` prop. CI enforces this part: `node scripts/scan-style-props.mjs` lists every violation with its `file:line`, and the lint job fails when their count rises above the limit it sets.

## The containers

| You want…                               | Use                                                                                                                         |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| a page, its header and its body         | `Page`, `PageHeader`, `PageContent` / `PageScrollableContent`                                                               |
| a side panel                            | `Contextualbar` and its parts                                                                                               |
| a dialog                                | `GenericModal`, or `Modal` and its parts                                                                                    |
| a list of records                       | `GenericTable`                                                                                                              |
| a form                                  | `FieldGroup` › `Field` › `FieldLabel` / `FieldRow` / `FieldHint` / `FieldError`                                             |
| things in a row or a column, with space | `Stack` (`direction`, `gap`, `align`, `justify`, `wrap`)                                                                    |
| buttons side by side                    | `ButtonGroup` (`stretch='equal'` for equal widths)                                                                          |
| a grid of cards                         | `CardGrid` › `Card`                                                                                                         |
| a dropdown or popover surface           | `PopoverSurface` (`elevation`, `maxHeight`, `flush`)                                                                        |
| nothing to show yet                     | `GenericNoResults`, `Skeleton`                                                                                              |
| a look a component offers               | its declared variation: `Button size='small'`, `Icon color='danger'`, `Divider variation='light'`, `FieldRow justify='end'` |

When the table has no row for what you need, the answer is a new container, not a `Box` in the screen (see below).

## Recipes

### Form

```tsx
<FieldGroup>
	<Field>
		<FieldLabel htmlFor={nameId} required>
			{t('Name')}
		</FieldLabel>
		<FieldRow>
			<TextInput id={nameId} {...register('name')} aria-describedby={`${nameId}-hint ${nameId}-error`} />
		</FieldRow>
		<FieldHint id={`${nameId}-hint`}>{t('Name_hint')}</FieldHint>
		{errors.name && <FieldError id={`${nameId}-error`}>{errors.name.message}</FieldError>}
	</Field>
</FieldGroup>
```

- Every input sits in a `Field`, even when a hand-made layout would be a few pixels closer to a mockup.
- A label with an action next to it (a link, a reset button) puts both in the label's `FieldRow`.
- A trailing link or button aligned to the end: `<FieldRow justify='end'>`.

### Filter bar

Each filter is a `Field`, with a visually hidden label when the design shows none. A `Stack direction='row' gap={8} wrap` lays them out.

### Actions

Buttons go in a `ButtonGroup`. An icon-only action is an `IconButton`; a counter on it is its `badge`. A coloured icon inside a button is passed as a child: `<Button><Icon name='star-filled' color='status-font-on-warning' />…</Button>`.

### Modal

`ModalHeader`, `ModalContent` and `ModalFooter` own their padding. Inside `ModalContent`, a `Stack` or a `FieldGroup` spaces the blocks. Content that brings its own footer uses `ModalContent fill`.

## When no container fits

Create one, named for what it is, and grow it as it gets reused:

1. **In a `layout/` folder next to the screen**, for example `views/omnichannel/directory/layout/ChatsFilterBar.tsx` (as `views/room/layout/RoomLayout.tsx` already does), built with `Stack`, `Field` or `Box`. The screen uses `<ChatsFilterBar>`, not the `Box`es.
2. **`apps/meteor/client/components/`** once a second feature needs it.
3. **`packages/ui-client`** once another package or app needs it.
4. **Fuselage** once it is part of the design system: a reusable layout or a variation of an existing component, reviewed with design.

Name it for its role (`SettingsSection`, `ChatsFilterBar`, `EmptyState`), not its shape (`FlexRow`, `Wrapper`, `Container`). A container that only renames `Stack` isn't one; use `Stack`.

Typography is the largest gap today: about 350 `Box`es in screens exist only to set `fontScale`, a text color or truncation. A `Text` component over the existing font-scale and text-color tokens is planned; until then, keep those `Box`es inside named containers.
