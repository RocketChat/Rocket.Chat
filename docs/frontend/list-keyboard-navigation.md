# Keyboard navigation of lists

Every list in the client follows one of three keyboard models, taken from the [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/patterns/). Pick the model by what the list is, not by the screen it is on, and reuse the hook that implements it. Do not write a new arrow-key handler for a list.

| The list is…                                | Model          | Implementation                                                  |
| ------------------------------------------- | -------------- | --------------------------------------------------------------- |
| a popup of choices filtered by a text field | combobox       | focus stays in the field, `aria-activedescendant` marks the row |
| a popup of choices opened from a button     | combobox       | fuselage `Select`                                               |
| a popup of commands opened from a button    | menu           | fuselage `Menu` / `GenericMenu` (react-aria)                    |
| a list of rows that stays on the page       | composite list | `useItemListNavigation` and its variants                        |

## Composite lists

Sidebar room lists, the side panel, contextual bar lists (members, files, threads, discussions, pinned, starred, mentions, canned responses, contact history, Outlook events) and any new list of rows use `useItemListNavigation` from `apps/meteor/client/hooks`, or one of its variants listed below. The list behaves as one tab stop:

- Up and Down move between rows. In a virtualized list, the row outside the render window is scrolled in first.
- Tab and Shift+Tab walk the controls of the focused row only: its focus target first, then every other tabbable control in reading order, such as the buttons of `ItemActions`, a menu trigger or the links and toolbar of a message. Tab past the last control, or Shift+Tab from the focus target, leaves the list; Tab never enters the next row.
- A `role=toolbar` in a row, such as a message toolbar or its reactions, is a single stop, as the [toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/) asks: Tab enters it on the button used last there, or its first one, and the next Tab leaves it. Inside it, Left and Right are the toolbar's own keys and move between its buttons.
- Outside a toolbar, Left and Right are left to the focused control, such as a video seeking or a code block scrolling. They never move the focus between the controls of a row: Tab already walks them, a `role=list` does not tell anyone the arrows do it, and screen readers in browse mode keep these keys for reading.
- Escape on a control returns to its row. Escape on the row itself is left to the surroundings, such as closing a contextual bar.
- Coming back to the list by keyboard returns to the row focused last.
- Keys typed in a text field inside a row (an input, a textarea, a select or editable content) are left to the field.

Tab only reaches controls inside a row. Keep every interactive element of a row inside the element `rowSelector` matches, and mount row actions on focus, not only on hover.

Attach the returned ref to the element that wraps the rows, such as the `List` component of a Virtuoso list, or a `Box` around it.

Pick the variant by what the rows are:

| Rows          | Hook                                             | Focus target                   | Row bounds                |
| ------------- | ------------------------------------------------ | ------------------------------ | ------------------------- |
| `Item`        | `useItemListNavigation()`                        | `ItemLink`                     | `Item`, `ItemGroupHeader` |
| messages      | `useMessageRowListNavigation()`                  | the message                    | the message               |
| room messages | `useMessageListNavigation()`                     | the message                    | the message               |
| sidebar rooms | `useSidebarListNavigation()`                     | the room link, the group title | `Item`, `ItemGroupHeader` |
| anything else | `useItemListNavigation({ isItem, rowSelector })` | `isItem`                       | `rowSelector`             |

Pass `isItem` and `onLeave` as stable functions, so the ref stays stable across renders.

The room and thread message lists (`useMessageListNavigation`) add two options on top of the message rows:

- `enterAtLast`: the first keyboard entry lands on the latest message.
- `onLeave`: Tab past the focused message moves to the composer, and Shift+Tab before it moves to the top of the room, or of the contextual bar for a thread, instead of the next and previous tabbable elements of the page.

The composer keeps its own keys: Up at the start of the text edits your previous message, and Shift+Tab returns to the message list.

## Testing a composite list

Check the keyboard model in the list's unit test, not in end-to-end tests:

```tsx
import { expectListKeyboard, listWrapper } from '<path to>/tests/mocks/utils/listContract';

it('follows the keyboard model of a list of rows', async () => {
	const { Default } = composeStories(stories);
	render(<Default />, { wrapper: listWrapper() });

	await expectListKeyboard(screen.getByTestId('virtuoso-item-list'));
});
```

- `listWrapper` renders the story in an app root where Virtuoso renders its rows, which it cannot measure in jsdom.
- `expectListKeyboard` checks that Down and Up move between rows and that Tab walks the first row, then leaves the list without entering the next row. It starts on the first `ItemLink`; pass the focus target as a second argument when the rows use another one, such as messages. The story needs at least two rows.

A list without a story gets one first: the story is the fixture the test renders. Keep end-to-end tests for a smoke check that the list is wired into the page, not for the key-by-key behavior.

## Combobox

The composer popup (`useComposerBoxPopup`) and the navbar search (`useSearchActiveOption`) keep the focus in the text field, both on top of `useActiveDescendant` from `@rocket.chat/fuselage-hooks`. The arrows move a highlighted option, written to the field's `aria-activedescendant`, and Enter picks it. Options carry an `id` and never receive focus.

Fuselage's `Select` is the same model without a text field, the [select-only combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/): the focus stays on its button, and typing jumps to the option whose label starts with what was typed. Its button is a labelable element, so a `label` pointing at its `id` names it, as it names any other input.
