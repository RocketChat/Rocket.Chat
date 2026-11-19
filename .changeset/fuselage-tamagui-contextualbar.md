---
'@rocket.chat/fuselage': minor
---

Renders the `Contextualbar` family (`Contextualbar`, `ContextualbarHeader`, `ContextualbarTitle`, `ContextualbarContent`, `ContextualbarEmptyContent`, `ContextualbarSection`, `ContextualbarFooter`, `ContextualbarSkeleton`) with Tamagui frames whose values name tokens and theme keys.

**Breaking for npm consumers**

- The parts no longer accept arbitrary HTML attributes, Box styling props or `style`. Besides its own props each takes `id`, `title`, `className`, `ref`, `testID`, `data-*` and `aria-*`; `Contextualbar` also takes `role`, `tabIndex`, `onPress` and the keyboard, focus and pointer handlers.
- `onPress` is the press handler. `onClick` still works and is deprecated.
- The `rcx-vertical-bar*` classes are not a public contract.
