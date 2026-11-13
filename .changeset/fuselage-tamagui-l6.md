---
'@rocket.chat/fuselage': minor
---

Renders the L6 components with Tamagui frames compiled to static CSS: the `Message` row and its parts (`MessageContainer`, `MessageLeftContainer`, `MessageContainerFixed`, `MessageHeader`, `MessageName`, `MessageNameContainer`, `MessageUsername`, `MessageRoles`, `MessageTimestamp`, `MessageBody`, `MessageBlock`, `MessageEmoji`, `MessageHighlight`), `MessageToolbar` and its wrapper, `MessageReactions` and `MessageMetrics`, `MessageSystem` and `ThreadMessage`, `MessageDivider`, `MessageStatusIndicator` and `MessageGenericPreview` with all its parts. Their look is unchanged, with the exceptions listed below.

`Message` provides a context its parts read (`sequential`, `pending` and whether it is the overlay host of the toolbar), so a part no longer needs a parent class rule. `Item` takes `editing`, which `Message` uses for its editing colours. The toolbar still appears on a row's hover, on keyboard focus and, on a touch device, on tap, even when the row has no `tabIndex`.

Intended visible changes: `MessageMetrics` spaces its items with a `gap` of 8px instead of a 4px margin on each side of every item; `MessageDivider`'s unread bar is the `__bar--unread` modifier; `ThreadMessage` clips and truncates its preview on the content part instead of on the row; the root of `MessageGenericPreview` no longer sets `font-size: 0`, so a bare text child now shows; a clamped `MessageBody` and a clamped description never grow wider than their container.

### Breaking for npm consumers

- `style` is no longer accepted by any `Message` part, and no longer reaches their elements. Props narrow to the attributes of the element each part renders plus the variations it declares (`HTMLAttributes`, `AllHTMLAttributes` and `RefAttributes` are gone from the message parts), so an attribute outside that list no longer type-checks, and one passed anyway is not forwarded.
- `MessageBody` takes `dir` (`'ltr' | 'rtl' | 'auto'`).
- `Message` takes `aria-busy` and `aria-roledescription`.
- `ThreadMessage` no longer takes `sequential`, `isEditing` and `isPending`; they were accepted and ignored.
- `MessageToolbarWrapper` and the reaction parts take the props of the element they render, and `MessageReaction` no longer takes the other `div` attributes it ignored.
- `MessageStatusIndicator` no longer takes `AllHTMLAttributes`; it takes `children` and the attributes of a `div`.
- `MessageSystemTimestamp` no longer takes `title` as a separate prop; it comes from the `Item` part attributes.
- The classes of the parts stay (`rcx-message`, `rcx-message-body`, `rcx-message-toolbar`, `rcx-message-reactions__reaction`, `rcx-message-thread` and the rest), but their declarations come from frames, so custom CSS that depended on their specificity needs a review. The `message-*` theme variables that were read by the old stylesheets keep working through the frames' palettes.
