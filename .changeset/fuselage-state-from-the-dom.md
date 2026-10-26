---
'@rocket.chat/fuselage': minor
'@rocket.chat/fuselage-ui-kit': patch
'@rocket.chat/meteor': patch
---

Components no longer take a visual state from class names. The classes `hover`, `is-hovered`, `active`, `is-active`, `focus`, `is-focused`, `disabled`, `is-disabled`, `invalid` and `is-visited` used to force the hovered, pressed, focused, disabled, invalid or visited look on buttons, inputs, selection controls, links, tabs, sidebar and accordion items, pagination and chips. States now come only from the element itself (`:hover`, `:active`, `:focus`, `:focus-visible`, `:disabled`, `:invalid`, `:visited`) or from the component's props, so a consumer class with one of those names no longer changes how a component looks.

Along with it:

- `SelectLegacy` no longer needs two clicks to open again after it lost focus while open.
- Inputs with only a start addon show the invalid border, and inputs with an addon drop it when their value is changed programmatically.
- The selected point of a UiKit linear scale element is a primary button.
- The transcript subject field of the close chat modal shows its focus ring.
