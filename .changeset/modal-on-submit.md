---
'@rocket.chat/fuselage': minor
'@rocket.chat/ui-client': minor
'@rocket.chat/ui-conference': patch
'@rocket.chat/meteor': patch
---

Replaces `Modal`'s `wrapper` and `wrapperFunction` with `onSubmit` and `formId`: `Modal` renders its own surface, as a `form` when `onSubmit` is given. `GenericModal`'s `wrapperFunction` becomes `onSubmit`, and the app's `ModalForm` is removed. `Modal`'s `width`, `height` and `maxHeight` and `ModalHeroImage`'s `width` and `height` accept only a Fuselage size (`x480`) or a number of pixels. The `ui-client` `ModalBackdrop` states its own overlay background instead of taking it from the `rcx-modal__backdrop` class.

### Breaking for npm consumers

- `Modal` no longer accepts `wrapper` or `wrapperFunction`. Pass `onSubmit` (and `formId` when the form needs an `id`) instead of rendering a `form` yourself.
- `GenericModal` no longer accepts `wrapperFunction`. Pass `onSubmit`; the confirm button is still a `type='submit'` button when it is given.
- `Modal` `width`, `height` and `maxHeight`, and `ModalHeroImage` `width` and `height`, no longer accept arbitrary Box size values such as percentages or `'full'`.
