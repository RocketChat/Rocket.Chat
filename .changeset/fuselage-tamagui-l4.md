---
'@rocket.chat/fuselage': minor
---

Renders the L4 components with Tamagui frames compiled to static CSS: `Tabs` and `TabsItem`, `Accordion` and `AccordionItem`, `Pagination`, the `Table` family (`Table`, `TableHead`, `TableBody`, `TableFoot`, `TableRow`, `TableCell` and `TableSelection`), the `Card` family with `CardGroup`, the `Modal` family, the `Contextualbar` family and `Bubble`. Their look is unchanged, with the exceptions listed below.

A `Bubble` group (the label and its dismiss button) now rounds its outer corners by reading direction: in a right-to-left layout the squared edge where the two halves meet is on the left, where before it stayed on the right and cut the wrong corners.

### Breaking for npm consumers

- `style` is no longer accepted by any of these components and no longer reaches their elements. Props narrow to the attributes of the element each part renders plus the variations it declares, so an attribute outside that list no longer type-checks, and one passed anyway is not forwarded (`Pagination` no longer takes every HTML attribute of an element, `Card` and its parts no longer take `AllHTMLAttributes`, the table parts take the Fuselage attribute groups instead of the table, section, row and cell attributes, and the `Modal`, `Contextualbar` and `Bubble` parts take the groups of the element they render).
- `Bubble`'s `contentProps` and `dismissProps` are `ButtonPartAttributes` without `onClick`, `ref`, `type` and `form`. The label gets the `rcx-bubble__content` class.
- `Modal`'s `ref` is a `Ref<HTMLDialogElement>`; a consumer that typed it as another element must type it as the dialog. `ModalContent` takes `DivAttributes` and the press handlers, and `ContextualbarTitle` takes `dangerouslySetInnerHTML`.
- `CardGroup` spaces its cards with `gap` and no longer adds `rcx-card-group__item` to its children, so a child that is not a `Card` no longer stretches in a `stretch` group. A `wrap` group keeps the 8px at its outer edges through its own padding.
- `GenericCard` turns its `width` and `height` into a class, because `Card` no longer takes them.
- `TableHeadContext` is exported with a wider value: `false` outside a head, `'static'` in one, `'sticky'` in the head of a `sticky` table.
- The styles of these components are no longer in a stylesheet per component: the classes of the parts stay (`rcx-tabs`, `rcx-table__row`, `rcx-card__body`, `rcx-modal__content` and the rest), but the declarations come from frames, so custom CSS that depended on their specificity or on `rcx-card-group__item` needs a review.
- A hovered tab keeps the 1px underline whenever the tab bar has a divider, as it did before; only a bar without one draws the wide underline.
