---
'@rocket.chat/fuselage': minor
---

Makes Fuselage components keep what a consumer passes and style themselves with static CSS.

- **`className`, props and `ref` are kept:**
  - The `States`, `Message`, `ThreadMessage`, `NavBar`, `Pagination`, `Sidebar` and `Option` parts, `MessageBlock`, `MessageReactions`, `NavBarItem`, `Position` and the card parts keep a consumer `className` next to their own class instead of replacing or dropping it. `InputBox` puts it on the wrapper when it has an addon, and on the input otherwise.
  - The modal footer parts, the generic preview, status indicator and thread origin parts, `OptionHeader` and `OptionTitle` forward the HTML attributes they used to drop.
  - Props override the defaults of `ContextualbarIcon`, `ContextualbarAction`, `ModalClose`, `StatesIcon` and `MessageMetricsFollowing`.
  - `PaginatedMultiSelect` keeps the consumer `ref`.
- **Fixes:**
  - `SelectLegacy` and `SelectFiltered` follow a controlled `value` that changes after mount.
  - `Select` applies `style` to its trigger.
  - `Options` only sets `aria-multiselectable` for multiple selection.
  - `TabsItem` forwards `disabled` to its button.
  - `FramedIcon` honors `size`.
  - `Chip` keeps `onMouseDown` and `onClick` on their own events.
  - `ToastBar` renders its `id`.
  - `Button` keeps the `rel` it is given.
  - `Field` parts log an error instead of throwing when used outside a `Field`.
- **New props:**
  - `Dropdown`, `CardGrid`, `Slider` and `AudioPlayer` accept the HTML attributes of their element.
  - `AccordionItem` honors `expanded` and reports toggles through `onToggle`.
  - `Item` takes `multiline` and `interactive`.
- **Types:**
  - `borderRadius`, `borderWidth`, `fontFamily`, `fontScale`, `strokeColor`, `fontColor` and `backgroundColor` only accept names from the token lists, and always return a value.
  - `SidebarLink` is typed as an anchor.
  - `MessageGenericPreviewFooter` and `SidebarCollapseGroup` no longer declare props they never used (`clamp`, `actions`).
