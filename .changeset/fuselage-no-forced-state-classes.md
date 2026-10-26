---
'@rocket.chat/fuselage': minor
---

Components no longer take a visual state from class names. The classes `hover`, `is-hovered`, `active`, `is-active`, `focus`, `is-focused`, `disabled`, `is-disabled`, `invalid` and `is-visited` used to force the hovered, pressed, focused, disabled, invalid or visited look on buttons, inputs, selection controls, links, tabs, sidebar and accordion items, pagination and chips. States now come only from the element itself (`:hover`, `:active`, `:focus`, `:focus-visible`, `:disabled`, `:invalid`, `:visited`) or from the component's props, so a consumer class with one of those names no longer changes how a component looks.
