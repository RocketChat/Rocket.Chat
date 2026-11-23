---
'@rocket.chat/fuselage': minor
'@rocket.chat/ui-client': minor
'@rocket.chat/ui-conference': patch
'@rocket.chat/meteor': patch
---

Replaces `Modal`'s `wrapper` and `wrapperFunction` with `onSubmit` and `formId`: `Modal` renders its own surface, as a `form` when `onSubmit` is given. The handler takes no event, and `Modal` prevents the browser's own submission. `GenericModal`'s `wrapperFunction` becomes `onSubmit`, and the app's `ModalForm` is removed.

### Breaking for npm consumers

- `Modal` no longer accepts `wrapper` or `wrapperFunction`. Pass `onSubmit` (and `formId` when the form needs an `id`) instead of rendering a `form` yourself.
- `GenericModal` no longer accepts `wrapperFunction`. Pass `onSubmit`; the confirm button is still a `type='submit'` button when it is given.
