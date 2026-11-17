# Layout in the app

Screens compose named layout containers. They don't lay themselves out with `Box`, with raw HTML elements, or with styling props passed to Fuselage components.

- A **screen** (anything under `apps/meteor/client/views/`) builds its UI from containers whose name says what they are: `Page`, `PageContent`, `Contextualbar`, `GenericModal`, `GenericTable`, `FieldGroup`, `Card`…
- **`Box` and `Stack` are for building containers**, inside their implementation. A raw `Box` or `Stack` in a screen means a container is missing: a `Stack` that only spaces a screen's own blocks is a container that has no name yet. CI doesn't count `Stack` yet; it counts the raw `Box`, `div`, `span` and `section` elements screens render (`node scripts/scan-raw-layout.mjs`) and fails when that count rises above the limit it sets. Files in a `layout/` folder are containers and are not counted.
- A Fuselage component decides how it looks; its container decides where it sits. Nobody passes it a styling prop it doesn't declare as a variation (`margin*`, `width`/`height`/`size`, `flexGrow`/`alignSelf`, `color`, `fontScale`, `padding*`, `display`, `is`) or an `rcx-*` prop. CI enforces this part: `node scripts/scan-style-props.mjs` lists every violation with its `file:line`, and the lint job fails when their count rises above the limit it sets.

## The containers

| You want…                                                   | Use                                                                                                                         |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| a page, its header and its body                             | `Page`, `PageHeader`, `PageContent` / `PageScrollableContent`                                                               |
| a side panel                                                | `Contextualbar` and its parts                                                                                               |
| a dialog                                                    | `GenericModal`, or `Modal` and its parts                                                                                    |
| a list of records                                           | `GenericTable`                                                                                                              |
| a list that fills the rest of a panel and scrolls inside it | `ListViewport`                                                                                                              |
| a form                                                      | `FieldGroup` › `Field` › `FieldLabel` / `FieldRow` / `FieldHint` / `FieldError`                                             |
| a modal that submits its fields                             | `ModalForm`, as `GenericModal`'s `wrapperFunction`                                                                          |
| a page's or a tab's content in a centred column             | `ContentColumn` (`size='form'`, 600px; `size='wide'`, 640px)                                                                |
| things in a row or a column, inside a container             | `Stack` (`direction`, `gap`, `align`, `justify`, `wrap`, and `is` for the element: `section`, `ul`, `li`, `form`…)          |
| buttons side by side                                        | `ButtonGroup` (`stretch='equal'` for equal widths)                                                                          |
| a grid of cards                                             | `CardGrid` › `Card`                                                                                                         |
| a dropdown or popover surface                               | `PopoverSurface` (`elevation`, `maxHeight`, `flush`)                                                                        |
| nothing to show yet                                         | `GenericNoResults`, `Skeleton`                                                                                              |
| text in a font scale or a text colour                       | `Text` (`fontScale`, `color`, `truncate`, and `is` for the element: `p`, `h2`, `label`…)                                    |
| formatted text: paragraphs, lists, links, code              | `RichContent`                                                                                                               |
| a look a component offers                                   | its declared variation: `Button size='small'`, `Icon color='danger'`, `Divider variation='light'`, `FieldRow justify='end'` |

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

The search, filters and actions above a list are a `FilterBar` (`client/components/FilterBar`):

```tsx
<FilterBar>
	<FilterBarSearch placeholder={t('Search_rooms')} value={text} onChange={(event) => setText(event.target.value)} />
	<FilterBarFilters>
		<Select aria-label={t('Type')} options={typeOptions} value={type} onChange={setType} />
		<MultiSelectCustom … />
	</FilterBarFilters>
	<Button variant='primary'>{t('Add_room')}</Button>
</FilterBar>
```

- The search takes the room the filters leave. When the row is full, the filters move to the next row together and share it in equal widths; they never move one by one.
- `FilterBarFilters` sizes each filter's slot; a filter sets no width of its own and only grows to fill that slot.
- A bar with only a search, optionally followed by a button, is `FilterByText`.
- Inside a contextual bar section, `<FilterBar compact>` keeps one row: the search shrinks and each filter stays narrow.
- Filters that show a visible label are a form instead: each one a `Field`, laid out by `Stack direction='row' gap={8} wrap`.

### Actions

Buttons go in a `ButtonGroup`. An icon-only action is an `IconButton`; a counter on it is its `badge`. A coloured icon inside a button is passed as a child: `<Button><Icon name='star-filled' color='status-font-on-warning' />…</Button>`.

### Modal

`ModalHeader`, `ModalContent` and `ModalFooter` own their padding. Inside `ModalContent`, a `Stack` or a `FieldGroup` spaces the blocks. Content that brings its own footer uses `ModalContent fill`.

## When no container fits

Look for one first, and otherwise create one, named for what it is, and grow it as it gets reused:

1. **Look for the same pattern first**: in the table above, in `apps/meteor/client/components/`, and in the `layout/` folders of other areas, which often hold it under another name. Reuse it; if it lives in another area, promote it to `client/components/` (step 3) instead of writing a second one.
2. **In a `layout/` folder next to the screen**, for example `views/omnichannel/directory/layout/ChatsFilterBar.tsx` (as `views/room/layout/RoomLayout.tsx` already does), built with `Stack`, `Field` or `Box`. The screen uses `<ChatsFilterBar>`, not the `Box`es.
3. **`apps/meteor/client/components/`** once a second feature needs it.
4. **`packages/ui-client`** once another package or app needs it.
5. **Fuselage** once it is part of the design system: a reusable layout or a variation of an existing component, reviewed with design.

Name it for its role (`SettingsSection`, `ChatsFilterBar`, `EmptyState`), not its shape (`FlexRow`, `Wrapper`, `Container`). A container that only renames `Stack`, with no role of its own, isn't one. Built from `Stack`, it carries what makes it that role: the gap, the element (`is='ul'`), the alignment.

A wrapper that only sets a margin or a padding usually isn't a container either: the space belongs to the parent, as the `gap` of its `Stack`, or to the padding the surface already has (`PageScrollableContent`, `ContextualbarContent`, `ModalContent`).

Text that only sets a font scale, a text colour or truncation is a `Text`, not a `Box`. `Text` is a plain element: it takes no outer spacing, and it ignores a surrounding `Margins`, which only reaches `Box`es. The space around it comes from its container, usually a `Stack` with a `gap`.
