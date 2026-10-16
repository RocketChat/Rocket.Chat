# Semantics of lists of rows

Sidebar room lists, the side panel, contextual bar lists (members, files, threads, discussions, pinned, starred, mentions, canned responses, contact history, Outlook events) and any new list of rows tell assistive technology the same thing their layout shows. Every such list follows these rules.

## The list

The list is a `role=list` with an accessible name, and it owns its rows: each row is a `listitem` child of it, with at most generic `div`s in between.

- In a Virtuoso list, pass `virtuosoListComponents` (`VirtuosoList` and `VirtuosoListItem` from `apps/meteor/client/components/VirtuosoList`) and the name as `context={{ 'aria-label': … }}`. When the rows are list items themselves, as messages are, pass only `List: VirtuosoList`.
- In a virtua list, `PaginatedVirtualList` takes the name as `aria-label`.
- In a `GroupedVirtuoso`, make the `Group` component a `listitem` too (`VirtuosoListGroup`). Virtuoso renders the sticky group header in a second copy of the `List`; when the headers hold no controls, hide that copy with `TopItemList: VirtuosoHiddenTopItemList`.
- Dividers between rows, such as an `ItemDivider` or a date divider, are either hidden from assistive technology (`aria-hidden`) or sit in their own list item.

## A row

- A row is an `Item`, never a clickable `div`. Its one focus target is an `ItemLink`: a link when the row navigates, a button otherwise.
- The `ItemLink` is the row's name. Point `aria-describedby` at the text that explains it, such as a message preview, and clamp long previews with `ItemDescription`'s `clamp`.
- A row with nothing to open still gets a disabled `ItemLink`, so the keyboard can land on it and reach its actions.

## Actions

- Actions sit in `ItemActions`, beside the `ItemLink`, never inside it.
- In an `Item` with a title, `ItemActions` is a group named after the title, so a button named "Options" still tells which row it acts on.
- Name icon buttons with `aria-label`, not only `title`, and give toggles `aria-pressed`.

## State

State goes in the name or in ARIA attributes, never only in color:

- put the unread state in the `ItemLink` name;
- label the room type and user status icons through the `label` of `ItemIcon` or `SidebarItemIcon`;
- mark the open room with `aria-current="page"`.

## Group headers and messages

- Group headers are `listitem`s holding a `SidebarCollapseGroup`, named after the group title. The toggle states whether the group is expanded with `aria-expanded`, so its name does not repeat the action.
- Message rows are `listitem`s named with `aria-labelledby` after their author, text and time, for user and system messages alike.

## Testing

Check the semantics in the list's unit test, from its story, not in end-to-end tests:

```tsx
import { expectListSemantics, listWrapper } from '<path to>/tests/mocks/utils/listContract';

it('follows the semantics of a list of rows', async () => {
	const { Default } = composeStories(stories);
	render(<Default />, { wrapper: listWrapper() });

	await expectListSemantics('Files_list');
});
```

- `listWrapper` renders the story in an app root where Virtuoso renders its rows, which it cannot measure in jsdom.
- `expectListSemantics` finds the list by its name, checks it owns list items, and runs axe on it, which covers unnamed controls and controls nested in other controls.

A list without a story gets one first: the story is the fixture the test renders.
