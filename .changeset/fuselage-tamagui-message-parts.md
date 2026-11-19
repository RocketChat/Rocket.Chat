---
'@rocket.chat/fuselage': minor
---

Renders these message parts with Tamagui frames whose values name tokens and theme keys of the Tamagui config: `MessageDivider`, `MessageStatusIndicator`, `MessageStatusPrivateIndicator`, `MessageNameContainer`, `MessageName`, `MessageUsername`, `MessageBody`, `MessageBlock`, `MessageHighlight`, `MessageMetrics`, `MessageMetricsItem`, `MessageMetricsItemLabel` and `MessageMetricsItemAvatarRow`. `Message` accepts `onPress` and `onLongPress`; the web renderer detects no long press.

**Breaking for npm consumers**

- The parts above take a declared set of props instead of every HTML attribute: `children`, `className`, `id`, `title`, `role`, `tabIndex`, `ref`, `testID`, `aria-*`, `data-*`, `onPress`, the deprecated `onClick` alias and the pointer, keyboard and focus handlers a trigger or a tooltip hands an element. Any other attribute, `style` included, no longer reaches the element.
- `MessageBlock` no longer accepts the Box styling props.
- `MessageBody` cuts a clamped body with the frame's line clamp instead of the `rcx-message-body--clamp` rule. The class is still set.
- These theme hooks no longer reach the parts: `--rcx-message-divider-background-color`, `--rcx-message-divider-color`, `--rcx-message-divider-color-unread`, `--rcx-message-divider-background-color-unread`, `--rcx-message-divider-size`, `--rcx-message-divider-size-neg`, `--rcx-message-highlight-colors-critical-color`, `--rcx-message-highlight-colors-relevant-color`, `--rcx-message-highlight-colors-other-color`, `--rcx-message-highlight-colors-link-color` and `--rcx-message-block-width-fixed`.
- The parts carry Tamagui's classes before their `rcx-*` classes, and their own rules are atomic classes: a stylesheet that overrode a property of one of them through its `rcx-*` class may no longer win.
- The underline of a pressable name container or highlight under the pointer applies only on devices that hover.
- `MessageDivider` sets its font on the two labels it renders instead of on its root.
