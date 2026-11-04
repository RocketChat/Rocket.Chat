---
'@rocket.chat/ui-kit': minor
'@rocket.chat/ui-contexts': minor
'@rocket.chat/apps-engine': minor
'@rocket.chat/apps': minor
'@rocket.chat/core-typings': minor
'@rocket.chat/model-typings': minor
'@rocket.chat/models': minor
'@rocket.chat/mock-providers': patch
'@rocket.chat/meteor': minor
---

Lets apps drive multi-step forms with UiKit modals. An app can push a modal on top of the current one (up to 3 stacked), close one or all of its modals, keep `private_metadata`, `callback_id` and `external_id` on a view, disable the submit button with `submit_disabled`, update a view by `external_id`, and drop stale updates through the view `hash`. `notifyOnClose` and `clearOnClose` are honored, and `viewClosed` now carries the `triggerId` so the app can open a modal in response.
